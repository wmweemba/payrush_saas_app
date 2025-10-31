#!/usr/bin/env node

/**
 * Database Migration Script for Brand Assets
 * 
 * This script ensures the brand_assets table exists and is properly configured.
 * Run this if you're experiencing issues with asset uploads not persisting.
 * 
 * Usage:
 * node scripts/migrate-brand-assets.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting brand assets table migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/019_ensure_brand_assets_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split the migration into individual statements (simple approach)
    const statements = migrationSQL
      .split(/;\s*(?=\n|$)/)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} had issues:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} failed:`, err.message);
        // Continue with other statements
      }
    }
    
    // Verify the table exists
    console.log('🔍 Verifying brand_assets table...');
    const { data, error } = await supabase
      .from('brand_assets')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST204') {
      console.error('❌ brand_assets table still does not exist');
      console.error('Please run the migration manually in Supabase SQL Editor:');
      console.error('File:', migrationPath);
      process.exit(1);
    } else if (error) {
      console.error('❌ Error verifying table:', error.message);
      process.exit(1);
    } else {
      console.log('✅ brand_assets table exists and is accessible');
    }
    
    // Check brand_assets table structure
    console.log('📊 Checking table structure...');
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'brand_assets' });
    
    if (columnError) {
      console.warn('⚠️  Could not verify table structure:', columnError.message);
    } else {
      console.log('📋 Table columns:', columns?.map(c => c.column_name).join(', '));
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your application servers');
    console.log('2. Try uploading a brand asset again');
    console.log('3. Check that assets appear in the Brand Assets section');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Manual migration required:');
    console.error('1. Open Supabase SQL Editor');
    console.error('2. Run the SQL from: supabase/migrations/019_ensure_brand_assets_table.sql');
    process.exit(1);
  }
}

// Helper function to create the SQL execution function if it doesn't exist
async function ensureExecSqlFunction() {
  const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error && error.message.includes('function exec_sql')) {
      console.log('📋 Creating exec_sql helper function...');
      // Need to create the function via direct SQL
      const { error: createError } = await supabase
        .from('pg_stat_activity') // Use any table to execute raw SQL
        .select('*')
        .limit(0); // We don't actually want data
      
      // This approach won't work easily, let's use a different method
      console.log('⚠️  exec_sql function not available');
      console.log('Please run the migration manually in Supabase SQL Editor');
      return false;
    }
    return true;
  } catch (err) {
    console.log('⚠️  Cannot use exec_sql function:', err.message);
    return false;
  }
}

// Run the migration
async function main() {
  console.log('🔧 PayRush Brand Assets Migration Tool');
  console.log('=====================================');
  
  // Check if we can use the exec_sql approach
  const canUseExecSql = await ensureExecSqlFunction();
  
  if (!canUseExecSql) {
    console.log('');
    console.log('📋 Manual Migration Required');
    console.log('============================');
    console.log('');
    console.log('Please follow these steps:');
    console.log('1. Open your Supabase project dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   supabase/migrations/019_ensure_brand_assets_table.sql');
    console.log('4. Run the SQL script');
    console.log('5. Restart your application');
    console.log('');
    console.log('The migration file is located at:');
    console.log(path.join(__dirname, '../supabase/migrations/019_ensure_brand_assets_table.sql'));
    return;
  }
  
  await runMigration();
}

main().catch(console.error);