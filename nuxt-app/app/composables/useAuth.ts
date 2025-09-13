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
    window.location.href = `${config.public.accountsUrl}/signin?returnUrl=${returnUrl}`
  }
  
  const logout = async () => {
    // Clear user session
    user.value = null
    // Redirect to accounts service logout
    window.location.href = `${config.public.accountsUrl}/signout`
  }
  
  const getUser = async (): Promise<User | null> => {
    // This would typically fetch from an API endpoint
    // For now, return a mock user or null
    if (!user.value) {
      try {
        // Mock API call - replace with actual implementation
        const { data } = await $fetch<{ user: User }>('/api/auth/user')
        user.value = data
      } catch (error) {
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
  
  // Initialize user on mount
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