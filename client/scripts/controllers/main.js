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
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, 512).toJSON());
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
        var rsaObj = cryptico.generateRSAKey('', 512),
            rsa = rsaObj.parse(localStorageService.load('rsa')),
            publicKey = cryptico.publicKeyString(rsa),
            encryptedMessage = cryptico.encrypt($scope.text, publicKey);

        socket.emit('send:message', {
            recipient: $scope.recipient,
            message: encryptedMessage.cipher
        });

        $scope.messages.push({
            user: $scope.currentUser,
            text: cryptico.decrypt(encryptedMessage.cipher, rsa).plaintext
        });
        $scope.text = '';
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
