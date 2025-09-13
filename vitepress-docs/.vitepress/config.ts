import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Eunomia Documentation',
  description: 'Room reservation and management system documentation',
  base: '/eunomia.cbd.int/',
  
  themeConfig: {
    repo: 'scbd/eunomia.cbd.int',
    editLinks: true,
    docsDir: 'vitepress-docs/docs',
    docsBranch: 'main',
    lastUpdated: 'Last Updated',
    
    nav: [
      { text: 'Schedule', link: '/schedule/' },
      { text: 'Reservations', link: '/reservations/' },
      { text: 'Side-events', link: '/side-events/' },
      { text: 'CCTV', link: '/cctv/' },
      { text: 'Administration', link: '/administration/' }
    ],
    
    sidebar: {
      '/schedule/': [
        {
          text: 'Schedule Management',
          items: [
            { text: 'Overview', link: '/schedule/' },
            { text: 'Conference Scheduling', link: '/schedule/conference' },
            { text: 'Side Events', link: '/schedule/side-events' }
          ]
        }
      ],
      '/reservations/': [
        {
          text: 'Reservations',
          items: [
            { text: 'Overview', link: '/reservations/' },
            { text: 'Room Booking', link: '/reservations/rooms' },
            { text: 'Audio/Video Equipment', link: '/reservations/av-equipment' }
          ]
        }
      ],
      '/side-events/': [
        {
          text: 'Side Events',
          items: [
            { text: 'Overview', link: '/side-events/' },
            { text: 'Event Management', link: '/side-events/management' },
            { text: 'Registration', link: '/side-events/registration' }
          ]
        }
      ],
      '/cctv/': [
        {
          text: 'CCTV System',
          items: [
            { text: 'Overview', link: '/cctv/' },
            { text: 'Camera Feeds', link: '/cctv/feeds' },
            { text: 'Frame Management', link: '/cctv/frames' }
          ]
        }
      ],
      '/administration/': [
        {
          text: 'Administration',
          items: [
            { text: 'Overview', link: '/administration/' },
            { text: 'User Management', link: '/administration/users' },
            { text: 'System Configuration', link: '/administration/config' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/scbd/eunomia.cbd.int' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023 Secretariat of the Convention on Biological Diversity (SCBD)'
    }
  }
})