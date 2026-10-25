-- ActivCampus · court booking: run the ac-court-tick edge function every minute.
--
-- The tick expires unfilled reservations, closes registration at start + 15
-- minutes, finishes stuck confirmations and retries refunds. Every step is
-- idempotent, so a slow or overlapping run is harmless.
--
-- The URL and the shared secret are read from Vault at run time, so neither
-- is stored in this file. They were created once, outside migrations:
--
--   select vault.create_secret('<project url>', 'ac_project_url');
--   select vault.create_secret('<AC_CRON_SECRET value>', 'ac_cron_secret');
--
-- ac_cron_secret must match the AC_CRON_SECRET Edge Function secret.

select cron.unschedule('ac-court-tick')
where exists (select 1 from cron.job where jobname = 'ac-court-tick');

select cron.schedule(
  'ac-court-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'ac_project_url')
           || '/functions/v1/ac-court-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ac_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
