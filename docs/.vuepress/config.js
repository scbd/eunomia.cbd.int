const path = require('path')
module.exports = {
  base:'/eunomia.cbd.int/',
  title: 'Eunomia',
  description: 'Room reservation and manegment system.',
  themeConfig: {
    repo: 'scbd/eunomia.cbd.int',
    editLinks: true,
    docsDir: 'docs',
    docsBranch: 'master',
    lastUpdated: 'Last Updated', // string | boolean
    nav: [
      { text: 'Schedule',         link: '/schedule/' },
      { text: 'Reservations',     link: '/reservations/' },
      { text: 'Side-events',      link: '/side-events/' },
      { text: 'CCTV',             link: '/cctv/' },
      { text: 'Administration',   link: '/administration/' }
    ],
    locales: {
      '/': {
        label:        'English',
        selectText:   'Languages',
        editLinkText: 'Edit this page on GitHub',
        lastUpdated:  'Last Updated',
        title:        'Eunomia Documentation',
        description:  'Eunomia Documentation'
      }
    }
  }
}
