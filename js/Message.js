
var app = angular.module('app');

var msgFields="id,displayName,read,lastSender,lastSenderFirstname,lastSenderSurname,followUp,created,messageCount";

app.factory('Message', function($cachedResource) {
    var Message = $cachedResource('message', "api/messageConversations/:id.json?paging=false", {id: "@id"}, {
        'get': {
            method: 'GET',
            params: {
                id: "@id",
            },
            url: dhisAPI + 'api/messageConversations/:id.json?fields=' + msgFields,
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
        'create': {
            method: 'POST',
            cached: false, // Can't cache this (message has no ID yet)
            url: dhisAPI + 'api/messageConversations',
            transformResponse: function(data, headers) {
                return {id: headers("Location").split("/")[2]};
            }
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
