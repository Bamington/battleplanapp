export interface CSVValidationResult {
  isValid: boolean
  error: string | null
}

export interface CSVRow {
  [key: string]: string
}

export type UploadType = 'models' | 'collections'

/**
 * Parse CSV text into an array of objects with column headers as keys
 */
export function parseCSVToObjects(text: string): CSVRow[] {
  console.log('parseCSVToObjects called with text length:', text.length)
  const lines = text.split('\n').filter(line => line.trim())
  console.log('Filtered lines:', lines.length)
  
  if (lines.length === 0) {
    console.log('No lines found, returning empty array')
    return []
  }

  console.log('First line (headers):', lines[0])
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  console.log('Parsed headers:', headers)
  
  const dataRows = lines.slice(1)
  console.log('Data rows count:', dataRows.length)

  const result = dataRows.map((line, index) => {
    console.log(`Parsing data row ${index + 1}:`, line)
    const values = parseCSVLine(line)
    console.log(`Row ${index + 1} values:`, values)
    
    const row: CSVRow = {}
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || ''
    })
    
    console.log(`Row ${index + 1} object:`, row)
    return row
  })

  console.log('Final result:', result)
  return result
}

/**
 * Parse a single CSV line, handling quoted values
 */
export function parseCSVLine(line: string): string[] {
  console.log('parseCSVLine called with:', line)
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  
  const finalResult = result.map(field => field.replace(/^"|"$/g, ''))
  console.log('parseCSVLine result:', finalResult)
  return finalResult
}

/**
 * Validate CSV structure based on upload type
 */
export function validateCSVStructure(rows: string[][], type: UploadType): CSVValidationResult {
  if (rows.length < 2) {
    return { 
      isValid: false, 
      error: 'CSV must have at least a header row and one data row' 
    }
  }

  const headers = rows[0].map(h => h.toLowerCase().trim())
  
  if (type === 'models') {
    const requiredHeaders = ['name', 'status', 'count', 'game_name']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }
    }
  } else {
    const requiredHeaders = ['name', 'game_name']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }
    }
  }

  return { isValid: true, error: null }
}

/**
 * Validate model data
 */
export function validateModelData(data: CSVRow): CSVValidationResult {
  // Check required fields
  if (!data.name?.trim()) {
    return { isValid: false, error: 'Name is required' }
  }
  if (!data.status?.trim()) {
    return { isValid: false, error: 'Status is required' }
  }
  if (!data.count?.trim()) {
    return { isValid: false, error: 'Count is required' }
  }
  if (!data.game_name?.trim()) {
    return { isValid: false, error: 'Game name is required' }
  }

  // Validate status
  const validStatuses = ['None', 'Assembled', 'Primed', 'Partially Painted', 'Painted']
  if (!validStatuses.includes(data.status)) {
    return { 
      isValid: false, 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    }
  }

  // Validate count
  const countNum = parseInt(data.count)
  if (isNaN(countNum) || countNum < 1) {
    return { isValid: false, error: 'Count must be a positive number' }
  }

  // Validate dates if provided
  if (data.purchase_date && !isValidDate(data.purchase_date)) {
    return { isValid: false, error: 'Invalid purchase date format (use YYYY-MM-DD)' }
  }
  if (data.painted_date && !isValidDate(data.painted_date)) {
    return { isValid: false, error: 'Invalid painted date format (use YYYY-MM-DD)' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate collection data
 */
export function validateCollectionData(data: CSVRow): CSVValidationResult {
  // Check required fields
  if (!data.name?.trim()) {
    return { isValid: false, error: 'Name is required' }
  }
  if (!data.game_name?.trim()) {
    return { isValid: false, error: 'Game name is required' }
  }

  // Validate date if provided
  if (data.purchase_date && !isValidDate(data.purchase_date)) {
    return { isValid: false, error: 'Invalid purchase date format (use YYYY-MM-DD)' }
  }

  return { isValid: true, error: null }
}

/**
 * Check if a string is a valid date in YYYY-MM-DD format
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/)
}

/**
 * Convert boolean string to boolean
 */
export function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'true'
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
