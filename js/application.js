'use strict';

var app = angular.module('app', ['ngRoute', 'ngCachedResource', 'ngSanitize', 'multi-select']);

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

var markRead = function(msg, $http) {
    $http({
        method: 'POST',
        url: dhisAPI + 'api/messageConversations/read',
        transformRequest: function(data) {
            return "[\""+msg.id+"\"]";
        },
        transformResponse: [],
    });
}

var markUnread = function(msg, $http) {
    $http({
        method: 'POST',
        url: dhisAPI + 'api/messageConversations/unread',
        transformRequest: function(data) {
            return "[\""+msg.id+"\"]";
        },
        transformResponse: [],
    });
}

app.run(function($window, $http, $rootScope, User) {
    if (isDev) {
        $http.defaults.headers.common.Authorization = make_base_auth("admin", "district");
    }

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

app.filter('filterMessageDisplay', function() {
  return function( items, messageFilter) {
    var filtered = [];

    if(messageFilter.name=="all")
    {
        angular.forEach(items, function(item){
            filtered.push(item);
        });
    }

    if(messageFilter.name=="follow")
    {
        angular.forEach(items, function(item){

            if(item.followUp == true)
            {
                filtered.push(item);
            }
        });
    }

    if(messageFilter.name=="unread")
    {
        angular.forEach(items, function(item){

            if(item.read == false)
            {
                filtered.push(item);
            }
        });
    }
    return filtered;
};
});
