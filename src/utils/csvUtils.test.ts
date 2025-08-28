import { 
  parseCSVToObjects, 
  parseCSVLine, 
  validateCSVStructure, 
  validateModelData, 
  validateCollectionData,
  parseBoolean,
  sanitizeString,
  isValidDate,
  type CSVRow,
  type UploadType
} from './csvUtils'

// Test CSV parsing
describe('CSV Utils', () => {
  describe('parseCSVLine', () => {
    it('should parse simple CSV line', () => {
      const result = parseCSVLine('a,b,c')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should handle quoted values', () => {
      const result = parseCSVLine('"a,b",c,"d,e"')
      expect(result).toEqual(['a,b', 'c', 'd,e'])
    })

    it('should handle empty values', () => {
      const result = parseCSVLine('a,,c')
      expect(result).toEqual(['a', '', 'c'])
    })
  })

  describe('parseCSVToObjects', () => {
    it('should parse CSV to objects', () => {
      const csv = 'name,age\nJohn,25\nJane,30'
      const result = parseCSVToObjects(csv)
      expect(result).toEqual([
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' }
      ])
    })

    it('should handle empty CSV', () => {
      const result = parseCSVToObjects('')
      expect(result).toEqual([])
    })
  })

  describe('validateCSVStructure', () => {
    it('should validate models CSV structure', () => {
      const rows = [
        ['name', 'status', 'count', 'game_name'],
        ['Model 1', 'Assembled', '1', 'Game 1']
      ]
      const result = validateCSVStructure(rows, 'models')
      expect(result.isValid).toBe(true)
    })

    it('should reject models CSV with missing columns', () => {
      const rows = [
        ['name', 'status', 'count'], // missing game_name
        ['Model 1', 'Assembled', '1']
      ]
      const result = validateCSVStructure(rows, 'models')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('game_name')
    })

    it('should validate collections CSV structure', () => {
      const rows = [
        ['name', 'game_name'],
        ['Collection 1', 'Game 1']
      ]
      const result = validateCSVStructure(rows, 'collections')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateModelData', () => {
    it('should validate valid model data', () => {
      const data: CSVRow = {
        name: 'Test Model',
        status: 'Assembled',
        count: '1',
        game_name: 'Test Game'
      }
      const result = validateModelData(data)
      expect(result.isValid).toBe(true)
    })

    it('should reject model data with missing name', () => {
      const data: CSVRow = {
        name: '',
        status: 'Assembled',
        count: '1',
        game_name: 'Test Game'
      }
      const result = validateModelData(data)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Name is required')
    })

    it('should reject invalid status', () => {
      const data: CSVRow = {
        name: 'Test Model',
        status: 'Invalid',
        count: '1',
        game_name: 'Test Game'
      }
      const result = validateModelData(data)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid status')
    })

    it('should reject invalid count', () => {
      const data: CSVRow = {
        name: 'Test Model',
        status: 'Assembled',
        count: '0',
        game_name: 'Test Game'
      }
      const result = validateModelData(data)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('positive number')
    })
  })

  describe('validateCollectionData', () => {
    it('should validate valid collection data', () => {
      const data: CSVRow = {
        name: 'Test Collection',
        game_name: 'Test Game'
      }
      const result = validateCollectionData(data)
      expect(result.isValid).toBe(true)
    })

    it('should reject collection data with missing name', () => {
      const data: CSVRow = {
        name: '',
        game_name: 'Test Game'
      }
      const result = validateCollectionData(data)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Name is required')
    })
  })

  describe('parseBoolean', () => {
    it('should parse true values', () => {
      expect(parseBoolean('true')).toBe(true)
      expect(parseBoolean('TRUE')).toBe(true)
      expect(parseBoolean('True')).toBe(true)
    })

    it('should parse false values', () => {
      expect(parseBoolean('false')).toBe(false)
      expect(parseBoolean('FALSE')).toBe(false)
      expect(parseBoolean('False')).toBe(false)
      expect(parseBoolean('')).toBe(false)
      expect(parseBoolean('anything')).toBe(false)
    })
  })

  describe('sanitizeString', () => {
    it('should sanitize HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test')
    })

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('')
    })
  })

  describe('isValidDate', () => {
    it('should validate correct date format', () => {
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('2024-12-31')).toBe(true)
    })

    it('should reject invalid date format', () => {
      expect(isValidDate('2024/01/15')).toBe(false)
      expect(isValidDate('01-15-2024')).toBe(false)
      expect(isValidDate('2024-13-45')).toBe(false)
      expect(isValidDate('invalid')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })
  })
})
