import Link from "next/link";
import { Eye } from "lucide-react";

export const metadata = {
  title: "Terms of Service — KlaraMD",
  description: "Terms and conditions for using the KlaraMD telehealth platform.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By creating an account or using the KlaraMD platform (&ldquo;Service&rdquo;), you agree to be bound by these
              Terms of Service. If you do not agree, do not use the Service. These terms constitute a legally binding
              agreement between you and KlaraMD. We reserve the right to update these terms; continued use of the
              Service after changes are posted constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Nature of the Service</h2>
            <p className="text-gray-700 leading-relaxed">
              KlaraMD is a telehealth platform that facilitates remote eye care consultations with licensed
              ophthalmologists and optometrists registered in Ontario, Canada. The Service is intended for Ontario
              residents aged 18 and over. The Service does not replace emergency medical care &mdash; if you are
              experiencing a medical emergency, call 911 or go to your nearest emergency room.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Clinical services are provided by independent regulated health professionals, not by KlaraMD directly.
              KlaraMD provides the technology platform only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You must be at least 18 years of age.</li>
              <li>You must be physically located in Ontario, Canada at the time of consultation.</li>
              <li>You must provide accurate and complete registration information.</li>
              <li>You must hold a valid Ontario Health Card for OHIP-covered services (or agree to private pay rates otherwise).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Account Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity
              that occurs under your account. You must notify us immediately of any unauthorized use at{" "}
              <a href="mailto:support@klaramd.com" className="text-teal-600 underline">support@klaramd.com</a>.
              You may not share your account with another person or create accounts on behalf of others without
              authorization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Informed Consent for Telehealth</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              By using the consultation features of this Service, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Telehealth consultations have inherent limitations compared to in-person examinations.</li>
              <li>Your treating clinician may determine that an in-person visit is necessary and refer you accordingly.</li>
              <li>You have the right to withdraw from a telehealth consultation at any time.</li>
              <li>CPSO telemedicine practice standards apply to all consultations conducted through this platform.</li>
              <li>Prescribing via telemedicine is subject to the clinical judgement of the treating physician and applicable CPSO guidelines.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Fees and Billing</h2>
            <p className="text-gray-700 leading-relaxed">
              OHIP-eligible services are billed directly to the Ontario Ministry of Health where applicable. For
              services not covered by OHIP, or for patients without a valid Ontario Health Card, private pay rates
              will be disclosed before the consultation. All fees are in Canadian dollars. Refund eligibility is
              determined on a case-by-case basis and subject to the clinical provider&rsquo;s policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide false, misleading, or fraudulent information, including false health card details.</li>
              <li>Attempt to access accounts, systems, or data that are not yours.</li>
              <li>Use the platform for any unlawful purpose.</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the platform.</li>
              <li>Interfere with the security, integrity, or availability of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the fullest extent permitted by Ontario law, KlaraMD&rsquo;s liability for any claim arising out of use
              of the platform is limited to the amount you paid for the specific service giving rise to the claim in
              the 12 months preceding the claim. KlaraMD is not liable for decisions made by independent clinicians
              using the platform, or for outcomes arising from information you provided that was inaccurate or
              incomplete. Nothing in these terms limits liability for death or personal injury caused by negligence,
              or for fraud.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable
              therein. Any disputes shall be resolved in the courts of Ontario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about these terms may be directed to:
            </p>
            <address className="not-italic mt-3 text-gray-700 leading-relaxed">
              <strong>KlaraMD</strong><br />
              Email:{" "}
              <a href="mailto:legal@klaramd.com" className="text-teal-600 underline">
                legal@klaramd.com
              </a><br />
              Ontario, Canada
            </address>
          </section>

        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-8 mt-8 border-t border-gray-200">
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <Link href="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
