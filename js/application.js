'use strict';

var app = angular.module('app', ['ngRoute', 'infinite-scroll', 'ngCachedResource', 'ngSanitize']);

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

app.controller('ShowAllMessages', function($scope, $cachedResource, $filter, Message, MessageDetails) {
    var msgs = Message.all();
    $scope.messages = msgs;

    msgs.$httpPromise.then(function() {
        // TODO: Add some limit
        for(var i = 0; i < msgs.length; i++) {
            MessageDetails.get({id: msgs[i].id});

        }

    });

    //filter the displayed messages
    $scope.filters= [
        {name:"all", id:0, display:"All Messages"}, 
        {name:"follow", id:1, display:"Follow-Up"},
        {name:"unread", id:2, display:"Unread"}];

    $scope.messageFilter=$scope.filters[0];
    

    $scope.getName = function(msg) {
        if (msg.lastSender) {
            return msg.lastSender.name;
        } else {
            return msg.lastSenderFirstname + " " + msg.lastSenderSurname;
        }
    }

    $scope.searchText = "";

    $scope.searchFilter = function(msg) {
        if ($scope.searchText === "") return true;
        if (msg.displayName.toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0) return true;
        if ($scope.getName(msg).toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0) return true;
        if ($filter('date')(msg.created, 'dd MMM yyyy').toLowerCase().indexOf($scope.searchText.toLowerCase()) >= 0) return true;
        return false;
    }

    $scope.unreadMessages = function(msg) {
        if(msg.read==false)
        {
            return true;
        }
        return false;

    }
});

var msgFields="id,displayName,read,lastSender,lastSenderFirstname,lastSenderSurname,followUp,created,messageCount";

app.factory('Message', function($cachedResource, $http) {
    return $cachedResource('message', "/api/messageConversations/:id.json?paging=false", {id: "@id"}, {
        'get': {
            method: 'GET',
            params: {
                id: "@id",
            },
            url: dhisAPI + '/api/messageConversations/:id.json?fields=' + msgFields,
            transformResponse: function(data) {
                var msg = angular.fromJson(data);
                msg.read = true; // TODO: BUG: This API endpoint always returns messages as unread
                return msg;
            }
        },
        'all': {
            method: 'GET',
            url: dhisAPI + 'api/messageConversations.json?paging=false&fields=' + msgFields,
            isArray: true,
            transformResponse: function(data) {
                return angular.fromJson(data).messageConversations;
            }
        },
    });
});

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

app.factory('MessageDetails', function($cachedResource) {
    return $cachedResource('messageDetails', dhisAPI + '/api/messageConversations/:id/messages.json?fields=*', {id: "@id"});
});

app.controller('ShowMessage', function($scope, $http, $routeParams, $cachedResource, $location, Message, MessageDetails) {
    var msg = Message.get({id:$routeParams.msgId});

    msg.$httpPromise.then(function() {
        $scope.conversation = msg;
    });

    var details = MessageDetails.get({id:$routeParams.msgId});
    details.$httpPromise.then(function() {
        $scope.conversationDetails = details;
    })

    if (!msg.read) {
        markRead(msg, $http);
    }

    $scope.markUnread = function() {
        markUnread(msg, $http);
        msg.read = false;

        $location.path("/all");
    }

    $scope.send = function() {
        // TODO
    }

    $scope.conversation = msg;
    $scope.conversationDetails = details;
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
