angular.module('MyApp', ['ui.date'])
  .controller('MyCtrl', function ($scope) {
    $scope.aDate = '2015-10-31';
    // $scope.aDate1 = 'Thursday, 11 October, 2012';
    $scope.aDate1 = '2015-10-31';
    // $scope.aDate1 =  "2014-08-20T00:00:00-04:00";
    // $scope.aDate1 =  "2016-12-28T15:58:21.162000Z";
    $scope.dateOptions = {
      dateFormat: 'dd.mm.yy',
    }
    $scope.getDate = function(date) {
      return typeof date;
    }
  })