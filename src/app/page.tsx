'use client'
import { useState } from 'react'
import Quiz from '@/components/Quiz'
import Dashboard from '@/components/Dashboard'
import { filterResources } from '@/lib/filterResources'
import type { FounderProfile, Resource } from '@/types'

export default function Home() {
  const [profile, setProfile] = useState<FounderProfile | null>(null)
  const [resources, setResources] = useState<Resource[]>([])

  function handleQuizComplete(p: FounderProfile) {
    setProfile(p)
    setResources(filterResources(p))
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#F2F2F2]">
        <header className="bg-[#002654] text-white px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <div className="w-6 h-6 bg-[#C8102E] rounded-sm flex items-center justify-center text-xs font-bold">U</div>
            <span className="font-bold text-lg tracking-tight">Utah Founder&apos;s Navigator</span>
          </div>
        </header>
        <div className="max-w-6xl mx-auto">
          <div className="text-center pt-12 pb-4 px-4">
            <h1 className="text-4xl font-bold text-[#002654] mb-3">
              Find the right resources.<br />
              <span className="text-[#C8102E]">In under 2 minutes.</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Answer 4 quick questions and we&apos;ll match you with the Utah state resources that fit your business — not every founder&apos;s.
            </p>
          </div>
          <Quiz onComplete={handleQuizComplete} />
        </div>
      </main>
    )
  }

  return (
    <Dashboard
      profile={profile}
      resources={resources}
      onReset={() => setProfile(null)}
    />
  )
}
