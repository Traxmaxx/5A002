'use strict';

app.controller('ChatCtrl', function ($scope, socket, localStorageService) {
    if (!("ontouchstart" in document.documentElement)) {
      $('#message-input').focus();
    }

    $scope.messages_read[$scope.params.recipient] = $scope.messages[$scope.params.recipient].length;
    $scope.pubkey = cryptico.publicKeyID($scope.clients[$scope.params.recipient].pubkey);

    $scope.sendMessage = function () {
        $("html, body").animate({ scrollTop: $(document).height() }, 300);

        if (!$scope.clients[$scope.params.recipient])
            return;

        var msg = {};

        msg.user = $scope.currentUser;
        msg.text = $scope.text;

        if (!$scope.messages[$scope.params.recipient])
            $scope.messages[$scope.params.recipient] = [];
        var idx = $scope.messages[$scope.params.recipient].push({
            user: 'me',
            acked: false,
            timestamp: new Date().getTime(),
            recipient: $scope.params.recipient,
            text: $scope.text
        });
        idx--;
        $scope.messages[$scope.params.recipient][idx].id = idx;

        socket.emit('send:message', {
            recipient: $scope.params.recipient,
            id: idx,
            message: cryptico.encrypt(escape(JSON.stringify(msg)),
                                      $scope.clients[$scope.params.recipient].pubkey,
                                      $scope.rsa).cipher
        });

        $scope.messages_read[$scope.params.recipient] = $scope.messages[$scope.params.recipient].length;

        $('#message-input').val('');
    };

    $scope.$on('event:message_received', function () {
        $scope.messages_read[$scope.params.recipient] = $scope.messages[$scope.params.recipient].length;
        if ($('.messages li:last-child').isOnScreen()) {
            $("html, body").animate({ scrollTop: $(document).height() }, 300);
        }
    });

});
