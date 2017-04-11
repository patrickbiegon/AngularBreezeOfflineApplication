(function () {
    angular.module('Enrollment').controller('SiteManagementController',
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
        vm.onSelectionChange = onSelectionChange;
        vm.sitesLoading = 1;
        vm.Sites = [];
        vm.sortColumn = 'Name';
        vm.sortReverse = false;
        vm.search = '';
        vm.filteredSites = [];
        vm.searchSites = searchSites;

        vm.downloadSite = downloadSite;
        vm.uploadSite = uploadSite;
        vm.syncSite = syncSite;

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
            vm.hidenav = $routeParams.hidenav;

            console.log(vm.country.CountryId);
            console.log(vm.district.DistrictId);
            console.log(vm.season.SeasonId);
            console.log(vm.hidenav);

            if (vm.district.DistrictId && vm.season.SeasonId) vm.seasonList = vm.district.DistrictId + '_' + vm.season.SeasonId;
            else if (vm.district.DistrictId) vm.districtList = vm.district.DistrictId;
            else if (vm.country.CountryId) vm.countryList = vm.country.CountryId;

            getCountry();
            getDistrict();
            getSeason();
            getSites();
        }

        function onSelectionChange() {
            if ((!vm.district || !vm.district.DistrictId) || (!vm.season || !vm.season.SeasonId)) {
                return;
            }
            else {
                getSites();
            }
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

                        getSites()
                    }
                })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    });
        }

        function getSites() {
            vm.sitesLoading = 1;
            vm.Sites = [];

            vm.ds.fetchSites(vm.district.DistrictId, vm.season.SeasonId, 0)
                .then(function(data) {
                        var fetchedSites = data.results;

                        if (fetchedSites != null && fetchedSites.length > 0) {
                            fetchedSites.forEach(function (site) {

                                site.TotalGroups = '--';

                                var siteGroups = site.Groups;
                                if (siteGroups != null && siteGroups.length > 0) {
                                    site.Groups.forEach(function (group) {
                                        var groupSeasonClients = group.SeasonClients.filter(function (sc) {
                                            return sc.DistrictId == vm.district.DistrictId &&
                                                    sc.SeasonId == vm.season.SeasonId;
                                        });
                                        if (groupSeasonClients != null && groupSeasonClients.length > 0) {
                                            if (site.TotalGroups != '--') {
                                                site.TotalGroups += 1;
                                            } else {
                                                site.TotalGroups = 0;
                                                site.TotalGroups += 1;
                                            }
                                        }
                                    });
                                }

                                //add the site
                                vm.Sites.push(site);

                            });
                        }

                        vm.filteredSites = vm.Sites;
                    })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    })
                .finally(function() {
                    $timeout(function() {
                        vm.sitesLoading = 0;
                    });
                });
        }

        function searchSites() {
            if (vm.Sites != null && vm.Sites.length > 0 &&
                vm.search != null && vm.search.length > 0) {

                var search = vm.search.toLowerCase();

                vm.filteredSites = vm.Sites.filter(function (s) {
                    return (s.Name.toLowerCase().indexOf(search) > -1);
                });
            }
            else {
                vm.filteredSites = vm.Sites;
            }
        }

        function downloadSite() {

            //todo check for unsynced local changes

            if (confirm('There are unsynced local changes. ' +
                'Any unsynced local changes will be lost. ' +
                'Are you sure you want to download?')) {
                ds.fetchGlobalData(vm.district.DistrictId, vm.season.SeasonId, vm.site.SiteId);
            }            
        }
        
        function uploadSite() {
            ds.saveGlobalData();
        }

        function syncSite() {
            ds.saveGlobalData();
            ds.fetchGlobalData(vm.district.DistrictId, vm.season.SeasonId, vm.site.SiteId);
        }

        // initialization complete.  Return viewmodel
        return vm;

    }
})();