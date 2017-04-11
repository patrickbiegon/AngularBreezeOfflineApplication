(function () {
    angular.module('Enrollment').controller('GroupManagementController',
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
        vm.groupsLoading = 1;
        vm.Group = {};
        vm.Groups = [];
        vm.sortColumn = 'Name';
        vm.sortReverse = false;
        vm.search = '';
        vm.filteredGroups = [];
        vm.searchGroups = searchGroups;
        vm.saveNewGroup = saveNewGroup;

        vm.isAdding = true;
        vm.groupName = "";
       
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
            vm.hidenav = $routeParams.hidenav;

            console.log(vm.country.CountryId);
            console.log(vm.district.DistrictId);
            console.log(vm.season.SeasonId);
            console.log(vm.site.SiteId);
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

                        getGroups();
                    }
                })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    });
        }

        function getGroups() {
            vm.groupsLoading = 1;
            vm.Groups = [];

            var siteGroups = vm.site.Groups;
            if (siteGroups != null && siteGroups.length > 0) {
                var groups = siteGroups.filter(function (group) {
                    return (group.DistrictId == vm.site.DistrictId &&
                            group.SiteId == vm.site.SiteId &&
                            group.Active == 1);
                });
                if (groups != null && groups.length > 0) {
                    groups.forEach(function (group) {

                        group.TotalEnrolled = 0;
                        group.TotalCredit = '--';

                        if (group.SeasonClients != null && group.SeasonClients.length > 0) {
                            var seasonClients = group.SeasonClients.filter(function (sc) {
                                return sc.SeasonId == vm.season.SeasonId;
                            });
                            if (seasonClients != null && seasonClients.length > 0) {
                                group.TotalEnrolled += seasonClients.length;
                                seasonClients.forEach(function (sc) {

                                    //TODO #4933 start update to use client bundles & bundle input choices to calculate group total credit
                                    vm.ds.fetchVSeasonClientCredit(sc.DistrictId, sc.SeasonId, sc.ClientId)
                                        .then(function (data) {
                                            var seasonClientCredit = data.results[0];
                                            if (seasonClientCredit != null) {
                                                if (group.TotalCredit != '--') {
                                                    group.TotalCredit += seasonClientCredit.TotalCredit;
                                                } else {
                                                    group.TotalCredit = 0;
                                                    group.TotalCredit = seasonClientCredit.TotalCredit;
                                                }
                                            }
                                        })
                                        .catch(
                                            function (err) {
                                                alert(err);
                                                return null;
                                            });
                                    //TODO #4933 end update to use client bundles & bundle input choices to calculate group total credit
                                });

                                if (group.TotalCredit == '--') {
                                    group.TotalCredit = 0;
                                }

                                $timeout(function () {
                                    $scope.$apply();
                                });
                            }
                        }

                        //add the group
                        vm.Groups.push(group);

                    });
                    vm.filteredGroups = vm.Groups;
                }
            }                

            $timeout(function () {
                vm.groupsLoading = 0;
            });
        }

        function searchGroups() {
            if (vm.Groups != null && vm.Groups.length > 0 &&
                vm.search != null && vm.search.length > 0) {

                var search = vm.search.toLowerCase();

                vm.filteredGroups = vm.Groups.filter(function (s) {
                    return (s.Name.toLowerCase().indexOf(search) > -1);
                });
            }
            else {
                vm.filteredGroups = vm.Groups;
            }
        }

        function saveNewGroup() {
           
            vm.errorMessage = "";
            vm.actionError = false;
            vm.actionStatus = false;
            vm.successMessage = "";
           
            if (IsRequired(vm.groupName) === true && IsAlpha(vm.groupName) === true) {
                var groupToCreate = {
                    DistrictId: vm.district.DistrictId,
                    SiteId: vm.site.SiteId,
                    GroupId: vm.Groups.count++,
                    groupName:vm.groupName
                };

                //create new client
                var newGroupData = vm.ds.createNewGroup(groupToCreate);
                console.log(newGroupData);
                var newGroup = newGroupData[0];


                vm.Groups.push(groupToCreate);

                vm.actionStatus = true;
                vm.successMessage = "Group created";

                // temp - save changes -this need to go once we get offline saving capability in place
                vm.ds.saveChanges()
                    .then(function (data) {

                        if (data != null) {
                            //errors
                            if (data.length > 1 && data[1] != null) {
                                //revert back into editing mode
                                vm.isEditing = true;
                                return false;
                            }
                            //entities
                            if (data.length > 0 && data[0] != null) {
                                //refresh the page
                                window.location =
                                    '#/ClientDetails' +
                                    '/district/' + vm.district.DistrictId +
                                    '/season/' + vm.season.SeasonId +
                                    '/site/' + vm.site.SiteId +
                                    '/group/' + vm.group.GroupId;
                                return true;
                            }
                        }

                    })
                    .catch(function (err) {
                        alert(err);
                        vm.isEditing = true;
                        return false;
                    });
            } else
            {
                vm.actionError = true;
            }
        }

        function cancel() {
            alert('cancel');
            vm.isAdding = false;
        }

        //valid group name
       function IsRequired(value) {
           //group name is required
           if ((!value || value === '' || value === undefined)) {
               vm.errorMessage += "Group name is required.";
               return false
           } else {
               //group name is unique
               return true;
           }

       }
       function IsAlpha(value)
       {
           var alphaRegex = /^[a-z]+$/i;
           if (alphaRegex.test(value) == true) {
               return true;
           } else {
               vm.errorMessage += "Only characters allowed as group name.";
               return false
           }
       }

      
        // initialization complete.  Return viewmodel
        return vm;

    }
})();