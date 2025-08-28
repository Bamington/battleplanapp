# CSV Upload Feature

This document describes the admin-only CSV upload feature for bulk importing models and collections into the BattlePlan app.

## Overview

The CSV upload feature allows administrators to bulk import models and collections from CSV files. This is useful for:
- Migrating data from other systems
- Bulk adding new models/collections
- Importing data from spreadsheets

**New Feature**: Column Mapping - If your CSV headers don't match the expected format, you can now map your columns to the required properties after upload.

## Access

- **Admin Only**: This feature is only available to users with `is_admin = true`
- **Location**: Admin Panel → CSV Upload
- **File Size Limit**: 5MB maximum

## Supported Upload Types

### 1. Models Upload

Upload individual models with their details.

#### Required Columns:
- `name` - Model name (required)
- `status` - Painting status (required)
- `count` - Number of models (required)
- `game_name` - Associated game (required)

#### Optional Columns:
- `box_name` - Collection/box name
- `notes` - Additional notes
- `purchase_date` - Purchase date (YYYY-MM-DD format)
- `painted_date` - Date painted (YYYY-MM-DD format)
- `public` - Public visibility (true/false, default: false)

#### Status Values:
- `None` - Unassembled
- `Assembled` - Built but not primed
- `Primed` - Primed but not painted
- `Partially Painted` - Some painting done
- `Painted` - Fully painted

#### Example Models CSV:
```csv
name,status,count,game_name,box_name,notes,purchase_date,painted_date,public
"Space Marine",Assembled,1,"Warhammer 40k","Space Marine Squad","My first model",2024-01-15,,true
"Ork Boy",Primed,5,"Warhammer 40k","Ork Boyz",,2024-02-01,2024-02-10,false
"Tau Fire Warrior",Painted,3,"Warhammer 40k","Tau Fire Warriors","Custom paint scheme",2024-01-20,2024-01-25,true
```

### 2. Collections Upload

Upload collections/boxes that can contain multiple models.

#### Required Columns:
- `name` - Collection name (required)
- `game_name` - Associated game (required)

#### Optional Columns:
- `purchase_date` - Purchase date (YYYY-MM-DD format)
- `public` - Public visibility (true/false, default: false)

#### Example Collections CSV:
```csv
name,game_name,purchase_date,public
"Space Marine Collection","Warhammer 40k",2024-01-15,true
"Ork Army","Warhammer 40k",2024-02-01,false
"Tau Empire Forces","Warhammer 40k",2024-01-20,true
```

## Data Processing Logic

### Game Resolution
- If a game with the specified name exists, it will be used
- If no game exists, a new game will be created automatically
- Game names are case-sensitive

### Box/Collection Resolution
- For models: If `box_name` is specified, the system will:
  - Use existing box if found (matching name and user)
  - Create new box if not found
- For collections: Each row creates a new collection

### User Association
- All imported data is associated with the uploading admin user
- This ensures proper ownership and access control

## Validation Rules

### Models Validation:
- Name is required and must not be empty
- Status must be one of the valid status values
- Count must be a positive integer
- Game name is required
- Dates must be in YYYY-MM-DD format (if provided)
- Public field must be 'true' or 'false'

### Collections Validation:
- Name is required and must not be empty
- Game name is required
- Dates must be in YYYY-MM-DD format (if provided)
- Public field must be 'true' or 'false'

## Error Handling

### Upload Process:
1. **File Validation**: Checks file type and size
2. **Structure Validation**: Verifies required columns are present
3. **Row-by-Row Processing**: Each row is processed individually
4. **Error Collection**: Errors are collected and reported
5. **Partial Success**: Upload continues even if some rows fail

### Error Types:
- **File Errors**: Invalid file type, size too large
- **Structure Errors**: Missing required columns
- **Validation Errors**: Invalid data in specific rows
- **Database Errors**: Issues with data insertion

### Error Reporting:
- Errors are displayed with row numbers
- Success and failure counts are shown
- Detailed error messages help identify issues

## Security Features

### Input Sanitization:
- All text inputs are sanitized to prevent injection attacks
- HTML tags are stripped from input
- Special characters are handled safely

### Access Control:
- Admin-only access enforced on both client and server
- User association ensures data ownership
- RLS policies maintain data security

### Rate Limiting:
- File size limits prevent abuse
- Processing is done client-side to reduce server load

## Usage Instructions

### Step 1: Prepare Your CSV
1. Create a CSV file with the required columns
2. Use the sample files as templates
3. Ensure data is properly formatted
4. Save as UTF-8 encoding

### Step 2: Upload
1. Navigate to Admin Panel → CSV Upload
2. Select upload type (Models or Collections)
3. Click "Select File" and choose your CSV
4. Review the file details
5. Click "Upload" to start processing

### Step 3: Column Mapping (if needed)
- If your CSV headers don't match the expected format, a column mapping modal will appear
- Map each required property to the corresponding CSV column
- Required fields are marked with an asterisk (*)
- Click "Confirm Mapping" to proceed

### Step 4: Monitor Progress
- Progress bar shows upload status
- Real-time feedback on processing
- Error messages appear as they occur

### Step 5: Review Results
- Success/failure counts are displayed
- Error details are shown for failed rows
- Download error report if needed

## Troubleshooting

### Common Issues:

**"Invalid CSV structure"**
- Check that required columns are present
- Ensure column names match exactly (case-sensitive)
- Verify CSV format is correct
- **Note**: If headers don't match, use the column mapping feature

**Column Mapping Issues**
- Make sure all required fields (marked with *) are mapped
- You can map multiple properties to the same column if needed
- Use the "Reset" button to clear all mappings and start over

**"Row X: Name is required"**
- Check for empty cells in required fields
- Ensure no extra commas in data
- Verify CSV parsing is correct

**"Invalid status"**
- Use only valid status values
- Check for typos in status field
- Ensure proper capitalization

**"Count must be a positive number"**
- Ensure count field contains only numbers
- Remove any text or special characters
- Verify no decimal points if not needed

**"Invalid date format"**
- Use YYYY-MM-DD format only
- Ensure dates are valid (not 2024-13-45)
- Leave empty for optional dates

### File Format Issues:

**Encoding Problems**
- Save CSV as UTF-8 encoding
- Avoid special characters in data
- Use standard CSV format

**Comma Issues**
- Enclose text in quotes if it contains commas
- Use proper CSV escaping
- Test with simple data first

**Line Ending Issues**
- Use standard line endings (CRLF or LF)
- Avoid mixed line endings
- Check file in text editor

## Best Practices

### Data Preparation:
1. **Backup First**: Always backup existing data
2. **Test Small**: Start with a small test file
3. **Validate Data**: Check data quality before upload
4. **Use Templates**: Use provided sample files as templates
5. **Check Headers**: Ensure your CSV headers are clear and descriptive

### Column Mapping:
1. **Review Headers**: Check your CSV headers before mapping
2. **Map Required Fields**: Always map all required fields (marked with *)
3. **Test Mapping**: Use a small test file to verify your mapping works
4. **Save Mappings**: Note down successful mappings for future use

### File Management:
1. **Consistent Naming**: Use consistent naming conventions
2. **Data Quality**: Ensure data is clean and accurate
3. **Documentation**: Keep records of what was uploaded
4. **Version Control**: Version your CSV files

### Upload Process:
1. **Review Before Upload**: Double-check data before uploading
2. **Monitor Progress**: Watch for errors during upload
3. **Verify Results**: Check imported data after upload
4. **Handle Errors**: Address any errors before re-uploading

## Technical Details

### File Processing:
- Client-side CSV parsing for performance
- Row-by-row validation and processing
- Batch database operations for efficiency
- Progress tracking for user feedback

### Database Operations:
- Uses Supabase client for all operations
- Maintains referential integrity
- Handles transactions properly
- Respects existing RLS policies

### Error Handling:
- Comprehensive validation at multiple levels
- Detailed error reporting
- Graceful failure handling
- Partial success support

## Support

For issues or questions about the CSV upload feature:
1. Check this documentation first
2. Review error messages carefully
3. Test with sample files
4. Contact system administrator if needed

## Sample Files

Sample CSV files are available for download:

### Standard Headers (No Mapping Required)
- `/sample-models.csv` - Example models file with standard headers
- `/sample-collections.csv` - Example collections file with standard headers

### Custom Headers (Requires Column Mapping)
- `/sample-models-custom-headers.csv` - Example models file with custom headers
- `/sample-collections-custom-headers.csv` - Example collections file with custom headers

These files demonstrate both the standard format and how to use the column mapping feature when headers don't match exactly.
