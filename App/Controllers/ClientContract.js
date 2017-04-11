(function () {
    angular.module('Enrollment').controller('ClientContractController',
    ['$q', '$scope', '$rootScope', '$timeout', '$location', '$localForage', '$filter', '$modal', 'dataservice', '$routeParams', 'yaaaService', 'EnrollmentServiceClass', controller]);


    function controller($q, $scope, $rootScope, $timeout, $location, $lf, $filter, $modal, dataservice, $routeParams, yaaas, EnrollmentServiceClass) {

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

        vm.bundles = [];
        vm.creditCycleBundles = [];

        vm.clientBundles = [];
        vm.totalCredit = {};

        vm.creditCycle = {};
        vm.creditCycle.CreditCycleId = 0;

        vm.isEditing = false;
        vm.clearClient = clearClient;
        vm.saveClient = saveClient;

        vm.clientBundleInputChoices = [];

        vm.newBundle = {
            editType: 'create',
            AtWillDistributions: [],
            BundleId: -1,
            BundleQuantity: -1,
            ClientId: -1,
            ClientBundleContractDate: new Date(),
            ClientBundleInputChoices: [],
            ClientBundlestatusId: 0,
            CreateAtCRUDLocationTypeId: 0,
            DistrictId: -1,
            GroupId: -1,

            //Used in getting which bundle the user selected
            Index: -1
        };
        vm.selectedBundleSelectionGroups = [];

        vm.makeEditable = copyClientToBeEditable;
        vm.refreshSelectionGroups = refreshSelectionGroups;

        dataservice.setOnReadyHandler(activate);

        //Once a selection has been made, we'll need to determine which selection groups need listed 
        $scope.$watch(function () { return vm.newBundle.Index; }, function (newValue, oldValue) {
            //Once we have selected a bundle, then we need to determine which selection groups we have
            vm.refreshSelectionGroups();
        });

        vm.saveBundleEdits = function () {

            if (vm.newBundle.editType == 'create') {
                //Add some of the missing fields first
                vm.newBundle.GroupId = vm.group.GroupId;
                vm.newBundle.ClientId = vm.client.ClientId;
                vm.newBundle.DistrictId = vm.district.DistrictId;
                vm.newBundle.BundleId = vm.bundles[vm.newBundle.Index].BundleId;

                dataservice.fetchNextClientBundleId(vm.district.DistrictId).then(function (data) {

                    vm.newBundle.ClientBundleId = data.results[0].ClientBundleId;

                    //Increment the id
                    vm.newBundle.ClientBundleId = vm.newBundle.ClientBundleId + 1;

                    var newClientBundle = EnrollmentServiceClass.createClientBundle(dataservice, vm.newBundle);

                    //cool, so we got our stuff, let's make the client bundle input choices and save them to this object
                    EnrollmentServiceClass.createClientBundleInputChoices(vm.district.DistrictId, dataservice, vm.selectedBundleSelectionGroups, newClientBundle);
                    console.log('Lets see if it worked: ');
                    console.log(newClientBundle);

                    console.log('saving')
                    vm.ds.saveChanges();

                });
            } else if (vm.newBundle.editType == 'edit') {
                //we need to save the changes that we made in the vm.newBundle object to the object that we were modifying
                var modifiedObject = {};

                //Find the client bundle and assign the new values to it
                angular.forEach(vm.clientBundles, function (clientBundle, clientBundleIndex) {
                    if (clientBundle.ClientBundleId == vm.newBundle.ClientBundleId) {
                        modifiedObject = clientBundle;  //assign by reference the client bundle that we want to modify

                        //let's change the modified object
                        modifiedObject.BundleId = vm.newBundle.BundleId;
                        modifiedObject.BundleQuantity = vm.newBundle.BundleQuantity;
                        modifiedObject.ClientBundleContractDate = vm.newBundle.ClientBundleContractDate;
                        modifiedObject.ClientBundleInputChoices = vm.newBundle.ClientBundleInputChoices;

                        //let's change the modified object
                        console.log('found modified object');
                        console.log(modifiedObject);
                        console.log(vm.newBundle);
                    }
                });
            }
        }
        
        vm.changeMode = function(mode){
            //change from edit to view
            if (mode == 'edit') {
                vm.isAdding = true;
                vm.reinit();
            } else if (mode == 'view') {
                vm.isAdding = false;
                vm.reinit();
            }
        }

        vm.reinit = function (){
            vm.newBundle.editType = 'create';
            vm.newBundle.AtWillDistributions = [];
            vm.newBundle.BundleId = -1;
            vm.newBundle.BundleQuantity = -1;
            vm.newBundle.ClientId = -1;
            vm.newBundle.ClientBundleContractDate = new Date();
            vm.newBundle.ClientBundleInputChoices = [];
            vm.newBundle.ClientBundlestatusId = 0;
            vm.newBundle.CreateAtCRUDLocationTypeId = 0;
            vm.newBundle.DistrictId = -1;
            vm.newBundle.GroupId = -1;

                //Used in getting which bundle the user selected
            vm.newBundle.Index = -1
        }

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
                var seasonClients = groupSeasonClients.filter(function (sc) {
                    return (sc.DistrictId == vm.group.DistrictId &&
                            sc.SeasonId == vm.season.SeasonId &&
                            sc.GroupId == vm.group.GroupId &&
                            sc.Client.ClientId == vm.client.ClientId);
                });

                if (seasonClients != null && seasonClients.length > 0) {

                    vm.client = seasonClients[0].Client;
                    //we need to get the client bundles
                    getClientBundles();

                }
            } else {
                copyClient();
                $timeout(function () {
                    vm.clientLoading = 0;
                });
            }
        }

        function getClientBundles() {
            vm.ds.fetchClientBundles(vm.client.ClientId, vm.client.DistrictId)
                .then(function (data) {

                    vm.clientBundles = data.results;

                    //now let's calculate the total credit
                    vm.totalCredit = EnrollmentServiceClass.calculateClientCredit(vm.client);
                    vm.clientLoading = 0;
                    copyClient();

                    console.log('client bundles');
                    console.log(vm.clientBundles);

                    getCreditCycleBundles();
                    getClientBundleInputChoices();
                })
                .catch(function (err) {
                    alert(err);
                    return null;
                })
                .finally(function () {
                    $timeout(function () {
                        vm.clientLoading = 0;
                    });
                });
        }

        function getCreditCycleBundles() {
            vm.ds.fetchCreditCycleBundles(vm.season.SeasonId, vm.client.DistrictId)
                .then(function (data) {
                    
                    vm.creditCycleBundles = data.results;

                    getBundles();
                })
                .catch(function (err) {
                    alert(err);
                    return null;
                })
                .finally(function () {
                    $timeout(function () {
                        vm.clientLoading = 0;
                    });
                });
        }

        function getBundles() {
            vm.ds.fetchSeasonDistrictBundles(vm.creditCycle.CreditCycleId, vm.client.DistrictId)
                .then(function (data) {

                    angular.forEach(data.results, function (item, index) {
                        angular.forEach(vm.creditCycleBundles, function (creditCycleBundle, ccbIndex) {
                            if (item.BundleId == creditCycleBundle.BundleId)
                                vm.bundles.push(item);
                        });
                    });

                })
                .catch(function (err) {
                    alert(err);
                    return null;
                })
                .finally(function () {
                    $timeout(function () {
                        vm.clientLoading = 0;
                    });
                });
        }

        function getClientBundleInputChoices() {
            vm.ds.fetchClientBundleInputChoices(vm.district.DistrictId)
                .then(function (data) {
                    vm.clientBundleInputChoices = data.results;
                })
                .catch(function (err) {
                    alert(err);
                    return null;
                })
                .finally(function () {
                    $timeout(function () {
                        vm.clientLoading = 0;
                    });
                });
        }

        function refreshSelectionGroups() {
            //let's clear what we have first
            vm.selectedBundleSelectionGroups = [];
            vm.tempSelectedBundleSelectionGroups = [];

            if (!vm.bundles[vm.newBundle.Index].BundleInputs || vm.bundles[vm.newBundle.Index].BundleInputs === '' || vm.bundles[vm.newBundle.Index].BundleInputs === undefined)
            { } else
            {
                console.log(vm.bundles[vm.newBundle.Index]);

                angular.forEach(vm.bundles[vm.newBundle.Index].BundleInputs, function (bundleInput, index) {

                    var cardinalityOfSelectionGroup = -1;
                    angular.forEach(vm.tempSelectedBundleSelectionGroups, function (selectionGroup, indexOfSelectionGroup) {
                        if (selectionGroup.name == bundleInput.SelectionGroup) {
                            cardinalityOfSelectionGroup = indexOfSelectionGroup;
                        }
                    });

                    if (cardinalityOfSelectionGroup == -1) {
                        var newSelectionGroup = {
                            name: bundleInput.SelectionGroup,
                            inputs: [],
                            selection: -1
                        };

                        //add the current bundle input to the inputs list
                        newSelectionGroup.inputs.push(bundleInput);

                        //add the selection group to the list
                        vm.tempSelectedBundleSelectionGroups.push(newSelectionGroup);
                    } else {
                        vm.tempSelectedBundleSelectionGroups[cardinalityOfSelectionGroup].inputs.push(bundleInput);
                    }
                });

                //now let's iterate through the list of selection groups and check the number of inputs available for each one
                //and we'll remove them if there is more than one option for each group
                angular.forEach(vm.tempSelectedBundleSelectionGroups, function (selectionGroup, index) {
                    if (selectionGroup.inputs.length > 1) {
                        vm.selectedBundleSelectionGroups.push(selectionGroup);
                    }
                });

                //set the selection groups
                angular.forEach(vm.newBundle.ClientBundleInputChoices, function (inputChoice, inputIndex) {

                    //find the selection group where we can put the selection into
                    angular.forEach(vm.selectedBundleSelectionGroups, function (selectionGroup, selectionIndex) {

                        if (selectionGroup.name == inputChoice.BundleInput.SelectionGroup) {
                            //then we have a match and we need to save the selection into the selection group
                            console.log('Setting selectionGroup.selection = ' + inputChoice.BundleInputId);
                            selectionGroup.selection = inputChoice.BundleInputId;
                        }
                    });
                });
            }

        }

        function copyClientToBeEditable(clientBundleToCopy) {
            //When we want to edit a client, then we need to copy the client's details from the model to 

            //only copy if we have a different bundle ID
            if (vm.newBundle.BundleId != clientBundleToCopy.BundleId) {
                vm.newBundle.editType = 'edit';
                
                vm.newBundle.AtWillDistributions = clientBundleToCopy.AtWillDistributions;
                vm.newBundle.BundleId = clientBundleToCopy.BundleId;
                vm.newBundle.BundleQuantity = clientBundleToCopy.BundleQuantity;
                vm.newBundle.ClientId = vm.client.ClientId;
                vm.newBundle.ClientBundleContractDate = new Date();
                vm.newBundle.DistrictId = vm.district.DistrictId;
                vm.newBundle.GroupId = vm.group.GroupId;
                vm.newBundle.ClientBundlestatusId = clientBundleToCopy.ClientBundlestatusId;
                vm.newBundle.CreateAtCRUDLocationTypeId = clientBundleToCopy.CreateAtCRUDLocationTypeId;
                vm.newBundle.ClientBundleInputChoices = clientBundleToCopy.ClientBundleInputChoices;
                vm.newBundle.ClientBundleId = clientBundleToCopy.ClientBundleId;

                //set the index
                angular.forEach(vm.bundles, function (bundle, bundleIndex) {
                    if (bundle.BundleId == clientBundleToCopy.BundleId)
                        vm.newBundle.Index = bundleIndex;
                });

                vm.refreshSelectionGroups();

                //set the selection groups
                angular.forEach(vm.newBundle.ClientBundleInputChoices, function (inputChoice, inputIndex) {

                    //find the selection group where we can put the selection into
                    angular.forEach(vm.selectedBundleSelectionGroups, function (selectionGroup, selectionIndex) {

                        if (selectionGroup.name == inputChoice.BundleInput.SelectionGroup) {
                            //then we have a match and we need to save the selection into the selection group
                            console.log('Setting selectionGroup.selection = ' + inputChoice.BundleInputId);
                            selectionGroup.selection = inputChoice.BundleInputId;
                        }
                    });
                });

                console.log('the selection groups');
                console.log(vm.selectedBundleSelectionGroups);

                console.log('Copy Result: ');
                console.log(vm.newBundle);
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

                if (vm.client.ClientId > 0) {
                    //existing client
                    saveExistingClient();
                }
                else {

                    //new client
                    saveNewClient();
                }

                //TODO add client to group

                //TODO #4933 SEASON CLIENT VALIDATION
            }
        }

        function saveExistingClient() {
            //save changes
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
            //vm.ds.fetchNextClientId(vm.district.DistrictId)
            //    .then(
            //        function (data) {
            //var maxClientId = data.results[0].ClientId;
            //maxClientId++;
            //if (maxClientId == 0) {
            //    maxClientId++;
            //}
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
            vm.clientCopy.NationalId = vm.client.NationalId;
            vm.clientCopy.LastName = vm.client.LastName;
            vm.clientCopy.FirstName = vm.client.FirstName;
            vm.clientCopy.MainPhoneNumber = vm.client.MainPhoneNumber;
            vm.clientCopy.Mobile1PhoneNumber = vm.client.Mobile1PhoneNumber;
            vm.clientCopy.Mobile2PhoneNumber = vm.client.Mobile2PhoneNumber;
        }

        function clearClient() {
            vm.client.NationalId = vm.clientCopy.NationalId;
            vm.client.LastName = vm.clientCopy.LastName;
            vm.client.FirstName = vm.clientCopy.FirstName;
            vm.client.MainPhoneNumber = vm.clientCopy.MainPhoneNumber;
            vm.client.Mobile1PhoneNumber = vm.clientCopy.Mobile1PhoneNumber;
            vm.client.Mobile2PhoneNumber = vm.client.Mobile2PhoneNumber;
        }

        // initialization complete.  Return viewmodel
        return vm;

    }
})();