-- Prevent concurrent sync executions for the same ad account.
-- Clean stale/inconsistent in-progress rows first so index creation is safe.

update public.sync_logs
set
  status = 'failed'::sync_status,
  error_message = coalesce(error_message, 'Auto-failed stale in-progress sync lock during migration'),
  completed_at = now()
where status = 'in_progress'::sync_status
  and completed_at is null
  and started_at < now() - interval '20 minutes';

with ranked as (
  select
    id,
    ad_account_id,
    row_number() over (
      partition by ad_account_id
      order by started_at desc, created_at desc, id desc
    ) as row_num
  from public.sync_logs
  where ad_account_id is not null
    and status = 'in_progress'::sync_status
    and completed_at is null
)
update public.sync_logs as s
set
  status = 'failed'::sync_status,
  error_message = coalesce(s.error_message, 'Auto-failed duplicate in-progress sync lock during migration'),
  completed_at = now()
from ranked
where s.id = ranked.id
  and ranked.row_num > 1;

create unique index if not exists sync_logs_one_in_progress_per_account_idx
  on public.sync_logs (ad_account_id)
  where ad_account_id is not null
    and status = 'in_progress'::sync_status
    and completed_at is null;
