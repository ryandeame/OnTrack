create or replace function public.get_exercise_dashboard_history(
  timezone text,
  days_count integer default 10
)
returns table (
  day_date date,
  total_reps bigint
)
language sql
stable
as $$
  with requested_days as (
    select generate_series(
      (now() at time zone timezone)::date - greatest(days_count - 1, 0),
      (now() at time zone timezone)::date,
      interval '1 day'
    )::date as day_date
  ),
  totals as (
    select
      (occurred_at at time zone timezone)::date as day_date,
      coalesce(sum((sets * reps)::bigint), 0)::bigint as total_reps
    from public.exercise_logs
    where occurred_at >= (
      (
        ((now() at time zone timezone)::date - greatest(days_count - 1, 0))::timestamp
      ) at time zone timezone
    )
    group by 1
  )
  select
    requested_days.day_date,
    coalesce(totals.total_reps, 0)::bigint as total_reps
  from requested_days
  left join totals using (day_date)
  order by requested_days.day_date;
$$;
