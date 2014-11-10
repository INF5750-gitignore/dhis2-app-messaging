'use strict';

var app = angular.module('app', ['ngRoute', 'infinite-scroll']);

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

app.controller('ShowAllMessages', function($scope, Dhis) {
    $scope.dhis = new Dhis();
    $scope.dhis.nextPage();
});

// Dhis constructor function to encapsulate HTTP and pagination logic
app.factory('Dhis', function($http, $timeout) {

    $http.defaults.headers.common.Authorization = make_base_auth("admin", "district");

    var Dhis = function() {
        this.messages = [];
        this.busy = false;
        this.after = '';
        this.page = 1;
    };

    Dhis.prototype.nextPage = function() {
        if (this.busy) return;
        console.log("loading page #" + this.page);
        this.busy = true;

        var url = dhisAPI + "/api/messageConversations.json?paging=true&pageSize=10&page="+this.page+"&fields=id,created,displayName,followUp,lastSenderSurname,lastSenderFirstname,read,messageCount";
        $http.get(url).success(function(data) {
            if(this.page <= data.pager.pageCount) {
                this.messages = this.messages.concat(data.messageConversations);
                this.page++;
            }
            var that = this;
            $timeout(function(){that.busy = false}, 200);
        }.bind(this));
    };

    return Dhis;
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

