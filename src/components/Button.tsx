import React from 'react'

export type ButtonVariant = 
  | 'primary' 
  | 'primary-sm' 
  | 'secondary' 
  | 'secondary-sm' 
  | 'danger' 
  | 'danger-sm' 
  | 'danger-outline' 
  | 'danger-outline-sm' 
  | 'ghost' 
  | 'ghost-sm' 
  | 'disabled' 
  | 'disabled-sm'

export type ButtonSize = 'default' | 'small'
export type ButtonWidth = 'default' | 'full' | 'flex'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  width?: ButtonWidth
  withIcon?: boolean
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'default', 
  width = 'default', 
  withIcon = false,
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  // Build the class string based on props
  const baseClass = `btn-${variant}`
  const sizeClass = size === 'small' ? `btn-${variant}-sm` : baseClass
  const widthClass = width === 'full' ? 'btn-full' : width === 'flex' ? 'btn-flex' : ''
  const iconClass = withIcon ? (size === 'small' ? 'btn-with-icon-sm' : 'btn-with-icon') : ''
  
  const buttonClasses = [
    sizeClass,
    widthClass,
    iconClass,
    className
  ].filter(Boolean).join(' ')

  return (
    <button 
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  )
}
