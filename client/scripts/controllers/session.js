'use strict';

app.controller('SessionCtrl', function ($scope, socket, localStorageService, $location, $rootScope) {
    $scope.login = function () {
        $scope.loading = 'loading';
        localStorageService.save('rsa', cryptico.generateRSAKey($scope.passphrase, $scope.bitLength).toJSON());
        localStorageService.save('username', $scope.username);
        $rootScope.$broadcast('event:auth-successful');
        $location.path('/users');
    };
});
