
var app = angular.module('app');
app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/msg/:msgId', {
            templateUrl: 'message.html',
            controller: 'ShowMessage'
        })
        .when('/all', {
            templateUrl: 'messagelist.html',
            controller: 'ShowAllMessages'
        })
        .otherwise({
            redirectTo: '/all'
        })
    ;
});


