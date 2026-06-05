# Supabase migrations

## Apply the schema

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**
2. Paste and run the contents of `migrations/001_user_interactions.sql`
3. Confirm tables `liked_articles`, `saved_articles`, and `comments` appear under **Table Editor**

## Tables

| Table | Purpose |
|-------|---------|
| `liked_articles` | Per-user article likes |
| `saved_articles` | Watchlist / saved articles |
| `comments` | Article comments (readable by all authenticated users) |

Row Level Security is enabled on all three tables.
