'use client'
import { useState } from 'react'
import type { FounderProfile, Stage, Industry, Community } from '@/types'

const UTAH_COUNTIES = [
  'Beaver','Box Elder','Cache','Carbon','Daggett','Davis','Duchesne','Emery',
  'Garfield','Grand','Iron','Juab','Kane','Millard','Morgan','Piute','Rich',
  'Salt Lake','San Juan','Sanpete','Sevier','Summit','Tooele','Uintah',
  'Utah','Wasatch','Washington','Wayne','Weber',
]

const STAGES: { value: Stage; label: string; sub: string }[] = [
  { value: 'idea', label: 'Idea Stage', sub: 'Validating and exploring' },
  { value: 'early', label: 'Early Stage', sub: 'Building, pre-revenue' },
  { value: 'revenue', label: 'Revenue Stage', sub: 'Generating sales, growing' },
  { value: 'scaling', label: 'Scaling', sub: 'Expanding team & market' },
  { value: 'expanding', label: 'Expanding', sub: 'Going national / international' },
]

const INDUSTRIES: Industry[] = [
  'Agriculture','Aerospace and Defense','Arts and Entertainment and Recreation',
  'Consumer Packaged Goods','Financial Services','Hospitality and Food Services',
  'Life Sciences and Healthcare','Manufacturing','Software and Information Technology','Other',
]

const COMMUNITIES: { value: Community; label: string }[] = [
  { value: 'none', label: 'None / General' },
  { value: 'veteran', label: 'Veteran-Owned' },
  { value: 'women', label: 'Woman-Owned' },
  { value: 'student', label: 'Student Entrepreneur' },
  { value: 'rural', label: 'Rural Business' },
]

interface Props {
  onComplete: (profile: FounderProfile) => void
}

export default function Quiz({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<Partial<FounderProfile>>({})

  function set<K extends keyof FounderProfile>(key: K, value: FounderProfile[K]) {
    const updated = { ...profile, [key]: value }
    setProfile(updated)
    if (step < 3) {
      setStep(step + 1)
    } else {
      onComplete(updated as FounderProfile)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2,3].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#C8102E] w-12' : 'bg-gray-300 w-8'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 font-medium">Step {step + 1} of 4</p>
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#002654] mb-2">What stage is your business?</h2>
            <p className="text-gray-500 mb-6">We&apos;ll match you with the most relevant resources.</p>
            <div className="space-y-3">
              {STAGES.map(s => (
                <button
                  key={s.value}
                  onClick={() => set('stage', s.value)}
                  className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-[#C8102E] hover:bg-red-50 transition-all group"
                >
                  <div className="font-semibold text-[#002654] group-hover:text-[#C8102E] whitespace-nowrap">{s.label}</div>
                  <div className="text-sm text-gray-500">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-[#002654] mb-2">What industry are you in?</h2>
            <p className="text-gray-500 mb-6">Choose the closest match.</p>
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => set('industry', ind)}
                  className="text-left px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-[#C8102E] hover:bg-red-50 transition-all text-sm font-medium text-[#002654] hover:text-[#C8102E]"
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-[#002654] mb-2">Which county are you in?</h2>
            <p className="text-gray-500 mb-6">Resources vary by location across Utah.</p>
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {UTAH_COUNTIES.map(c => (
                <button
                  key={c}
                  onClick={() => set('county', c)}
                  className="text-left px-3 py-2.5 rounded-lg border-2 border-gray-200 hover:border-[#C8102E] hover:bg-red-50 transition-all text-sm font-medium text-[#002654] hover:text-[#C8102E]"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-[#002654] mb-2">Do you belong to any of these communities?</h2>
            <p className="text-gray-500 mb-6">Some resources are specifically designed for these groups.</p>
            <div className="space-y-3">
              {COMMUNITIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => set('community', c.value)}
                  className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-[#C8102E] hover:bg-red-50 transition-all font-semibold text-[#002654] hover:text-[#C8102E]"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
