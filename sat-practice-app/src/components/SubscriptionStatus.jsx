'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();
        
        if (response.ok) {
          setSubscription(data);
        } else {
          console.error('Error fetching subscription:', data.error);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!subscription?.isSubscriptionActive) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Free Plan</h3>
        <p className="mt-1 text-xs text-gray-500">
          You are currently on the free plan with limited access.
        </p>
        <Link
          href="/pricing"
          className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <h3 className="text-sm font-medium text-green-800">
        {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)} Plan
      </h3>
      <p className="mt-1 text-xs text-green-700">
        Your subscription will {subscription.subscription?.cancel_at_period_end 
          ? 'end' 
          : 'renew'} on {new Date(subscription.subscription?.current_period_end * 1000).toLocaleDateString()}
      </p>
      {!subscription.subscription?.cancel_at_period_end && (
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
              });
              const data = await response.json();
              
              if (response.ok) {
                setSubscription({
                  ...subscription,
                  subscription: data.subscription,
                });
                alert('Your subscription will be canceled at the end of the billing period.');
              } else {
                console.error('Error canceling subscription:', data.error);
                alert('Error canceling subscription. Please try again.');
              }
            } catch (error) {
              console.error('Error canceling subscription:', error);
              alert('Error canceling subscription. Please try again.');
            }
          }}
          className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cancel
        </button>
      )}
    </div>
  );
} 