'use client'
import { useState } from 'react'
import type { Resource } from '@/types'

interface Props {
  resource: Resource
}

export default function ResourceCard({ resource }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [email, setEmail] = useState('')
  const [domain, setDomain] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function requestVerification() {
    setStatus('sending')
    setErrorMsg('')
    const res = await fetch('/api/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resourceId: resource.id, companyDomain: domain }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('sent')
    } else {
      setStatus('error')
      setErrorMsg(data.error)
    }
  }

  const topicColors: Record<string, string> = {
    'Funding': 'bg-green-100 text-green-800',
    'Start a Business': 'bg-blue-100 text-blue-800',
    'Late Stage Growth': 'bg-purple-100 text-purple-800',
    'Entrepreneurship Communities': 'bg-orange-100 text-orange-800',
    'Marketing and Sales': 'bg-yellow-100 text-yellow-800',
    'Other': 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-[#002654] text-base leading-tight">{resource.title}</h3>
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="text-xs text-gray-400 hover:text-[#C8102E] shrink-0 mt-0.5"
        >
          Edit
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {resource.topics.map(t => (
          <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${topicColors[t] ?? 'bg-gray-100 text-gray-600'}`}>
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <a
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#C8102E] hover:underline"
        >
          Visit →
        </a>
        {resource.email && (
          <a href={`mailto:${resource.email}`} className="text-xs text-gray-400 hover:text-[#002654]">
            {resource.email}
          </a>
        )}
      </div>

      {showEdit && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {status === 'sent' ? (
            <p className="text-sm text-green-700 font-medium">✓ Verification email sent. Check your inbox.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">
                To suggest an update, verify your email matches the company domain.
              </p>
              <input
                type="email"
                placeholder="your@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#C8102E]"
              />
              <input
                type="text"
                placeholder="company.com (domain to verify)"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-[#C8102E]"
              />
              {errorMsg && <p className="text-xs text-[#C8102E] mb-2">{errorMsg}</p>}
              <button
                onClick={requestVerification}
                disabled={status === 'sending' || !email || !domain}
                className="w-full bg-[#002654] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#003580] disabled:opacity-50 transition-colors"
              >
                {status === 'sending' ? 'Sending…' : 'Send Verification Email'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
