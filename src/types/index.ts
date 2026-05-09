export type Stage = 'idea' | 'early' | 'revenue' | 'scaling' | 'expanding'
export type Community = 'none' | 'veteran' | 'women' | 'student' | 'rural'
export type Industry =
  | 'Agriculture'
  | 'Aerospace and Defense'
  | 'Arts and Entertainment and Recreation'
  | 'Consumer Packaged Goods'
  | 'Financial Services'
  | 'Hospitality and Food Services'
  | 'Life Sciences and Healthcare'
  | 'Manufacturing'
  | 'Software and Information Technology'
  | 'Other'

export interface FounderProfile {
  stage: Stage
  industry: Industry
  county: string
  community: Community
}

export interface Resource {
  id: string
  title: string
  description: string
  communities: string[]
  industries: string[]
  locations: string[]
  topics: string[]
  link: string
  email: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
