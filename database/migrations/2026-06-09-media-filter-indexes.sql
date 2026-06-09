-- Run once from the Neon SQL Editor. Keep heavy DDL out of Cloudflare requests.
create extension if not exists pg_trgm;

create index concurrently if not exists media_status_updated_idx
  on media(status, updated_at desc, id desc);

create index concurrently if not exists media_admin_filter_idx
  on media(status, access_level, created_at desc, id desc);

create index concurrently if not exists media_status_downloads_idx
  on media(status, downloads desc, id desc);

create index concurrently if not exists media_status_views_idx
  on media(status, views desc, id desc);

create index concurrently if not exists media_title_trgm_idx
  on media using gin(title gin_trgm_ops);

create index concurrently if not exists media_description_trgm_idx
  on media using gin(description gin_trgm_ops);

create index concurrently if not exists media_topic_trgm_idx
  on media using gin(topic gin_trgm_ops);

create index concurrently if not exists tags_name_trgm_idx
  on tags using gin(name gin_trgm_ops);
