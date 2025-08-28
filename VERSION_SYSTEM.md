# Version System

The BattlePlan app includes a version tracking system that displays the current version number in the footer.

## How It Works

1. **Database Table**: The `version` table stores version history with:
   - `id`: Auto-incrementing primary key
   - `ver_number`: Numeric version number (e.g., 1.0, 1.1, 1.2)
   - `created_at`: Timestamp of when the version was created
   - `ver_notes`: Optional notes about the version

2. **Display**: The current version is displayed in the footer of the app

## Version Management

Version numbers are now managed manually through the database or admin interface. The automatic version increment functionality has been removed.

## Version Numbering

- **Format**: Numeric (e.g., 1.0, 1.1, 1.2, 2.0)
- **Initial Version**: 1.0 (automatically created if table is empty)

## Database Migration

The version system requires a database migration to add the `ver_number` column:

```sql
-- Migration: 20250101000000_add_version_number.sql
ALTER TABLE version ADD COLUMN ver_number numeric NOT NULL DEFAULT 1.0;
```

## Troubleshooting

### Version Display Issues

1. Check the browser console for any errors
2. Verify the `useVersion` hook is working correctly
3. Ensure the footer component is receiving the version data
4. Verify the database migration has been applied

## Future Enhancements

Potential improvements to consider:
- Manual version management interface
- Version release notes
- Version comparison tools
- Automated changelog generation
