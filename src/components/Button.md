# Button Component Library

This document describes the centralized button styling system using CSS classes and tokens.

## Available Button Classes

### Primary Buttons
- `.btn-primary` - Standard primary button
- `.btn-primary-sm` - Small primary button

### Secondary Buttons
- `.btn-secondary` - Standard secondary button (outline style)
- `.btn-secondary-sm` - Small secondary button

### Danger Buttons
- `.btn-danger` - Standard danger button (red background)
- `.btn-danger-sm` - Small danger button
- `.btn-danger-outline` - Danger outline button
- `.btn-danger-outline-sm` - Small danger outline button

### Ghost Buttons
- `.btn-ghost` - Standard ghost button (minimal styling)
- `.btn-ghost-sm` - Small ghost button

### Disabled Buttons
- `.btn-disabled` - Standard disabled button
- `.btn-disabled-sm` - Small disabled button

### Utility Classes
- `.btn-full` - Full width button
- `.btn-flex` - Flex-1 button
- `.btn-with-icon` - Button with icon spacing
- `.btn-with-icon-sm` - Small button with icon spacing

## Usage Examples

### Using CSS Classes Directly
```tsx
// Primary button
<button className="btn-primary">Add Box</button>

// Small secondary button with icon
<button className="btn-secondary-sm btn-with-icon-sm">
  <Plus className="w-4 h-4" />
  Add Model
</button>

// Full width danger button
<button className="btn-danger btn-full">Delete Box</button>
```

### Using the Button Component
```tsx
import { Button } from './Button'

// Primary button
<Button variant="primary">Add Box</Button>

// Small secondary button with icon
<Button variant="secondary-sm" size="small" withIcon>
  <Plus className="w-4 h-4" />
  Add Model
</Button>

// Full width danger button
<Button variant="danger" width="full">Delete Box</Button>

// Disabled button
<Button variant="disabled" disabled>Processing...</Button>
```

## Button Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| `primary` | Brand color background | Main actions, forms, CTAs |
| `secondary` | Brand color outline | Secondary actions, alternatives |
| `danger` | Red background | Delete, destructive actions |
| `danger-outline` | Red outline | Less prominent destructive actions |
| `ghost` | Minimal styling | Subtle actions, navigation |
| `disabled` | Grayed out | Disabled state |

## Button Sizes

| Size | Padding | Use Case |
|------|---------|----------|
| `default` | `px-6 py-3` | Standard buttons |
| `small` | `px-4 py-2` | Compact buttons, inline actions |

## Button Widths

| Width | Description | Use Case |
|-------|-------------|----------|
| `default` | Auto width | Standard buttons |
| `full` | Full width | Form buttons, mobile |
| `flex` | Flex-1 | Button groups, equal width |

## Token System

All button styles use the centralized token system:

- `--color-brand` - Primary brand color
- `--color-brand-hover` - Brand hover state
- `--color-button-red` - Danger color
- `--color-border` - Border color
- `--color-text` - Text color
- `--color-bg-secondary` - Secondary background

## Migration Guide

### Before (Inline Styles)
```tsx
<button className="bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/80 text-white px-6 py-3 rounded-lg transition-colors text-base font-semibold">
  Add Box
</button>
```

### After (Centralized Classes)
```tsx
<button className="btn-primary">
  Add Box
</button>
```

### Or Using Button Component
```tsx
<Button variant="primary">Add Box</Button>
```

## Benefits

1. **Consistency** - All buttons use the same design tokens
2. **Maintainability** - Changes to button styles are centralized
3. **Developer Experience** - Simple, semantic class names
4. **Dark Mode Support** - Automatic light/dark mode switching
5. **Type Safety** - TypeScript support with the Button component
