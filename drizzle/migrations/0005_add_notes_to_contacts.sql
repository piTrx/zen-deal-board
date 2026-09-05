alter table public.contacts add column if not exists notes text;

comment on column public.contacts.notes is 'Free-form notes about the contact';