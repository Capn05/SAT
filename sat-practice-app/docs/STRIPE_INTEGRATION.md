# Stripe Integration Guide

This document explains how to set up Stripe integration for the SAT Prep Pro application to handle payments and subscriptions.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com) if you don't have one)
2. Your application deployed to a public domain or a tool like ngrok for local testing

## Step 1: Create Your Products and Payment Links in Stripe

1. Login to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to "Products" in the sidebar
3. Create two products:
   - Monthly Plan ($29/month)
   - 6-Month Plan ($150 one-time payment)
4. For each product, create a Payment Link:
   - Click on the product
   - Find "Payment Links" tab and click "Create payment link"
   - Configure your payment link settings
   - For the 6-Month plan, add custom metadata with key `plan_type` and value `six_month`
   - For the Monthly plan, add custom metadata with key `plan_type` and value `monthly`
5. Copy the URLs of both payment links for the next step

## Step 2: Configure Environment Variables

1. Copy the `.env.local.example` file to a new file named `.env.local`
2. Set your Supabase credentials
3. Add your Stripe credentials:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (found in Stripe Dashboard > Developers > API keys)
   - `NEXT_PUBLIC_STRIPE_MONTHLY_LINK`: The payment link URL for the monthly plan
   - `NEXT_PUBLIC_STRIPE_SIX_MONTH_LINK`: The payment link URL for the 6-month plan

## Step 3: Set Up Stripe Webhook

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted` (if using subscription model)
5. Click "Add endpoint"
6. Copy the "Signing secret" that appears
7. Add this as `STRIPE_WEBHOOK_SECRET` in your `.env.local` file

## Step 4: Prepare the Subscriptions Table in Supabase

1. Login to your [Supabase Dashboard](https://app.supabase.io/)
2. Navigate to the SQL Editor
3. Create the subscriptions table:

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Set up RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for service role to manage all subscriptions
CREATE POLICY "Service role can manage all subscriptions" 
ON public.subscriptions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
```

## Step 5: Deploy Your Application

1. Deploy your application with the environment variables configured
2. Make sure your webhook URL is publicly accessible

## Testing the Integration

1. Visit your application's pricing page
2. Select a plan and complete the checkout process
3. After successful payment, you should be redirected back to your application
4. Check the Supabase database to verify that a subscription record was created
5. You should be able to access the protected content

## Troubleshooting

### Webhook Issues

- Check Stripe Dashboard > Developers > Webhooks to see if webhooks are being delivered
- Check "Recent deliveries" for any failed webhook attempts and their error messages
- Ensure your STRIPE_WEBHOOK_SECRET is correct

### Payment Link Issues

- Make sure the payment link URLs in your environment variables are correct
- Test the payment links directly to ensure they're working

### Subscription Verification Issues

- Check the Supabase database to see if subscription records are being created
- Verify that the user authentication is working correctly
- Check browser console for any errors in the authentication/subscription flow 