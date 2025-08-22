import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface AboutPageProps {
  onBack: () => void
}

export function AboutPage({ onBack }: AboutPageProps) {
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
        <h1 className="text-4xl font-bold text-title text-center">About this app</h1>
      </div>

      <div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-8">
          <div className="space-y-6 text-base text-text leading-relaxed">
            <p>
              You're using a very, very early version of the Mini Myths app. Our hope is that one day you'll be able to use this app to manage your tabletop wargaming collection, and book a table at nearby gaming store.
            </p>
            <p>
              We're still in very early development, so make sure to let us know if you run into any issues along the way. You can flag issues in the Mini Myths Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}