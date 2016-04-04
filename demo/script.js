angular.module('MyApp', ['ui.date'])
  .controller('MyCtrl', function ($scope, $filter, $compile, $rootScope) {
    // $scope.aDate = ;
    // $scope.otherDate = 'Thursday, 11 October, 2012';
    // $scope.otherDate = '2015-10-31';
    // $scope.otherDate = $filter('date')((new Date("2014-08-20T00:00:00-04:00")).getTime(),'dd/MM/yyyy');
    // $scope.otherDate =  "2016-12-28T15:58:21.162000Z";
    $scope.dateOptions = {
      dateFormat: 'dd.mm.yy',
    };


  });