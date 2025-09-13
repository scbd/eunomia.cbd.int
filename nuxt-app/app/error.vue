<template>
  <div class="container-fluid mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card border-danger">
          <div class="card-header bg-danger text-white text-center">
            <h1 class="card-title mb-0">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ error.statusCode }}
            </h1>
          </div>
          <div class="card-body text-center">
            <h4 class="card-title">{{ error.statusMessage || 'An error occurred' }}</h4>
            
            <div class="mt-4">
              <p class="text-muted">
                <span v-if="error.statusCode === 404">
                  The page you're looking for doesn't exist.
                </span>
                <span v-else-if="error.statusCode === 403">
                  You don't have permission to access this page.
                </span>
                <span v-else-if="error.statusCode === 500">
                  Something went wrong on our end. Please try again later.
                </span>
                <span v-else>
                  {{ error.message || 'Please try again or contact support if the problem persists.' }}
                </span>
              </p>
            </div>
            
            <div class="mt-4">
              <button 
                @click="clearError" 
                class="btn btn-primary me-2"
              >
                <i class="fas fa-refresh me-2"></i>
                Try Again
              </button>
              <NuxtLink to="/" class="btn btn-outline-secondary">
                <i class="fas fa-home me-2"></i>
                Go Home
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NuxtError {
  statusCode: number
  statusMessage?: string
  message?: string
}

const props = defineProps<{
  error: NuxtError
}>()

useHead({
  title: `${props.error.statusCode} - Eunomia`
})

const clearError = () => {
  clearError()
}
</script>

<style scoped>
.container-fluid {
  min-height: 60vh;
}
</style>