var test = angular.module('MyModule', [
	'masonry',
	'ui.router'
]);


test.config(function($stateProvider, $urlRouterProvider,$locationProvider){
	$locationProvider.html5Mode(false).hashPrefix('!');
	$urlRouterProvider.otherwise('/home');
	
    $stateProvider
	.state('home', {
		url: "/home",
		templateUrl: "masonry.html"
	})
	.state('upload', {
		url: "/upload",
		templateUrl: "upload.html"
	})
})




