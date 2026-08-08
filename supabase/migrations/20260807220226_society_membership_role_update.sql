-- Lets society leaders change a member's role (AC-18's Executive tab).
--
-- `society_memberships` had SELECT, INSERT and two DELETE policies but no
-- UPDATE at all, so promoting a member was denied by the database regardless of
-- what the client sent.
--
-- Constraints encoded here rather than in the client, because the client is not
-- a trust boundary:
--   * only OWNER/PRESIDENT of that same society may change roles;
--   * an OWNER's row cannot be modified (no demoting the owner);
--   * the new role must be MEMBER or EXEC — OWNER/PRESIDENT cannot be granted
--     this way, so leadership can't be escalated sideways.

create policy "Leaders can change member roles"
  on public.society_memberships
  for update
  to authenticated
  using (
    -- The row being changed must not be an owner...
    role_id <> 'OWNER'
    -- ...and the caller must lead this society.
    and exists (
      select 1
      from public.society_memberships sm
      where sm.society_id = society_memberships.society_id
        and sm.user_id = auth.uid()
        and sm.role_id in ('OWNER', 'PRESIDENT')
    )
  )
  with check (
    role_id in ('MEMBER', 'EXEC')
    and exists (
      select 1
      from public.society_memberships sm
      where sm.society_id = society_memberships.society_id
        and sm.user_id = auth.uid()
        and sm.role_id in ('OWNER', 'PRESIDENT')
    )
  );
