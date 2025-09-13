<template>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header">
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
          <h1 class="card-title mt-2 mb-0">
            Conference Schedule - {{ route.params.institution }} {{ route.params.code }}
          </h1>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <h4 class="alert-heading">Dynamic Route Migration</h4>
            <p>This page demonstrates the migrated dynamic routing from AngularJS:</p>
            <ul>
              <li><strong>Original Route</strong>: <code>/:institution/:code/schedule</code></li>
              <li><strong>Nuxt 4 Route</strong>: <code>/[institution]/[code]/schedule.vue</code></li>
              <li><strong>Institution</strong>: {{ route.params.institution }}</li>
              <li><strong>Code</strong>: {{ route.params.code }}</li>
            </ul>
          </div>
          
          <!-- Conference schedule content will go here -->
          <div class="row">
            <div class="col-md-8">
              <div class="card">
                <div class="card-header">
                  <h5>Schedule Overview</h5>
                </div>
                <div class="card-body">
                  <p class="text-muted">Conference schedule for {{ route.params.institution }} {{ route.params.code }} will be displayed here.</p>
                  
                  <!-- Example schedule items -->
                  <div class="list-group">
                    <div class="list-group-item">
                      <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Opening Session</h6>
                        <small>09:00 - 10:30</small>
                      </div>
                      <p class="mb-1">Welcome remarks and keynote presentations</p>
                      <small>Room: Main Hall</small>
                    </div>
                    <div class="list-group-item">
                      <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Technical Session 1</h6>
                        <small>11:00 - 12:30</small>
                      </div>
                      <p class="mb-1">Technical presentations and discussions</p>
                      <small>Room: Conference Room A</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-md-4">
              <div class="card">
                <div class="card-header">
                  <h5>Event Information</h5>
                </div>
                <div class="card-body">
                  <dl class="row">
                    <dt class="col-sm-5">Institution:</dt>
                    <dd class="col-sm-7">{{ route.params.institution }}</dd>
                    
                    <dt class="col-sm-5">Event Code:</dt>
                    <dd class="col-sm-7">{{ route.params.code }}</dd>
                    
                    <dt class="col-sm-5">Type:</dt>
                    <dd class="col-sm-7">Conference</dd>
                    
                    <dt class="col-sm-5">Status:</dt>
                    <dd class="col-sm-7">
                      <span class="badge bg-success">Active</span>
                    </dd>
                  </dl>
                </div>
              </div>
              
              <div class="card mt-3">
                <div class="card-header">
                  <h5>Quick Actions</h5>
                </div>
                <div class="card-body">
                  <button class="btn btn-primary w-100 mb-2" disabled>
                    Export Schedule
                  </button>
                  <button class="btn btn-outline-secondary w-100 mb-2" disabled>
                    Print Schedule
                  </button>
                  <NuxtLink 
                    :to="`/reservations?event=${route.params.institution}-${route.params.code}`"
                    class="btn btn-outline-info w-100"
                  >
                    View Reservations
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Validate that required parameters exist
if (!route.params.institution || !route.params.code) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Institution and code parameters are required'
  })
}

useHead({
  title: `${route.params.institution} ${route.params.code} Schedule - Eunomia`,
  meta: [
    { 
      name: 'description', 
      content: `Conference schedule for ${route.params.institution} ${route.params.code}` 
    }
  ]
})

// Set up middleware for authentication if needed
// definePageMeta({
//   middleware: 'auth'
// })
</script>