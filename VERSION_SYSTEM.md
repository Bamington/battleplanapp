# Version System

The BattlePlan app uses a unified version management system where `package.json` is the single source of truth for version numbers. Versions are automatically synchronized to Android/iOS build files and the database.

## How It Works

1. **Single Source of Truth**: The version number in `package.json` is the master version
2. **Automatic Synchronization**: Running `npm run sync-version` updates:
   - Android `build.gradle` (versionName and versionCode)
   - iOS `project.pbxproj` (MARKETING_VERSION and CURRENT_PROJECT_VERSION)
   - Supabase database (version table)
3. **Database Table**: The `version` table stores version history with:
   - `id`: Auto-incrementing primary key
   - `ver_number`: Semantic version string (e.g., "1.0.0", "1.1.0", "1.2.3")
   - `ver_title`: Version title (auto-generated as "v{version}" by sync script)
   - `created_at`: Timestamp of when the version was created
   - `ver_notes`: Optional notes about the version (can be added via admin UI)
   - `published`: Boolean flag to control which version is displayed

4. **Display**: The current published version is displayed in the footer of the app

## Version Numbering

- **Format**: Semantic versioning (MAJOR.MINOR.PATCH)
  - Examples: `1.0.0`, `1.1.0`, `1.2.3`, `2.0.0`
- **Version Code Calculation**: For Android/iOS build numbers
  - Formula: `MAJOR * 10000 + MINOR * 100 + PATCH`
  - Examples:
    - 1.0.0 → 10000
    - 1.1.0 → 10100
    - 1.2.3 → 10203
    - 2.0.0 → 20000

## Usage

### Updating the Version

1. **Using npm version command** (recommended):
   ```bash
   npm version patch   # 1.0.0 → 1.0.1
   npm version minor   # 1.0.0 → 1.1.0
   npm version major   # 1.0.0 → 2.0.0
   ```
   This automatically updates `package.json` and creates a git commit/tag.

2. **Manual update**: Edit `package.json` directly:
   ```json
   {
     "version": "1.2.3"
   }
   ```

### Syncing Versions

After updating the version in `package.json`, run:

```bash
npm run sync-version
```

This will:
- Update Android `build.gradle` with the new version
- Update iOS `project.pbxproj` with the new version
- Create or update the version entry in the database

### Automatic Sync Before Builds

The sync script runs automatically before Android/iOS builds via npm prebuild hooks:
- `prebuild:android` - Runs before Android builds
- `prebuild:ios` - Runs before iOS builds

## Database Sync

The sync script automatically:
- Checks if a published version with the current version number exists
- If found: Updates the `ver_title` to "v{version}" and ensures `published=true`
- If not found: Creates a new version entry with:
  - `ver_number`: Semantic version from package.json
  - `ver_title`: Auto-generated "v{version}" (e.g., "v1.0.0")
  - `published`: true
  - `ver_notes`: null (admins can add notes via UI)
  - `created_at`: Current timestamp

### Database Credentials

The sync script requires Supabase credentials in your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

If credentials are missing, the script will still update Android/iOS files but skip database sync with a warning.

## Version Management UI

Admins can manage versions through the Release Management page:
- View version history
- Edit version notes
- Toggle publish status
- Create new versions manually (though sync script is recommended)

## Database Migration

The version system uses semantic versioning stored as text. If you're upgrading from the old numeric system, run the migration:

```sql
-- Migration: 20251229150735_migrate_version_to_semantic.sql
-- This converts numeric versions (1.0, 1.1) to semantic format (1.0.0, 1.1.0)
```

## Troubleshooting

### Version Display Issues

1. Check the browser console for any errors
2. Verify the `useVersion` hook is working correctly
3. Ensure the footer component is receiving the version data
4. Verify the database migration has been applied
5. Check that a published version exists in the database

### Sync Script Issues

1. **Version format error**: Ensure `package.json` version follows semantic versioning (MAJOR.MINOR.PATCH)
2. **Database sync fails**: Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
3. **File updates fail**: Verify file paths exist (Android/iOS projects may not be present in web-only setups)
4. **TypeScript execution error**: Ensure `tsx` is installed: `npm install --save-dev tsx`

### Android/iOS Build Issues

1. **Version not updating**: Run `npm run sync-version` manually before building
2. **Version code conflicts**: Ensure version code increments with each release (handled automatically by sync script)
3. **iOS build errors**: Verify `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` are correctly set in `project.pbxproj`

## Best Practices

1. **Always use semantic versioning**: Follow MAJOR.MINOR.PATCH format
2. **Sync before releases**: Run `npm run sync-version` before building mobile apps
3. **Use npm version**: Prefer `npm version` commands over manual edits for consistency
4. **Add release notes**: Use the admin UI to add detailed notes about what changed in each version
5. **Keep versions published**: Only unpublish versions if you need to hide them temporarily

## Future Enhancements

Potential improvements to consider:
- Automated changelog generation from git commits
- Version comparison tools
- Release notes templates
- Integration with CI/CD pipelines
