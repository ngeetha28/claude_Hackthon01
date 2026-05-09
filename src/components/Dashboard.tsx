'use client'
import { useState, useMemo } from 'react'
import type { FounderProfile, Resource } from '@/types'
import ResourceCard from './ResourceCard'
import ChatAdvisor from './ChatAdvisor'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea Stage', early: 'Early Stage', revenue: 'Revenue Stage',
  scaling: 'Scaling', expanding: 'Expanding',
}

interface Props {
  profile: FounderProfile
  resources: Resource[]
  onReset: () => void
}

export default function Dashboard({ profile, resources, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<'resources' | 'chat'>('resources')
  const [topicFilter, setTopicFilter] = useState<string>('All')
  const [search, setSearch] = useState('')

  const allTopics = useMemo(() => {
    const topics = new Set<string>()
    resources.forEach(r => r.topics.forEach(t => topics.add(t)))
    return ['All', ...Array.from(topics)]
  }, [resources])

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const matchTopic = topicFilter === 'All' || r.topics.includes(topicFilter)
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      return matchTopic && matchSearch
    })
  }, [resources, topicFilter, search])

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Header */}
      <header className="bg-[#002654] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#C8102E] rounded-sm flex items-center justify-center text-xs font-bold">U</div>
              <span className="font-bold text-lg tracking-tight">Utah Founder&apos;s Navigator</span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">Governor&apos;s Office of Economic Opportunity</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{STAGE_LABELS[profile.stage]}</p>
              <p className="text-xs text-blue-200">{profile.industry} · {profile.county} County</p>
            </div>
            <button onClick={onReset} className="text-xs text-blue-300 hover:text-white border border-blue-400 hover:border-white px-3 py-1.5 rounded-lg transition-colors">
              Start Over
            </button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-[#C8102E] text-white px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-sm">
          <span className="font-bold">{resources.length} resources matched</span>
          <span className="opacity-80">·</span>
          <span className="opacity-80">Personalized for your profile</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit mb-6">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'resources' ? 'bg-[#002654] text-white' : 'text-gray-600 hover:text-[#002654]'}`}
          >
            Resources ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'chat' ? 'bg-[#002654] text-white' : 'text-gray-600 hover:text-[#002654]'}`}
          >
            AI Advisor
          </button>
        </div>

        {activeTab === 'resources' && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search resources…"
                className="border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8102E] flex-1"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allTopics.map(t => (
                  <button
                    key={t}
                    onClick={() => setTopicFilter(t)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      topicFilter === t
                        ? 'bg-[#C8102E] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C8102E]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No resources match your filters.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
            <ChatAdvisor profile={profile} filteredIds={resources.map(r => r.id)} />
          </div>
        )}
      </div>
    </div>
  )
}
