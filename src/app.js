require('file?name=/index.html!jade-env-html?{module:"public"}!./layout.jade');
require('./static.js' );
const axios = require('axios');

var app = angular.module('app', ((([
  'ngCookies',
  'ngRoute',
   'ngFlash',
  'angular-loading-bar',
  'ngAnimate',
  'ngAidbox'
]))));
const util  = require('./util.js');
util.requireAll(require.context("ng-cache?!jade-env-html!./", true, /^\.\/.*\.jade$/));

var mock = require('./mock.js')

var endpoint = "http://ec2-54-149-115-237.us-west-2.compute.amazonaws.com:8080/v2/api/mockehr";
// var endpoint = "http://localhost:7777"; // Just a proxy backdoo

app.config(function ($routeProvider) {
  $routeProvider
    .when('/', {templateUrl: 'index.jade', controller: 'IndexCtrl'})
    .otherwise({templateUrl: 'index.jade', controller: 'IndexCtrl'});
});

app.controller('IndexCtrl', function($http, $scope, $aidbox, $rootScope, Flash){
    const egress_statuses = ["Egress", "Processed", "Error"];
    const ingress_statuses = ["Ingress"];

    $scope.$watch('messages', messages => {
        if (messages && messages.length) {
            $scope.egress = messages
                .filter(m => {
                    return (egress_statuses.indexOf(m.messageStatus) != -1);});
            $scope.ingress = messages
                .filter(m => {
                    return (ingress_statuses.indexOf(m.messageStatus) != -1);});
        }
    }, true);

    $scope.submit = (msg) => {
        $http({url: endpoint,
               method: 'post',
               headers: { 'content-type': 'application/json' },
               data: {
                   message: encodeURIComponent(msg),
                   messageStatus: 'Egress',
                   instance: process.argv[3],
                   error: ''}})
            .then(result  => {
                Flash.create("success", "Message has been sent");
                 /*    Add to Egress list

                var resp =  result.data;
                resp.message = decodeURI(resp.message);
                $scope.messages.unshift(resp);

                // */

            }).catch(err => {
                Flash.create("error", "Fail:" + err);
            });
        $scope.new_msg = "";
    };

    var poll = () => {
        $http({url: endpoint})
            .then(function(data){
                $scope.messages = data.data
                    .map(m => {
                        m.message = decodeURI(m.message);
                        return m;
                    });
            });
    };

     /*  Local mock load

    $scope.messages = mock
        .map(m => {
            m.message = decodeURI(m.message);
            return m;
        });
    //  */

    poll();
    setInterval(poll, 10000);

});
