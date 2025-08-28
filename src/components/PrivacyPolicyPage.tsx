import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface PrivacyPolicyPageProps {
  onBack: () => void
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
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
        <h1 className="text-4xl font-bold text-title text-center">Privacy Policy</h1>
      </div>

      <div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-8">
          <div className="space-y-6 text-base text-text leading-relaxed">
            <div className="prose prose-sm max-w-none">
              <h2 className="text-2xl font-bold text-title mb-4">Privacy Policy for Battleplan</h2>
              <p className="text-sm text-secondary-text mb-6"><em>Last updated: 26/08/2025</em></p>
              
              <p className="mb-6">
                Battleplan ("we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our application ("Battleplan" or "the App").
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">1. Information We Collect</h3>
              <p className="mb-3">
                When you use Battleplan, we may collect the following types of information:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1">
                <li><strong>Personal Information</strong>: such as your email address, username, or any other details you provide when registering.</li>
                <li><strong>Uploaded Content</strong>: including photos, images, text, or other materials you choose to share in the App.</li>
                <li><strong>Usage Information</strong>: data on how you interact with the App (e.g., features you use, device type, and basic analytics).</li>
              </ul>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">2. How We Use Your Information</h3>
              <p className="mb-3">
                We will only use your information to:
              </p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Provide and operate the App.</li>
                <li>Improve features, performance, and user experience.</li>
                <li>Respond to support requests and feedback.</li>
                <li>Communicate with you about updates, changes, or issues related to the App.</li>
              </ul>
              <p className="mb-6">
                We <strong>do not sell your data</strong>. Your information will never be shared with third parties for marketing or advertising purposes.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">3. Data Visibility and Sharing</h3>
              <p className="mb-3">
                Certain information you upload to Battleplan—including <strong>photos, text, and your email address</strong>—may be visible to other Battleplan users. By using the App, you acknowledge and consent to this visibility.
              </p>
              <p className="mb-6">
                We encourage you to consider carefully the information you choose to share.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">4. Data Storage and Security</h3>
              <p className="mb-6">
                We take reasonable measures to protect your data from unauthorized access, alteration, or disclosure. However, no system is completely secure, and we cannot guarantee the absolute security of your information.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">5. Your Rights</h3>
              <p className="mb-3">
                Depending on your location, you may have certain rights regarding your personal information, such as:
              </p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Accessing the data we hold about you.</li>
                <li>Requesting corrections to inaccurate information.</li>
                <li>Requesting deletion of your account and associated data.</li>
              </ul>
              <p className="mb-6">
                To exercise these rights, please contact us at bam@mini-myths.com.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">6. Children's Privacy</h3>
              <p className="mb-6">
                Battleplan is not intended for children under the age of 13 (or the minimum age of digital consent in your region). We do not knowingly collect personal information from children.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">7. Changes to This Policy</h3>
              <p className="mb-6">
                We may update this Privacy Policy from time to time. If we make material changes, we will notify you through the App or by email. Please review this policy periodically.
              </p>

              <hr className="my-6 border-border-custom" />

              <h3 className="text-xl font-semibold text-title mb-3">8. Contact Us</h3>
              <p className="mb-3">
                If you have any questions or concerns about this Privacy Policy, you can reach us at:
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
