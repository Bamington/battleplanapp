import React, { useState } from 'react'
import { Database, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { migrateBattleImages, migrateBoxImages, migrateAllImages } from '../utils/migrateImages'

interface MigrationResult {
  success: boolean
  migrated?: number
  skipped?: number
  errors?: string[]
  total?: number
  error?: string
}

export function MigrationPanel() {
  const [battleMigrationResult, setBattleMigrationResult] = useState<MigrationResult | null>(null)
  const [boxMigrationResult, setBoxMigrationResult] = useState<MigrationResult | null>(null)
  const [isRunning, setIsRunning] = useState({
    battles: false,
    boxes: false,
    all: false
  })

  const runBattleMigration = async () => {
    setIsRunning(prev => ({ ...prev, battles: true }))
    setBattleMigrationResult(null)

    try {
      const result = await migrateBattleImages()
      setBattleMigrationResult(result)
    } catch (error) {
      setBattleMigrationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsRunning(prev => ({ ...prev, battles: false }))
    }
  }

  const runBoxMigration = async () => {
    setIsRunning(prev => ({ ...prev, boxes: true }))
    setBoxMigrationResult(null)

    try {
      const result = await migrateBoxImages()
      setBoxMigrationResult(result)
    } catch (error) {
      setBoxMigrationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsRunning(prev => ({ ...prev, boxes: false }))
    }
  }

  const runAllMigrations = async () => {
    setIsRunning(prev => ({ ...prev, all: true }))
    setBattleMigrationResult(null)
    setBoxMigrationResult(null)

    try {
      const result = await migrateAllImages()
      setBattleMigrationResult(result.battles)
      setBoxMigrationResult(result.boxes)
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      setBattleMigrationResult(errorResult)
      setBoxMigrationResult(errorResult)
    } finally {
      setIsRunning(prev => ({ ...prev, all: false }))
    }
  }

  const ResultIcon = ({ result }: { result: MigrationResult | null }) => {
    if (!result) return null
    if (result.success) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const ResultSummary = ({ result, type }: { result: MigrationResult | null, type: string }) => {
    if (!result) return null

    return (
      <div className="mt-4 p-4 rounded-lg border bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <ResultIcon result={result} />
          <h4 className="font-medium">
            {type} Migration {result.success ? 'Completed' : 'Failed'}
          </h4>
        </div>

        {result.success && (
          <div className="text-sm text-gray-600">
            <p>✅ Migrated: {result.migrated || 0} images</p>
            <p>⏭️ Skipped: {result.skipped || 0} (already migrated)</p>
            <p>📊 Total processed: {result.total || 0}</p>
          </div>
        )}

        {result.error && (
          <p className="text-sm text-red-600">❌ Error: {result.error}</p>
        )}

        {result.errors && result.errors.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-red-600 font-medium">Errors encountered:</p>
            <ul className="text-xs text-red-500 ml-4">
              {result.errors.slice(0, 5).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {result.errors.length > 5 && (
                <li>• ... and {result.errors.length - 5} more errors</li>
              )}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Image Migration Panel</h2>
            <p className="text-gray-600">Migrate legacy images to the new multi-image system</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Before You Start</h3>
              <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
                <li>This will move images from the legacy <code>image_url</code> field to the new junction tables</li>
                <li>Existing images in the new system will be skipped (safe to run multiple times)</li>
                <li>This operation cannot be easily reversed - backup your database first!</li>
                <li>All images will remain functional during and after migration</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Battle Migration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-purple-500" />
              <h3 className="font-medium">Battle Images</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Migrate all battle images from legacy storage to the new multi-image system
            </p>
            <button
              onClick={runBattleMigration}
              disabled={isRunning.battles || isRunning.all}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning.battles ? 'Migrating...' : 'Migrate Battle Images'}
            </button>
            <ResultSummary result={battleMigrationResult} type="Battle" />
          </div>

          {/* Box Migration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-green-500" />
              <h3 className="font-medium">Collection Images</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Migrate all collection images from legacy storage to the new multi-image system
            </p>
            <button
              onClick={runBoxMigration}
              disabled={isRunning.boxes || isRunning.all}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning.boxes ? 'Migrating...' : 'Migrate Collection Images'}
            </button>
            <ResultSummary result={boxMigrationResult} type="Collection" />
          </div>

          {/* All Migration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium">Migrate All</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Run both migrations sequentially for a complete migration
            </p>
            <button
              onClick={runAllMigrations}
              disabled={isRunning.all || isRunning.battles || isRunning.boxes}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning.all ? 'Migrating All...' : 'Migrate Everything'}
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {(isRunning.battles || isRunning.boxes || isRunning.all) && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-blue-700">
                Migration in progress... This may take a few moments.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}