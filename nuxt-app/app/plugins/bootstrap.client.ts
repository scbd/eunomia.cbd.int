// Bootstrap plugin to load Bootstrap JavaScript on client side
export default defineNuxtPlugin({
  name: 'bootstrap',
  parallel: true,
  async setup() {
    if (process.client) {
      const { default: bootstrap } = await import('bootstrap/dist/js/bootstrap.bundle.min.js')
      
      // Make bootstrap available globally
      return {
        provide: {
          bootstrap
        }
      }
    }
  }
})