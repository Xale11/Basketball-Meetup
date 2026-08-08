import {
  Society,
  SocietyAnnouncement,
  SocietyAnnouncementWithAuthor,
  SocietyMembership,
  SocietyMembershipStatusEnum,
  SocietyRoleIdEnum,
  SocietyStatusEnum,
} from '@/types/societies';
import { supabase } from './supabase';
import { uploadToSupabaseBucket } from './supabase-storage.api';
import { throwSupabaseError } from '@/lib/supabaseError';

export type SocietyMembershipWithSociety = SocietyMembership & { societies: Society };
export type SocietyWithCount = Society & { memberCount: number };

// Note: these functions deliberately have no outer try/catch. The previous
// `catch (error) { throw new Error(JSON.stringify(error)) }` wrapper destroyed
// the error — JSON.stringify of an Error instance is "{}" — so callers received
// a useless message and lost the Postgres code entirely.

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getSocietiesByUniversityId = async (
  university_id: string,
): Promise<SocietyWithCount[]> => {
  const { data: societies, error: sError } = await supabase
    .from('societies')
    .select('*')
    .eq('university_id', university_id)
    .order('name', { ascending: true });
  if (sError) throwSupabaseError('societies.api getSocietiesByUniversityId', sError);
  if (!societies || societies.length === 0) return [];

  const societyIds = societies.map((s: Society) => s.id);
  const { data: memberships, error: mError } = await supabase
    .from('society_memberships')
    .select('society_id')
    .in('society_id', societyIds)
    .eq('status', SocietyMembershipStatusEnum.ACTIVE);
  if (mError) throwSupabaseError('societies.api getSocietiesByUniversityId counts', mError);

  const countMap = new Map<string, number>();
  for (const m of memberships ?? []) {
    countMap.set(m.society_id, (countMap.get(m.society_id) ?? 0) + 1);
  }

  return societies.map((s: any) => ({
    ...s,
    memberCount: countMap.get(s.id) ?? 0,
  })) as SocietyWithCount[];
};

export const getSocietyById = async (
  id: string,
): Promise<{ society: Society; memberCount: number } | null> => {
  const [{ data: society, error: sError }, { count, error: cError }] = await Promise.all([
    supabase.from('societies').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('society_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('society_id', id)
      .eq('status', SocietyMembershipStatusEnum.ACTIVE),
  ]);
  if (sError) throwSupabaseError('societies.api getSocietyById', sError);
  if (cError) throwSupabaseError('societies.api getSocietyById count', cError);
  if (!society) return null;
  return { society: society as Society, memberCount: count ?? 0 };
};

export const getSocietyMembershipsByUserId = async (
  user_id: string,
): Promise<SocietyMembershipWithSociety[]> => {
  const { data, error } = await supabase
    .from('society_memberships')
    .select('*, societies(*)')
    .eq('user_id', user_id);
  if (error) throwSupabaseError('societies.api getSocietyMembershipsByUserId', error);
  return (data ?? []) as SocietyMembershipWithSociety[];
};

// ─── Mutations ───────────────────────────────────────────────────────────────

export const createSocietyMembership = async (
  user_id: string,
  society_id: string,
): Promise<SocietyMembership | null> => {
  if (!user_id || !society_id) {
    throw new Error('No user id or society id provided to create society membership');
  }
  const { data, error } = await supabase
    .from('society_memberships')
    .insert({
      user_id,
      society_id,
      role_id: SocietyRoleIdEnum.MEMBER,
      status: SocietyMembershipStatusEnum.ACTIVE,
    })
    .select('*')
    .maybeSingle();
  if (error) throwSupabaseError('societies.api createSocietyMembership', error);
  return data as SocietyMembership | null;
};

export const deleteSocietyMembership = async (
  user_id: string,
  society_id: string,
): Promise<void> => {
  const { error } = await supabase
    .from('society_memberships')
    .delete()
    .eq('user_id', user_id)
    .eq('society_id', society_id);
  if (error) throwSupabaseError('societies.api deleteSocietyMembership', error);
};

export const createSociety = async (
  userId: string,
  universityId: string,
  input: {
    name: string;
    description: string;
    category: string | null;
    logoUri?: string;
  },
): Promise<Society> => {
  // Generate a slug-style text ID matching the existing society ID convention
  const base = input.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const suffix = Date.now().toString(36);
  const id = `${base}-${suffix}`;

  // Insert the society row (logo added in a second pass if provided)
  const { data, error } = await supabase
    .from('societies')
    .insert({
      id,
      name: input.name.trim(),
      description: input.description.trim() || null,
      category: input.category,
      university_id: universityId,
      created_by_user_id: userId,
      status: SocietyStatusEnum.ACTIVE,
      logo: null,
    })
    .select('*')
    .maybeSingle();
  if (error) throwSupabaseError('societies.api createSociety', error);
  const society = data as Society;

  // Upload logo if provided, then patch the logo URL onto the row
  if (input.logoUri) {
    const logoUrl = await uploadToSupabaseBucket(
      input.logoUri,
      `societies/${id}`,
      'logo',
      'images',
    );
    const { error: logoError } = await supabase
      .from('societies')
      .update({ logo: logoUrl })
      .eq('id', id);
    if (!logoError) society.logo = logoUrl;
  }

  // Auto-enrol the creator as OWNER
  const { error: ownerError } = await supabase.from('society_memberships').insert({
    user_id: userId,
    society_id: id,
    role_id: SocietyRoleIdEnum.OWNER,
    status: SocietyMembershipStatusEnum.ACTIVE,
  });
  // Was unchecked: a failure here left a society with no owner and no signal.
  if (ownerError) throwSupabaseError('societies.api createSociety owner enrolment', ownerError);

  return society;
};

export const updateSociety = async (
  id: string,
  updates: {
    name?: string;
    description?: string;
    category?: string | null;
    logoUri?: string;
  },
): Promise<Society> => {
  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Society name cannot be empty');
  }

  const payload: Partial<Society> & { updated_at?: string } = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;

  if (updates.logoUri) {
    const logoUrl = await uploadToSupabaseBucket(
      updates.logoUri,
      `societies/${id}`,
      'logo',
      'images',
    );
    payload.logo = logoUrl;
  }

  const { data, error } = await supabase
    .from('societies')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throwSupabaseError('societies.api updateSociety', error);
  return data as Society;
};

/**
 * Changes a member's role within a society.
 *
 * Authorisation lives in the `Leaders can change member roles` RLS policy, not
 * here — only OWNER/PRESIDENT of the same society may call this, an OWNER's row
 * is untouchable, and the new role is restricted to MEMBER or EXEC so
 * leadership cannot be granted sideways.
 */
export const updateSocietyMemberRole = async (
  user_id: string,
  society_id: string,
  role_id: SocietyRoleIdEnum.MEMBER | SocietyRoleIdEnum.EXEC,
): Promise<SocietyMembership> => {
  const { data, error } = await supabase
    .from('society_memberships')
    .update({ role_id })
    .eq('user_id', user_id)
    .eq('society_id', society_id)
    .select('*')
    .maybeSingle();

  if (error) throwSupabaseError('societies.api updateSocietyMemberRole', error);
  if (!data) {
    // An RLS denial surfaces as zero rows rather than an error.
    throw new Error('You do not have permission to change this member\u2019s role.');
  }
  return data as SocietyMembership;
};

export type SocietyMemberWithProfile = SocietyMembership & {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
  };
};

/**
 * Active members of a society with their profiles, for the Members tab.
 *
 * The embed hint is `societyMemberships_userId_fkey1`, which does NOT follow the
 * `<table>_<column>_fkey` convention the rest of this file relies on. Two things
 * are going on, both in the database rather than here:
 *   * `society_memberships` was created with camelCase constraint names, so the
 *     FK is `societyMemberships_userId_fkey`, not `society_memberships_user_id_fkey`;
 *   * `user_id` carries TWO foreign keys — one to `auth.users` and one to
 *     `profiles` — and the profiles one was added second, so Postgres suffixed
 *     it `1`.
 * See the note in ACTIVCAMPUS_UI_REDESIGN.md about normalising these.
 */
export const getSocietyMembers = async (
  society_id: string,
): Promise<SocietyMemberWithProfile[]> => {
  const { data, error } = await supabase
    .from('society_memberships')
    .select('*, profiles!societyMemberships_userId_fkey1(id, first_name, last_name, photo_url)')
    .eq('society_id', society_id)
    .eq('status', SocietyMembershipStatusEnum.ACTIVE);

  if (error) throwSupabaseError('societies.api getSocietyMembers', error);
  return (data ?? []) as SocietyMemberWithProfile[];
};

// ─── Announcements (AC-24) ───────────────────────────────────────────────────

/**
 * A society's announcements, newest first.
 *
 * `author` is a left join: the FK cascades on profile delete, but the embed is
 * still typed nullable because a row can arrive before its author is readable.
 */
export const getSocietyAnnouncements = async (
  society_id: string,
): Promise<SocietyAnnouncementWithAuthor[]> => {
  const { data, error } = await supabase
    .from('society_announcements')
    .select('*, author:profiles!society_announcements_author_id_fkey(id, first_name, last_name, photo_url)')
    .eq('society_id', society_id)
    .order('created_at', { ascending: false });

  if (error) throwSupabaseError('societies.api getSocietyAnnouncements', error);
  return (data ?? []) as SocietyAnnouncementWithAuthor[];
};

/**
 * Posts an announcement.
 *
 * `author_id` is sent explicitly because the RLS policy pins it to auth.uid() —
 * there is no column default, so omitting it fails the NOT NULL constraint
 * before the policy is ever evaluated.
 */
export const createSocietyAnnouncement = async (input: {
  society_id: string;
  author_id: string;
  title: string;
  content: string;
  is_important?: boolean;
}): Promise<SocietyAnnouncement> => {
  const { data, error } = await supabase
    .from('society_announcements')
    .insert({
      society_id: input.society_id,
      author_id: input.author_id,
      title: input.title,
      content: input.content,
      is_important: input.is_important ?? false,
    })
    .select('*')
    .single();

  if (error) throwSupabaseError('societies.api createSocietyAnnouncement', error);
  return data as SocietyAnnouncement;
};

export const deleteSocietyAnnouncement = async (id: string): Promise<void> => {
  const { error } = await supabase.from('society_announcements').delete().eq('id', id);
  if (error) throwSupabaseError('societies.api deleteSocietyAnnouncement', error);
};
