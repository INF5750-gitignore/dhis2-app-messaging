
var app = angular.module('app');

app.factory('User', function($cachedResource) {
    var User = $cachedResource('user', "api/users.json", {id: "@id"}, {
        'all': {
            method: 'GET',
            params: {
                fields: "id,name",
                paging: false,
            },
            url: dhisAPI + 'api/users.json',
            isArray: true,
            transformResponse: function(data) {
                return angular.fromJson(data).users;
            }
        },
    });

    return User;
});

