create index if not exists idx_user_metric_preferences_brand_id on public.user_metric_preferences (brand_id);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_metric_preference_position()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.position is null then
    select coalesce(max(position), -1) + 1
    into new.position
    from public.user_metric_preferences
    where user_id = new.user_id
      and brand_id = new.brand_id;
  end if;

  if new.position < 0 then
    new.position = 0;
  end if;

  return new;
end;
$$;

create or replace function public.reindex_metric_preferences_after_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.reindex_metric_preference_positions(old.user_id, old.brand_id);
  return old;
end;
$$;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select
using ((select auth.uid()) = id);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
for insert
with check ((select auth.uid()) = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists users_delete_own on public.users;
create policy users_delete_own on public.users
for delete
using ((select auth.uid()) = id);

drop policy if exists brands_insert_authenticated on public.brands;
create policy brands_insert_authenticated on public.brands
for insert
with check ((select auth.uid()) is not null);

drop policy if exists user_brand_access_select_self_or_admin on public.user_brand_access;
create policy user_brand_access_select_self_or_admin on public.user_brand_access
for select
using (
  user_id = (select auth.uid())
  or public.has_brand_role(brand_id, array['owner', 'admin'])
);

drop policy if exists user_brand_access_insert_self_or_admin on public.user_brand_access;
create policy user_brand_access_insert_self_or_admin on public.user_brand_access
for insert
with check (
  (select auth.uid()) = user_id
  and (
    not exists (
      select 1
      from public.user_brand_access existing
      where existing.brand_id = user_brand_access.brand_id
    )
    or public.has_brand_role(brand_id, array['owner', 'admin'])
  )
);

drop policy if exists user_metric_preferences_select_own on public.user_metric_preferences;
create policy user_metric_preferences_select_own on public.user_metric_preferences
for select
using (user_id = (select auth.uid()) and public.has_brand_access(brand_id));

drop policy if exists user_metric_preferences_insert_own on public.user_metric_preferences;
create policy user_metric_preferences_insert_own on public.user_metric_preferences
for insert
with check (user_id = (select auth.uid()) and public.has_brand_access(brand_id));

drop policy if exists user_metric_preferences_update_own on public.user_metric_preferences;
create policy user_metric_preferences_update_own on public.user_metric_preferences
for update
using (user_id = (select auth.uid()) and public.has_brand_access(brand_id))
with check (user_id = (select auth.uid()) and public.has_brand_access(brand_id));

drop policy if exists user_metric_preferences_delete_own on public.user_metric_preferences;
create policy user_metric_preferences_delete_own on public.user_metric_preferences
for delete
using (user_id = (select auth.uid()) and public.has_brand_access(brand_id));
