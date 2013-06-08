(function (window, angular) {
  'use strict';

  angular.module('local-storage', [])
    .service('localStorageService', function () {
      return {
        save: function (key, val) {
          localStorage.setItem(key, JSON.stringify(val));
        },
        load: function (key) {
          var retrieved = localStorage.getItem(key);
          try {
            return JSON.parse(retrieved);
          } catch (e) {
            return retrieved;
          }
        },
        destroy: function (key) {
          localStorage.removeItem(key);
        }
      };
    });
})(window, window.angular);