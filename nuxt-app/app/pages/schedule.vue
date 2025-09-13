<template>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <h1 class="card-title mb-0">Conference Schedule</h1>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <h4 class="alert-heading">Migration in Progress</h4>
            <p>This page is being migrated from AngularJS to Vue 3/Nuxt 4. The following features will be available:</p>
            <ul>
              <li>Conference schedule management</li>
              <li>Session timing and room assignments</li>
              <li>Speaker and participant management</li>
              <li>Real-time schedule updates</li>
            </ul>
          </div>
          
          <!-- Placeholder content -->
          <div class="row">
            <div class="col-md-9">
              <div class="card">
                <div class="card-header">
                  <h5>Schedule Overview</h5>
                </div>
                <div class="card-body">
                  <p class="text-muted">Schedule calendar will be displayed here.</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-header">
                  <h5>Filters</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label">Event Group</label>
                    <select class="form-select" disabled>
                      <option>Select event...</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Date Range</label>
                    <input type="date" class="form-control" disabled>
                  </div>
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
useHead({
  title: 'Schedule - Eunomia'
})
</script>