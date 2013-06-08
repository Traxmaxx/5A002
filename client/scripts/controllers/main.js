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
        $scope.currentUser = $scope.username;
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, 512).toJSON());
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

        socket.emit('send:message', {
            recipient: $scope.recipient,
            message: cryptico.encrypt($scope.text, $scope.recipient.pubkey).cipher
        });

        $scope.messages.push({
            user: $scope.currentUser,
            text: $scope.text
        });

        $scope.text = '';
    };

    socket.on('login:reply', function (data) {
        $scope.clients.push(data.clientlist[0]);
    });

    socket.on('news', function (data) {
        console.log(data);
    });

    socket.on('send:messagereply', function (data) {
        console.log(data);
    });

    socket.on('recieve:message', function (data) {
        var rsaObj = cryptico.generateRSAKey('', 512),
            rsa = rsaObj.parse(localStorageService.load('rsa'));
        $scope.messages.push({
            user: data.sender,
            text: cryptico.decrypt(data.message, rsa).plaintext
        });
    });

    socket.on('client:add', function (data) {
        $scope.clients.push(data);
    });

    socket.on('client:remove', function (data) {
        $scope.clients.splice($scope.clients.indexOf(data), 1);
    });


    //Connect on load if already loggedin
    if ($scope.currentUser) {
        connectSocket();
    }
});
