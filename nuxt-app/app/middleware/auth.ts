export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth()
  
  // If user is not authenticated, redirect to login
  if (!user.value?.isAuthenticated) {
    const config = useRuntimeConfig()
    const returnUrl = encodeURIComponent(window.location.href)
    
    // Navigate to external accounts service
    return navigateTo(`${config.public.accountsUrl}/signin?returnUrl=${returnUrl}`, {
      external: true
    })
  }
})