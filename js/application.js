'use strict';

var app = angular.module('app', ['ngRoute', 'infinite-scroll', 'ngCachedResource', 'ngSanitize']);

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

app.controller('ShowAllMessages', function($scope, $cachedResource, Dhis, Message, MessagePage) {
    $scope.dhis = new Dhis();
    $scope.dhis.nextPage();

    $scope.offline = function() {
        console.log("Offlining messages...");
        // Message.$clearCache();
        $cachedResource.clearCache();

        var date = new Date();
        var limit = date.getTime();
        limit -= 1000*3600*24*30*6; // 6 months -> msec
        date.setTime(limit);
        console.log(date.toISOString());

        var getPage = function(page) {
            var remainingPages = 0;
            MessagePage.get({page:page}, function(data) {
                var messages = data.messageConversations;
                console.log("Getting page: ", data.pager.page);

                var stop = false;

                for(var i = 0; i < messages.length; i++) {
                    Message.get({id: messages[i].id});
                    console.log("Getting message: ", messages[i].id);

                    if (!stop && messages[i].created < date.toISOString()) {
                        console.log("Message is too old!");
                        stop = true;
                    }
                }

                if (!stop && data.pager.pageCount > data.pager.page) {
                    getPage(page+1);
                }
            });
        }

        getPage(1);
    }
});

app.factory('Message', function($cachedResource) {
    return $cachedResource('message', dhisAPI + '/api/messageConversations/:id.json?fields=*', {id: "@id"});
});

app.factory('MessageDetails', function($cachedResource) {
    return $cachedResource('messageDetails', dhisAPI + '/api/messageConversations/:id/messages.json?fields=*', {id: "@id"});
});

app.factory('MessagePage', function($cachedResource) {
    return $cachedResource(
            'page',
            dhisAPI + 'api/messageConversations.json?paging=true&pageSize=:pageSize&page=:page&fields=:fields&filter=:filter',
            {
                page: "@page",
                pageSize: 10,
                fields: "*",
                filter: "@filter"
            });
});

// Dhis constructor function to encapsulate HTTP and pagination logic
app.factory('Dhis', function($http, $timeout, MessagePage) {

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

        // Only show spinner for a short while when offline
        if (!navigator.onLine) {
            $timeout(function(){this.busy = false;}.bind(this), 1000);
        }

        MessagePage.get({page:this.page},
                function(data) {
                    if(this.page <= data.pager.pageCount) {
                        this.messages = this.messages.concat(data.messageConversations);
                        this.page++;
                    }
                    var that = this;
                    $timeout(function(){that.busy = false;}, 200);
                }.bind(this)
                );
    };

    return Dhis;
});

app.controller('ShowMessage', function($scope, $routeParams, $cachedResource, Message, MessageDetails) {
    Message.get({id:$routeParams.msgId}, function(message) {
        $scope.conversation = message;
    });

    MessageDetails.get({id:$routeParams.msgId}, function(messageDetails) {
        $scope.conversationDetails = messageDetails;
    });
});

app.run(function($window, $rootScope) {
      $rootScope.online = navigator.onLine;
      $window.addEventListener("offline", function () {
        $rootScope.$apply(function() {
          $rootScope.online = false;
        });
      }, false);
      $window.addEventListener("online", function () {
        $rootScope.$apply(function() {
          $rootScope.online = true;
        });
      }, false);
});
