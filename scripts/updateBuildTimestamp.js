#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current timestamp in UTC
const now = new Date();
const timestamp = now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');

// Path to the build timestamp file
const timestampFile = path.join(__dirname, '..', 'src', 'utils', 'buildTimestamp.ts');

// Read the current file
let content = fs.readFileSync(timestampFile, 'utf8');

// Update the timestamp
content = content.replace(
  /export const BUILD_TIMESTAMP = '.*'/,
  `export const BUILD_TIMESTAMP = '${timestamp}'`
);

// Write the updated content back
fs.writeFileSync(timestampFile, content);

console.log(`✅ Build timestamp updated to: ${timestamp}`);
