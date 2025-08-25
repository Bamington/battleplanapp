# Battleplan App

A React-based application for tracking miniatures and booking gaming tables.

## Features

### Expandable Floating Action Button (FAB)
The app features an expandable floating action button that provides quick access to add content to your collection:
- **Location**: Fixed to the bottom-right corner of the UI
- **Visibility**: Only appears on the Collection tab
- **Functionality**: 
  - Click to expand and reveal "Add Model" and "Add Collection" options
  - Uses existing color tokens and icons for consistency
  - Smooth animations for expanding/collapsing
  - Automatically closes after selecting an action

### Build Timestamp Feature

The app automatically displays the last build timestamp on the login screen. This timestamp is updated automatically whenever you run:

- `npm run dev` - Updates timestamp and starts development server
- `npm run build` - Updates timestamp and builds for production
- `npm run update-timestamp` - Updates timestamp only

The timestamp shows the date and time when the code was last modified and built.

## Development

```bash
npm install
npm run dev
```

## Building for Production

```bash
npm run build
```
