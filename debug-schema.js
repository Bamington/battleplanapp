/**
 * Database Schema Inspector
 *
 * This script checks the current database schema to investigate
 * collection deletion behavior and potential model cascade deletes.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSchema() {
  console.log('🔍 Inspecting database schema for collection deletion behavior...\n')

  try {
    // 1. Check if box_id column still exists in models table
    console.log('1. Checking models table structure:')
    const { data: modelsColumns, error: modelsError } = await supabase
      .rpc('get_table_columns', { table_name: 'models' })

    if (modelsError) {
      // Fallback: Try to query the information_schema directly
      const { data: fallbackColumns, error: fallbackError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'models')
        .eq('table_schema', 'public')

      if (fallbackError) {
        console.log('   ❌ Could not inspect models table columns')
        console.log('   Error:', fallbackError.message)
      } else {
        const hasBoxId = fallbackColumns.some(col => col.column_name === 'box_id')
        console.log(`   📋 Models table columns: ${fallbackColumns.map(c => c.column_name).join(', ')}`)
        console.log(`   ${hasBoxId ? '⚠️' : '✅'} box_id column exists: ${hasBoxId}`)
      }
    }

    // 2. Check foreign key constraints on models table
    console.log('\n2. Checking foreign key constraints on models table:')
    const { data: fkConstraints, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type,
        table_name
      `)
      .eq('table_name', 'models')
      .eq('constraint_type', 'FOREIGN KEY')

    if (fkError) {
      console.log('   ❌ Could not check foreign key constraints')
      console.log('   Error:', fkError.message)
    } else {
      console.log('   📋 Foreign key constraints found:')
      fkConstraints.forEach(fk => {
        console.log(`   - ${fk.constraint_name}`)
      })

      const hasBoxIdFk = fkConstraints.some(fk => fk.constraint_name === 'models_box_id_fkey')
      console.log(`   ${hasBoxIdFk ? '⚠️' : '✅'} models_box_id_fkey exists: ${hasBoxIdFk}`)
    }

    // 3. Check detailed foreign key information
    console.log('\n3. Checking detailed foreign key relationships:')
    const { data: fkDetails, error: fkDetailsError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq('table_name', 'models')

    if (fkDetailsError) {
      console.log('   ❌ Could not check foreign key details')
      console.log('   Error:', fkDetailsError.message)
    } else {
      console.log('   📋 Foreign key details:')
      fkDetails.forEach(fk => {
        console.log(`   - ${fk.constraint_name}: ${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`)
      })
    }

    // 4. Check referential actions (CASCADE, RESTRICT, etc.)
    console.log('\n4. Checking foreign key referential actions:')
    const { data: refActions, error: refError } = await supabase
      .from('information_schema.referential_constraints')
      .select(`
        constraint_name,
        delete_rule,
        update_rule
      `)
      .in('constraint_name', fkConstraints?.map(fk => fk.constraint_name) || [])

    if (refError) {
      console.log('   ❌ Could not check referential actions')
      console.log('   Error:', refError.message)
    } else {
      console.log('   📋 Referential actions:')
      refActions.forEach(ref => {
        const isProblematic = ref.delete_rule === 'CASCADE' && ref.constraint_name.includes('box_id')
        console.log(`   ${isProblematic ? '⚠️' : '✅'} ${ref.constraint_name}: DELETE ${ref.delete_rule}, UPDATE ${ref.update_rule}`)
      })
    }

    // 5. Check model_boxes junction table constraints
    console.log('\n5. Checking model_boxes junction table constraints:')
    const { data: junctionFks, error: junctionError } = await supabase
      .from('information_schema.key_column_usage')
      .select(`
        constraint_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      `)
      .eq('table_name', 'model_boxes')

    if (junctionError) {
      console.log('   ❌ Could not check model_boxes constraints')
      console.log('   Error:', junctionError.message)
    } else {
      console.log('   📋 model_boxes foreign keys:')
      junctionFks.forEach(fk => {
        console.log(`   - ${fk.constraint_name}: ${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`)
      })
    }

    // 6. Check model_boxes referential actions
    const { data: junctionRefActions, error: junctionRefError } = await supabase
      .from('information_schema.referential_constraints')
      .select(`
        constraint_name,
        delete_rule,
        update_rule
      `)
      .in('constraint_name', junctionFks?.map(fk => fk.constraint_name) || [])

    if (!junctionRefError && junctionRefActions) {
      console.log('   📋 model_boxes referential actions:')
      junctionRefActions.forEach(ref => {
        console.log(`   ✅ ${ref.constraint_name}: DELETE ${ref.delete_rule}, UPDATE ${ref.update_rule}`)
      })
    }

    // 7. Summary and recommendations
    console.log('\n📊 SUMMARY:')

    if (fkConstraints?.some(fk => fk.constraint_name === 'models_box_id_fkey')) {
      console.log('⚠️  POTENTIAL ISSUE FOUND:')
      console.log('   - The old models_box_id_fkey constraint still exists')
      console.log('   - This suggests the migration to remove box_id column did not complete')
      console.log('   - Models may be getting deleted when collections are deleted')
      console.log('\n🔧 RECOMMENDED ACTIONS:')
      console.log('   1. Check if any models still have box_id values set')
      console.log('   2. Complete the migration to remove the box_id column')
      console.log('   3. Test collection deletion in a safe environment')
    } else {
      console.log('✅ Schema looks correct:')
      console.log('   - No problematic foreign key constraints found')
      console.log('   - model_boxes junction table properly configured')
      console.log('   - Models should be safe from cascade deletion')
    }

  } catch (error) {
    console.error('❌ Error during schema inspection:', error)
  }
}

// Run the inspection
inspectSchema()