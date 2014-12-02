
var app = angular.module('app');

//var msgDetailFields = "created,followUp,name,read,messageCount,displayName,lastSender,messages"
var msgDetailFields = "*";

app.factory('MessageDetails', function($cachedResource) {
    return $cachedResource('messageDetails', dhisAPI + '/api/messageConversations/:id/messages.json?fields=' + msgDetailFields, {id: "@id"});
});
