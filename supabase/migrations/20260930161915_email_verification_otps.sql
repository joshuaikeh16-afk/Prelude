create table if not exists public.email_verification_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_code_hash text not null,
  attempts_used integer not null default 0,
  expires_at timestamptz not null,
  invalidated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_otps_email_idx
  on public.email_verification_otps(email);
