<template>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <h1 class="card-title mb-0">Administration Panel</h1>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <h4 class="alert-heading">Migration in Progress</h4>
            <p>This page is being migrated from AngularJS to Vue 3/Nuxt 4. The following features will be available:</p>
            <ul>
              <li>User management and roles</li>
              <li>Room configuration</li>
              <li>System settings</li>
              <li>Type management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Administration - Eunomia'
})
</script>