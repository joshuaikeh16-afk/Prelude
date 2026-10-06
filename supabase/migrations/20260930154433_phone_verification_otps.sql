create table if not exists public.phone_verification_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_id text not null,
  attempts_used integer not null default 0,
  expires_at timestamptz not null,
  invalidated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists phone_verification_otps_phone_idx
  on public.phone_verification_otps(phone);

create index if not exists phone_verification_otps_otp_id_idx
  on public.phone_verification_otps(otp_id);
