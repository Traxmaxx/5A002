'use strict';

app.controller('MainCtrl', function ($scope, socket, localStorageService) {
    $scope.messages = [];
    $scope.clients = [];
    $scope.currentUser = localStorageService.load('username');
    $scope.bitLength = 512

    var connectSocket = function () {
        socket.emit('login', {
            username: localStorageService.load('username'),
            pubkey: cryptico.publicKeyString(localStorageService.load('rsa'))
        });
    };

    $scope.login = function () {
        $scope.currentUser = $scope.username;
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, $scope.bitLength).toJSON());
        localStorageService.save('username', $scope.username);
        connectSocket();
    };

    $scope.logout = function () {
        localStorageService.destroy('username');
        localStorageService.destroy('rsa');
        $scope.currentUser = null;
        socket.emit('logout', 'do it now!');
    };

    $scope.sendMessage = function () {
        var rsaObj = cryptico.generateRSAKey('', $scope.bitLength),
        rsa = rsaObj.parse(localStorageService.load('rsa'));

        socket.emit('send:message', {
            recipient: $scope.recipient,
            message: cryptico.encrypt($scope.text, $scope.recipient.pubkey, rsa).cipher
        });

        $scope.messages.push({
            user: $scope.currentUser,
            text: $scope.text
        });

        $('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
        $scope.text = '';
    };

    socket.on('login:reply', function (data) {
        $scope.clients = data.clientlist;
    });

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
        var length = $scope.clients.length;

        while (length--) {
            if ($scope.clients[length].username == data.sender) {
                if ($scope.clients[length].pubkey != decryptedtext.publicKeyString) {
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
                        cryptico.publicKeyID($scope.clients[length].pubkey) +
                        ']',
                        text: decryptedtext.plaintext
                    });
                    return;
                }
            }
        }

        $scope.messages.push({
            user: 'invalid sender (not in list)!',
            text: decryptedtext.plaintext
        });

        $('#messages').animate({scrollTop: $('#messages').prop("scrollHeight")}, 500);
    });

    socket.on('client:update', function (data) {
        // First we check if a user has logged in/out or changed its key
        var orig_list = {}
        for (var i = 0; i < $scope.clients.length; i++)
            orig_list[$scope.clients[i].username] = $scope.clients[i].pubkey;
        var updated_list = {}
        for (var i = 0; i < data.clientlist.length; i++) {
            updated_list[data.clientlist[i].username] = data.clientlist[i].pubkey;
            console.log(data.clientlist[i].username + ' is present');
        }
        for (var key in orig_list) {
            if (!(key in updated_list)) {
                $scope.messages.push({
                    user: key +
                    '[' +
                    cryptico.publicKeyID(orig_list[key]) +
                    ']',
                    text: '[user logged out]'
                });
                console.log(key + ' logged out');
            } else if (orig_list[key] != updated_list[key]) {
                $scope.messages.push({
                    user: key +
                    '[' +
                    cryptico.publicKeyID(orig_list[key]) +
                    ' -> ' +
                    cryptico.publicKeyID(updated_list[key]) +
                    ']',
                    text: '[user changed key]'
                });
                console.log(key + ' changed key');
            }
        }
        for (var key in updated_list) {
            if (!(key in orig_list)) {
                $scope.messages.push({
                    user: key +
                    '[' +
                    cryptico.publicKeyID(updated_list[key]) +
                    ']',
                    text: '[user logged in]'
                });
                console.log(key + ' logged in');
            }
        }

        $scope.clients = data.clientlist;
    });

    socket.on('client:add', function (data) {
        $scope.messages.push({
            user: 'Warning',
            text: 'server sent client:add'
        });
        $scope.clients.push(data);
    });

    socket.on('client:remove', function (data) {
        $scope.messages.push({
            user: 'Warning',
            text: 'server sent client:remove'
        });
        $scope.clients.splice($scope.clients.indexOf(data), 1);
    });


    //Connect on load if already loggedin
    if ($scope.currentUser) {
        connectSocket();
    }
});
