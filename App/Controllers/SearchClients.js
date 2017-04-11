(function () {
    angular.module('Enrollment').controller('SearchClientsController',
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
        vm.SelectedClients = [];
        vm.sortColumn = 'ClientId';
        vm.sortReverse = false;
        vm.search = '';
        vm.filteredClients = [];
        vm.searchClients = searchClients;

        vm.isAdding = false;
        vm.clearClients = clearClients;
        vm.saveClients = saveClients;

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
            var groups = vm.site.Groups.filter(function (group) {
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
            if (vm.district.DistrictId > 0 && vm.season.SeasonId > 0 && vm.group.GroupId > 0) {
                vm.clientsLoading = 1;
                vm.Clients = [];

                var siteGroups = vm.site.Groups;
                if (siteGroups != null && siteGroups.length > 0) {
                    siteGroups.forEach(function (siteGroup) {

                        var groupSeasonClients = siteGroup.SeasonClients;
                        if (groupSeasonClients != null && groupSeasonClients.length > 0) {
                            groupSeasonClients.forEach(function (seasonClient) {

                                var client = seasonClient.Client;

                                console.log('sc:'+seasonClient);

                                var existingClient = vm.Clients.filter(function(c) {
                                    return (c.DistrictId == client.DistrictId &&
                                        c.ClientId == client.ClientId);
                                });
                                if (existingClient != null && existingClient.length == 1 &&
                                    seasonClient.SeasonId > existingClient.SeasonId) {
                                    vm.Clients.pop(existingClient);
                                    client = existingClient;
                                    client.SeasonClient = seasonClient;
                                }
                                else {
                                    client.SeasonClient = seasonClient;                                    
                                }

                                //is the client a group leader?
                                if (seasonClient.Facilitator) {
                                    client.GroupLeader = 1;
                                } else {
                                    client.GroupLeader = 0;
                                }

                                //season name
                                console.log('season'+vm.season.SeasonName);
                                client.SeasonName = vm.season.SeasonName;

                                //group name
                                client.GroupName = seasonClient.Group.Name;

                                //is the client enrolled?
                                if (seasonClient.SeasonId == vm.season.SeasonId) {
                                    client.Enrolled = 1;
                                } else {
                                    client.Enrolled = 0;
                                }

                                //total credit
                                client.TotalCredit = '--';

                                //TODO #4933 start update to use client bundles & bundle input choices to calculate client total credit
                                //vm.ds.fetchVSeasonClientCredit(client.DistrictId, client.SeasonId, client.ClientId)
                                //    .then(function(data) {
                                //        var seasonClientCredit = data.results[0];
                                //        if (seasonClientCredit != null) {
                                //            client.TotalCredit = 0;
                                //            client.TotalCredit = seasonClientCredit.TotalCredit;
                                //        }
                                //    })
                                //    .catch(
                                //        function(err) {
                                //            alert(err);
                                //            return null;
                                //        });
                                //TODO #4933 end update to use client bundles & bundle input choices to calculate client total credit

                                client.IsSelected = 0;

                                //add the client
                                vm.Clients.push(client);
                            });
                            vm.filteredClients = vm.Clients;
                        }
                    });
                }                                                

                $timeout(function() {
                    vm.clientsLoading = 0;
                });
            }
        }

        function searchClients() {
            if (vm.Clients != null && vm.Clients.length > 0 &&
                vm.search != null && vm.search.length > 0) {

                var search = vm.search.toLowerCase();

                vm.filteredClients = vm.Clients.filter(function (c) {
                    return (c.FirstName.toLowerCase().indexOf(search) > -1 ||
                            c.LastName.toLowerCase().indexOf(search) > -1 ||
                            c.ClientId.toString().indexOf(search) > -1 ||
                            c.SeasonName.toLowerCase().indexOf(search) ||
                            c.GroupName.toLowerCase().indexOf(search));
                });
            }
            else {
                vm.filteredClients = vm.Clients;
            }
        }

        function clearClients() {
            vm.Clients.forEach(function(client) {
                client.IsSelected = false;
            });
            vm.filteredClients = vm.Clients;
        }

        function saveClients() {
            if (vm.Clients != null && vm.Clients.length > 0) {
                
                //add clients to group
                vm.Clients.forEach(function (client) {

                    if (client.IsSelected) {
                        var sc = client.SeasonClient;

                        //add client to group

                        if (sc.SeasonId == vm.season.SeasonId) {
                            //existing season client
                            client.SeasonClient.GroupId = vm.group.GroupId;
                        } else {
                            //new season client
                            var newSeasonClient = {};
                            newSeasonClient.DistrictId = sc.DistrictId;
                            newSeasonClient.SeasonId = vm.season.SeasonId;
                            newSeasonClient.ClientId = sc.ClientId;
                            newSeasonClient.GroupId = sc.GroupId;
                            newSeasonClient.NewMember = sc.NewMember;
                            newSeasonClient.Facilitator = sc.Facilitator;
                            newSeasonClient.Dropped = sc.Dropped;
                            newSeasonClient.DroppedDate = sc.DroppedDate;
                            newSeasonClient.Timestamp = sc.Timestamp;
                            newSeasonClient.LandVerified = sc.LandVerified;
                            newSeasonClient.RepaymentsRefund = sc.RepaymentsRefund;

                            //TODO #4917 SEASON CLIENT VALIDATION

                            //create new season client
                            var newSeasonClientData = vm.ds.createNewSeasonClient(newSeasonClient);
                            newSeasonClient = newSeasonClientData[0];
                            client.SeasonClient = newSeasonClient;
                        }
                    }                    
                });

                //save changes
                vm.ds.saveChanges()
                    .then(function(data) {

                        if (data != null) {
                            //errors
                            if (data.length > 1 && data[1] != null) {
                                //revert back into adding mode
                                vm.isAdding = true;
                                return false;
                            }
                            //entities
                            if (data.length > 0 && data[0] != null) {
                                //todo refresh the list?
                                //refresh the page
                                window.location =
                                    '#/SearchClients' +
                                    '/district/' + vm.district.DistrictId +
                                    '/season/' + vm.season.SeasonId +
                                    '/site/' + vm.site.SiteId +
                                    '/group/' + vm.group.GroupId;

                                return true;
                            }
                        }

                    })
                    .catch(function(err) {
                        alert(err);
                        vm.isEditing = true;
                        return false;
                    });
            }
        }

        // initialization complete.  Return viewmodel
        return vm;

    }
})();