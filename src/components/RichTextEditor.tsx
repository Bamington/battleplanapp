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
  label,
  rows = 3 
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle textarea change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const insertText = (text: string) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = textarea.value
    
    // Insert text at cursor position
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
    onChange(newValue)
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  return (
    <div>
      {label && (
        <div className="mb-2">
          <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        </div>
      )}



            {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border border-gray-300 dark:border-gray-600 border-b-0 rounded-t-md bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => insertText('**')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Bold (**text**)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('*')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Italic (*text*)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertText('__')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Underline (__text__)"
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

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white resize-none"
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          direction: 'ltr',
          textAlign: 'left'
        }}
        rows={rows}
      />
    </div>
  )
}
