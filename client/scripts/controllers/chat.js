'use strict';

app.controller('ChatCtrl', function ($scope, socket, localStorageService) {

    $scope.sendMessage = function () {
        var rsaObj = cryptico.generateRSAKey('', $scope.bitLength),
        rsa = rsaObj.parse(localStorageService.load('rsa'));

        socket.emit('send:message', {
            recipient: $scope.clients[$scope.params.recipient],
            message: cryptico.encrypt($scope.text, $scope.clients[$scope.params.recipient].pubkey, rsa).cipher
        });

        $scope.messages.push({
            user: 'me',
            recipient: $scope.clients[$scope.params.recipient],
            text: $scope.text
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

        if ($scope.clients[$scope.params.recipient].username == data.sender) {
            if ($scope.clients[$scope.params.recipient].pubkey != decryptedtext.publicKeyString) {
                $scope.messages.push({
                    user: data.sender + ' - invalid signature ' +
                    '(verification failed)!',
                    text: decryptedtext.plaintext
                });
                return;
            } else {
                $scope.messages.push({
                    user: data.sender +
                    '[' +
                    cryptico.publicKeyID($scope.clients[$scope.params.recipient].pubkey) +
                    ']',
                    recipient: $scope.currentUser,
                    text: decryptedtext.plaintext
                });
                return;
            }
        }

        $scope.messages.push({
            user: 'invalid sender (not in list)!',
            text: decryptedtext.plaintext
        });

        //$('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
    });



    socket.on('send:messagereply', function (data) {
        console.log(data);
    });

    $('#message-input').keydown(function(event) {
        if (event.keyCode == 13 && $scope.recipient) {
          console.log($('#message-input').val());
          $scope.sendMessage();
          return false;
        }
    });
});
