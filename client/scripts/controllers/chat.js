'use strict';

app.controller('ChatCtrl', function ($scope, socket, localStorageService) {
    if (!("ontouchstart" in document.documentElement)) {
      $('#message-input').focus();
    }

    $scope.sendMessage = function () {
        var rsaObj = cryptico.generateRSAKey('', $scope.bitLength),
          rsa = rsaObj.parse(localStorageService.load('rsa')),
          msg = {};

        msg.user = $scope.currentUser;
        msg.text = $scope.text;

        socket.emit('send:message', {
            recipient: $scope.params.recipient,
            message: cryptico.encrypt(JSON.stringify(msg), $scope.clients[$scope.params.recipient].pubkey, rsa).cipher
        });

        if (!$scope.messages[$scope.params.recipient])
            $scope.messages[$scope.params.recipient] = [];
        $scope.messages[$scope.params.recipient].push({
            user: 'me',
            recipient: $scope.params.recipient,
            text: $scope.text
        });

        //$('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
        $('#message-input').val('');
    };
});
