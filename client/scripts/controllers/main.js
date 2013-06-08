'use strict';

app.controller('MainCtrl', function ($scope, socket, localStorageService) {
    $scope.messages = [];
    $scope.clients = [];
    $scope.currentUser = localStorageService.load('username');

    var connectSocket = function () {
        socket.emit('login', {
            username: localStorageService.load('username'),
            pubkey: cryptico.publicKeyString(localStorageService.load('rsa'))
        });
    };

    $scope.login = function () {
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, 512));
        localStorageService.save('username', $scope.username);
        $scope.currentUser = $scope.username;
        connectSocket();
    };

    $scope.logout = function () {
        localStorageService.destroy('username');
        localStorageService.destroy('rsa');
        $scope.currentUser = null;
    };

    $scope.sendMessage = function () {
        var rsa = localStorageService.load('rsa')
        var publicKey = cryptico.publicKeyString(rsa);
        var encryptedMessage = cryptico.encrypt($scope.message, publicKey);

        socket.emit('send:message', {
            recipient: $scope.recipient,
            message: encryptedMessage.cipher
        });
//
        // add the message to our model locally
        $scope.messages.push({
            user: $scope.currentUser,
            text: cryptico.decrypt(encryptedMessage.cipher, localStorageService.load('rsa'))
        });

        // clear message box
        $scope.message = '';
    };

    socket.on('login:reply', function (data) {
        $scope.clients.push(data.clientlist);
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

    if ($scope.currentUser) {
        connectSocket();
    }
});
