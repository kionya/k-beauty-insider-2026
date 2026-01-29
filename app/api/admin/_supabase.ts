-- 1) 스탬프 발급 조건 강제: reservation.status='Completed' + reservation.user_id 존재 + user_id 일치
create or replace function public.enforce_stamp_completed_only()
returns trigger
language plpgsql
as $$
declare
  v_status text;
  v_user_id uuid;
begin
  if new.reservation_id is null then
    raise exception 'reservation_id is required to issue a stamp';
  end if;

  select status, user_id
    into v_status, v_user_id
  from public.reservations
  where id = new.reservation_id;

  if not found then
    raise exception 'Reservation % not found', new.reservation_id;
  end if;

  if v_status <> 'Completed' then
    raise exception 'Cannot issue stamp unless reservation status is Completed';
  end if;

  if v_user_id is null then
    raise exception 'Cannot issue stamp for guest reservation (no user_id)';
  end if;

  -- stamps.user_id를 클라이언트가 안 보내도 자동 세팅
  if new.user_id is null then
    new.user_id := v_user_id;
  end if;

  if new.user_id <> v_user_id then
    raise exception 'Stamp user_id must match reservation.user_id';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_stamps_completed_only on public.stamps;

create trigger trg_stamps_completed_only
before insert on public.stamps
for each row
execute function public.enforce_stamp_completed_only();