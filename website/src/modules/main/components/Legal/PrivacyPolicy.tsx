import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-center mb-8">
          <span className="bg-linear-to-br from-[#17FFFD] to-[#2631f7] bg-clip-text text-transparent">
            Nudgio
          </span>{' '}
          <span className="text-zinc-900 dark:text-zinc-100">
            Privacy Policy
          </span>
        </h1>
      </header>

      <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          <strong>Effective Date:</strong> March 5, 2026
        </p>

        <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black leading-relaxed">
          Nudgio is committed to safeguarding the privacy of its users and the merchants who connect their stores through our platform. This Privacy Policy outlines how we collect, use, share, and protect personal information, in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
        </p>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            1. Information We Collect
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              1.1 Account Information
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">When you create a Nudgio account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
              <li><strong>Name and Email Address</strong>: Used for account creation, authentication, and communication.</li>
              <li><strong>Organization Details</strong>: Organization name and membership information for multi-user access.</li>
              <li><strong>Billing Information</strong>: Payment details processed securely through Stripe. We do not store credit card numbers on our servers.</li>
            </ul>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              1.2 Store Connection Data
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">When you connect your ecommerce store (Shopify, WooCommerce, or Magento), we collect and process:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
              <li><strong>API Credentials</strong>: Access tokens, consumer keys, and consumer secrets required to communicate with your store. These are encrypted at rest using AES symmetric encryption.</li>
              <li><strong>Product Data</strong>: Product names, descriptions, prices, images, categories, SKUs, and stock information from your store catalog.</li>
              <li><strong>Order Data</strong>: Order history including order IDs, product IDs, quantities, prices, and timestamps. Used to generate purchase-pattern-based recommendations.</li>
            </ul>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              1.3 Automatically Collected Data
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">When you visit our website or use our platform, we may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
              <li><strong>Device Information</strong>: IP address, browser type, operating system, device identifiers.</li>
              <li><strong>Usage Data</strong>: Pages viewed, time spent on each page, navigation paths, and referring URL.</li>
              <li><strong>Location Data</strong>: General geographic location inferred from your IP address.</li>
              <li><strong>Analytics Data</strong>: Recommendation widget interactions (impressions, clicks) tracked for performance analytics.</li>
            </ul>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              1.4 Shopify Session Data
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              When you install Nudgio from the Shopify App Store, our embedded app processes Shopify session tokens (JSON Web Tokens) that contain your shop domain, user ID, and locale. These tokens are used solely for authentication within the Shopify Admin and are not stored on our servers. We also exchange session tokens for offline access tokens through Shopify&apos;s Token Exchange API, which are encrypted and stored to maintain your store connection.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            2. How We Use Your Information
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We use your information for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li><strong>To Provide Our Service</strong>: Connect to your ecommerce store, import product and order data, generate AI-powered product recommendations, and serve recommendation widgets.</li>
            <li><strong>Account Management</strong>: Manage your account, authenticate your identity, and process subscription billing through Stripe.</li>
            <li><strong>Analytics and Improvement</strong>: Track recommendation performance (clicks, impressions, conversions) to improve recommendation quality and provide you with analytics dashboards.</li>
            <li><strong>Communication</strong>: Send service-related emails, respond to support inquiries, and notify you of important changes to our platform.</li>
            <li><strong>Compliance and Legal Obligations</strong>: Process your data to comply with applicable laws, enforce our terms, and protect our rights or the rights of others.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            3. Data Security
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We take the security of your data seriously and implement the following measures:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li><strong>Credential Encryption</strong>: All store API credentials (access tokens, consumer keys, consumer secrets, database passwords) are encrypted at rest using Fernet symmetric encryption (AES-128-CBC).</li>
            <li><strong>Transport Security</strong>: All data transmitted between your browser, our servers, and third-party store APIs is encrypted using TLS/HTTPS.</li>
            <li><strong>Access Controls</strong>: Access to personal data is limited to authorized personnel. Store connections are scoped to the owning user and organization.</li>
            <li><strong>Payment Security</strong>: All payment processing is handled by Stripe. We never store credit card numbers on our servers.</li>
          </ul>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Despite these measures, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            4. Cookies and Tracking Technologies
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We use cookies and similar technologies to enhance user experience and track website performance. Cookies enable us to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li><strong>Authenticate Sessions</strong>: Maintain your login state and secure access to your account.</li>
            <li><strong>Track Website Performance</strong>: Using Vercel Analytics to collect and analyze anonymous usage data.</li>
            <li><strong>Remember Preferences</strong>: Store your theme preference (light/dark mode) and other settings.</li>
          </ul>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            You can control cookie preferences through your browser settings. Please note that disabling cookies may affect certain platform features, including authentication.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            5. Third-Party Services
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We use third-party services to help us operate our platform, including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li><strong>Shopify Billing API</strong>: For merchants who install Nudgio from the Shopify App Store, subscription billing is processed through Shopify&apos;s Billing API. Charges appear in your Shopify admin and are subject to Shopify&apos;s terms and privacy policy.</li>
            <li><strong>Stripe</strong>: For merchants on WooCommerce and Magento, subscription billing and payment processing are handled by Stripe. Stripe collects and processes payment information under its own privacy policy.</li>
            <li><strong>Vercel</strong>: Hosts our website and provides anonymous analytics. Subject to Vercel&apos;s privacy policy.</li>
            <li><strong>Ecommerce Platforms</strong>: Shopify, WooCommerce, and Magento APIs are accessed using credentials you provide to fetch product and order data necessary for our service.</li>
          </ul>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            These third parties may collect personal data subject to their own privacy policies. We recommend reviewing the privacy policies of these third parties.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            6. Data Sharing and Disclosure
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We may share your personal information with:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li><strong>Service Providers</strong>: Third parties who assist us in providing our services (e.g., hosting, payment processing).</li>
            <li><strong>Legal Obligations</strong>: When required by law, regulation, or court order, or in response to a valid legal process.</li>
            <li><strong>Business Transfers</strong>: In the event of a merger, sale, or acquisition, your personal information may be transferred to the acquiring entity.</li>
          </ul>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            We do not sell or rent your personal information to third parties for their marketing purposes. Your store data (products, orders) is only used to generate recommendations for your own store.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            7. Your Rights and Choices
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              7.1 Access and Control Over Your Data
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
              <li><strong>Right to Access</strong>: You may request access to the personal data we hold about you.</li>
              <li><strong>Right to Rectification</strong>: You can request correction of inaccurate or incomplete information.</li>
              <li><strong>Right to Deletion</strong>: You can request the deletion of your data, including all store connections and associated data.</li>
              <li><strong>Right to Restrict Processing</strong>: You can request limitations on how your data is processed.</li>
              <li><strong>Right to Object</strong>: You can object to data processing based on legitimate interests.</li>
              <li><strong>Right to Data Portability</strong>: You can request a copy of your data in a structured, machine-readable format.</li>
            </ul>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              To exercise these rights, please contact us at contact@nudgio.tech. We may require verification of your identity before processing your request.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              7.2 Store Data Deletion
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              You can disconnect your ecommerce store at any time through the Nudgio dashboard. When you delete a connection, all associated API credentials are permanently removed from our systems. Cached recommendation data is also cleared.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              7.3 Shopify GDPR Compliance Requests
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">
              For merchants using the Shopify App Store, we support Shopify&apos;s mandatory GDPR compliance webhooks:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
              <li><strong>Customer Data Request</strong>: When a customer requests their data, Shopify notifies us and we provide all personal data we hold for that customer within 30 days.</li>
              <li><strong>Customer Data Erasure</strong>: When a customer requests deletion of their data, we remove all personal data associated with that customer from our systems within 30 days.</li>
              <li><strong>Shop Data Erasure</strong>: When a merchant uninstalls Nudgio, we delete all store data (products, orders, API credentials, recommendation settings) associated with that shop within 30 days.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            8. Data Retention
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            We retain your personal information for as long as your account is active or as needed to provide you with our services. When you delete your account or a store connection, we will delete the associated data within 30 days, except where we are required to retain it for legal or compliance purposes. Analytics data may be retained in anonymized form for service improvement.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            9. International Data Transfers
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Your personal data may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws that are different from those in your country. We take appropriate steps to ensure that your personal information is protected in accordance with this Privacy Policy wherever it is processed.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            10. Children&apos;s Privacy
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Our services are not directed to children under 16, and we do not knowingly collect personal information from children under 16. If we learn that we have inadvertently collected such information, we will delete it as soon as possible.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            11. Data Controller
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            The data controller responsible for processing your personal data is Buraro Technologies, located in Bucharest, Romania. For any questions or requests regarding data protection, please contact us at contact@nudgio.tech.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            12. Changes to This Privacy Policy
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            We may update this Privacy Policy from time to time. When we make changes, we will revise the effective date at the top of the policy and post the updated policy on our website. We encourage you to review this policy regularly.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            13. Contact
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            If you have any questions about this Privacy Policy or our data practices, please contact us at contact@nudgio.tech.
          </p>
        </div>

      </div>
    </article>
  );
};

export default PrivacyPolicy;
