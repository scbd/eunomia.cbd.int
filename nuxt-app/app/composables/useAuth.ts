export interface User {
  id: string
  email: string
  name?: string
  roles: string[]
  isAuthenticated: boolean
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const user = ref<User | null>(null)
  
  const login = async () => {
    // Redirect to external accounts service
    const returnUrl = encodeURIComponent(window.location.href)
    await navigateTo(`${config.public.accountsUrl}/signin?returnUrl=${returnUrl}`, {
      external: true
    })
  }
  
  const logout = async () => {
    // Clear user session
    user.value = null
    // Redirect to accounts service logout
    await navigateTo(`${config.public.accountsUrl}/signout`, {
      external: true
    })
  }
  
  const getUser = async (): Promise<User | null> => {
    // Fetch user from API if not already loaded
    if (!user.value) {
      try {
        const { data } = await $fetch<{ success: boolean; user: User }>('/api/auth/user')
        user.value = data
      } catch (error) {
        console.warn('Failed to fetch user:', error)
        user.value = null
      }
    }
    
    return user.value
  }
  
  const hasRole = (role: string): boolean => {
    return user.value?.roles?.includes(role) ?? false
  }
  
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }
  
  // Initialize user on mount (client-side only)
  onMounted(() => {
    getUser()
  })
  
  return {
    user: readonly(user),
    login,
    logout,
    getUser,
    hasRole,
    hasAnyRole
  }
}