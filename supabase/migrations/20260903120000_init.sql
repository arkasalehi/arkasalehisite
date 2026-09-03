-- Arka Salehi schema (replaces Prisma). Run in Supabase SQL editor if MCP cannot apply it.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('USER', 'ADMIN');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.post_type as enum ('BLOG', 'VIDEO', 'SHORT');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.post_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.comment_status as enum ('VISIBLE', 'HIDDEN', 'SPAM');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.notification_type as enum ('LIKE', 'COMMENT', 'REPLY', 'NEW_CONTENT');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.order_status as enum ('PENDING', 'PAID', 'FULFILLED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text not null unique,
  display_name text not null,
  role public.user_role not null default 'USER',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  type public.post_type not null,
  status public.post_status not null default 'DRAFT',
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  cover_image text,
  video_url text,
  thumbnail_url text,
  duration int,
  reading_time int,
  seo_title text,
  seo_description text,
  featured boolean not null default false,
  scheduled_at timestamptz,
  published_at timestamptz,
  view_count int not null default 0,
  category_id uuid references public.categories (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_live_idx on public.posts (type, status, published_at);
create index if not exists posts_featured_idx on public.posts (featured, status, published_at);
create index if not exists posts_views_idx on public.posts (status, view_count);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_author_idx on public.posts (author_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  status public.comment_status not null default 'VISIBLE',
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists comments_user_idx on public.comments (user_id);
create index if not exists comments_parent_idx on public.comments (parent_id);
create index if not exists comments_status_idx on public.comments (status);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
create index if not exists likes_post_idx on public.likes (post_id);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at);
create index if not exists bookmarks_post_idx on public.bookmarks (post_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  actor_id uuid,
  post_id uuid,
  group_key text,
  count int not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_read_idx on public.notifications (user_id, read, created_at);
create index if not exists notifications_group_idx on public.notifications (user_id, group_key, read);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  price int not null,
  compare_price int,
  discount_percent int not null default 0,
  stock int not null default 0,
  image_url text,
  in_stock boolean not null default true,
  sku text unique,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_featured_idx on public.products (featured, in_stock);

create table if not exists public.post_products (
  post_id uuid not null references public.posts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (post_id, product_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity int not null default 1,
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists cart_items_user_idx on public.cart_items (user_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.order_status not null default 'PENDING',
  total int not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity int not null default 1,
  price int not null
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace view public.live_posts
with (security_invoker = true) as
select *
from public.posts
where status = 'PUBLISHED'
  and (scheduled_at is null or scheduled_at <= now())
  and (published_at is null or published_at <= now());

create or replace function public.seed_demo_content(p_author uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cat_design uuid;
  cat_studio uuid;
  prod_nb uuid;
  prod_mn uuid;
  blog1 uuid;
begin
  if exists (select 1 from public.posts limit 1) then
    return;
  end if;

  insert into public.categories (name, slug, description)
  values
    ('طراحی', 'design', 'مینیمالیسم، محصول و تجربه کاربری'),
    ('استودیو', 'studio', 'پشت‌صحنه و ساخت محتوا')
  on conflict (slug) do update set name = excluded.name
  returning id into cat_design;

  select id into cat_design from public.categories where slug = 'design';
  select id into cat_studio from public.categories where slug = 'studio';

  insert into public.products (title, slug, description, price, compare_price, image_url, featured, sku, stock, in_stock)
  values
    (
      'دفترچه طراحی آرکا',
      'design-notebook',
      'دفترچه محدود برای ایده‌پردازی روزانه.',
      390000,
      490000,
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
      true,
      'NB-001',
      20,
      true
    ),
    (
      'جلسه منتورشیپ',
      'mentorship',
      'یک جلسه خصوصی برای معماری محصول محتوا.',
      2400000,
      null,
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      true,
      'MN-001',
      10,
      true
    )
  on conflict (slug) do nothing;

  select id into prod_nb from public.products where slug = 'design-notebook';
  select id into prod_mn from public.products where slug = 'mentorship';

  insert into public.posts (
    type, status, title, slug, excerpt, body, cover_image, seo_title, seo_description,
    published_at, reading_time, category_id, author_id, featured
  ) values (
    'BLOG', 'PUBLISHED',
    'چرا مینیمالیسم در محصول جواب می‌دهد',
    'minimal-product-design',
    'کمتر، واضح‌تر، سریع‌تر. این یادداشت درباره تصمیم‌های طراحی است که بار شناختی را کم می‌کنند.',
    'محصول خوب شلوغ نیست. هر سطح شیشه‌ای، هر گرادیان و هر انیمیشن باید یک کار مشخص انجام دهد.' || chr(10) || chr(10) ||
    'در این پلتفرم فقط یک خالق محتوا وجود دارد. این محدودیت عمدی است: تمرکز روی کیفیت انتشار، نه رقابت برای توجه.' || chr(10) || chr(10) ||
    'اگر در حال ساخت تجربه فارسی راست‌به‌چپ هستید، فاصله‌گذاری، وزن فونت و کنتراست مهم‌تر از تزئین است.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
    'مینیمالیسم در طراحی محصول',
    'چطور با کم کردن المان‌ها، محصول محتوایی سریع‌تر و خواناتر می‌سازیم.',
    now(), 4, cat_design, p_author, true
  )
  on conflict (slug) do nothing
  returning id into blog1;

  if blog1 is not null and prod_nb is not null then
    insert into public.post_products (post_id, product_id) values (blog1, prod_nb) on conflict do nothing;
  end if;

  insert into public.posts (
    type, status, title, slug, excerpt, body, cover_image, published_at, reading_time, category_id, author_id
  ) values (
    'BLOG', 'PUBLISHED',
    'معماری portable: از کلودفلر تا سرور خودتان',
    'portable-architecture',
    'لایه دیتابیس و احراز هویت را از APIهای اختصاصی ابر جدا کنید تا بعداً روی Node.js هم اجرا شود.',
    'قفل‌شدن به یک ارائه‌دهنده معمولاً از لایه داده شروع می‌شود. سوپابیس روی HTTP کار می‌کند و روی Cloudflare Workers هم پایدار است.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
    now(), 5, cat_studio, p_author
  ) on conflict (slug) do nothing;

  insert into public.posts (
    type, status, title, slug, excerpt, video_url, thumbnail_url, cover_image, duration, published_at, category_id, author_id
  ) values
    (
      'VIDEO', 'PUBLISHED', 'پشت‌صحنه یک جلسه استودیو', 'studio-session',
      'نور، صدا و ریتم تدوین برای ویدیوی فارسی.',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80',
      90, now(), cat_studio, p_author
    ),
    (
      'VIDEO', 'PUBLISHED', 'یک پاس کوتاه روی UI شیشه‌ای', 'glass-ui-pass',
      'گرادیان آبی/فیروزه‌ای بدون شلوغی.',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      75, now(), cat_design, p_author
    ),
    (
      'SHORT', 'PUBLISHED', 'یک قانون برای انتشار', 'one-rule',
      'اگر ارزش ندارد، منتشر نکن.',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80',
      null, 18, now(), cat_studio, p_author
    ),
    (
      'SHORT', 'PUBLISHED', 'فاصله در رابط راست‌به‌چپ', 'rtl-spacing',
      'فضای منفی را جدی بگیرید.',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://images.unsplash.com/photo-1618005198919-d3d2249c7c5b?auto=format&fit=crop&w=900&q=80',
      null, 15, now(), cat_design, p_author
    )
  on conflict (slug) do nothing;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  dname text;
  r public.user_role;
begin
  uname := coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1));
  uname := lower(regexp_replace(uname, '[^a-zA-Z0-9._]', '', 'g'));
  if length(uname) < 3 then
    uname := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  dname := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), uname);
  r := case when lower(new.email) in ('admin@arkasalehi.ir') then 'ADMIN' else 'USER' end;

  insert into public.profiles (id, email, username, display_name, role)
  values (new.id, new.email, uname, dname, r)
  on conflict (id) do nothing;

  if r = 'ADMIN' then
    perform public.seed_demo_content(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_post_views(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set view_count = view_count + 1
  where id = p_id and status = 'PUBLISHED';
end;
$$;

create or replace function public.notify_admins(
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_actor_id uuid default null,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_row record;
  existing public.notifications%rowtype;
  gkey text;
  next_count int;
  next_title text;
begin
  gkey := case when p_post_id is not null then p_type::text || ':' || p_post_id::text else null end;
  for admin_row in select id from public.profiles where role = 'ADMIN' loop
    if gkey is not null and p_type in ('LIKE', 'COMMENT') then
      select * into existing
      from public.notifications
      where user_id = admin_row.id and group_key = gkey and read = false
      order by created_at desc
      limit 1;
      if found then
        next_count := existing.count + 1;
        next_title := case
          when p_type = 'LIKE' then next_count::text || ' نفر این مطلب را پسندیدند'
          else next_count::text || ' نظر تازه روی مطلب'
        end;
        update public.notifications
        set count = next_count, title = next_title, body = p_body, created_at = now()
        where id = existing.id;
        continue;
      end if;
    end if;
    insert into public.notifications (user_id, type, title, body, link, actor_id, post_id, group_key)
    values (admin_row.id, p_type, p_title, p_body, p_link, p_actor_id, p_post_id, gkey);
  end loop;
end;
$$;

create or replace function public.notify_user(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_actor_id uuid default null,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id = p_actor_id then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, link, actor_id, post_id)
  values (p_user_id, p_type, p_title, p_body, p_link, p_actor_id, p_post_id);
end;
$$;

create or replace function public.notify_all_users(
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null,
  p_post_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, link, post_id)
  select id, p_type, p_title, p_body, p_link, p_post_id from public.profiles;
end;
$$;

create or replace function public.place_order(p_items jsonb, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  prod public.products%rowtype;
  qty int;
  unit_price int;
  order_total int := 0;
  new_order_id uuid;
  next_stock int;
begin
  if uid is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'NOT_FOUND';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into prod from public.products where id = (item->>'productId')::uuid for update;
    qty := coalesce((item->>'quantity')::int, 0);
    if not found or not prod.in_stock or prod.stock < qty or qty < 1 then
      raise exception 'NOT_FOUND';
    end if;
    unit_price := round(prod.price * (1 - least(90, greatest(0, prod.discount_percent)) / 100.0));
    order_total := order_total + unit_price * qty;
  end loop;

  insert into public.orders (user_id, status, total, note)
  values (uid, 'PENDING', order_total, p_note)
  returning id into new_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into prod from public.products where id = (item->>'productId')::uuid for update;
    qty := (item->>'quantity')::int;
    unit_price := round(prod.price * (1 - least(90, greatest(0, prod.discount_percent)) / 100.0));
    next_stock := prod.stock - qty;
    update public.products
    set stock = next_stock, in_stock = next_stock > 0
    where id = prod.id;
    insert into public.order_items (order_id, product_id, quantity, price)
    values (new_order_id, prod.id, qty, unit_price);
  end loop;

  return jsonb_build_object('id', new_order_id, 'total', order_total, 'status', 'PENDING');
end;
$$;

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notifications enable row level security;
alter table public.products enable row level security;
alter table public.post_products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "settings read" on public.site_settings;
create policy "settings read" on public.site_settings for select using (true);
drop policy if exists "settings write admin" on public.site_settings;
create policy "settings write admin" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories for select using (true);
drop policy if exists "categories write admin" on public.categories;
create policy "categories write admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (
  public.is_admin()
  or (
    status = 'PUBLISHED'
    and (scheduled_at is null or scheduled_at <= now())
    and (published_at is null or published_at <= now())
  )
);
drop policy if exists "posts write admin" on public.posts;
create policy "posts write admin" on public.posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "post products read" on public.post_products;
create policy "post products read" on public.post_products for select using (true);
drop policy if exists "post products write admin" on public.post_products;
create policy "post products write admin" on public.post_products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (status = 'VISIBLE' or public.is_admin() or user_id = auth.uid());
drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments admin" on public.comments;
create policy "comments admin" on public.comments for update using (public.is_admin());
drop policy if exists "comments delete admin" on public.comments;
create policy "comments delete admin" on public.comments for delete using (public.is_admin());

drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes for select using (true);
drop policy if exists "likes write own" on public.likes;
create policy "likes write own" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes delete own" on public.likes;
create policy "likes delete own" on public.likes for delete using (auth.uid() = user_id);

drop policy if exists "bookmarks read own" on public.bookmarks;
drop policy if exists "bookmarks read" on public.bookmarks;
create policy "bookmarks read" on public.bookmarks for select using (true);
drop policy if exists "bookmarks insert own" on public.bookmarks;
create policy "bookmarks insert own" on public.bookmarks for insert with check (auth.uid() = user_id);
drop policy if exists "bookmarks delete own" on public.bookmarks;
create policy "bookmarks delete own" on public.bookmarks for delete using (auth.uid() = user_id);

drop policy if exists "notifications own" on public.notifications;
create policy "notifications own" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "products read" on public.products;
create policy "products read" on public.products for select using (true);
drop policy if exists "products write admin" on public.products;
create policy "products write admin" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cart own" on public.cart_items;
create policy "cart own" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orders own read" on public.orders;
create policy "orders own read" on public.orders for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "order items read" on public.order_items;
create policy "order items read" on public.order_items for select using (
  public.is_admin()
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
grant execute on function public.notify_admins(public.notification_type, text, text, text, uuid, uuid) to authenticated;
grant execute on function public.notify_user(uuid, public.notification_type, text, text, text, uuid, uuid) to authenticated;
grant execute on function public.notify_all_users(public.notification_type, text, text, text, uuid) to authenticated;
grant execute on function public.place_order(jsonb, text) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.likes;
exception when duplicate_object then null;
end $$;
