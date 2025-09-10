import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit2, Save, X } from 'lucide-react'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { RichTextEditor } from './RichTextEditor'
import { useVersion } from '../hooks/useVersion'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReleaseManagementPageProps {
  onBack: () => void
  onLogoClick?: () => void
}

interface Version {
  id: number
  ver_number: number
  ver_title: string
  ver_notes: string | null
  created_at: string
}

export function ReleaseManagementPage({ onBack, onLogoClick }: ReleaseManagementPageProps) {
  console.log('=== ReleaseManagementPage rendering ===')
  
  const { currentVersion, loading, error, fetchCurrentVersion } = useVersion()
  const [versions, setVersions] = useState<Version[]>([])
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form state for new version
  const [newVersion, setNewVersion] = useState({
    ver_number: '',
    ver_title: '',
    ver_notes: ''
  })
  
  // Form state for editing
  const [editVersion, setEditVersion] = useState({
    ver_number: '',
    ver_title: '',
    ver_notes: ''
  })

  const handleAdminClick = () => {
    // This is a no-op since we're already in admin
  }

  const handleTabChange = (_tab: string) => {
    // This is a no-op since we're in admin mode
  }

  // Fetch all versions
  const fetchVersions = async () => {
    try {
      setLoadingVersions(true)
      const { data, error: fetchError } = await supabase
        .from('version')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setVersions(data || [])
    } catch (err) {
      console.error('Error fetching versions:', err)
    } finally {
      setLoadingVersions(false)
    }
  }

  // Create new version
  const handleCreateVersion = async () => {
    try {
      const { data, error } = await supabase
        .from('version')
        .insert({
          ver_number: parseFloat(newVersion.ver_number),
          ver_title: newVersion.ver_title,
          ver_notes: newVersion.ver_notes || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Reset form and refresh data
      setNewVersion({ ver_number: '', ver_title: '', ver_notes: '' })
      setShowForm(false)
      await fetchVersions()
      await fetchCurrentVersion()
    } catch (err) {
      console.error('Error creating version:', err)
      alert('Failed to create version')
    }
  }

  // Start editing a version
  const handleStartEdit = (version: Version) => {
    setEditingId(version.id)
    setEditVersion({
      ver_number: version.ver_number.toString(),
      ver_title: version.ver_title,
      ver_notes: version.ver_notes || ''
    })
  }

  // Save edited version
  const handleSaveEdit = async () => {
    if (!editingId) return

    try {
      const { error } = await supabase
        .from('version')
        .update({
          ver_number: parseFloat(editVersion.ver_number),
          ver_title: editVersion.ver_title,
          ver_notes: editVersion.ver_notes || null
        })
        .eq('id', editingId)

      if (error) throw error

      // Reset edit state and refresh data
      setEditingId(null)
      setEditVersion({ ver_number: '', ver_title: '', ver_notes: '' })
      await fetchVersions()
      await fetchCurrentVersion()
    } catch (err) {
      console.error('Error updating version:', err)
      alert('Failed to update version')
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditVersion({ ver_number: '', ver_title: '', ver_notes: '' })
  }

  // Load versions on mount
  useEffect(() => {
    fetchVersions()
  }, [])

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header 
        onAddModel={() => {}} 
        onAdminClick={handleAdminClick}
        onSettingsClick={() => {}}
        activeTab="collection"
        onTabChange={handleTabChange}
        onLogoClick={onLogoClick}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin Panel</span>
          </button>
          <h1 className="text-4xl font-bold text-title">RELEASE MANAGEMENT</h1>
        </div>

        {/* Current Version Display */}
        <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-text mb-2">Current Version</h2>
          {loading ? (
            <p className="text-secondary-text">Loading...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : currentVersion ? (
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-brand">
                Version {currentVersion.ver_number.toFixed(2)}
              </span>
              {currentVersion.ver_title && (
                <span className="text-lg text-text">- {currentVersion.ver_title}</span>
              )}
            </div>
          ) : (
            <p className="text-secondary-text">No version information available</p>
          )}
        </div>

        {/* Create New Version Form */}
        <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">Create New Version</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? 'Cancel' : 'New Version'}</span>
            </button>
          </div>

                     {showForm && (
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-text mb-2">
                     Version Number *
                   </label>
                   <input
                     type="number"
                     step="0.1"
                     value={newVersion.ver_number}
                     onChange={(e) => setNewVersion({ ...newVersion, ver_number: e.target.value })}
                     className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand"
                     placeholder="1.0"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-text mb-2">
                     Version Title *
                   </label>
                   <input
                     type="text"
                     value={newVersion.ver_title}
                     onChange={(e) => setNewVersion({ ...newVersion, ver_title: e.target.value })}
                     className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand"
                     placeholder="Initial Release"
                   />
                 </div>
               </div>
               
               <div>
                 <RichTextEditor
                   value={newVersion.ver_notes}
                   onChange={(value) => setNewVersion({ ...newVersion, ver_notes: value })}
                   placeholder="Optional notes about this version..."
                   label="Version Notes"
                   rows={4}
                 />
               </div>
               
               <div className="flex justify-end">
                 <button
                   onClick={handleCreateVersion}
                   disabled={!newVersion.ver_number || !newVersion.ver_title}
                   className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Create Version
                 </button>
               </div>
             </div>
           )}
        </div>

        {/* Version History */}
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Version History</h2>
          
          {loadingVersions ? (
            <p className="text-secondary-text">Loading versions...</p>
          ) : versions.length === 0 ? (
            <p className="text-secondary-text">No versions found</p>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="border border-border-custom rounded-lg p-4">
                                     {editingId === version.id ? (
                     // Edit mode
                     <div className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-text mb-2">
                             Version Number *
                           </label>
                           <input
                             type="number"
                             step="0.1"
                             value={editVersion.ver_number}
                             onChange={(e) => setEditVersion({ ...editVersion, ver_number: e.target.value })}
                             className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-text mb-2">
                             Version Title *
                           </label>
                           <input
                             type="text"
                             value={editVersion.ver_title}
                             onChange={(e) => setEditVersion({ ...editVersion, ver_title: e.target.value })}
                             className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand"
                           />
                         </div>
                       </div>
                       
                       <div>
                         <RichTextEditor
                           value={editVersion.ver_notes}
                           onChange={(value) => setEditVersion({ ...editVersion, ver_notes: value })}
                           placeholder="Optional notes about this version..."
                           label="Version Notes"
                           rows={4}
                         />
                       </div>
                       
                       <div className="flex justify-end space-x-2">
                         <button
                           onClick={handleCancelEdit}
                           className="flex items-center space-x-2 px-4 py-2 border border-border-custom rounded-lg text-text hover:bg-bg-secondary transition-colors"
                         >
                           <X className="w-4 h-4" />
                           <span>Cancel</span>
                         </button>
                         <button
                           onClick={handleSaveEdit}
                           disabled={!editVersion.ver_number || !editVersion.ver_title}
                           className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           <Save className="w-4 h-4" />
                           <span>Save</span>
                         </button>
                       </div>
                     </div>
                  ) : (
                                         // View mode
                     <div>
                       <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 mb-3">
                         <span className="text-lg font-semibold text-brand">
                           Version {version.ver_number.toFixed(2)}
                         </span>
                         <span className="text-text">{version.ver_title}</span>
                         <span className="text-secondary-text text-sm">
                           {new Date(version.created_at).toLocaleDateString('en-AU')}
                         </span>
                       </div>
                       {version.ver_notes && (
                         <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                           <ReactMarkdown 
                             remarkPlugins={[remarkGfm]}
                             components={{
                               p: ({ children }) => <p className="mb-2 last:mb-0 text-base text-text">{children}</p>,
                               h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-text">{children}</h1>,
                               h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-text">{children}</h2>,
                               h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-text">{children}</h3>,
                               ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                               ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                               li: ({ children }) => <li className="text-base text-text">{children}</li>,
                               strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                               em: ({ children }) => <em className="italic text-text">{children}</em>,
                               code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                               pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                               blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2 text-text">{children}</blockquote>,
                             }}
                           >
                             {version.ver_notes}
                           </ReactMarkdown>
                         </div>
                       )}
                       <div className="flex justify-end">
                         <button
                           onClick={() => handleStartEdit(version)}
                           className="btn-secondary btn-with-icon"
                         >
                           <Edit2 className="w-4 h-4" />
                           <span>Edit</span>
                         </button>
                       </div>
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <TabBar 
        activeTab="collection" 
        onTabChange={(_tab) => {
          // This is a no-op since we're in admin mode
        }} 
      />
    </div>
  )
}
