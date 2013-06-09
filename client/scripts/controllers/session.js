'use strict';

app.controller('SessionCtrl', function ($scope, socket, localStorageService) {
    $scope.login = function () {
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, $scope.bitLength).toJSON());
        localStorageService.save('username', $scope.username);
        $rootScope.connectSocket();
    };
});
