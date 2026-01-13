import React from 'react'
import { Pipette } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

// Extend Window interface to include EyeDropper
declare global {
  interface Window {
    EyeDropper?: {
      new (): {
        open: () => Promise<{ sRGBHex: string }>
      }
    }
  }
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  // Check if EyeDropper API is supported (Chrome, Edge, Opera) and not mobile
  const isSupported = typeof window !== 'undefined' &&
    'EyeDropper' in window &&
    // Exclude mobile devices
    !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const pickColor = async () => {
    if (!window.EyeDropper) return

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      onChange(result.sRGBHex)
    } catch (err) {
      console.error('Error picking color:', err)
      // User cancelled or error occurred
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <button
      type="button"
      onClick={pickColor}
      className="p-2 border border-border-custom rounded-md hover:bg-bg-secondary transition-colors"
      title="Pick color from screen"
    >
      <Pipette className="w-5 h-5 text-secondary-text" />
    </button>
  )
}
