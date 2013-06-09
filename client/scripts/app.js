'use strict';

if (!("ontouchstart" in document.documentElement)) {
  document.documentElement.className += " no-touch";
}

(function (window, angular) {
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

var app = angular.module('battlehackChatApp', ['local-storage'])
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
        redirectTo: '/users'
      });
  })
  .run(function ($rootScope, localStorageService, socket, $location, $routeParams) {
      $rootScope.currentUser = localStorageService.load('username');
      $rootScope.bitLength = 512;
      $rootScope.messages = {}; // per-sender message queue
      $rootScope.messages_read = {}; // per-sender number of read messages
      $rootScope.clients = {}; // hash table with peers
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
        $location.path('/users');
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
          if (!$rootScope.messages[key])
            $rootScope.messages[key] = [];
          if (!(key in data.clientlist)) {
            $rootScope.messages[key].push({
              user: key,
              text: 'user logged out'
            });
            console.log(key + ' logged out');
          } else if ($rootScope.clients[key].pubkey != data.clientlist[key].pubkey) {
            $rootScope.messages[key].push({
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
            if (!$rootScope.messages[key])
              $rootScope.messages[key] = [];
            $rootScope.messages[key].push({
              user: key,
              text: 'user logged in with ' +
                  cryptico.publicKeyID(data.clientlist[key].pubkey)
            });
            console.log(key + ' logged in');
            $rootScope.messages_read[key] = $rootScope.messages[key].length;
          }
        }

        delete data.clientlist[$rootScope.currentUser];
        $rootScope.clients = data.clientlist;
      });

      socket.on('login:reply', function (data) {
        delete data.clientlist[$rootScope.currentUser];
        $rootScope.clients = data.clientlist;
      });

      socket.on('send:messagereply', function (data) {
        console.log(data);
      });

      socket.on('recieve:message', function (data) {
        var rsaObj = cryptico.generateRSAKey('', $rootScope.bitLength),
            rsa = rsaObj.parse(localStorageService.load('rsa'));

        var decryptedtext = cryptico.decrypt(data.message, rsa);
        var msg = JSON.parse(decryptedtext.plaintext)
        var plaintext = msg.text;
        if (msg.user != data.sender) {
          $rootScope.messages[msg.user].push({
            user: msg.user + ' - server told it\'s ' + data.sender,
            text: plaintext
          });
          $rootScope.$broadcast('event:message_received');
          return;
        }

        if ($rootScope.clients[data.sender]) {
          if ($rootScope.clients[data.sender].pubkey !== decryptedtext.publicKeyString) {
            $rootScope.messages[data.sender].push({
              user: data.sender + ' - invalid signature ' +
                  '(verification failed)!',
              text: plaintext
            });
            $rootScope.$broadcast('event:message_received');
            return;
          } else {
            $rootScope.messages[data.sender].push({
              user: data.sender +
                  '[' +
                  cryptico.publicKeyID($rootScope.clients[data.sender].pubkey) +
                  ']',
              recipient: $rootScope.currentUser,
              text: plaintext
            });
            $rootScope.$broadcast('event:message_received');
            return;
          }
        }

        $rootScope.messages[data.sender].push({
          user: 'invalid sender (' + data.sender + ' is not in our list)!',
          text: plaintext
        });
        $rootScope.$broadcast('event:message_received');

        //$('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
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

app.filter('urlify', function() {
  return function(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
      return '<a href="' + url + '">' + url + '</a>';
    })
  };
});
