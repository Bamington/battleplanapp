#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable');
  console.log('💡 Add VITE_SUPABASE_URL to your .env file');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.log('💡 You can find this in your Supabase project settings under API > Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateVersion() {
  try {
    console.log('🔄 Updating version number...');

    // Get the latest version number
    const { data: latestVersion, error: fetchError } = await supabase
      .from('version')
      .select('ver_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No rows found, create initial version
        console.log('📝 No existing version found, creating initial version 1.0...');
        const { data, error: insertError } = await supabase
          .from('version')
          .insert({
            ver_number: 1.0,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log('✅ Initial version 1.0 created');
        return data;
      }
      throw fetchError;
    }

    // Calculate new version number
    const currentVersion = latestVersion?.ver_number || 1.0;
    const newVersionNumber = currentVersion + 0.1;

    // Insert new version
    const { data, error: insertError } = await supabase
      .from('version')
      .insert({
        ver_number: newVersionNumber,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Version updated from ${currentVersion} to ${newVersionNumber}`);
    return data;
  } catch (error) {
    console.error('❌ Error updating version:', error);
    console.log('💡 Make sure:');
    console.log('   1. The version table exists in your database');
    console.log('   2. The migration has been applied (ver_number column exists)');
    console.log('   3. Your service role key has write permissions');
    process.exit(1);
  }
}

// Run the update
updateVersion();
