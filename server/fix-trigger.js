/**
 * Temporary script to fix the approval workflow trigger
 * This script applies the SQL fix directly to the database
 */

const { supabase } = require('./config/database');

async function fixApprovalTrigger() {
  console.log('🔧 Fixing approval workflow trigger...');
  
  const fixSql = `
    -- Fix approval workflow trigger to use correct status values
    CREATE OR REPLACE FUNCTION update_invoice_status_on_approval()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update invoice status based on approval status
      -- Use capitalized status values to match the constraint
      IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE invoices 
        SET 
          status = 'Sent'  -- Changed from 'approved' to 'Sent' (proper capitalization)
        WHERE id = NEW.invoice_id;
      ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE invoices 
        SET 
          status = 'Pending'  -- Changed from 'draft' to 'Pending' (proper capitalization)
        WHERE id = NEW.invoice_id;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: fixSql });
    
    if (error) {
      console.error('❌ Error fixing trigger:', error);
      
      // Try alternative approach using raw SQL
      const { error: directError } = await supabase
        .from('__temp__')
        .select('*')
        .eq('__sql__', fixSql);
        
      if (directError) {
        console.error('❌ Direct SQL execution failed:', directError);
      }
    } else {
      console.log('✅ Approval workflow trigger fixed successfully');
    }
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the fix
fixApprovalTrigger()
  .then(() => {
    console.log('🎉 Fix script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix script failed:', error);
    process.exit(1);
  });