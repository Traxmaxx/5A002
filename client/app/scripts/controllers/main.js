'use strict';

angular.module('battlehackChatApp')
  .controller('MainCtrl', function ($scope, socket) {
    $scope.name = 'Alex';
    $scope.messages = [];

    socket.on('init', function (data) {
        console.log('data');
        $scope.name = data.name;
        $scope.users = data.users;
    });

    socket.on('news', function (data) {
        console.log(data);
    });

    $scope.sendMessage = function () {
        console.log('yay');
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
        $scope.message = 'Testmessage';
    };

  });
