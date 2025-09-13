<template>
  <div>
    <!-- Navigation Header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <NuxtLink class="navbar-brand" to="/">
          <strong>Eunomia</strong>
        </NuxtLink>
        
        <button 
          class="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/reservations">Reservations</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/side-events">Side Events</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/schedule">Schedule</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/cctv">CCTV</NuxtLink>
            </li>
            <li class="nav-item">
              <NuxtLink class="nav-link" to="/admin">Administration</NuxtLink>
            </li>
          </ul>
          
          <div class="navbar-nav">
            <div v-if="user" class="nav-item dropdown">
              <a 
                class="nav-link dropdown-toggle" 
                href="#" 
                id="userDropdown" 
                role="button" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {{ user.name || user.email }}
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" @click="logout">Logout</a></li>
              </ul>
            </div>
            <div v-else class="nav-item">
              <a class="nav-link" href="#" @click="login">Login</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Main Content -->
    <main class="container-fluid mt-3">
      <slot />
    </main>
    
    <!-- Toast Container -->
    <div id="toast-container" class="toast-container position-fixed top-0 end-0 p-3">
      <!-- Toasts will be dynamically added here -->
    </div>
  </div>
</template>

<script setup lang="ts">
// Authentication composable
const { user, login, logout } = useAuth()

// Initialize authentication on client side
onMounted(async () => {
  // The useAuth composable will handle user loading
})
</script>

<style>
/* Custom styles can be added here */
.navbar-brand {
  font-weight: 600;
}
</style>