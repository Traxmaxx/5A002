'use strict';

angular.module('battlehackChatApp')
  .controller('MainCtrl', function ($scope, socket) {
    $scope.name = '';
    $scope.message = 'Testmessage';
    $scope.pubkey = 'GJJtQWJw5RfWmPKLzjnu...etc'
    $scope.messages = [];

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
        socket.emit('login', {
            username: $scope.username,
            pubkey: $scope.pubkey
        });
    }

    $scope.sendMessage = function () {
        //console.log('yay');
        socket.emit('send:message', {
            user: $scope.name,
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
