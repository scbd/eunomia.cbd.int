<template>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <h1 class="card-title mb-0">Eunomia - Room Scheduling System</h1>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4 mb-4">
              <div class="card border-primary">
                <div class="card-header bg-primary text-white">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-calendar-alt me-2"></i>
                    Room Reservations
                  </h5>
                </div>
                <div class="card-body">
                  <p class="card-text">Manage and view room bookings for conferences and meetings.</p>
                  <NuxtLink to="/reservations" class="btn btn-primary">
                    View Reservations
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <div class="col-md-4 mb-4">
              <div class="card border-success">
                <div class="card-header bg-success text-white">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-calendar-check me-2"></i>
                    Schedule
                  </h5>
                </div>
                <div class="card-body">
                  <p class="card-text">View conference schedules and manage event timing.</p>
                  <NuxtLink to="/schedule" class="btn btn-success">
                    View Schedule
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <div class="col-md-4 mb-4">
              <div class="card border-info">
                <div class="card-header bg-info text-white">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-users me-2"></i>
                    Side Events
                  </h5>
                </div>
                <div class="card-body">
                  <p class="card-text">Organize and manage side events and special sessions.</p>
                  <NuxtLink to="/side-events" class="btn btn-info">
                    Manage Events
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6 mb-4">
              <div class="card border-warning">
                <div class="card-header bg-warning text-dark">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-video me-2"></i>
                    CCTV Management
                  </h5>
                </div>
                <div class="card-body">
                  <p class="card-text">Monitor camera feeds and manage video surveillance.</p>
                  <NuxtLink to="/cctv" class="btn btn-warning">
                    CCTV Dashboard
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 mb-4">
              <div class="card border-danger">
                <div class="card-header bg-danger text-white">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-cog me-2"></i>
                    Administration
                  </h5>
                </div>
                <div class="card-body">
                  <p class="card-text">System administration and user management.</p>
                  <NuxtLink to="/admin" class="btn btn-danger">
                    Admin Panel
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
// Set page metadata
useHead({
  title: 'Eunomia - Room Scheduling System',
  meta: [
    { 
      name: 'description', 
      content: 'Room reservation and management system for conferences and meetings' 
    }
  ]
})
</script>