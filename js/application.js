'use strict';

var app = angular.module('app', ['ngRoute']);

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

app.controller('ShowAllMessages', function ($scope) {
    $.ajax({
        url: "http://inf5750-8.uio.no/api/messageConversations.json?paging=false&fields=id,created,displayName,followUp,lastSenderSurname,lastSenderFirstname,read,messageCount",
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function (data) {
            $scope.messages = data.messageConversations;
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth("admin", "district"));
        }
    });
});

app.controller('ShowMessage', function($scope, $routeParams) {

    $.ajax({
        url: "http://inf5750-8.uio.no/api/messageConversations/" + $routeParams.msgId + ".json?fields=*",
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function (data) {
            $scope.conversation = data
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth("admin", "district"));
        }
    });

});

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

    // configure html5 to get links working on jsfiddle
    // $locationProvider.html5Mode(true);
});
