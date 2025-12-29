#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface VersionInfo {
  version: string; // e.g., "1.2.3"
  versionCode: number; // Android versionCode / iOS build number
}

// Read version from package.json
function getVersionFromPackageJson(): string {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

// Validate semantic version format
function validateSemanticVersion(version: string): boolean {
  const semanticVersionRegex = /^\d+\.\d+\.\d+$/;
  return semanticVersionRegex.test(version);
}

// Calculate versionCode from version string
// Format: MAJOR * 10000 + MINOR * 100 + PATCH
// e.g., 1.2.3 -> 10203, 2.0.0 -> 20000
function calculateVersionCode(version: string): number {
  if (!validateSemanticVersion(version)) {
    throw new Error(`Invalid version format: ${version}. Expected MAJOR.MINOR.PATCH (e.g., 1.0.0)`);
  }
  
  const parts = version.split('.').map(Number);
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected MAJOR.MINOR.PATCH`);
  }
  
  return parts[0] * 10000 + parts[1] * 100 + parts[2];
}

// Update Android build.gradle
function updateAndroidVersion(versionInfo: VersionInfo) {
  const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  
  if (!fs.existsSync(gradlePath)) {
    console.warn(`⚠️  Android build.gradle not found at ${gradlePath}, skipping Android update`);
    return;
  }
  
  let content = fs.readFileSync(gradlePath, 'utf8');
  
  // Update versionName (must be quoted string)
  content = content.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${versionInfo.version}"`
  );
  
  // Update versionCode (must be integer)
  content = content.replace(
    /versionCode\s+\d+/,
    `versionCode ${versionInfo.versionCode}`
  );
  
  fs.writeFileSync(gradlePath, content);
  console.log(`✅ Updated Android: versionName="${versionInfo.version}", versionCode=${versionInfo.versionCode}`);
}

// Update iOS project.pbxproj
function updateIOSVersion(versionInfo: VersionInfo) {
  const pbxprojPath = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
  
  if (!fs.existsSync(pbxprojPath)) {
    console.warn(`⚠️  iOS project.pbxproj not found at ${pbxprojPath}, skipping iOS update`);
    return;
  }
  
  let content = fs.readFileSync(pbxprojPath, 'utf8');
  
  // Update MARKETING_VERSION (user-facing version) - can be string or number
  // Match patterns like: MARKETING_VERSION = 1.0; or MARKETING_VERSION = "1.0";
  content = content.replace(
    /MARKETING_VERSION\s*=\s*[^;]+;/g,
    `MARKETING_VERSION = ${versionInfo.version};`
  );
  
  // Update CURRENT_PROJECT_VERSION (build number) - must be integer
  content = content.replace(
    /CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${versionInfo.versionCode};`
  );
  
  fs.writeFileSync(pbxprojPath, content);
  console.log(`✅ Updated iOS: MARKETING_VERSION=${versionInfo.version}, CURRENT_PROJECT_VERSION=${versionInfo.versionCode}`);
}

// Update Supabase database
async function updateDatabaseVersion(versionInfo: VersionInfo) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase credentials not found. Skipping database sync.');
    console.warn('   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file to enable database sync.');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if a published version with this number exists
    const { data: existingVersion, error: fetchError } = await supabase
      .from('version')
      .select('id, ver_number, published')
      .eq('ver_number', versionInfo.version)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw fetchError;
    }
    
    const verTitle = `v${versionInfo.version}`;
    
    if (existingVersion) {
      // Update existing version
      const { error: updateError } = await supabase
        .from('version')
        .update({
          ver_title: verTitle,
          published: true
        })
        .eq('id', existingVersion.id);
      
      if (updateError) throw updateError;
      console.log(`✅ Updated database version: ${versionInfo.version} (ID: ${existingVersion.id})`);
    } else {
      // Create new version entry
      const { data: newVersion, error: insertError } = await supabase
        .from('version')
        .insert({
          ver_number: versionInfo.version,
          ver_title: verTitle,
          ver_notes: null,
          published: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      console.log(`✅ Created database version: ${versionInfo.version} (ID: ${newVersion.id})`);
    }
  } catch (error: any) {
    console.error('❌ Error updating database:', error.message);
    console.error('   Database sync failed, but file updates were successful.');
  }
}

// Main execution
async function main() {
  try {
    console.log('📦 Starting version sync...\n');
    
    const version = getVersionFromPackageJson();
    
    if (!validateSemanticVersion(version)) {
      throw new Error(`Invalid version format in package.json: ${version}. Expected MAJOR.MINOR.PATCH format (e.g., 1.0.0)`);
    }
    
    const versionCode = calculateVersionCode(version);
    
    const versionInfo: VersionInfo = {
      version,
      versionCode
    };
    
    console.log(`📦 Syncing version: ${version} (code: ${versionCode})\n`);
    
    // Update Android
    updateAndroidVersion(versionInfo);
    
    // Update iOS
    updateIOSVersion(versionInfo);
    
    // Update database (async, may fail gracefully)
    await updateDatabaseVersion(versionInfo);
    
    console.log('\n✅ Version sync complete!');
  } catch (error: any) {
    console.error('\n❌ Error syncing version:', error.message);
    process.exit(1);
  }
}

main();

