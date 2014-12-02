
var app = angular.module('app');
app.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/msg/:msgId', {
            templateUrl: 'message.html',
            controller: 'ShowMessage',
            resolve: {
                message: function($route, Message) {
                    return Message.get({id:$route.current.params.msgId});
                },
                messageDetails: function($route, MessageDetails) {
                    return MessageDetails.get({id:$route.current.params.msgId});
                }
            }
        })
        .when('/all', {
            templateUrl: 'messagelist.html',
            controller: 'ShowAllMessages',
            resolve: {
                messages: function(Message) {
                    return Message.all();
                }
            }
        })
        .when('/new', {
            templateUrl: 'newmessage.html',
            controller: 'NewMessage',
            resolve: {
                userList: function(User) {
                    return User.all();
                }
            }
        })
        .otherwise({
            redirectTo: '/all'
        })
    ;
});


