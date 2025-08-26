#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Updating Supabase types...');

try {
  // Generate types
  execSync('npm run generate-types', { stdio: 'inherit' });
  
  // Check if the file was created
  const typesPath = path.join(__dirname, '..', 'src', 'lib', 'database.types.ts');
  if (fs.existsSync(typesPath)) {
    const stats = fs.statSync(typesPath);
    console.log(`✅ Types updated successfully at ${new Date(stats.mtime).toLocaleString()}`);
  } else {
    console.log('❌ Types file was not created');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to update types:', error.message);
  process.exit(1);
}
