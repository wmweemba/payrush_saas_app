/**
 * Flutterwave Webhook Handler
 * 
 * This API route handles webhook notifications from Flutterwave
 * when payments are completed, failed, or updated.
 * 
 * Webhook URL: https://yourapp.com/api/webhooks/flutterwave
 */

import { NextResponse } from 'next/server';
import { processWebhook } from '@/lib/payments/flutterwave';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Log webhook for debugging (remove in production)
    console.log('Flutterwave webhook received:', body);
    
    // Verify webhook signature (implement based on Flutterwave documentation)
    // const isValid = verifyWebhookSignature(body, request.headers);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    // }
    
    // Process the webhook
    const result = await processWebhook(body);
    
    if (result.success && result.action === 'payment_completed') {
      // Update invoice status in database
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'Paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', result.invoice_id);
      
      if (error) {
        console.error('Failed to update invoice status:', error);
        return NextResponse.json(
          { error: 'Failed to update invoice' }, 
          { status: 500 }
        );
      }
      
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: result.invoice_id,
          amount: result.amount,
          currency: result.currency,
          provider: 'flutterwave',
          status: 'completed',
          reference: result.flw_ref,
          created_at: new Date().toISOString(),
        });
      
      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        // Don't fail the webhook for this, just log it
      }
      
      console.log(`Payment completed for invoice ${result.invoice_id}`);
    }
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Webhook processed successfully' 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check endpoint for webhook
  return NextResponse.json({ 
    status: 'ok', 
    service: 'flutterwave-webhook',
    timestamp: new Date().toISOString() 
  });
}

/**
 * Verify webhook signature from Flutterwave
 * Implementation based on Flutterwave documentation
 * @param {Object} body - Webhook body
 * @param {Headers} headers - Request headers
 * @returns {boolean} Whether signature is valid
 */
function verifyWebhookSignature(body, headers) {
  // TODO: Implement signature verification
  // This is critical for production security
  
  const signature = headers.get('verif-hash');
  const expectedSignature = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  
  // Simple verification - enhance based on Flutterwave specs
  return signature === expectedSignature;
}

// Export configuration for Flutterwave webhook setup
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};