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
        scbdMenuService.menus.mainMenu.push({
          name: 'Dashbord',
          type: 'link',
          faIcon: 'fa-th',
          path: '/',
  //            roles:['Administrator','IndeAdministrator'],
        });
        scbdMenuService.menus.mainMenu.push({
          name: 'Schedule',
          type: 'link',
          faIcon: 'fa-calendar',
          path: '/schedule/day',
  //            roles:['Administrator','IndeAdministrator'],
        });

        scbdMenuService.menus.mainMenu.push({
          name: 'Side Events',
          type: 'link',
          faIcon: 'fa-calendar-o',
          path: '/side-events',
  //            roles:['Administrator','IndeAdministrator'],
        });


        scbdMenuService.menus.mainMenu.push({
              name: 'Admin',
              type: 'toggle',
              open:0,
              faIcon: 'fa-gears',
              roles:['Administrator','IndeAdministrator'],
              pages: [
                {
                  name: 'Locations',
                  type: 'link',
                  path: '',
              //    mdIcon: 'all_inclusive',
                  roles:['Administrator','IndeAdministrator'],
                },
                {
                  name: 'Rooms',
                  type: 'link',
                  path: '',
              //    mdIcon: 'all_inclusive',
                  roles:['Administrator','IndeAdministrator'],
                },
                {
                  name: 'Meeting Types',
                  type: 'link',
                  path: '',
              //    mdIcon: 'all_inclusive',
                  roles:['Administrator','IndeAdministrator'],
                },
                {
                  name: 'Meeting Groupes',
                  type: 'link',
                  path: '',
              //    mdIcon: 'all_inclusive',
                  roles:['Administrator','IndeAdministrator'],
                },

          ]});
          scbdMenuService.validateMenus();// minds color classes and animation ect
        return scbdMenuService;
  }]);
});