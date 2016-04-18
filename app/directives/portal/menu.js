define(['app',  '../side-menu/scbd-side-menu'], function (app) {

app.factory("mainMenu", ['scbdMenuService', function(scbdMenuService) {


        //var extended = angular.extend(scbdMenuService, {});
        //console.log(extended);
        scbdMenuService.menus.mainMenu= [];
        scbdMenuService.menus.mainMenu.push({
          type: 'config',
          menuClass:'main-menu',
          colorClass: 'main-menu-color',
          activeClass: 'main-menu-active',
          iconClass: 'pulse',
          selfMenu: scbdMenuService.menus.mainMenu,// needed shouls be added programatically in parent service
          childrenColorClass: 'main-menu-children-color',
          childrenActiveClass: 'main-menu-children-active'
        });
  //       scbdMenuService.menus.mainMenu.push({
  //         name: 'Dashbord',
  //         type: 'link',
  //         faIcon: 'fa-th',
  //         path: '/',
  // //            roles:['Administrator','EunoAdministrator'],
  //       });

        scbdMenuService.menus.mainMenu.push({
              name: 'Schedule',
              type: 'toggle',
              open:0,
              faIcon: 'fa-calendar',
              roles:['Administrator'],
              pages: [
                {
                  name: 'Location Schedule',
                  type: 'link',
                  faIcon: 'fa-map-marker',
                  path: '/schedule/day',
                  roles:['Administrator','EunoAdministrator'],
                },
                {
                  name: 'Conference Schedule',
                  type: 'link',
                  faIcon: 'fa-users',
                  path: '/schedule/conference',
                  roles:['Administrator','EunoAdministrator'],
                }
              ]
              });




        scbdMenuService.menus.mainMenu.push({
          name: 'Side Events',
          type: 'link',
          faIcon: 'fa-calendar-o',
          path: '/side-events',
              roles:['Administrator','EunoAdministrator'],
        });
        //
        scbdMenuService.menus.mainMenu.push({
              name: 'CCTV',
              type: 'toggle',
              open:0,
              faIcon: 'fa-cc',
              roles:['Administrator'],
              pages: [

                {
                  name: 'Feeds',
                  type: 'link',
                  path: '/events/56ab766f2f4ad2ad1b885444/cctv/feeds',
              //    mdIcon: 'all_inclusive',
                  roles:['Administrator'],
                },
                {
                  name: 'Frames',
                  type: 'link',
                  path: '/events/56ab766f2f4ad2ad1b885444/cctv/frames',
              //    mdIcon: 'all_inclusive',
                  roles:['Administrator'],
                }]
              });
        //
        scbdMenuService.menus.mainMenu.push({
              name: 'Admin',
              type: 'toggle',
              open:0,
              faIcon: 'fa-gears',
              roles:['Administrator','EunoAdministrator'],
              pages: [

        //         {
        //           name: 'Locations',
        //           type: 'link',
        //           path: '',
        //       //    mdIcon: 'all_inclusive',
        //           roles:['Administrator','EunoAdministrator'],
        //         },
        //         {
        //           name: 'Rooms',
        //           type: 'link',
        //           path: '',
        //       //    mdIcon: 'all_inclusive',
        //           roles:['Administrator','EunoAdministrator'],
        //         },
        //         {
        //           name: 'Resources',
        //           type: 'link',
        //           path: '',
        //       //    mdIcon: 'all_inclusive',
        //           roles:['Administrator','EunoAdministrator'],
        //         },
        //         {
        //           name: 'Conferences',
        //           type: 'link',
        //           path: '',
        //       //    mdIcon: 'all_inclusive',
        //           roles:['Administrator','EunoAdministrator'],
        //         },
                 {
                  name: 'Reservation Types',
                  type: 'link',
                  path: '/admin/reservation/types',
                  faIcon: 'fa-cubes',
                  roles:['Administrator','EunoAdministrator'],
                },
        //         {
        //           name: 'Meeting Groupes',
        //           type: 'link',
        //           path: '',
        //       //    mdIcon: 'all_inclusive',
        //           roles:['Administrator','EunoAdministrator'],
        //         },
        //
          ]});
          scbdMenuService.validateMenus();// minds color classes and animation ect
        return scbdMenuService;
  }]);
});
