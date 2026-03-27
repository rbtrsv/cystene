import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-center mb-8">
          <span className="bg-linear-to-br from-[#3AFF00] to-[#23FFF6] bg-clip-text text-transparent">
            Nudgio
          </span>{' '}
          <span className="text-zinc-900 dark:text-zinc-100">
            Terms of Service
          </span>
        </h1>
      </header>

      <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          <strong>Effective Date:</strong> March 5, 2026
        </p>

        <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black leading-relaxed">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Nudgio platform, website, APIs, and related services (collectively, the &quot;Service&quot;) operated by Buraro Technologies (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account or using the Service, you agree to be bound by these Terms.
        </p>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            1. Service Description
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Nudgio is a SaaS ecommerce recommendation engine. The Service connects to your ecommerce store (Shopify, WooCommerce, or Magento) via API or database connection, imports your product and order data, and generates AI-powered product recommendations (bestsellers, cross-sell, upsell, and similar products) that you can embed on your store.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            2. Account Registration
          </h2>
          <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must be at least 16 years of age to use the Service.</li>
            <li>One person or legal entity may maintain no more than one free account.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            3. Store Connections and Data
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              3.1 Authorization
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              By connecting your ecommerce store to Nudgio, you represent and warrant that you have the authority to grant us access to your store&apos;s product and order data through the APIs or database credentials you provide. You are solely responsible for ensuring that your use of Nudgio complies with the terms of service of your ecommerce platform (Shopify, WooCommerce, or Magento). For Shopify merchants, your use of Nudgio is also subject to Shopify&apos;s API Terms of Service and Partner Program Agreement.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              3.2 Credential Security
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              We encrypt all API credentials (access tokens, consumer keys, consumer secrets, and database passwords) at rest. However, you are responsible for safeguarding the credentials you provide and for revoking access through your ecommerce platform if you believe your credentials have been compromised.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              3.3 Data Usage
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              We access your store data solely to provide the Service — generating product recommendations and analytics. We do not sell, share, or use your store data for any purpose other than delivering the Service to you. Your product and order data is not shared with other Nudgio users.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            4. Subscription Plans and Billing
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              4.1 Plans
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              Nudgio offers Free, Pro, and Enterprise subscription tiers. Each tier has defined limits on the number of store connections, monthly API requests, and rate limits. Current pricing and limits are available on our website and dashboard.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              4.2 Payment
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              For merchants who install Nudgio from the Shopify App Store, subscription billing is processed through Shopify&apos;s Billing API and charges appear in your Shopify admin. For all other platforms (WooCommerce, Magento), paid subscriptions are billed monthly through Stripe. By subscribing to a paid plan, you authorize us to charge the applicable payment method at the beginning of each billing cycle. All fees are non-refundable except as required by applicable law.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              4.3 Cancellation
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              You may cancel your subscription at any time through the Stripe Customer Portal. Upon cancellation, your subscription remains active until the end of the current billing period. After that, your account reverts to the Free tier with its associated limits.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              4.4 Grace Period
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              If a payment fails, we provide a 7-day grace period during which your service continues at the current tier. If payment is not resolved within this period, your account will be downgraded and access to paid features will be restricted.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            5. Acceptable Use
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or systems connected to the Service.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
            <li>Use the Service to process data from stores you do not own or have authorization to manage.</li>
            <li>Exceed the rate limits or usage quotas associated with your subscription tier through automated means.</li>
            <li>Resell, sublicense, or redistribute the Service or its outputs without our prior written consent.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            6. Intellectual Property
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            The Service, including its design, code, algorithms, documentation, and branding, is the intellectual property of Buraro Technologies. You retain ownership of your store data. By using the Service, you grant us a limited, non-exclusive license to access and process your store data solely for the purpose of providing the Service.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            7. Recommendation Widgets
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Nudgio generates HTML recommendation widgets that you embed on your store. You are responsible for the placement and presentation of these widgets on your store. We do not guarantee any specific revenue increase or conversion rate from the use of our recommendations. Recommendation quality depends on the quantity and quality of your product and order data.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            8. Service Availability
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            We strive to maintain high availability of the Service but do not guarantee uninterrupted or error-free operation. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify you of planned downtime in advance.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            9. Limitation of Liability
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            To the maximum extent permitted by applicable law, Buraro Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, or business opportunities, arising out of or related to your use of the Service. Our total aggregate liability for any claims arising from these Terms shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            10. Disclaimer of Warranties
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will meet your specific requirements, that recommendations will result in increased sales, or that the Service will be uninterrupted, timely, secure, or error-free.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            11. Termination
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We may suspend or terminate your access to the Service at any time if:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li>You violate these Terms or our Acceptable Use policy.</li>
            <li>Your account has been inactive for an extended period.</li>
            <li>We are required to do so by law.</li>
            <li>We discontinue the Service (with reasonable notice).</li>
          </ul>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Upon termination, your right to use the Service ceases immediately. We will delete your data in accordance with our Privacy Policy, unless retention is required by law.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            12. Governing Law
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            These Terms are governed by and construed in accordance with the laws of Romania, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Bucharest, Romania.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            13. Changes to These Terms
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            We may update these Terms from time to time. When we make material changes, we will revise the effective date at the top and notify you via email or a prominent notice on our platform. Your continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Terms.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            14. Contact
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            If you have any questions about these Terms, please contact us at contact@nudgio.tech.
          </p>
        </div>

      </div>
    </article>
  );
};

export default TermsOfService;
