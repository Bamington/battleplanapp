import React, { useState, useRef } from 'react'
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  parseCSVToObjects, 
  validateCSVStructure, 
  validateModelData, 
  validateCollectionData,
  parseBoolean,
  sanitizeString,
  type CSVRow,
  type UploadType
} from '../utils/csvUtils'

interface CSVUploadPageProps {
  onBack: () => void
}

interface UploadState {
  isUploading: boolean
  progress: number
  successCount: number
  errorCount: number
  errors: string[]
}

interface ColumnMapping {
  [key: string]: string // property -> column name
}

interface ColumnMappingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (mapping: ColumnMapping) => void
  csvHeaders: string[]
  uploadType: UploadType
}

function ColumnMappingModal({ isOpen, onClose, onConfirm, csvHeaders, uploadType }: ColumnMappingModalProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({})
  
  // Get required properties based on upload type
  const getRequiredProperties = () => {
    if (uploadType === 'models') {
      return [
        { key: 'name', label: 'Name', required: true },
        { key: 'status', label: 'Status', required: true },
        { key: 'count', label: 'Count', required: true },
        { key: 'game_name', label: 'Game Name', required: true },
        { key: 'box_name', label: 'Box Name', required: false },
        { key: 'notes', label: 'Notes', required: false },
        { key: 'purchase_date', label: 'Purchase Date', required: false },
        { key: 'painted_date', label: 'Painted Date', required: false },
        { key: 'public', label: 'Public', required: false }
      ]
    } else {
      return [
        { key: 'name', label: 'Name', required: true },
        { key: 'game_name', label: 'Game Name', required: true },
        { key: 'purchase_date', label: 'Purchase Date', required: false },
        { key: 'public', label: 'Public', required: false }
      ]
    }
  }

  const requiredProperties = getRequiredProperties()

  const handleMappingChange = (propertyKey: string, columnName: string) => {
    setMapping(prev => ({
      ...prev,
      [propertyKey]: columnName
    }))
  }

  const handleConfirm = () => {
    // Validate that all required properties are mapped
    const missingRequired = requiredProperties
      .filter(prop => prop.required)
      .filter(prop => !mapping[prop.key])

    if (missingRequired.length > 0) {
      alert(`Please map all required properties: ${missingRequired.map(p => p.label).join(', ')}`)
      return
    }

    onConfirm(mapping)
  }

  const handleReset = () => {
    setMapping({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border-custom rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-title">Map CSV Columns</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-secondary-text">
              Map your CSV columns to the required properties. Required fields are marked with an asterisk (*).
            </p>

            <div className="space-y-4">
              {requiredProperties.map(property => (
                <div key={property.key} className="flex items-center space-x-4">
                  <label className="flex-1 text-text font-medium">
                    {property.label}
                    {property.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    value={mapping[property.key] || ''}
                    onChange={(e) => handleMappingChange(property.key, e.target.value)}
                    className="flex-1 bg-bg-secondary border border-border-custom rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Select a column...</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors"
              >
                Confirm Mapping
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-bg-secondary text-text rounded-lg border border-border-custom hover:bg-bg-card transition-colors"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-bg-secondary text-text rounded-lg border border-border-custom hover:bg-bg-card transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CSVUploadPage({ onBack }: CSVUploadPageProps) {
  console.log('=== CSVUploadPage rendering ===')
  console.log('onBack function:', onBack)
  
  const [uploadType, setUploadType] = useState<UploadType>('models')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    successCount: 0,
    errorCount: 0,
    errors: []
  })
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  
  // Column mapping state
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [parsedCsvRows, setParsedCsvRows] = useState<CSVRow[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  
  console.log('CSVUploadPage user:', user)
  console.log('CSVUploadPage user is_admin:', user?.is_admin)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect called', e.target.files)
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, file.size, file.type)

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      console.log('Invalid file type:', file.name)
      setError('Please select a valid CSV file')
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size, 'bytes')
      setError('File size must be 5MB or less')
      return
    }

    console.log('File validation passed, setting selected file')
    setSelectedFile(file)
    setError(null)
  }

  const handleUpload = async () => {
    console.log('handleUpload called')
    console.log('selectedFile:', selectedFile)
    console.log('user:', user)
    
    if (!selectedFile || !user) {
      console.log('Missing file or user, returning early')
      return
    }

    console.log('Starting upload process...')
    setUploadState({
      isUploading: true,
      progress: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    })

    try {
      console.log('Reading file text...')
      // Read and parse CSV file
      const text = await selectedFile.text()
      console.log('File text length:', text.length)
      console.log('File text preview:', text.substring(0, 200))
      
      console.log('Parsing CSV...')
      const csvRows = parseCSVToObjects(text)
      console.log('Parsed CSV rows:', csvRows.length)
      console.log('First row:', csvRows[0])
      
      if (csvRows.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Extract headers from the first row
      const headers = Object.keys(csvRows[0])
      console.log('CSV headers:', headers)
      
      // Store the parsed data and headers for column mapping
      setCsvHeaders(headers)
      setParsedCsvRows(csvRows)
      
      // Check if we need column mapping
      const requiredHeaders = uploadType === 'models' 
        ? ['name', 'status', 'count', 'game_name']
        : ['name', 'game_name']
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        // Show column mapping modal
        console.log('Missing headers, showing column mapping modal')
        setShowColumnMapping(true)
        setUploadState({
          isUploading: false,
          progress: 0,
          successCount: 0,
          errorCount: 0,
          errors: []
        })
        return
      }

      // If all headers are present, proceed with normal processing
      await processUploadedData(csvRows, {})

    } catch (err) {
      console.error('Upload error:', err)
      setUploadState({
        isUploading: false,
        progress: 0,
        successCount: 0,
        errorCount: 0,
        errors: [err instanceof Error ? err.message : 'Upload failed']
      })
    }
  }

  const handleColumnMappingConfirm = async (mapping: ColumnMapping) => {
    console.log('Column mapping confirmed:', mapping)
    setColumnMapping(mapping)
    setShowColumnMapping(false)
    
    // Transform the CSV data using the mapping
    const transformedRows = parsedCsvRows.map(row => {
      const transformedRow: CSVRow = {}
      
      // Map each property to its corresponding column
      Object.entries(mapping).forEach(([property, column]) => {
        if (column && row[column] !== undefined) {
          transformedRow[property] = row[column]
        }
      })
      
      return transformedRow
    })
    
    console.log('Transformed rows:', transformedRows)
    
    // Process the transformed data
    await processUploadedData(transformedRows, mapping)
  }

  const processUploadedData = async (csvRows: CSVRow[], mapping: ColumnMapping) => {
    console.log('Processing uploaded data with mapping:', mapping)
    
    setUploadState({
      isUploading: true,
      progress: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    })

    try {
      // Convert back to array format for structure validation
      const rows = [Object.keys(csvRows[0]), ...csvRows.map(row => Object.values(row))]
      console.log('Converted to array format for validation')
      
      // Validate CSV structure
      console.log('Validating CSV structure...')
      const validationResult = validateCSVStructure(rows, uploadType)
      console.log('Validation result:', validationResult)
      
      if (!validationResult.isValid) {
        throw new Error(`Invalid CSV structure: ${validationResult.error}`)
      }

      // Process the data
      console.log('Processing CSV data...')
      const result = await processCSVData(csvRows, uploadType, user!.id)
      console.log('Processing result:', result)
      
      setUploadState({
        isUploading: false,
        progress: 100,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors
      })

    } catch (err) {
      console.error('Processing error:', err)
      setUploadState({
        isUploading: false,
        progress: 0,
        successCount: 0,
        errorCount: 0,
        errors: [err instanceof Error ? err.message : 'Processing failed']
      })
    }
  }

  const processCSVData = async (csvRows: CSVRow[], type: UploadType, userId: string) => {
    console.log('processCSVData called with:', { csvRows: csvRows.length, type, userId })
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i]
      const rowNumber = i + 2 // +2 because we start from row 2 (after header)
      
      console.log(`Processing row ${rowNumber}:`, row)

      try {
        if (type === 'models') {
          console.log('Processing as model row')
          await processModelRow(row, userId, rowNumber)
        } else {
          console.log('Processing as collection row')
          await processCollectionRow(row, userId, rowNumber)
        }
        successCount++
        console.log(`Row ${rowNumber} processed successfully`)
      } catch (err) {
        console.error(`Error processing row ${rowNumber}:`, err)
        errorCount++
        errors.push(`Row ${rowNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }

      // Update progress
      setUploadState(prev => ({
        ...prev,
        progress: Math.round(((i + 1) / csvRows.length) * 100)
      }))
    }

    console.log('Processing complete:', { successCount, errorCount, errors })
    return { successCount, errorCount, errors }
  }

  const processModelRow = async (row: CSVRow, userId: string, _rowNumber: number) => {
    console.log('processModelRow called with:', { row, userId })
    
    // Validate the data first
    console.log('Validating model data...')
    const validation = validateModelData(row)
    console.log('Validation result:', validation)
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Validation failed')
    }

    const name = sanitizeString(row.name || '')
    const status = sanitizeString(row.status || '')
    const count = parseInt(row.count || '0')
    const gameName = sanitizeString(row.game_name || '')
    const boxName = sanitizeString(row.box_name || '')
    const notes = sanitizeString(row.notes || '')
    const purchaseDate = row.purchase_date || null
    const paintedDate = row.painted_date || null
    const isPublic = parseBoolean(row.public || 'false')

    console.log('Processed values:', {
      name, status, count, gameName, boxName, notes, purchaseDate, paintedDate, isPublic
    })

    // Get or create game
    console.log('Getting or creating game:', gameName)
    const gameId = await getOrCreateGame(gameName)
    console.log('Game ID:', gameId)

    // Get or create box if specified
    let boxId: string | null = null
    if (boxName) {
      console.log('Getting or creating box:', boxName)
      boxId = await getOrCreateBox(boxName, gameId, userId)
      console.log('Box ID:', boxId)
    }

    // Create model
    console.log('Creating model in database...')
    const { error } = await supabase
      .from('models')
      .insert({
        name,
        status,
        count,
        game_id: gameId,
        box_id: boxId,
        user_id: userId,
        notes: notes || null,
        purchase_date: purchaseDate,
        painted_date: paintedDate,
        public: isPublic
      })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    console.log('Model created successfully')
  }

  const processCollectionRow = async (row: CSVRow, userId: string, _rowNumber: number) => {
    // Validate the data first
    const validation = validateCollectionData(row)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Validation failed')
    }

    const name = sanitizeString(row.name || '')
    const gameName = sanitizeString(row.game_name || '')
    const purchaseDate = row.purchase_date || null
    const isPublic = parseBoolean(row.public || 'false')

    // Get or create game
    const gameId = await getOrCreateGame(gameName)

    // Create box (collection)
    const { error } = await supabase
      .from('boxes')
      .insert({
        name,
        game_id: gameId,
        user_id: userId,
        purchase_date: purchaseDate,
        public: isPublic
      })

    if (error) throw new Error(`Database error: ${error.message}`)
  }

  const getOrCreateGame = async (gameName: string): Promise<string> => {
    console.log('getOrCreateGame called with:', gameName)
    
    // Try to find existing game
    console.log('Looking for existing game...')
    const { data: existingGame, error: findError } = await supabase
      .from('games')
      .select('id')
      .eq('name', gameName)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding game:', findError)
      throw new Error(`Failed to find game: ${findError.message}`)
    }

    if (existingGame) {
      console.log('Found existing game:', existingGame.id)
      return existingGame.id
    }

    // Create new game
    console.log('Creating new game...')
    const { data: newGame, error } = await supabase
      .from('games')
      .insert({ name: gameName })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating game:', error)
      throw new Error(`Failed to create game: ${error.message}`)
    }
    
    console.log('Created new game:', newGame.id)
    return newGame.id
  }

  const getOrCreateBox = async (boxName: string, gameId: string, userId: string): Promise<string> => {
    console.log('getOrCreateBox called with:', { boxName, gameId, userId })
    
    // Try to find existing box
    console.log('Looking for existing box...')
    const { data: existingBox, error: findError } = await supabase
      .from('boxes')
      .select('id')
      .eq('name', boxName)
      .eq('user_id', userId)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding box:', findError)
      throw new Error(`Failed to find box: ${findError.message}`)
    }

    if (existingBox) {
      console.log('Found existing box:', existingBox.id)
      return existingBox.id
    }

    // Create new box
    console.log('Creating new box...')
    const { data: newBox, error } = await supabase
      .from('boxes')
      .insert({
        name: boxName,
        game_id: gameId,
        user_id: userId
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating box:', error)
      throw new Error(`Failed to create box: ${error.message}`)
    }
    
    console.log('Created new box:', newBox.id)
    return newBox.id
  }

  const handleReset = () => {
    setSelectedFile(null)
    setError(null)
    setUploadState({
      isUploading: false,
      progress: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    })
    setShowColumnMapping(false)
    setCsvHeaders([])
    setParsedCsvRows([])
    setColumnMapping({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>
        <h1 className="text-4xl font-bold text-title">CSV UPLOAD</h1>
        <p className="text-secondary-text mt-2">
          Upload CSV files to bulk import models and collections
        </p>
      </div>

      {/* Upload Type Selection */}
      <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-text mb-4">Upload Type</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setUploadType('models')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              uploadType === 'models'
                ? 'bg-brand text-white border-brand'
                : 'bg-bg-secondary text-text border-border-custom hover:bg-bg-card'
            }`}
          >
            Models
          </button>
          <button
            onClick={() => setUploadType('collections')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              uploadType === 'collections'
                ? 'bg-brand text-white border-brand'
                : 'bg-bg-secondary text-text border-border-custom hover:bg-bg-card'
            }`}
          >
            Collections
          </button>
        </div>
      </div>

      {/* CSV Format Instructions */}
      <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-text mb-4">CSV Format</h2>
        <div className="space-y-4">
          {uploadType === 'models' ? (
            <div>
              <p className="text-secondary-text mb-2">Required columns for models:</p>
              <div className="bg-bg-secondary rounded p-3 font-mono text-sm">
                name,status,count,game_name,box_name,notes,purchase_date,painted_date,public
              </div>
              <p className="text-sm text-secondary-text mt-2">
                Status must be: None, Assembled, Primed, Partially Painted, or Painted
              </p>
              <p className="text-sm text-secondary-text mt-2">
                <strong>Note:</strong> If your CSV headers don't match exactly, you'll be able to map them after upload.
              </p>
              <div className="mt-4 space-y-2">
                <div>
                  <a
                    href="/sample-models.csv"
                    download
                    className="text-brand hover:text-brand/80 transition-colors text-sm"
                  >
                    Download sample models CSV (standard headers)
                  </a>
                </div>
                <div>
                  <a
                    href="/sample-models-custom-headers.csv"
                    download
                    className="text-brand hover:text-brand/80 transition-colors text-sm"
                  >
                    Download sample models CSV (custom headers - requires mapping)
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-secondary-text mb-2">Required columns for collections:</p>
              <div className="bg-bg-secondary rounded p-3 font-mono text-sm">
                name,game_name,purchase_date,public
              </div>
              <p className="text-sm text-secondary-text mt-2">
                <strong>Note:</strong> If your CSV headers don't match exactly, you'll be able to map them after upload.
              </p>
              <div className="mt-4 space-y-2">
                <div>
                  <a
                    href="/sample-collections.csv"
                    download
                    className="text-brand hover:text-brand/80 transition-colors text-sm"
                  >
                    Download sample collections CSV (standard headers)
                  </a>
                </div>
                <div>
                  <a
                    href="/sample-collections-custom-headers.csv"
                    download
                    className="text-brand hover:text-brand/80 transition-colors text-sm"
                  >
                    Download sample collections CSV (custom headers - requires mapping)
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-text mb-4">Upload File</h2>
        
        <div className="border-2 border-dashed border-border-custom rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploadState.isUploading}
          />
          
          {!selectedFile ? (
            <div>
              <Upload className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <p className="text-text mb-2">Click to select a CSV file</p>
              <p className="text-sm text-secondary-text mb-4">Maximum file size: 5MB</p>
              <button
                onClick={() => {
                  console.log('Select File button clicked!')
                  console.log('fileInputRef.current:', fileInputRef.current)
                  fileInputRef.current?.click()
                }}
                className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors"
                disabled={uploadState.isUploading}
              >
                Select File
              </button>
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-brand mx-auto mb-4" />
              <p className="text-text mb-2">{selectedFile.name}</p>
              <p className="text-sm text-secondary-text mb-4">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex space-x-2 justify-center">
                <button
                  onClick={() => {
                    console.log('Upload button clicked!')
                    handleUpload()
                  }}
                  className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors"
                  disabled={uploadState.isUploading}
                >
                  {uploadState.isUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={handleReset}
                  className="bg-bg-secondary text-text px-4 py-2 rounded-lg border border-border-custom hover:bg-bg-card transition-colors"
                  disabled={uploadState.isUploading}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress and Results */}
      {uploadState.isUploading && (
        <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-text mb-4">Upload Progress</h2>
          <div className="space-y-4">
            <div className="w-full bg-bg-secondary rounded-full h-2">
              <div
                className="bg-brand h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-secondary-text">{uploadState.progress}% complete</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!uploadState.isUploading && (uploadState.successCount > 0 || uploadState.errorCount > 0) && (
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Upload Results</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600">{uploadState.successCount} successful</span>
              </div>
              {uploadState.errorCount > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">{uploadState.errorCount} errors</span>
                </div>
              )}
            </div>

            {uploadState.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {uploadState.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={showColumnMapping}
        onClose={() => setShowColumnMapping(false)}
        onConfirm={handleColumnMappingConfirm}
        csvHeaders={csvHeaders}
        uploadType={uploadType}
      />
    </div>
  )
}
