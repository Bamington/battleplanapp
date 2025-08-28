# Battles Table RLS Migration Guide

## Overview

The battles table currently exists with a schema that doesn't include a `user_id` field, which makes proper user isolation difficult. This guide provides two migration options to fix the RLS policies.

## Current Battles Table Schema

```sql
- id (number, primary key)
- battle_name (text)
- date_played (text)
- game_name (text)
- game_uid (text)
- opp_name (text)
- opp_id (text[])
- result (text)
- created_at (text)
```

## Migration Options

### Option 1: Basic RLS Policies (20250828000001_fix_battles_rls_policies.sql)

**Use this if you want to keep the current schema without user isolation.**

This migration:
- Allows all authenticated users to read, insert, update, and delete all battles
- Doesn't require schema changes
- Provides basic RLS protection (only authenticated users can access)

**Pros:**
- No schema changes required
- Simple to implement
- Works with existing data

**Cons:**
- No user isolation (all users can see/edit all battles)
- Less secure for multi-user environments

### Option 2: Add User ID for Proper Isolation (20250828000002_add_user_id_to_battles.sql)

**Use this for proper user isolation (RECOMMENDED).**

This migration:
- Adds a `user_id` column to the battles table
- Creates proper RLS policies that restrict users to their own battles
- Updates the frontend code to include user_id when creating battles

**Pros:**
- Proper user isolation
- Secure multi-user environment
- Follows best practices for user data

**Cons:**
- Requires schema change
- Need to handle existing data (if any)

## Frontend Changes Made

When using Option 2, the following frontend changes have been implemented:

### NewBattleModal.tsx
```typescript
// Added user_id to the insert operation
const { error } = await supabase
  .from('battles')
  .insert({
    // ... other fields
    user_id: user?.id // Add user_id for proper RLS isolation
  })
```

### useBattles.ts
```typescript
// Added user_id filter to the query
const { data, error } = await supabase
  .from('battles')
  .select('*')
  .eq('user_id', user.id) // Filter by user_id for proper isolation
  .order('date_played', { ascending: false })
```

## Recommended Approach

**Use Option 2** for production environments as it provides proper user isolation and security. This ensures that users can only see and manage their own battles.

## Running the Migration

1. Choose which migration to run based on your requirements
2. Run the migration using Supabase CLI:
   ```bash
   # For Option 1 (basic RLS)
   npx supabase db push
   
   # For Option 2 (user isolation) - RECOMMENDED
   npx supabase db push
   ```

## Testing

After running the migration:
1. Test creating a new battle
2. Verify that users can only see their own battles
3. Test that the battle name is generated correctly as "[Game] against [Opponent]"
4. Verify that the GameDropdown shows recent and favorite games correctly
