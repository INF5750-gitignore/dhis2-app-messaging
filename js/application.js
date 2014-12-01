'use strict';

var app = angular.module('app', ['ngRoute', 'infinite-scroll', 'ngCachedResource', 'ngSanitize', 'multi-select']);

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

app.controller('ShowAllMessages', function($scope, $cachedResource, $filter, $http, Message, MessageDetails) {
    var msgs = Message.all();
    $scope.messages = msgs;

    msgs.$httpPromise.then(function() {
        // TODO: Add some limit
        for(var i = 0; i < msgs.length; i++) {
            MessageDetails.get({id: msgs[i].id});
        }

        if (isDev) {
            console.log("localStorage usage:", JSON.stringify(localStorage).length);
        }
    });

    //filter the displayed messages
    $scope.filters = [
    {name:"all", id:0, display:"All Messages"},
    {name:"follow", id:1, display:"Follow-Up"},
    {name:"unread", id:2, display:"Unread"}];

    $scope.setFilter = function(filter) {
        $scope.messageFilter = filter;
    }

    $scope.messageFilter=$scope.filters[0];

    // Inconsistent API, names are stored differently when fetching a list
    // compared to fetching a specific message.
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

    $scope.getVisibleMessages = function() {
        // TODO: Replace the complex filtering in the view with this function
    }

    $scope.selectAll = function() {
        for (var i = 0; i < $scope.messages.length; i++) {
            var message = $scope.messages[i];
            if (!message._selected) message._selected = true;
        }
    }

    $scope.selectNone = function() {
        for (var i = 0; i < $scope.messages.length; i++) {
            var message = $scope.messages[i];
            if (message._selected) message._selected = false;
        }
    }

    $scope.unreadMessages = function(msg) {
        return !msg.read;
    }

    $scope.updateReadStatus = function(setRead) {
        var selected = [];

        for (var i = 0; i < $scope.messages.length; i++) {
            var message = $scope.messages[i];
            if (message._selected && message.read != setRead) {
                selected.push(message);
            }
        }

        if (selected.length === 0) return;

        var ids = selected.map(function(msg) { return msg.id; });

        $http({
            method: 'POST',
            url: dhisAPI + 'api/messageConversations/' + (setRead ? 'read' : 'unread'),
            transformRequest: function(data) {
                return JSON.stringify(ids);
            },
            transformResponse: function(data) {
                return (setRead ? angular.fromJson(data).markedRead : angular.fromJson(data).markedUnread);
            }
        }).success(function(data) {
            // TODO: This can be made more efficient with a map structure
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < selected.length; j++) {
                    if (data[i] === selected[j].id) {
                        selected[j].read = setRead;
                        break;
                    }
                }
            }
        });
    }

    $scope.delete = function()
    {
        if(confirm("Warning! Are you sure you want to delete the message?"))
        {

            for (var i = 0; i < $scope.messages.length; i++) {
                var message = $scope.messages[i];
                if (message._selected) {
                    message.$delete();
                }
            }
        }
    }

});

var msgFields="id,displayName,read,lastSender,lastSenderFirstname,lastSenderSurname,followUp,created,messageCount";

app.factory('Message', function($cachedResource, $http) {
    var Message = $cachedResource('message', "/api/messageConversations/:id.json?paging=false", {id: "@id"}, {
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
        'page': {
            method: 'GET',
            params: {
                page: "@page",
            },
            url: dhisAPI + 'api/messageConversations.json?paging=true&pageSize=10&page=:page&fields=' + msgFields,
            isArray: true,
            transformResponse: function(data) {
                return angular.fromJson(data).messageConversations;
            }
        },
        'reply': {
            method: 'POST',
            cached: false,
            params: {
                id: "@id",
            },
            url: dhisAPI + 'api/messageConversations/:id',
            transformRequest: function(data) {
                return JSON.stringify(data.message);
            },
            transformResponse: []
        },
        'delete': {
            method: 'DELETE',
            cached: false,
            url: dhisAPI + 'api/messageConversations/:id',
            transformRequest: [],
            transformResponse: [],
        }
    });

Message.prototype._selected = false;

return Message;
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


//var msgDetailFields = "created,followUp,name,read,messageCount,displayName,lastSender,messages"
var msgDetailFields = "*";

app.factory('MessageDetails', function($cachedResource) {
    return $cachedResource('messageDetails', dhisAPI + '/api/messageConversations/:id/messages.json?fields=' + msgDetailFields, {id: "@id"});
});

app.controller('ShowMessage', function($scope, $http, $routeParams, $cachedResource, $location, $rootScope, Message, MessageDetails) {
    var msg = Message.get({id:$routeParams.msgId});

    msg.$httpPromise.then(function() {
        $scope.conversation = msg;
    }, function(response) {
        if (response.status === 404) $location.path("/all");
    });

    var details = MessageDetails.get({id:$routeParams.msgId});
    details.$httpPromise.then(function() {
        $scope.conversationDetails = details;
    })

    msg.read = true;
    markRead(msg, $http);

    $scope.markUnread = function() {
        markUnread(msg, $http);
        msg.read = false;

        $location.path("/all");
    }

    $scope.delete = function() {
        if(confirm("Warning! Are you sure you want to delete the message?"))
        {
            msg.$delete({}, function() {
                Message.$clearCache({where: [{id: msg.id}]});
                MessageDetails.$clearCache({where: [{id: msg.id}]});

                $location.path("/all");
            });
        }
    }

    $scope.send = function() {
        var reply = Message.reply({id: msg.id, message: $scope.reply}, function(data) {
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

    $scope.conversation = msg;
    $scope.conversationDetails = details;
});

app.controller('NewMessage', function($scope, $http, $location) {

    $scope.list_users_new_message = angular.copy($scope.list_users);

    $scope.send = function() {
        var json = {};
        json.users = [];
        json.subject = $scope.subject;
        json.text = $scope.text;
        
        $scope.users.forEach(function(u) {
            json.users.push({id: u.id, name: u.name});
        });

        var loc = $location;
        $http.post(dhisAPI + '/api/messageConversations', json).
        success(function(data) {
            loc.path('/all').replace();
        });
    };
});

app.run(function($window, $http, $rootScope) {
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

    var root = $rootScope;
    $http.get(dhisAPI + '/api/users.json?fields=id,name&paging=false').
    success(function(data) {
        root.list_users= angular.fromJson(data).users;
    });
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
