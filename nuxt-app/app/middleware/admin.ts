export default defineNuxtRouteMiddleware((to, from) => {
  const { user, hasAnyRole } = useAuth()
  
  // Check if user is authenticated first
  if (!user.value?.isAuthenticated) {
    const config = useRuntimeConfig()
    const returnUrl = encodeURIComponent(window.location.href)
    
    return navigateTo(`${config.public.accountsUrl}/signin?returnUrl=${returnUrl}`, {
      external: true
    })
  }
  
  // Check if user has admin role
  if (!hasAnyRole(['EunoAdministrator'])) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Denied: Administrator role required'
    })
  }
})