(function () {
    angular.module('Enrollment').controller('ClientManagementController',
    ['$q', '$scope', '$rootScope', '$timeout', '$location', '$localForage', '$filter', '$modal', 'dataservice', '$routeParams', 'yaaaService', controller]);


    function controller($q, $scope, $rootScope, $timeout, $location, $lf, $filter, $modal, dataservice, $routeParams, yaaas) {

        // The controller's API to which the view binds
        var vm = this;
        vm.ds = dataservice;

        vm.country = {};
        vm.country.CountryId = 0;
        vm.district = {};
        vm.district.DistrictId = 0;
        vm.season = {};
        vm.season.SeasonId = 0;
        vm.site = {};
        vm.site.SiteId = 0;
        vm.group = {};
        vm.group.GroupId = 0;
        vm.clientsLoading = 1;
        vm.Clients = [];
        vm.sortColumn = 'ClientId';
        vm.sortReverse = false;
        vm.search = '';
        vm.filteredClients = [];
        vm.searchClients = searchClients;

        vm.actionError = false;
        vm.actionStatus = false;
        vm.errorMessage = "";
        vm.successMessage = "";

        dataservice.setOnReadyHandler(activate);

        function activate() {

            vm.country.CountryId = $routeParams.countryId ? $routeParams.countryId : 0;
            vm.district.DistrictId = $routeParams.districtId ? $routeParams.districtId : 0;
            if (vm.district.DistrictId > 0) {
                var districtStr = vm.district.DistrictId.toString();
                var countryId = districtStr.substr((districtStr.length - 3), 3);
                vm.country.CountryId = parseInt(countryId);
            }
            vm.season.SeasonId = $routeParams.seasonId ? $routeParams.seasonId : 0;
            vm.site.SiteId = $routeParams.siteId ? $routeParams.siteId : 0;
            vm.group.GroupId = $routeParams.groupId ? $routeParams.groupId : 0;
            vm.hidenav = $routeParams.hidenav;

            console.log(vm.country.CountryId);
            console.log(vm.district.DistrictId);
            console.log(vm.season.SeasonId);
            console.log(vm.site.SiteId);
            console.log(vm.group.GroupId);
            console.log(vm.hidenav);

            getCountry();
            getDistrict();
            getSeason();
            getSite();
        }

        function getCountry() {
            vm.ds.fetchCountry(vm.country.CountryId)
                .then(function (data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.country = data.results[0];
                    }
                })
                .catch(
                    function (err) {
                        alert(err);
                        return null;
                    });
        }

        function getDistrict() {
            vm.ds.fetchDistrict(vm.district.DistrictId)
                .then(function(data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.district = data.results[0];
                    }
                })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    });
        }

        function getSeason() {
            vm.ds.fetchSeason(vm.district.DistrictId, vm.season.SeasonId)
                .then(function(data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.season = data.results[0];
                    }
                })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    });
        }

        function getSite() {
            vm.ds.fetchSites(vm.district.DistrictId, vm.season.SeasonId, vm.site.SiteId)
                .then(function(data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.site = data.results[0];

                        getGroup();
                    }
                })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    });
        }

        function getGroup() {
            var groups = vm.site.Groups.filter(function(group) {
                return (group.DistrictId == vm.district.DistrictId &&
                        group.SiteId == vm.site.SiteId &&
                        group.Active == 1 &&
                        group.GroupId == vm.group.GroupId);
            });
            if (groups != null && groups.length > 0) {
                vm.group = groups[0];

                getClients();
            }
        }

        function getClients() {
            vm.clientsLoading = 1;
            vm.Clients = [];

            var groupSeasonClients = vm.group.SeasonClients;
            if (groupSeasonClients != null && groupSeasonClients.length > 0) {
                var seasonClients = groupSeasonClients.filter(function (sc) {
                    return (sc.DistrictId == vm.group.DistrictId &&
                            sc.SeasonId == vm.season.SeasonId &&
                            sc.GroupId == vm.group.GroupId);
                });
                if (seasonClients != null && seasonClients.length > 0) {
                    seasonClients.forEach(function (seasonClient) {

                        console.log(searchClients);

                        var client = seasonClient.Client;

                        if (client != null) {

                            //is the client a group leader?
                            if (client.Facilitator) {
                                client.GroupLeader = 1;
                            }

                            //is the client dropped?
                            client.Dropped = seasonClient.Dropped ? 1 : 0;

                            //total credit
                            client.TotalCredit = '--';

                            //TODO #4933 start update to use client bundles & bundle input choices to calculate client total credit
                            vm.ds.fetchVSeasonClientCredit(client.DistrictId, client.SeasonId, client.ClientId)
                                .then(function (data) {
                                    var seasonClientCredit = data.results[0];
                                    if (seasonClientCredit != null) {
                                        client.TotalCredit = 0;
                                        client.TotalCredit = seasonClientCredit.TotalCredit;
                                    }
                                })
                                .catch(
                                    function (err) {
                                        alert(err);
                                        return null;
                                    });
                            //TODO #4933 end update to use client bundles & bundle input choices to calculate client total credit

                            //add the client
                            vm.Clients.push(client);
                        }
                    });
                    vm.filteredClients = vm.Clients;
                }
            }                                

            $timeout(function() {
                vm.clientsLoading = 0;
            });
        }

        function searchClients() {
            if (vm.Clients != null && vm.Clients.length > 0 &&
                vm.search != null && vm.search.length > 0) {

                var search = vm.search.toLowerCase();

                vm.filteredClients = vm.Clients.filter(function (c) {
                    return (c.FirstName.toLowerCase().indexOf(search) > -1 ||
                            c.LastName.toLowerCase().indexOf(search) > -1 ||
                            c.ClientId.toString().indexOf(search) > -1);
                });
            }
            else {
                vm.filteredClients = vm.Clients;
            }
        }

        // initialization complete.  Return viewmodel
        return vm;

    }
})();