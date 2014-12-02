
var app = angular.module('app');

app.controller('ShowAllMessages', function($scope, $cachedResource, $filter, $http, Message, MessageDetails, messages) {
    $scope.messages = messages;
    messages.$httpPromise.then(function() {
        // TODO: Add some limit
        for(var i = 0; i < messages.length; i++) {
            MessageDetails.get({id: messages[i].id});
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
        if(!confirm("Warning! Are you sure you want to delete the selected messages?"))
            return;

        var selected = [];
        var unselected = [];

        for (var i = 0; i < $scope.messages.length; i++) {
            var message = $scope.messages[i];
            if (message._selected) {
                selected.push(message);
            } else {
                unselected.push(message);
            }
        }

        var deleteList = function(list) {
            var msg = list.pop();

            msg.$delete(function(data) {
                console.log("Deleted", msg.id);

                Message.$clearCache({where: [{id: msg.id}]});
                MessageDetails.$clearCache({where: [{id: msg.id}]});

                if (list.length > 0) {
                    deleteList(list);
                }
            });
        }

        deleteList(selected);
        $scope.messages = unselected;
    }

});

