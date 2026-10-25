-- ActivCampus · court booking demo seed (Lancaster University, our first client).
--
-- Venue names and prices are placeholders until we have the real facility list.
-- The demo players exist only so the organiser's "simulate player" button has
-- someone to pay as; their passwords are random and never stored, so nobody
-- can sign in as them. They are recognisable by the @activcampus.test domain.
--
-- To reset the demo before a meeting (deletes every court-booking event and
-- its payments records; Stripe test data is untouched):
--
--   delete from public.events
--   where id in (select event_id from public.ac_court_sessions);

insert into public.universities (id, name, status)
values ('lancaster', 'Lancaster University', 'ACTIVE')
on conflict (id) do nothing;

insert into public.ac_venues (university_id, name, address, court_cost_pence)
select v.university_id, v.name, v.address, v.court_cost_pence
from (values
  ('lancaster', 'Sports Centre · Court 1', 'Lancaster University Sports Centre', 15000),
  ('lancaster', 'Sports Centre · Court 2', 'Lancaster University Sports Centre', 15000),
  ('lancaster', 'Outdoor Court',           'Lancaster University Sports Centre', 6000)
) as v(university_id, name, address, court_cost_pence)
where not exists (
  select 1 from public.ac_venues e where e.university_id = v.university_id and e.name = v.name
);

do $$
declare
  v_names text[][] := array[
    ['Amara','Okafor'], ['Ben','Hughes'], ['Chloe','Patel'], ['Daniel','Wright'],
    ['Ella','Morgan'], ['Faisal','Khan'], ['Grace','Lee'], ['Harry','Evans'],
    ['Isla','Campbell'], ['Jamal','Mensah'], ['Katie','Walsh'], ['Liam','Turner'],
    ['Maya','Singh'], ['Noah','Clarke'], ['Olivia','Brown'], ['Priya','Shah'],
    ['Reece','Taylor'], ['Sofia','Rossi'], ['Tom','Fletcher'], ['Zara','Ahmed']
  ];
  v_email text;
  v_id    uuid;
begin
  for i in 1 .. array_length(v_names, 1) loop
    v_email := format('demo.player+%s@activcampus.test', i);
    select id into v_id from auth.users where email = v_email;

    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
        extensions.crypt(encode(extensions.gen_random_bytes(24), 'hex'), extensions.gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"],"ac_demo_player":true}'::jsonb, '{}'::jsonb,
        now(), now(), '', '', '', ''
      );
    end if;

    insert into public.profiles (id, first_name, last_name, over_18, onboarding_status, university_id, course)
    values (v_id, v_names[i][1], v_names[i][2], true, 'completed', 'lancaster', 'Demo player')
    on conflict (id) do nothing;
  end loop;
end;
$$;
