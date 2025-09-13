// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  css: [
    'bootstrap/dist/css/bootstrap.min.css'
  ],
  
  plugins: [
    '~/plugins/bootstrap.client.ts'
  ],
  
  app: {
    head: {
      title: 'Eunomia - Room Scheduling',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Room reservation and management system' }
      ]
    }
  },
  
  runtimeConfig: {
    public: {
      accountsUrl: process.env.ACCOUNTS_URL || 'https://accounts.cbd.int',
      apiUrl: process.env.API_URL || '/api'
    }
  }
})
