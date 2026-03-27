import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-center mb-8">
          <span className="bg-linear-to-br from-[#3AFF00] to-[#23FFF6] bg-clip-text text-transparent">
            Cystene
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
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Cystene platform, website, APIs, and related services (collectively, the &quot;Service&quot;) operated by Buraro Technologies (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account or using the Service, you agree to be bound by these Terms.
        </p>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            1. Service Description
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Cystene is a SaaS cybersecurity scanning platform. The Service allows you to add infrastructure targets (domains, IP addresses, IP ranges, or URLs), configure and run security scans (port scanning, DNS enumeration, SSL/TLS analysis, and web security checks), and receive prioritized vulnerability findings with remediation guidance. Scan results are stored, tracked over time, and exportable as reports.
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
            3. Target Ownership and Authorization
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              3.1 Authorization
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              By adding a scan target to Cystene, you represent and warrant that you own or have explicit written authorization to perform security scanning against that target. Unauthorized scanning of systems you do not own or have permission to test is illegal and strictly prohibited. You are solely responsible for ensuring that your use of the Service complies with all applicable laws, regulations, and third-party agreements.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              3.2 Target Verification
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              Cystene requires ownership verification before allowing scans against a target. Verification methods include DNS TXT record, file upload, or meta tag placement. You must complete verification before any scans can be executed. We reserve the right to suspend scanning capabilities if we have reason to believe a target is not owned or authorized by you.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              3.3 Data Usage
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              We store scan results (findings, discovered assets, and reports) solely to provide the Service to you. We do not sell, share, or use your scan data for any purpose other than delivering the Service. Your vulnerability data, infrastructure details, and scan configurations are not shared with other Cystene users.
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
              Cystene offers Free, Pro, and Enterprise subscription tiers. Each tier has defined limits on the number of scan targets, monthly scans, scan types available, and report generation. Current pricing and limits are available on our website and dashboard.
            </p>

            <h3 className="text-xl font-medium my-2 text-zinc-900 dark:text-zinc-100">
              4.2 Payment
            </h3>
            <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
              Paid subscriptions are billed monthly through Stripe. By subscribing to a paid plan, you authorize us to charge the applicable payment method at the beginning of each billing cycle. All fees are non-refundable except as required by applicable law.
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
            <li>Use the Service to scan targets you do not own or have explicit written authorization to test.</li>
            <li>Use the Service for any unlawful purpose, including unauthorized penetration testing, denial-of-service attacks, or exploitation of discovered vulnerabilities against third-party systems.</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or systems connected to the Service.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
            <li>Exceed the rate limits or usage quotas associated with your subscription tier through automated means.</li>
            <li>Resell, sublicense, or redistribute the Service, its scan results, or its outputs without our prior written consent.</li>
            <li>Use the Service to generate false or misleading security reports for third parties.</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            6. Intellectual Property
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            The Service, including its design, code, scanning algorithms, documentation, and branding, is the intellectual property of Buraro Technologies. You retain ownership of your scan data and reports. By using the Service, you grant us a limited, non-exclusive license to process your target data solely for the purpose of providing the Service.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            7. Scan Results and Reports
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            Cystene generates security scan results, vulnerability findings, and exportable reports based on automated scanning. Scan results reflect the state of your infrastructure at the time of scanning and are not a guarantee of complete security coverage. We do not guarantee the detection of all vulnerabilities, and the absence of findings does not mean your infrastructure is free of security issues. You are responsible for validating findings and implementing remediation measures.
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
            To the maximum extent permitted by applicable law, Buraro Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, or business opportunities, arising out of or related to your use of the Service. We are not liable for any damages resulting from vulnerabilities that the Service failed to detect, or from actions taken based on scan results. Our total aggregate liability for any claims arising from these Terms shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            10. Disclaimer of Warranties
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-6">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will detect all vulnerabilities in your infrastructure, that scan results will be complete or error-free, or that the Service will be uninterrupted, timely, secure, or error-free.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold my-3 text-zinc-900 dark:text-zinc-100">
            11. Termination
          </h2>
          <p className="font-normal max-sm:text-sm sm:text-base dark:text-white text-black mb-4">We may suspend or terminate your access to the Service at any time if:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4 font-normal max-sm:text-sm sm:text-base dark:text-white text-black">
            <li>You violate these Terms or our Acceptable Use policy.</li>
            <li>You scan targets without proper authorization.</li>
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
            If you have any questions about these Terms, please contact us at contact@cystene.com.
          </p>
        </div>

      </div>
    </article>
  );
};

export default TermsOfService;
