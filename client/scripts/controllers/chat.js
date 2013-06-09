'use strict';

app.controller('ChatCtrl', function ($scope, socket, localStorageService) {
    if (!("ontouchstart" in document.documentElement)) {
      $('#message-input').focus();
    }

    $scope.sendMessage = function () {
        $scope.messages.push({
          user: 'me',
          recipient: $scope.params.recipient,
          text: $scope.text
        });

        var rsaObj = cryptico.generateRSAKey('', $scope.bitLength),
          rsa = rsaObj.parse(localStorageService.load('rsa')),
          msg = {};

        msg.user = $scope.currentUser;
        msg.text = $scope.text;

        socket.emit('send:message', {
            recipient: $scope.params.recipient,
            message: cryptico.encrypt(JSON.stringify(msg), $scope.clients[$scope.params.recipient].pubkey, rsa).cipher
        });

        //$('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
        $('#message-input').val('');
    };

    socket.on('news', function (data) {
        console.log(data);
    });

    socket.on('send:messagereply', function (data) {
        console.log(data);
    });

    socket.on('recieve:message', function (data) {
        var rsaObj = cryptico.generateRSAKey('', $scope.bitLength),
            rsa = rsaObj.parse(localStorageService.load('rsa'));

        var decryptedtext = cryptico.decrypt(data.message, rsa);
        var msg = JSON.parse(decryptedtext.plaintext)
        var plaintext = msg.text;
        if (msg.user != data.sender) {
            $scope.messages.push({
                user: msg.user + ' - server told it\'s ' + data.sender,
                text: plaintext
            });
            return;
        }

        if ($scope.clients[data.sender]) {
            if ($scope.clients[data.sender].pubkey !== decryptedtext.publicKeyString) {
                $scope.messages.push({
                    user: data.sender + ' - invalid signature ' +
                    '(verification failed)!',
                    text: plaintext
                });
                return;
            } else {
                $scope.messages.push({
                    user: data.sender +
                    '[' +
                    cryptico.publicKeyID($scope.clients[data.sender].pubkey) +
                    ']',
                    recipient: $scope.currentUser,
                    text: plaintext
                });
                return;
            }
        }

        $scope.messages.push({
            user: 'invalid sender (' + data.sender + ' is not in our list)!',
            text: plaintext
        });

        //$('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
    });



    socket.on('send:messagereply', function (data) {
        console.log(data);
    });
});
