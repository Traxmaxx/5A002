'use strict';

app.controller('ChatCtrl', function ($scope, socket, localStorageService) {
    if (!("ontouchstart" in document.documentElement)) {
      $('#message-input').focus();
    }

    $scope.messages_read[$scope.params.recipient] = $scope.messages[$scope.params.recipient].length;

    $scope.sendMessage = function () {
        $("html, body").animate({ scrollTop: $(document).height() }, 300);

        if (!$scope.clients[$scope.params.recipient])
            return;

        var rsaObj = cryptico.generateRSAKey('', $scope.bitLength),
          rsa = rsaObj.parse(localStorageService.load('rsa')),
          msg = {};

        msg.user = $scope.currentUser;
        msg.text = $scope.text;

        socket.emit('send:message', {
            recipient: $scope.params.recipient,
            message: cryptico.encrypt(JSON.stringify(msg),
                                      $scope.clients[$scope.params.recipient].pubkey,
                                      rsa).cipher
        });

        if (!$scope.messages[$scope.params.recipient])
            $scope.messages[$scope.params.recipient] = [];
        $scope.messages[$scope.params.recipient].push({
            user: 'me',
            recipient: $scope.params.recipient,
            text: $scope.text
        });

        console.log('updating read count for ' + $scope.params.recipient + ': ' + $scope.messages[$scope.params.recipient].length);
        $scope.messages_read[$scope.params.recipient] = $scope.messages[$scope.params.recipient].length;

        //$('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
        $('#message-input').val('');
    };

    $scope.$on('event:message_received', function () {
        $scope.messages_read[$scope.params.recipient] = $scope.messages[$scope.params.recipient].length;
    });

});
