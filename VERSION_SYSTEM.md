# Version System

The BattlePlan app now includes an automated version tracking system that increments the version number with each deployment.

## How It Works

1. **Database Table**: The `version` table stores version history with:
   - `id`: Auto-incrementing primary key
   - `ver_number`: Numeric version number (e.g., 1.0, 1.1, 1.2)
   - `created_at`: Timestamp of when the version was created

2. **Automatic Increment**: Each time you run `npm run build`, the version number automatically increments by 0.1

3. **Display**: The current version is displayed in the footer of the app

## Usage

### Automatic Version Increment (Recommended)

The version automatically increments during the build process:

```bash
npm run build
```

This will:
1. Update the build timestamp
2. Increment the version number in the database
3. Build the app

### Manual Version Increment

If you need to manually increment the version (e.g., for hotfixes), you can:

1. **Via Admin Panel**: Go to Admin Panel → Version Management → Click "Increment Version"
2. **Via Script**: Run `npm run update-version`

### Environment Variables Required

For the version update script to work, you need these environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: The service role key is required because the version update needs to write to the database during the build process.

## Version Numbering

- **Format**: Numeric (e.g., 1.0, 1.1, 1.2, 2.0)
- **Increment**: +0.1 for each deployment
- **Initial Version**: 1.0 (automatically created if table is empty)

## Database Migration

The version system requires a database migration to add the `ver_number` column:

```sql
-- Migration: 20250101000000_add_version_number.sql
ALTER TABLE version ADD COLUMN ver_number numeric NOT NULL DEFAULT 1.0;
```

## Troubleshooting

### Version Not Updating

1. Check that environment variables are set correctly
2. Ensure the service role key has write permissions to the `version` table
3. Verify the database migration has been applied

### Version Display Issues

1. Check the browser console for any errors
2. Verify the `useVersion` hook is working correctly
3. Ensure the footer component is receiving the version data

## Future Enhancements

Potential improvements to consider:
- Major/minor version increments (e.g., 1.0 → 1.1 → 2.0)
- Version release notes
- Version comparison tools
- Automated changelog generation
