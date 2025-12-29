# Friends System Database Migrations

## Instructions for Manual Application

Since the CLI connection is having issues, you can apply these migrations manually through the Supabase Dashboard.

### How to Apply Migrations:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dthxptbozocrbvmhwvao
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the SQL from each migration file below **in order**
5. Click **Run** to execute each migration

---

## Migration 1: Create Friendships Table

**File:** `supabase/migrations/20250930000000_create_friendships_table.sql`

**Location:** C:\Users\Nebula PC\battleplanapp\supabase\migrations\20250930000000_create_friendships_table.sql

This creates:
- `friendships` table with user_id, friend_id, status (pending/accepted/blocked)
- Indexes for performance
- RLS policies for security
- Trigger for updated_at

---

## Migration 2: Create Shared Content Tables

**File:** `supabase/migrations/20250930000001_create_shared_content_tables.sql`

**Location:** C:\Users\Nebula PC\battleplanapp\supabase\migrations\20250930000001_create_shared_content_tables.sql

This creates:
- `shared_models` table
- `shared_boxes` table
- `shared_battles` table
- `shared_bookings` table
- Indexes for all sharing tables
- RLS policies for secure sharing

---

## Migration 3: Create Friendship Functions

**File:** `supabase/migrations/20250930000002_create_friendship_functions.sql`

**Location:** C:\Users\Nebula PC\battleplanapp\supabase\migrations\20250930000002_create_friendship_functions.sql

This creates helper functions:
- `get_friends(user_id)` - Get all accepted friends
- `get_pending_requests(user_id)` - Get pending friend requests
- `check_friendship_status(user_id, friend_id)` - Check relationship status
- `get_shared_content_count(user_id)` - Count shared items
- `are_friends(user_id, friend_id)` - Check if users are friends
- `send_friend_request(friend_id)` - Safely send friend request

---

## Verification Steps

After applying all migrations, verify they were successful:

1. In SQL Editor, run:
```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('friendships', 'shared_models', 'shared_boxes', 'shared_battles', 'shared_bookings');

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name LIKE '%friend%' OR routine_name LIKE '%shared%';
```

2. Expected results:
   - 5 tables should be listed
   - 6 functions should be listed

---

## Troubleshooting

If you encounter errors:

1. **Table already exists**: Skip that table creation or drop it first
2. **Function already exists**: Use `CREATE OR REPLACE FUNCTION`
3. **Permission errors**: Make sure you're connected as the postgres user
4. **RLS errors**: Check that Row Level Security is properly configured

---

## Alternative: CLI Push (when connection works)

If you want to retry the CLI approach later:

```bash
cd "C:\Users\Nebula PC\battleplanapp"
npx supabase db push
```

You'll need to enter your database password when prompted.

---

## Next Steps

After migrations are applied:
1. Update TypeScript types: `npx supabase gen types typescript --local > src/lib/database.types.ts`
2. Create the React hooks in `src/hooks/useFriends.ts` and `src/hooks/useSharing.ts`
3. Build the UI components for friends management
4. Test the friendship and sharing features