'use strict';

var app = angular.module('battlehackChatApp', ['ngResource', 'local-storage'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/chat/:recipient', {
        templateUrl: 'views/chat.html',
        controller: 'ChatCtrl'
      })
      .when('/users', {
        templateUrl: 'views/users.html',
        controller: 'UsersCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'SessionCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function ($rootScope, localStorageService, socket, $location, $routeParams) {
      $rootScope.currentUser = localStorageService.load('username');
      $rootScope.bitLength = 512;
      $rootScope.messages = [];
      $rootScope.clients = {};
      $rootScope.params = $routeParams;

      $rootScope.connectSocket = function () {
          socket.emit('login', {
              username: localStorageService.load('username'),
              pubkey: cryptico.publicKeyString(localStorageService.load('rsa'))
          });
      };

      $rootScope.logout = function () {
        localStorageService.destroy('username');
        localStorageService.destroy('rsa');
        $rootScope.currentUser = null;
        socket.emit('logout', 'do it now!');
      };

      //Connect on load if already loggedin
      if ($rootScope.currentUser) {
        $rootScope.connectSocket();
      } else {
        $location.path('/login');
      }

      $rootScope.$on('event:auth-successful', function () {
        $rootScope.currentUser = localStorageService.load('username');
        $rootScope.connectSocket();
      });

      socket.on('client:update', function (data) {
        // First we check if a user has logged in/out or changed its key
        for (var key in $rootScope.clients) {
          if (!(key in data.clientlist)) {
            $rootScope.messages.push({
              user: key,
              text: 'user logged out'
            });
            console.log(key + ' logged out');
          } else if ($rootScope.clients[key].pubkey != data.clientlist[key].pubkey) {
            $rootScope.messages.push({
              user: key,
              text: 'user changed key from ' +
                  cryptico.publicKeyID($rootScope.clients[key].pubkey) +
                  ' to '
                  + cryptico.publicKeyID(data.clientlist[key].pubkey)
            });
          }
        }
        for (var key in data.clientlist) {
          if (!(key in $rootScope.clients)) {
            $rootScope.messages.push({
              user: key,
              text: 'user logged in with ' +
                  cryptico.publicKeyID(data.clientlist[key].pubkey)
            });
            console.log(key + ' logged in');
          }
        }

        $rootScope.clients = data.clientlist;
      });

      socket.on('login:reply', function (data) {
        $rootScope.clients = data.clientlist;
      });
  });

app.factory('socket', function ($rootScope) {
  var socket = io.connect('battlehack.nilsson.io:80');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
