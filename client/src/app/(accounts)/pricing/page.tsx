'use client';

import { useState } from 'react';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Price, Subscription } from '@/modules/accounts/schemas/subscriptions.schema';
import SubscriptionProvider from '@/modules/accounts/providers/subscriptions-provider';

// PricingCard Component
const PricingCard = ({ 
  plan, 
  onSubscribe, 
  isLoading 
}: { 
  plan: Price; 
  onSubscribe: (priceId: string) => void; 
  isLoading: string | null;
}) => (
  <div
    className="group relative rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-md hover:shadow-lg transition-all duration-300 p-6 bg-white/50 backdrop-blur-sm dark:bg-zinc-800/50 flex flex-col hover:-translate-y-1"
  >
    <div className="flex-grow">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent mb-3">
          {plan.name}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed min-h-[48px] px-2">
          {plan.description || `Perfect for ${plan.name.toLowerCase()} teams and growing businesses`}
        </p>
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-bold text-zinc-900 dark:text-white">
            ${plan.amount.toFixed(2)}
          </span>
          <span className="text-lg font-medium text-zinc-500 dark:text-zinc-400 ml-2">
            /{plan.interval || 'month'}
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">No setup fees • Cancel anytime</p>
      </div>
      <div className="flex-grow">
        <ul className="space-y-2 mb-6">
          {plan.features?.map((feature, index) => (
            <li key={index} className="flex items-start group/feature">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 group-hover/feature:bg-green-200 dark:group-hover/feature:bg-green-800/40 transition-colors">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{feature}</span>
            </li>
          )) || (
            <li className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-zinc-700 dark:text-zinc-300">Full access to all features</span>
            </li>
          )}
        </ul>
      </div>
    </div>
    
    <div className="mt-auto">
      <Button
        className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 dark:from-zinc-700 dark:to-zinc-600 dark:hover:from-zinc-600 dark:hover:to-zinc-500 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
        onClick={() => onSubscribe(plan.id)}
        disabled={isLoading === plan.id}
      >
        {isLoading === plan.id ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Get Started</span>
        )}
      </Button>
    </div>
  </div>
);

// CurrentSubscription Component
const CurrentSubscription = ({ 
  subscription, 
  onManage, 
  isLoading 
}: { 
  subscription: Subscription; 
  onManage: () => void; 
  isLoading: string | null;
}) => (
  <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800/50 dark:to-zinc-700/50 p-8 rounded-2xl mx-auto max-w-2xl shadow-lg border border-blue-200/50 dark:border-zinc-600/50 backdrop-blur-sm">
    <div className="text-center mb-6">
      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Current Subscription</h3>
      <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mx-auto"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white/60 dark:bg-zinc-700/60 p-4 rounded-xl">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Plan</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-white">
          {subscription.plan_name
            ? subscription.plan_name.charAt(0) + subscription.plan_name.slice(1).toLowerCase()
            : 'Unknown'}
        </p>
      </div>
      <div className="bg-white/60 dark:bg-zinc-700/60 p-4 rounded-xl">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Status</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            subscription.subscription_status === 'ACTIVE' ? 'bg-green-500' : 
            subscription.subscription_status === 'TRIALING' ? 'bg-blue-500' : 
            'bg-red-500'
          }`}></div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-white capitalize">
            {subscription.subscription_status.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
    <div className="text-center">
      <Button 
        onClick={onManage}
        disabled={isLoading === 'portal'}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isLoading === 'portal' ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <span>Manage Subscription</span>
        )}
      </Button>
    </div>
  </div>
);

// LoadingState Component
const LoadingState = () => (
  <div className="bg-white dark:bg-black min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-zinc-600 dark:text-zinc-400" />
      <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Loading subscription plans...</h2>
    </div>
  </div>
);

// ErrorState Component
const ErrorState = ({ error }: { error: string | null }) => (
  <div className="bg-white dark:bg-black min-h-screen">
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Pricing Plans</h1>
        <div className="mt-6 bg-zinc-100 dark:bg-zinc-800 border-l-4 border-zinc-400 dark:border-zinc-600 p-4 mx-auto max-w-3xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="ml-3 text-left">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <strong className="font-medium">
                  {error ? 'Error loading plans:' : 'No subscription plans found.'}
                </strong>
                <br />
                {error || 'Please try again later or contact support.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

function PricingPageContent() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const {
    plans,
    currentSubscription,
    isLoading,
    error: subscriptionError,
    createCheckoutSession,
    createCustomerPortalSession
  } = useSubscriptions();

  const handleSubscribe = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const checkoutUrl = await createCheckoutSession(priceId);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setLoadingPriceId(null);
    }
  };

  const handleCustomerPortal = async () => {
    try {
      const portalUrl = await createCustomerPortalSession();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (subscriptionError || !plans || !Array.isArray(plans.prices) || plans.prices.length === 0) {
    return <ErrorState error={subscriptionError} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-zinc-400/5 to-zinc-600/5 rounded-full blur-3xl"></div>
      </div>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-200 dark:to-white bg-clip-text text-transparent mb-6">
            Choose Your Plan
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
          
          {currentSubscription && (
            <CurrentSubscription 
              subscription={currentSubscription} 
              onManage={handleCustomerPortal} 
              isLoading={null} 
            />
          )}
        </div>

        <div className={`grid gap-6 mx-auto ${ 
          plans.prices.length === 1 ? 'grid-cols-1 max-w-xs' :
          plans.prices.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-xl' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-3xl'
        }`}>
          {plans.prices.map((plan) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              onSubscribe={handleSubscribe} 
              isLoading={loadingPriceId} 
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-8 max-w-xl mx-auto border border-zinc-200/50 dark:border-zinc-700/50">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Still have questions?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>24/7 support</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>Money-back guarantee</span>
              </div>
            </div>
            <p className="mt-6 text-zinc-600 dark:text-zinc-400">
              Need a custom plan? {' '}
              <a 
                href="mailto:sales@nexotype.com" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline transition-colors"
              >
                Contact our sales team
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <SubscriptionProvider>
      <PricingPageContent />
    </SubscriptionProvider>
  );
}
