/*
http interceptors for lazy loading and authentication
*/
(function () {

    angular.module('Enrollment')
        .config(['$httpProvider', function ($httpProvider) {

        var injectParams = ['$q', '$rootScope'];

        var httpInterceptor401 = function ($q, $rootScope) {

            var success = function (response) {
                return response;
            };

            var error = function (res) {
                if (res.status === 401) {
                    //Raise event so listener (navbarController) can act on it
                    alert('You need to login');
                    $rootScope.$broadcast('redirectToLogin', null);
                    return $q.reject(res);
                }
                return $q.reject(res);
            };

            return function (promise) {
                return promise.then(success, error);
            };

        };

        httpInterceptor401.$inject = injectParams;

        $httpProvider.interceptors.push(httpInterceptor401);

    }]);

}());

/*load the dancing maize for any long executing asyn calls by intercepting http server calls*/
(function () {

    var injectParams = ['$q', '$timeout', '$window', 'httpInterceptor'];

    var wcOverlayDirective = function ($q, $timeout, $window, httpInterceptor) {

       
                var queue = [];

                init();

                function init() {
                    wireUpHttpInterceptor();
                    if ($window.jQuery) wirejQueryInterceptor();
                }

                //Hook into httpInterceptor factory request/response/responseError functions
                function wireUpHttpInterceptor() {

                    httpInterceptor.request = function (config) {
                        processRequest();
                        return config || $q.when(config);
                        console.log(config);
                    };

                    httpInterceptor.response = function (response) {
                        processResponse();
                        console.log(response);
                        return response || $q.when(response);
                    };

                    httpInterceptor.responseError = function (rejection) {
                        processResponse();
                        return $q.reject(rejection);
                    };
                }

                //Monitor jQuery Ajax calls in case it's used in an app
                function wirejQueryInterceptor() {
                    $(document).ajaxStart(function () {
                        processRequest();
                    });

                    $(document).ajaxComplete(function () {
                        processResponse();
                    });

                    $(document).ajaxError(function () {
                        processResponse();
                    });
                }

                function processRequest() {
                    alert('process request');
                }

                function processResponse() {
                    alert("process response");
                }

        
    };

    var wcDirectivesApp = angular.module('wc.directives', []);

    //Empty factory to hook into $httpProvider.interceptors
    //Directive will hookup request, response, and responseError interceptors
    wcDirectivesApp.factory('httpInterceptor', function () {
        return {};
    });

    //Hook httpInterceptor factory into the $httpProvider interceptors so that we can monitor XHR calls
    wcDirectivesApp.config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('httpInterceptor');
    }]);

    //Directive that uses the httpInterceptor factory above to monitor XHR calls
    //When a call is made it displays an overlay and a content area
    //No attempt has been made at this point to test on older browsers
    wcOverlayDirective.$inject = injectParams;

    wcDirectivesApp.directive('wcOverlay', wcOverlayDirective);

}());
