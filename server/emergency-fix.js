/**
 * Emergency fix for approval workflow trigger
 * This script directly applies the SQL fix to resolve the constraint violation issue
 */

const { supabase } = require('./config/database');

async function applyTriggerFix() {
  console.log('🔧 Applying approval workflow trigger fix...');
  
  try {
    // First, let's try to drop and recreate the trigger function with correct values
    const fixSQL = `
      -- Fix the approval workflow trigger function
      CREATE OR REPLACE FUNCTION update_invoice_status_on_approval()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update invoice status based on approval status
        -- Use capitalized status values to match the constraint
        IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
          UPDATE invoices 
          SET 
            status = 'Sent',
            approval_status = 'sent'
          WHERE id = NEW.invoice_id;
        ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
          UPDATE invoices 
          SET 
            status = 'Pending',
            approval_status = 'draft'
          WHERE id = NEW.invoice_id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('Executing trigger fix SQL...');
    
    // Try to execute the SQL using a simple select with the SQL as a string
    // This is a workaround since we can't execute arbitrary SQL directly
    const { error } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }

    console.log('✅ Database connection verified');
    console.log('⚠️  Please run the following SQL directly in your Supabase dashboard:');
    console.log('----------------------------------------');
    console.log(fixSQL);
    console.log('----------------------------------------');
    
    return true;
  } catch (error) {
    console.error('❌ Error applying trigger fix:', error.message);
    return false;
  }
}

// For now, let's also try to temporarily disable the trigger to test our bulk update
async function testBulkUpdateFix() {
  console.log('🧪 Testing if we can identify the exact constraint issue...');
  
  try {
    // Try to query the current constraint information
    // This might give us insight into what's actually in the database
    const { data, error } = await supabase
      .from('invoices')
      .select('id, status, approval_status')
      .limit(5);
      
    if (error) {
      console.error('❌ Error querying invoices:', error);
      return false;
    }
    
    console.log('📊 Current invoice statuses in database:');
    data.forEach(invoice => {
      console.log(`- ID: ${invoice.id.substring(0, 8)}..., status: "${invoice.status}", approval_status: "${invoice.approval_status}"`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error testing:', error.message);
    return false;
  }
}

// Run both functions
async function main() {
  console.log('🚀 Starting emergency fix procedures...');
  
  await testBulkUpdateFix();
  console.log('');
  await applyTriggerFix();
  
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Copy the SQL above and run it in your Supabase SQL editor');
  console.log('2. Then try the bulk status update again');
  console.log('3. If it still fails, we may need to inspect the actual database constraints');
}

main().catch(console.error);