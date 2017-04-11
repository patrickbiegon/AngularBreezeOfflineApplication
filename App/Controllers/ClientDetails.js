(function () {
    angular.module('Enrollment').controller('ClientDetailsController',
    ['$q', '$scope', '$rootScope', '$timeout', '$location', '$localForage', '$filter', '$modal', 'dataservice', '$routeParams', 'yaaaService', controller]);


    function controller($q, $scope, $rootScope, $timeout, $location, $lf, $filter, $modal, dataservice, $routeParams,yaaas) {

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
        vm.client = {};
        vm.clientCopy = {};
        vm.client.ClientId = 0;
        vm.clientLoading = 1;
        vm.client.MainPhoneNumber = {};
        vm.client.MainPhoneNumber.PhoneNumber = '';
        vm.client.Mobile1PhoneNumber = {};
        vm.client.Mobile1PhoneNumber.PhoneNumber = '';
        vm.client.Mobile2PhoneNumber = {};
        vm.client.Mobile2PhoneNumber.PhoneNumber = '';

        vm.isEditing =true;
        vm.clearClient = clearClient;
        vm.saveClient = saveClient;

        vm.actionError = false;
        vm.actionStatus = false;
        vm.errorMessage = "";
        vm.successMessage = "";

        vm.clientPhoneNumbers=[];

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
            vm.client.ClientId = $routeParams.clientId ? $routeParams.clientId : 0;
            vm.hidenav = $routeParams.hidenav;

            console.log(vm.country.CountryId);
            console.log(vm.district.DistrictId);
            console.log(vm.season.SeasonId);
            console.log(vm.site.SiteId);
            console.log(vm.group.GroupId);
            console.log(vm.client.ClientId);
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
                .then(function (data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.district = data.results[0];
                    }
                })
                .catch(
                    function (err) {
                        alert(err);
                        return null;
                    });
        }

        function getSeason() {
            vm.ds.fetchSeason(vm.district.DistrictId, vm.season.SeasonId)
                .then(function (data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.season = data.results[0];
                    }
                })
                .catch(
                    function (err) {
                        alert(err);
                        return null;
                    });
        }

        function getSite() {
            vm.ds.fetchSites(vm.district.DistrictId, vm.season.SeasonId, vm.site.SiteId)
                .then(function (data) {
                    if (data != null && data.results != null && data.results.length > 0) {
                        vm.site = data.results[0];

                        getGroup();
                    }
                })
                .catch(
                    function (err) {
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

                getClient();
            }
        }

        function getClient() {
            if (vm.client.ClientId > 0) {
                vm.clientLoading = 1;
                vm.clientClientId = vm.client.ClientId;
                vm.client = {};
                vm.client.ClientId = vm.clientClientId;

                //get client
                var groupSeasonClients = vm.group.SeasonClients;
                var seasonClients = groupSeasonClients.filter(function(sc) {
                    return (sc.DistrictId == vm.group.DistrictId &&
                            sc.SeasonId == vm.season.SeasonId &&
                            sc.GroupId == vm.group.GroupId &&
                            sc.Client.ClientId == vm.client.ClientId);
                });

                if (seasonClients != null && seasonClients.length > 0) {

                    vm.client = seasonClients[0].Client;

                    //get client phone numbers
                    vm.ds.fetchClientPhoneNumbers(vm.client.DistrictId, vm.client.GlobalClientId)
                        .then(function(data) {
                            var clientPhoneNumbers = data.results;
                            if (clientPhoneNumbers != null && clientPhoneNumbers.length > 0) {
                                vm.client.MainPhoneNumber = clientPhoneNumbers[0];
                            } else {
                                vm.client.MainPhoneNumber = '';
                            }
                            if (clientPhoneNumbers != null && clientPhoneNumbers.length > 1) {
                                vm.client.Mobile1PhoneNumber = clientPhoneNumbers[1];
                            } else {
                                vm.client.Mobile1PhoneNumber = '';
                            }
                            if (clientPhoneNumbers != null && clientPhoneNumbers.length > 2) {
                                vm.client.Mobile2PhoneNumber = clientPhoneNumbers[2];
                            } else {
                                vm.client.Mobile2PhoneNumber = '';
                            }
                            copyClient();
                        })
                        .catch(function(err) {
                            alert(err);
                            return null;
                        })
                        .finally(function() {
                            $timeout(function() {
                                vm.clientLoading = 0;
                            });
                        });
                }
            } else {
                copyClient();
                $timeout(function() {
                    vm.clientLoading = 0;
                });
            }
        }

        function saveClient() {

            if (vm.client.NationalId != vm.clientCopy.NationalId ||
                vm.client.LastName != vm.clientCopy.LastName ||
                vm.client.FirstName != vm.clientCopy.FirstName || 
                vm.client.MainPhoneNumber != vm.clientCopy.MainPhoneNumber ||
                vm.client.Mobile1PhoneNumber != vm.clientCopy.Mobile1PhoneNumber ||
                vm.client.Mobile2PhoneNumber != vm.client.Mobile2PhoneNumber) {

                //TODO #4917 CLIENT VALIDATION
                if (Alpha(vm.client.LastName) && vm.Alpha(vm.client.FirstName)) {

                    if (vm.client.ClientId > 0) {
                        //existing client
                        saveExistingClient();
                    }
                    else {

                        //new client
                        saveNewClient();
                    }
                } else
                {
                    console.log("validation failed");
                }
                //TODO add client to group

                //TODO #4933 SEASON CLIENT VALIDATION
            }
        }

        function saveExistingClient() {
            //save changes
            //prevent changing of name if been sync -status -not new --?modified.
            vm.ds.saveChanges()
                .then(function (data) {

                    if (data != null) {
                        //errors
                        if (data.length > 1 && data[1] != null) {
                            alert(data[1]);
                            vm.isEditing = true;
                            return false;
                        }
                        //entities
                        if (data.length > 0 && data[0] != null) {
                            alert("Client successfully saved.");

                            //refresh the copy
                            copyClient();
                            return true;
                        }
                    }

                })
                .catch(function (err) {
                    alert(err);
                    vm.isEditing = true;
                    return false;
                });
        }

        function saveNewClient() {
            //get next max client id

            //vm.client.ClientId = maxClientId;

            //create new client
            var newClientData = vm.ds.createNewClient(vm.client);
            var newClient = newClientData[0];
            vm.client = newClient;

            //save changes
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
                                '/group/' + vm.group.GroupId +
                                '/client/' + vm.client.ClientId;
                            return true;
                        }
                    }

                })
                .catch(function (err) {
                    alert(err);
                    vm.isEditing = true;
                    return false;
                });

        }

        function copyClient() {
            for (var property in vm.client)
                vm.clientCopy[property] = vm.client[property];
        }

        function clearClient() {
            for (var property in vm.client)
                vm.client[property] = vm.clientCopy[property];
        }

        /**/
        function Alpha(value) {
            var alphaRegex = "/^[a-z]+$/i";
            if (alphaRegex.test(value) == true) {
                return true;
            } else {
                vm.errorMessage = true;
                vm.errorMessage = "Only characters allowed in " + fieldName;
                return false
            }
        }
        function Numeric(value, fieldName) {
            var numericRegex = "/^[0-9]+$/";
            if (!numericRegex.test(value)) {
                vm.errorMessage = true;
                vm.errorMessage = "Only alpanumerics is allowed in " + fieldName;
                return false
            }
        }
        function isRequired(value,fieldName) {
            if ((!value || value === '' || value === undefined)) {
                vm.errorMessage = true;
                vm.errorMessage =fieldName+ " is required";
                return false
            } else {
                //group name is unique
                return true;
            }
        }
        function PhoneHasNotBeenUsed(value) {
            console.log(value);
            if (vm.clientPhoneNumbers) { // check if the phoneNumbers have been loaded yet
                var numbers = []; // for holding the phoneNumbers of the stacks
                angular.forEach(vm.clientPhoneNumbers, function (number) {
                    numbers.push(number); // put the phoneNumbers in the array
                });
                return numbers.indexOf($value) === -1; // returns true if the phoneNumber doesn't exist in the array; false otherwise
            }

        }
        function NationalIDHasNotBeenUsed($value) {
            console.log($value);
            if (vm.clientPhoneNumbers) { // check if the phoneNumbers have been loaded yet
                var numbers = []; // for holding the phoneNumbers of the stacks
                angular.forEach(vm.clientPhoneNumbers, function (number) {
                    numbers.push(number); // put the phoneNumbers in the array
                });
                return numbers.indexOf($value) === -1; // returns true if the phoneNumber doesn't exist in the array; false otherwise
            }
        }
        function NationalIDInCorrectFormat()
        {

        }
        function ClientState(group) {
            var aspect;
            if (group.entityAspect) {
                aspect = group.entityAspect;
                var entityState = aspect.entityState;
                if (entityState.isUnchanged()) {
                    return 0;
                }
                if (entityState.isAdded()) {
                    return 1;
                }
                if (entityState.isModified()) {
                    return 2;
                }
                if (entityState.isAdded()) {
                    return 3;
                }
            } else {
                aspect = group.complexAspect;
                if (aspect.originalValues && !__isEmpty(aspect.originalValues)) {

                }
            }
        }

        
        // initialization complete.  Return viewmodel
        return vm;

    }
})();