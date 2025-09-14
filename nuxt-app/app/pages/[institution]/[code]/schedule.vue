<template>
  <div class="container-fluid">
    <!-- Loading state -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center" style="height: 50vh;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading conference...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      <h4 class="alert-heading">Error Loading Conference</h4>
      <p>{{ error }}</p>
      <button class="btn btn-outline-danger" @click="refreshConference">
        Try Again
      </button>
    </div>

    <!-- Main content -->
    <div v-else class="row">
      <div class="col-12">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item">
                <NuxtLink to="/">Home</NuxtLink>
              </li>
              <li class="breadcrumb-item">
                <NuxtLink to="/schedule">Schedule</NuxtLink>
              </li>
              <li class="breadcrumb-item active" aria-current="page">
                {{ route.params.institution }} / {{ route.params.code }}
              </li>
            </ol>
          </nav>
          
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" @click="refreshConference">
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h2 mb-0">
            Conference Schedule - {{ conference?.name || `${route.params.institution} ${route.params.code}` }}
          </h1>
          <div v-if="conference" class="d-flex align-items-center gap-2">
            <span 
              class="badge" 
              :class="{
                'bg-success': conference.status === 'active',
                'bg-warning': conference.status === 'draft',
                'bg-secondary': conference.status === 'inactive'
              }"
            >
              {{ conference.status }}
            </span>
          </div>
        </div>

        <!-- Conference Schedule Component -->
        <div class="schedule-wrapper">
          <ConferenceSchedule 
            v-if="conference"
            :conference="conference" 
            :search="searchQuery"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ConferenceSchedule from '~/components/schedule/ConferenceSchedule.vue'

const route = useRoute()

// Validate that required parameters exist
if (!route.params.institution || !route.params.code) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Institution and code parameters are required'
  })
}

// Use the composable within the component setup
const { loadConference, currentConference, isLoading, error } = useConference()

// Reactive state
const searchQuery = ref('')
const conference = currentConference

// Load conference data
const refreshConference = async () => {
  await loadConference(
    route.params.institution as string, 
    route.params.code as string
  )
}

// Initialize page on mount
onMounted(async () => {
  await refreshConference()
})

// Set up SEO
useHead({
  title: computed(() => {
    if (conference.value) {
      return `${conference.value.name} Schedule - Eunomia`
    }
    return `${route.params.institution} ${route.params.code} Schedule - Eunomia`
  }),
  meta: [
    { 
      name: 'description', 
      content: computed(() => {
        if (conference.value) {
          return `Conference schedule for ${conference.value.name}`
        }
        return `Conference schedule for ${route.params.institution} ${route.params.code}`
      })
    }
  ]
})

// Set up middleware for authentication if needed
// definePageMeta({
//   middleware: ['auth']
// })
</script>

<style scoped>
.schedule-wrapper {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  overflow: hidden;
  min-height: 600px;
}

.container-fluid {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .container-fluid {
    padding: 1rem;
  }
  
  .schedule-wrapper {
    margin: -1rem;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>