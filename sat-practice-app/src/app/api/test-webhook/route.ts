import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(req: NextRequest) {
  console.log('Test webhook endpoint hit');
  
  // Report environment configuration
  return NextResponse.json({
    message: 'Test webhook endpoint is working',
    config: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set',
      monthlyLink: process.env.NEXT_PUBLIC_MONTHLY_PLAN_PAYMENT_LINK ? 'Set' : 'Not set',
      quarterlyLink: process.env.NEXT_PUBLIC_QUARTERLY_PLAN_PAYMENT_LINK ? 'Set' : 'Not set',
    },
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  console.log('Test webhook POST endpoint hit');
  
  try {
    // Get the request body
    const body = await req.json();
    
    // Check if we can connect to the database
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      message: 'Test webhook POST endpoint is working',
      receivedBody: body,
      databaseConnection: error ? 'Failed' : 'Success',
      subscriptionCount: data ? data.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test webhook:', error);
    return NextResponse.json({
      message: 'Error in test webhook',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 