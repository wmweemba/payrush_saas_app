import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * POST /api/payments/verify
 * Verifies payment with Flutterwave and updates invoice status
 */
export async function POST(request) {
  try {
    const { transaction_id, invoice_id } = await request.json();

    // Validate required parameters
    if (!transaction_id || !invoice_id) {
      return NextResponse.json(
        { error: 'Missing transaction_id or invoice_id' },
        { status: 400 }
      );
    }

    console.log(`Verifying payment - Transaction ID: ${transaction_id}, Invoice ID: ${invoice_id}`);

    // Step 1: Verify payment with Flutterwave API
    const flutterwaveResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!flutterwaveResponse.ok) {
      throw new Error(`Flutterwave API error: ${flutterwaveResponse.status}`);
    }

    const flutterwaveData = await flutterwaveResponse.json();

    if (flutterwaveData.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', details: flutterwaveData },
        { status: 400 }
      );
    }

    const transaction = flutterwaveData.data;

    // Step 2: Validate transaction details
    if (transaction.status !== 'successful') {
      return NextResponse.json(
        { error: 'Payment not successful', status: transaction.status },
        { status: 400 }
      );
    }

    // Step 3: Get invoice details from database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Step 4: Validate payment amount matches invoice
    const paidAmount = parseFloat(transaction.amount);
    const invoiceAmount = parseFloat(invoice.amount);

    if (paidAmount !== invoiceAmount) {
      return NextResponse.json(
        { error: 'Payment amount mismatch', paid: paidAmount, expected: invoiceAmount },
        { status: 400 }
      );
    }

    // Step 5: Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('reference', transaction.tx_ref)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already processed', payment_id: existingPayment.id },
        { status: 409 }
      );
    }

    // Step 6: Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          invoice_id: invoice_id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'successful',
          reference: transaction.tx_ref,
          flutterwave_id: transaction.id.toString(),
          payment_method: transaction.payment_type || 'card',
          customer_email: transaction.customer.email,
          customer_name: transaction.customer.name,
        }
      ])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record', details: paymentError },
        { status: 500 }
      );
    }

    // Step 7: Update invoice status to 'Paid'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'Paid' })
      .eq('id', invoice_id);

    if (updateError) {
      console.error('Invoice status update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invoice status', details: updateError },
        { status: 500 }
      );
    }

    // Step 8: Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment verified and invoice updated successfully',
      data: {
        payment_id: paymentRecord.id,
        transaction_id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        reference: transaction.tx_ref,
        invoice_status: 'Paid'
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}