import type { Ref } from 'vue'

export interface Conference {
  id: string
  institution: string
  code: string
  name: string
  timezone?: string
  startDate?: string
  endDate?: string
  status?: 'active' | 'inactive' | 'draft'
}

export interface ConferenceStore {
  conferences: Ref<Conference[]>
  currentConference: Ref<Conference | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
}

export const useConference = (): ConferenceStore & {
  loadConference: (institution: string, code: string) => Promise<Conference | null>
  loadConferences: () => Promise<Conference[]>
  getCurrentConference: () => Conference | null
} => {
  const conferences = ref<Conference[]>([])
  const currentConference = ref<Conference | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadConference = async (institution: string, code: string): Promise<Conference | null> => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/conferences/${institution}/${code}`)
      
      if (response.success && response.data) {
        const conference = response.data
        currentConference.value = conference
        
        // Add to conferences list if not already present
        const existingIndex = conferences.value.findIndex(c => c.id === conference.id)
        if (existingIndex >= 0) {
          conferences.value[existingIndex] = conference
        } else {
          conferences.value.push(conference)
        }
        
        return conference
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load conference'
      console.error('Conference loading error:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const loadConferences = async (): Promise<Conference[]> => {
    isLoading.value = true
    error.value = null
    
    try {
      // In real implementation, this would be an API call
      // const response = await $fetch('/api/conferences')
      
      // Sample data for development
      const conferenceList: Conference[] = [
        {
          id: 'cbd-cop15',
          institution: 'CBD',
          code: 'COP15',
          name: 'CBD COP15',
          timezone: 'America/New_York',
          startDate: '2024-01-15',
          endDate: '2024-01-17',
          status: 'active'
        },
        {
          id: 'unfccc-cop28',
          institution: 'UNFCCC',
          code: 'COP28',
          name: 'UNFCCC COP28',
          timezone: 'Asia/Dubai',
          startDate: '2024-02-01',
          endDate: '2024-02-03',
          status: 'active'
        }
      ]
      
      conferences.value = conferenceList
      return conferenceList
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load conferences'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const getCurrentConference = (): Conference | null => {
    return currentConference.value
  }

  return {
    conferences,
    currentConference,
    isLoading,
    error,
    loadConference,
    loadConferences,
    getCurrentConference
  }
}