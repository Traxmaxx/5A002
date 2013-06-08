'use strict';

angular.module('battlehackChatApp')
  .controller('MainCtrl', function ($scope, socket, localStorageService) {
    $scope.messages = [];
    $scope.currentUser = localStorageService.load('username');

    socket.on('login:reply', function (data) {
        console.log(data);
    });

    socket.on('news', function (data) {
        console.log(data);
    });

    socket.on('send:messagereply', function (data) {
        console.log(data);
    });

    socket.on('recieve:message', function (data) {
        console.log(data);
    });

    socket.on('client:update', function (data) {
        console.log(data);
    });

    $scope.login = function () {
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, '512'));
        localStorageService.save('username', $scope.username);
        $scope.currentUser = $scope.username;

        socket.emit('login', {
            username: localStorageService.load('username'),
            pubkey: cryptico.publicKeyString(localStorageService.load('rsa'))
        });
    }

    $scope.logout = function () {
        localStorageService.destroy('username');
        localStorageService.destroy('rsa');
        $scope.currentUser = null;
    }

    $scope.sendMessage = function () {
        //console.log('yay');
        socket.emit('send:message', {
            user: localStorageService.load('username'),
            message: $scope.message
        });

        // add the message to our model locally
        $scope.messages.push({
          user: $scope.name,
          text: $scope.message
        });

        // clear message box
        $scope.message = '';
    };

  });
