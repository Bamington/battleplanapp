import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface TermsOfServicePageProps {
  onBack: () => void
}

export function TermsOfServicePage({ onBack }: TermsOfServicePageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-4xl font-bold text-title text-center">Terms of Service</h1>
      </div>

      <div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-8">
          <div className="space-y-6 text-base text-text leading-relaxed">
            <div className="prose prose-sm max-w-none">
              <h2 className="text-2xl font-bold text-title mb-4">Terms of Service for Battleplan</h2>
              <p className="text-sm text-secondary-text mb-6"><em>Last updated: 26/08/2025</em></p>
              
              <p className="mb-6">
                Welcome to Battleplan ("we," "our," or "us"). By accessing or using the Battleplan app ("the App"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">1. Eligibility</h3>
              <p className="mb-6">
                You must be at least 13 years old (or the minimum age of digital consent in your region) to use Battleplan. By using the App, you confirm that you meet this requirement.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">2. Use of the App</h3>
              <p className="mb-3">
                You agree to use Battleplan only for lawful purposes and in compliance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1">
                <li>Use the App in any way that violates applicable laws or regulations.</li>
                <li>Upload or share harmful, offensive, or infringing content.</li>
                <li>Attempt to hack, disrupt, or misuse the App's services.</li>
                <li>Impersonate another person or misrepresent your affiliation with any entity.</li>
              </ul>
              <p className="mb-6">
                We reserve the right to suspend or terminate your account if you violate these Terms.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">3. User Content</h3>
              <p className="mb-3">
                You may upload photos, text, and other materials ("User Content") to the App. By doing so, you:
              </p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Grant us a limited, non-exclusive license to use, store, display, and share your User Content solely for operating and improving the App.</li>
                <li>Acknowledge that <strong>User Content (including your photos and email address) may be visible to other Battleplan users</strong>.</li>
                <li>Confirm that you own the rights to your User Content, or that you have permission to share it.</li>
              </ul>
              <p className="mb-6">
                We do not claim ownership of your User Content.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">4. Privacy</h3>
              <p className="mb-6">
                Your use of the App is also governed by our Privacy Policy, which explains how we collect and use your information. By using the App, you agree to that policy.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">5. Intellectual Property</h3>
              <p className="mb-6">
                All intellectual property related to Battleplan—including but not limited to logos, trademarks, designs, software, and features—remain the property of Battleplan and its team. You may not copy, modify, distribute, or create derivative works from our intellectual property without our prior written permission.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">6. Disclaimer of Warranties</h3>
              <p className="mb-6">
                Battleplan is provided "as is" and "as available." We make no guarantees that the App will always be secure, error-free, or uninterrupted. To the fullest extent permitted by law, we disclaim all warranties, express or implied.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">7. Limitation of Liability</h3>
              <p className="mb-6">
                To the fullest extent permitted by law, Battleplan and its team will not be liable for any indirect, incidental, or consequential damages resulting from your use of the App. Your sole remedy for dissatisfaction with the App is to stop using it.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">8. Account Termination</h3>
              <p className="mb-6">
                You may stop using the App at any time. We may suspend or terminate your account at our discretion if you violate these Terms or if we need to protect the App or its users.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">9. Changes to These Terms</h3>
              <p className="mb-6">
                We may update these Terms from time to time. If we make material changes, we will notify you through the App or by email. Your continued use of Battleplan after changes take effect means you accept the revised Terms.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">10. Governing Law</h3>
              <p className="mb-6">
                These Terms will be governed by and interpreted in accordance with the laws of <strong>[Insert Jurisdiction]</strong>, without regard to its conflict of law principles.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">11. Contact Us</h3>
              <p className="mb-3">
                If you have any questions about these Terms, you can contact us at:
              </p>
              <p className="mb-6">
                <strong>bam@mini-myths.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
