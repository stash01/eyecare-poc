import Link from "next/link";
import { Eye } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — KlaraMD",
  description: "How KlaraMD collects, uses, and protects your personal health information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            <Eye className="w-6 h-6 text-teal-600" />
            <span className="font-semibold text-lg">KlaraMD</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. About This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              KlaraMD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting the privacy of your personal health
              information in accordance with the <em>Personal Health Information Protection Act, 2004</em> (PHIPA) and
              other applicable Ontario privacy legislation. This policy describes how we collect, use, disclose, and
              safeguard your information when you use our telehealth platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We collect the following categories of information:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Identity information:</strong> name, date of birth, email address, phone number.</li>
              <li><strong>Health card information:</strong> Ontario Health Card number (encrypted at rest using AES-256-GCM).</li>
              <li><strong>Clinical information:</strong> symptom assessment responses, consultation notes, and treatment recommendations.</li>
              <li><strong>Technical information:</strong> session tokens (stored as hashed values only), IP address, and browser type for security purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Your information is used to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide telehealth consultations and clinical assessments.</li>
              <li>Communicate with you regarding appointments, results, and follow-up care.</li>
              <li>Verify your identity and eligibility for OHIP-covered services.</li>
              <li>Maintain records required by PHIPA and CPSO guidelines.</li>
              <li>Improve the safety and quality of our platform.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We do not sell, rent, or trade your personal health information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed">
              All personal health information is stored on servers located in Canada (Toronto/Montreal region) to comply
              with PHIPA requirements for data residency. We use industry-standard encryption in transit (TLS 1.2+) and
              at rest. Access to PHI is restricted to authorized clinical and administrative personnel on a need-to-know
              basis. All access events are recorded in an append-only audit log retained for a minimum of 10 years as
              required by PHIPA s.13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Disclosure of Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may disclose your personal health information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>To your treating physician or specialist with your consent.</li>
              <li>To third-party service providers who process data on our behalf under data processing agreements confirming Canadian data residency.</li>
              <li>As required by law, regulation, court order, or to comply with a lawful request from a public health authority.</li>
              <li>In a medical emergency where disclosure is necessary to prevent serious harm.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Under PHIPA, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Request access to your personal health information held by us.</li>
              <li>Request correction of inaccurate or incomplete records.</li>
              <li>Withdraw consent for certain uses or disclosures (subject to legal or safety limitations).</li>
              <li>File a complaint with the <a href="https://www.ipc.on.ca" className="text-teal-600 underline" target="_blank" rel="noopener noreferrer">Information and Privacy Commissioner of Ontario</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              Patient health records are retained for a minimum of 10 years from the date of last entry, or until a
              patient reaches 18 years of age (whichever is longer), in accordance with CPSO and PHIPA requirements.
              Audit logs are retained for a minimum of 10 years. You may request deletion of non-clinical account data
              by contacting us below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use strictly necessary session cookies (httpOnly, Secure) for authentication. We do not use advertising
              or tracking cookies. Analytics, if used, are configured to anonymize IP addresses and do not share data
              with third parties outside Canada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this policy from time to time. Material changes will be communicated to registered users
              by email at least 30 days before taking effect. Continued use of the platform after the effective date
              constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy inquiries, requests, or complaints, please contact our Privacy Officer:
            </p>
            <address className="not-italic mt-3 text-gray-700 leading-relaxed">
              <strong>KlaraMD Privacy Officer</strong><br />
              Email:{" "}
              <a href="mailto:privacy@klaramd.com" className="text-teal-600 underline">
                privacy@klaramd.com
              </a><br />
              Ontario, Canada
            </address>
          </section>

        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-8 mt-8 border-t border-gray-200">
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <Link href="/terms" className="hover:text-gray-700">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
