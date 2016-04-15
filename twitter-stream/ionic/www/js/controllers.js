angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

})

.controller('TweetListCtrl', function($scope, $rootScope, tweet, $q) {
  $scope.page = 0;
  $scope.next = true;
  $scope.tweets = [];

  var setChannel = function(channel) {
    $rootScope.channel = channel;
    $rootScope.defaultHashtag = channel;
    $scope.searchKey = channel;
    $scope.clearAndSearch();
  };

  var getDefaultCriteria = function() {
    return $rootScope.defaultHashtag;
  };

  var loadData = function() {
    if($scope.searchKey && $scope.next) {
      $scope.page = $scope.next ? $scope.page + 1 : $scope.page;
      tweet.findViewed($scope.searchKey, { page: $scope.page })
        .then(function(r) {
          if (r.data.result.length) {
            $scope.tweets = $scope.tweets.concat(r.data.result);
            $scope.$broadcast('scroll.infiniteScrollComplete');
          } else {
            $scope.next = false;
          }
        });
    }
  };

  var clearCriteria = function(searchKey) {
    $scope.page = 0;
    $scope.next = true;
    $scope.tweets = [];
    $scope.searchKey = (searchKey)  ? searchKey : getDefaultCriteria();
  };

  var clearAndSearch = function() {
    if($scope.searchKey) {
      $scope.clearCriteria($scope.searchKey);
      $scope.loadData();
    }
  };

  $scope.clearAndSearch = clearAndSearch;
  $scope.searchKey = getDefaultCriteria();
  $scope.loadData = loadData;
  $scope.clearCriteria = clearCriteria;
  $scope.setChannel = setChannel;
  $scope.channels = $rootScope.channels;
})

.controller('TweetDetailCtrl', function($scope, $stateParams, tweetDetail, tweet) {
  $scope.tweet = tweetDetail;
})

.controller('TweetFavoriteCtrl', function($scope, $stateParams, tweetFavorites) {
  $scope.tweets = tweetFavorites;
})


.controller('RecommendationCtrl', function($scope, $stateParams, tweetList) {
  $scope.tweets = tweetList;
})

.controller('StreamCtrl', function($scope, $stateParams, TDCardDelegate, tweet, $rootScope) {
  $scope.cards = [];

  var loadData = function() {
    tweet.findToSwipe()
      .then(function(r) {
        $scope.cards = r.data.result;
      });
  };

  $scope.cardDestroyed = function(index) {
    $scope.cards.splice(index, 1);
    if(!$scope.cards.length) {
      loadData();
    }
  };

  var swipeCard = function(card) {
    tweet.swipe(card);
    updateSwiped();
  };

  var updateSwiped = function() {
    $scope.swiped = tweet.getSwiped();
  };

  $scope.cardSwipedLeft = function(card) {
    tweet.nope(card.id);
    swipeCard(card);
  };

  $scope.cardSwipedRight = function(card) {
    tweet.like(card.id);
    swipeCard(card);
  };

  updateSwiped();
  loadData();

})

;
