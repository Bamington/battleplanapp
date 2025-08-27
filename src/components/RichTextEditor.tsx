import React, { useState, useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text...", 
  label = "Notes",
  rows = 3 
}: RichTextEditorProps) {
  const editableRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize content when value changes
  useEffect(() => {
    if (editableRef.current && value) {
      // Convert markdown to plain text for display
      const plainText = value
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/__(.*?)__/g, '$1') // Remove underline
        .replace(/^- (.*)/gm, '$1') // Remove bullet points
        .replace(/^\d+\. (.*)/gm, '$1') // Remove numbered lists
      editableRef.current.textContent = plainText
      setIsInitialized(true)
    }
  }, [value])

  const formatText = (command: string, value?: string) => {
    if (!editableRef.current) return
    
    editableRef.current.focus()
    document.execCommand(command, false, value)
    
    // Convert to markdown and notify parent
    const markdown = htmlToMarkdown(editableRef.current.innerHTML)
    onChange(markdown)
  }

  const insertText = (text: string) => {
    if (!editableRef.current) return
    
    editableRef.current.focus()
    document.execCommand('insertText', false, text)
    
    // Convert to markdown and notify parent
    const markdown = htmlToMarkdown(editableRef.current.innerHTML)
    onChange(markdown)
  }

  const handleInput = () => {
    if (!editableRef.current) return
    
    // Convert to markdown and notify parent
    const markdown = htmlToMarkdown(editableRef.current.innerHTML)
    onChange(markdown)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.execCommand('insertLineBreak', false)
      handleInput()
    }
  }

  // Convert HTML back to markdown for storage
  const htmlToMarkdown = (html: string) => {
    if (!html) return ''
    
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '__$1__')
      .replace(/<li>(.*?)<\/li>/g, '- $1')
      .replace(/<br>/g, '\n')
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
  }

  return (
    <div>
      <div className="mb-2">
        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border border-gray-300 dark:border-gray-600 border-b-0 rounded-t-md bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        <button
          type="button"
          onClick={() => insertText('- ')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('1. ')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Rich Text Editor */}
      <div
        ref={editableRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white min-h-[80px] max-h-[200px] overflow-y-auto"
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}
        data-placeholder={placeholder}
      />
    </div>
  )
}
