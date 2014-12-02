
var app = angular.module('app');

app.controller('NewMessage', function($scope, $http, $location, Message, userList) {
    $scope.userList = angular.copy(userList);

    userList.$httpPromise.then(function() {
        $scope.userList = angular.copy(userList);
    });

    $scope.send = function() {
        if ($scope.users.length === 0)
            return;

        Message.create({
            subject: $scope.subject,
            text:    $scope.text,
            users:   $scope.users.map(function(user) { return {id: user.id } }),
        }).$promise.then(function(data) {
            $location.path("/msg/" + data.id);
        });
    };

    $scope.users = [];
});

