import resources from '@/data/resources.json'
import type { FounderProfile, Resource } from '@/types'

const STAGE_TOPIC_MAP: Record<string, string[]> = {
  idea: ['Start a Business', 'Funding'],
  early: ['Start a Business', 'Entrepreneurship Communities', 'Funding'],
  revenue: ['Funding', 'Marketing and Sales', 'Entrepreneurship Communities'],
  scaling: ['Late Stage Growth', 'Funding', 'Marketing and Sales'],
  expanding: ['Late Stage Growth'],
}

const COMMUNITY_MAP: Record<string, string> = {
  veteran: 'Veteran',
  women: 'Women',
  student: 'Student',
  rural: 'Rural',
  none: '',
}

export function filterResources(profile: FounderProfile): Resource[] {
  const targetTopics = STAGE_TOPIC_MAP[profile.stage] ?? []
  const targetCommunity = COMMUNITY_MAP[profile.community]

  return (resources as Resource[]).filter((r) => {
    const locationMatch =
      r.locations.includes('All counties') || r.locations.includes(profile.county)
    const industryMatch =
      r.industries.includes('All industries') || r.industries.includes(profile.industry)
    const topicMatch = r.topics.some((t) => targetTopics.includes(t))
    const communityMatch =
      !targetCommunity ||
      r.communities.length === 0 ||
      r.communities.includes(targetCommunity) ||
      r.communities.includes('Multiple communities') ||
      r.communities.includes('Any')

    return locationMatch && industryMatch && topicMatch && communityMatch
  })
}

export function getAllResources(): Resource[] {
  return resources as Resource[]
}
