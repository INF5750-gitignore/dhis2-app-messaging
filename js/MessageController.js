
var app = angular.module('app');

app.controller('ShowMessage', function($scope, $http, $routeParams, $cachedResource, $location, $rootScope, Message, MessageDetails, message, messageDetails) {
    $scope.conversation = message;
    $scope.conversationDetails = messageDetails;

    message.$httpPromise.then(function() {
        markRead(message, $http);
    }, function(response) {
        if (response.status === 404) $location.path("/all");
    });

    message.read = true;

    $scope.markUnread = function() {
        markUnread(message, $http);
        message.read = false;

        $location.path("/all");
    }

    $scope.delete = function() {
        if(confirm("Warning! Are you sure you want to delete the message?"))
        {
            message.$delete({}, function() {
                Message.$clearCache({where: [{id: message.id}]});
                MessageDetails.$clearCache({where: [{id: message.id}]});

                $location.path("/all");
            });
        }
    }

    $scope.send = function() {
        var reply = Message.reply({id: message.id, message: $scope.reply}, function(data) {
            $scope.reply = "";

            var msg_update = Message.get({id:$routeParams.msgId});
            msg_update.$httpPromise.then(function() {
                $scope.conversation = msg_update;
            });

            var details_update = MessageDetails.get({id:$routeParams.msgId});
            details_update.$httpPromise.then(function() {
                $scope.conversationDetails = details_update;
            });
        });

    }
});

