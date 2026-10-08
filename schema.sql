
-- NWU Helpdesk Ticketing System
-- Supabase / PostgreSQL Database Schema

-- 1. EXTENSIONS


create extension if not exists "pgcrypto";

-- 2. ENUM TYPES

create type public.app_role as enum (
  'customer',
  'agent',
  'admin',
  'manager'
);

create type public.ticket_status as enum (
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed'
);

create type public.ticket_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

-- 3. PROFILES

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);


-- Automatically create a profile when a user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );

  return new;
end;
$$;


create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 4. TICKET CATEGORIES

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- 5. TICKET NUMBER SEQUENCE

create sequence public.ticket_number_seq;

-- 6. TICKETS

create table public.tickets (
  id uuid primary key default gen_random_uuid(),

  ticket_number text not null unique
    default (
      'HD-' ||
      lpad(
        nextval('public.ticket_number_seq')::text,
        6,
        '0'
      )
    ),

  subject text not null,
  description text not null,

  category_id uuid not null
    references public.categories(id),

  status public.ticket_status not null default 'open',

  priority public.ticket_priority not null default 'medium',

  customer_id uuid not null
    references public.profiles(id)
    on delete cascade,

  assigned_agent_id uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 7. TICKET COMMENTS

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid not null
    references public.tickets(id)
    on delete cascade,

  author_id uuid not null
    references public.profiles(id)
    on delete cascade,

  body text not null,

  is_internal boolean not null default false,

  created_at timestamptz not null default now()
);


-- 8. AUDIT LOG

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid
    references public.tickets(id)
    on delete set null,

  actor_id uuid
    references public.profiles(id)
    on delete set null,

  action text not null,

  old_data jsonb,
  new_data jsonb,

  created_at timestamptz not null default now()
);

-- 9. INDEXES

create index tickets_customer_id_idx
  on public.tickets(customer_id);

create index tickets_assigned_agent_id_idx
  on public.tickets(assigned_agent_id);

create index tickets_category_id_idx
  on public.tickets(category_id);

create index tickets_status_idx
  on public.tickets(status);

create index tickets_priority_idx
  on public.tickets(priority);

create index ticket_comments_ticket_id_idx
  on public.ticket_comments(ticket_id);

create index audit_logs_ticket_id_idx
  on public.audit_logs(ticket_id);

create index audit_logs_actor_id_idx
  on public.audit_logs(actor_id);

-- 10. UPDATED_AT FUNCTION

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger tickets_touch_updated_at
  before update on public.tickets
  for each row
  execute procedure public.touch_updated_at();

-- 11. HELPER FUNCTIONS FOR RLS

create or replace function public.current_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;


create or replace function public.is_agent_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    public.current_role() in ('agent', 'admin'),
    false
  );
$$;


create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    public.current_role() = 'admin',
    false
  );
$$;

-- 12. ENABLE ROW LEVEL SECURITY

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.audit_logs enable row level security;

-- 13. PROFILE POLICIES

create policy "profiles: users read own"
  on public.profiles
  for select
  using (id = auth.uid());


create policy "profiles: agents admins managers read all"
  on public.profiles
  for select
  using (
    public.current_role() in ('agent', 'admin', 'manager')
  );


create policy "profiles: users update own information"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.current_role()
  );


create policy "profiles: admins manage users"
  on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 14. CATEGORY POLICIES

create policy "categories: authenticated users read"
  on public.categories
  for select
  to authenticated
  using (true);


create policy "categories: admins insert"
  on public.categories
  for insert
  with check (public.is_admin());


create policy "categories: admins update"
  on public.categories
  for update
  using (public.is_admin())
  with check (public.is_admin());


create policy "categories: admins delete"
  on public.categories
  for delete
  using (public.is_admin());

-- 15. TICKET POLICIES

-- Customers can view their own tickets.
create policy "tickets: customers read own"
  on public.tickets
  for select
  using (customer_id = auth.uid());


-- Agents and admins can view all tickets.
create policy "tickets: agents admins read all"
  on public.tickets
  for select
  using (public.current_role() in ('agent', 'admin'));


-- Managers can view tickets for reporting.
create policy "tickets: managers read all"
  on public.tickets
  for select
  using (public.current_role() = 'manager');


-- Customers can create tickets for themselves.
create policy "tickets: customers create own"
  on public.tickets
  for insert
  with check (
    customer_id = auth.uid()
  );


-- Customers can update their own tickets.
create policy "tickets: customers update own"
  on public.tickets
  for update
  using (
    customer_id = auth.uid()
  )
  with check (
    customer_id = auth.uid()
  );


-- Agents and admins can update tickets.
create policy "tickets: agents admins update"
  on public.tickets
  for update
  using (
    public.current_role() in ('agent', 'admin')
  )
  with check (
    public.current_role() in ('agent', 'admin')
  );


-- Only admins can delete tickets.
create policy "tickets: admins delete"
  on public.tickets
  for delete
  using (public.is_admin());

-- 16. COMMENT POLICIES

-- Customers can see non-internal comments on their own tickets.
create policy "comments: customers read own non-internal"
  on public.ticket_comments
  for select
  using (
    is_internal = false
    and exists (
      select 1
      from public.tickets t
      where t.id = ticket_id
      and t.customer_id = auth.uid()
    )
  );


-- Agents and admins can see all comments.
create policy "comments: agents admins read all"
  on public.ticket_comments
  for select
  using (
    public.current_role() in ('agent', 'admin')
  );


-- Customers can create public comments on their own tickets.
create policy "comments: customers insert"
  on public.ticket_comments
  for insert
  with check (
    author_id = auth.uid()
    and is_internal = false
    and exists (
      select 1
      from public.tickets t
      where t.id = ticket_id
      and t.customer_id = auth.uid()
    )
  );


-- Agents and admins can create comments/internal notes.
create policy "comments: agents admins insert"
  on public.ticket_comments
  for insert
  with check (
    public.current_role() in ('agent', 'admin')
    and author_id = auth.uid()
  );


-- Only admins can delete comments.
create policy "comments: admins delete"
  on public.ticket_comments
  for delete
  using (public.is_admin());

-- 17. AUDIT LOGGING FUNCTION

create or replace function public.log_ticket_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if TG_OP = 'INSERT' then

    insert into public.audit_logs (
      ticket_id,
      actor_id,
      action,
      new_data
    )
    values (
      new.id,
      coalesce(auth.uid(), new.customer_id),
      'TICKET_CREATED',
      to_jsonb(new)
    );

    return new;

  elsif TG_OP = 'UPDATE' then

    insert into public.audit_logs (
      ticket_id,
      actor_id,
      action,
      old_data,
      new_data
    )
    values (
      new.id,
      auth.uid(),
      'TICKET_UPDATED',
      to_jsonb(old),
      to_jsonb(new)
    );

    return new;

  elsif TG_OP = 'DELETE' then

    insert into public.audit_logs (
      ticket_id,
      actor_id,
      action,
      old_data
    )
    values (
      old.id,
      auth.uid(),
      'TICKET_DELETED',
      to_jsonb(old)
    );

    return old;

  end if;

  return null;
end;
$$;


create trigger tickets_audit_trigger
  after insert or update or delete
  on public.tickets
  for each row
  execute procedure public.log_ticket_activity();

-- 18. AUDIT LOG POLICIES

create policy "audit logs: admins read all"
  on public.audit_logs
  for select
  using (public.is_admin());


create policy "audit logs: agents read"
  on public.audit_logs
  for select
  using (
    public.current_role() = 'agent'
  );

-- 19. REALTIME

alter publication supabase_realtime
  add table public.tickets;

alter publication supabase_realtime
  add table public.ticket_comments;

-- END OF NWU HELPDESK DATABASE SCHEMA
