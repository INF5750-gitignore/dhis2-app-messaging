
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
        .when('/new', {
            templateUrl: 'newmessage.html',
            controller: 'NewMessage'
        })
        .otherwise({
            redirectTo: '/all'
        })
    ;
});


