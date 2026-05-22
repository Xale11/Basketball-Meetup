import { Society, SocietyMembership, SocietyMembershipStatusEnum, SocietyRoleIdEnum, SocietyStatusEnum } from '@/types/societies';
import { supabase } from './supabase';
import { uploadToSupabaseBucket } from './supabase-storage.api';

export type SocietyMembershipWithSociety = SocietyMembership & { societies: Society };
export type SocietyWithCount = Society & { memberCount: number };

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getSocietiesByUniversityId = async (
  university_id: string,
): Promise<SocietyWithCount[]> => {
  try {
    const { data: societies, error: sError } = await supabase
      .from('societies')
      .select('*')
      .eq('university_id', university_id)
      .order('name', { ascending: true });
    if (sError) throw new Error(JSON.stringify(sError));
    if (!societies || societies.length === 0) return [];

    const societyIds = societies.map((s: Society) => s.id);
    const { data: memberships, error: mError } = await supabase
      .from('society_memberships')
      .select('society_id')
      .in('society_id', societyIds)
      .eq('status', SocietyMembershipStatusEnum.ACTIVE);
    if (mError) throw new Error(JSON.stringify(mError));

    const countMap = new Map<string, number>();
    for (const m of memberships ?? []) {
      countMap.set(m.society_id, (countMap.get(m.society_id) ?? 0) + 1);
    }

    return societies.map((s: any) => ({
      ...s,
      memberCount: countMap.get(s.id) ?? 0,
    })) as SocietyWithCount[];
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

export const getSocietyById = async (
  id: string,
): Promise<{ society: Society; memberCount: number } | null> => {
  try {
    const [{ data: society, error: sError }, { count, error: cError }] = await Promise.all([
      supabase.from('societies').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('society_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('society_id', id)
        .eq('status', SocietyMembershipStatusEnum.ACTIVE),
    ]);
    if (sError) throw new Error(JSON.stringify(sError));
    if (cError) throw new Error(JSON.stringify(cError));
    if (!society) return null;
    return { society: society as Society, memberCount: count ?? 0 };
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

export const getSocietyMembershipsByUserId = async (
  user_id: string,
): Promise<SocietyMembershipWithSociety[]> => {
  try {
    const { data, error } = await supabase
      .from('society_memberships')
      .select('*, societies(*)')
      .eq('user_id', user_id);
    if (error) throw new Error(JSON.stringify(error));
    return (data ?? []) as SocietyMembershipWithSociety[];
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

// ─── Mutations ───────────────────────────────────────────────────────────────

export const createSocietyMembership = async (
  user_id: string,
  society_id: string,
): Promise<SocietyMembership | null> => {
  try {
    if (!user_id || !society_id) {
      throw new Error('No user id or society id provided to create society membership');
    }
    const { data, error }: { data: SocietyMembership | null; error: any } = await supabase
      .from('society_memberships')
      .insert({
        user_id,
        society_id,
        role_id: SocietyRoleIdEnum.MEMBER,
        status: SocietyMembershipStatusEnum.ACTIVE,
      })
      .select('*')
      .maybeSingle();
    if (error) throw new Error(JSON.stringify(error));
    return data;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

export const deleteSocietyMembership = async (
  user_id: string,
  society_id: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('society_memberships')
      .delete()
      .eq('user_id', user_id)
      .eq('society_id', society_id);
    if (error) throw new Error(JSON.stringify(error));
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
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
  try {
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
    if (error) throw new Error(JSON.stringify(error));
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
    await supabase.from('society_memberships').insert({
      user_id: userId,
      society_id: id,
      role_id: SocietyRoleIdEnum.OWNER,
      status: SocietyMembershipStatusEnum.ACTIVE,
    });

    return society;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
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
  try {
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
    if (error) throw new Error(JSON.stringify(error));
    return data as Society;
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};
