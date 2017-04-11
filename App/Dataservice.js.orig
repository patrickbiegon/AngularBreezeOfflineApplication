/* dataservice: data access and model management layer 
 * relies on Angular injector to provide:
 *     $timeout - Angular equivalent of 'setTimeout'
 *     breeze - the Breeze.Angular service (which is breeze itself)
 */

(function () {
    angular.module('Enrollment').factory('dataservice',
        ['BaseDataService', '$rootScope', '$q', '$timeout', '$window', 'breeze', 'routeParams', 'localpersistence', dataservice]);

    function dataservice(bds, $rootScope, $q, $timeout, $window, breeze, $routeParams, lp) {

        var ds = {

            fetchCountry: fetchCountry,
            fetchDistrict: fetchDistrict,
            fetchSeason: fetchSeason,
            fetchSites: fetchSites,
            fetchGroup: fetchGroup,
            fetchClient: fetchClient,
            fetchVSeasonClientCredit: fetchVSeasonClientCredit,
            fetchClientPhoneNumbers: fetchClientPhoneNumbers,

            fetchNextClientId: fetchNextClientId,
            fetchNextClientBundleId: fetchNextClientBundleId,
            fetchNextClientBundleInputChoiceId: fetchNextClientBundleInputChoiceId,

            fetchCreditCycles: fetchCreditCycles,
            fetchCreditCycleBundles: fetchCreditCycleBundles,
            fetchClientBundles: fetchClientBundles,
            fetchClientBundleInputChoices: fetchClientBundleInputChoices, 
            fetchSeasonDistrictBundles: fetchSeasonDistrictBundles,
            fetchBundleInputs:fetchBundleInputs,
            
            createNewClient: createNewClient,
            createNewClientBundle: createNewClientBundle,
            createNewClientBundleInputChoice: createNewClientBundleInputChoice,
            createNewSeasonClient: createNewSeasonClient,

            calculateClientCredit: calculateClientCredit,

            isOnline: false,
            fetchGlobalData: fetchGlobalData,
            fetchLocalData: fetchLocalData,
            saveGlobalData: saveGlobalData,

            addOnReadyHandler: addOnReadyHandler,
            isReady: false,
            onlineStatus: {},
            checkOnlineStatus: bds.checkOnlineStatus,
            saveChanges: saveChanges,
            navbar: {
                url: {
                    baseUri: "",
                    queryString: ""
                }
            }

        }

        var onReadyHandler = null;

        //fetch the local data
        //1. local data, online, fetch local data, go to the url or the group mgmt page
        //2. local data, offline, fetch local data, go to the url or the group mgmt page
        //3. no local data, online, fetch global data, go to the site mgmt page
        //4. no local data, offline, do nothing, go to the site mgmt page
        fetchLocalData()
            .then(function (data) {

                var districtId = $routeParams.districtId ? $routeParams.districtId : 0;
                var seasonId = $routeParams.seasonId ? $routeParams.seasonId : 0;
                var siteId = $routeParams.siteId ? $routeParams.siteId : 0;

                //configure the bds
                var initBds = bds.initBDS({
                    serviceName: '/breeze/Enrollment',
                    instanceType: "live",
                    onReadyHandler: function() {
                        if (onReadyHandler) onReadyHandler();
                        ds.isReady = true;
                    },
                });

                if (data != null) {
                    initBds.then(function (data) {
                        //finish configuring the bds
                        setIsReady();
                        //1. local data, online, fetch local data, go to the url or the group mgmt page
                        //2. local data, offline, fetch local data, go to the url or the group mgmt page
                        bds.checkOnlineStatus
                            .then(function(data) {
                                ds.isOnline = ds.onlineStatus.server;
                                //online or offline - go to the url or the group mgmt page
                                var url = $window.location.toLowerCase();
                                if (url == '/' || url.indexOf('sitemanagement') != -1) {
                                    if (districtId > 0 && seasonId > 0 && siteId > 0) {
                                        //go to the group mgmt page
                                        $window.location =
                                            '/GroupManagement' +
                                            '/district/' + districtId +
                                            '/season/' + seasonId +
                                            '/site/' + siteId;
                                    }
                                }
                            });
                    });

                } else {
                    initBds.then(function(data) {
                        //3. no local data, online, fetch global data, go to the site mgmt page
                        //4. no local data, offline, do nothing, go to the site mgmt page
                        bds.checkOnlineStatus
                            .then(function(data) {
                                ds.isOnline = ds.onlineStatus.server;
                                if (isOnline) {
                                    //online - fetch global data
                                    if (districtId > 0 && seasonId > 0 && siteId > 0) {
                                        fetchGlobalData(districtId, seasonId, siteId)
                                            .then(function(data) {
                                                //go to the site mgmt page
                                                $window.location =
                                                    '/SiteManagement' +
                                                    '/district/' + districtId +
                                                    '/season/' + seasonId +
                                                    '/site/' + siteId;
                                            });
                                    }
                                } else {
                                    //offline - do nothing
                                    //go to the site mgmt page
                                    $window.location = '/';
                                }
                            });
                    });
                }
            })
            .catch(
                function(err) {
                    console.dir(err);
                    return null;
                });

    	// initialiazation complete, return the object
        return ds;

        function addOnReadyHandler(handler) {
        	if (!ds.isReady) {
        		onReadyHandler = handler;
        	} else
        	{
        		handler();
        	}
        }

        //fetch country
        function fetchCountry(countryId) {

            var countryPred = new breeze.Predicate("CountryId", "eq", countryId);

            var qry = breeze.EntityQuery
                .from('Countries')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(countryPred);
            return bds.query(qry, countryId); //passing in a region, country or district(s) specifies the context
        }

        //fetch district
        function fetchDistrict(districtId) {

            var districtPred = new breeze.Predicate("DistrictId", "eq", districtId);

            var qry = breeze.EntityQuery
                .from('Districts')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(districtPred);
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetch season
        function fetchSeason(districtId, seasonId) {

            var finalPred;

            var districtPred = new breeze.Predicate("DistrictId", "eq", districtId);
            var seasonPred = new breeze.Predicate("SeasonId", "eq", seasonId);

            finalPred = breeze.Predicate.and([districtPred, seasonPred]);

            var qry = breeze.EntityQuery
                .from('Seasons')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred);
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetch sites
        function fetchSites(districtId, seasonId, siteId) {

            var finalPred;

            var districtPred = new breeze.Predicate("DistrictId", "eq", districtId);
            var activePred = new breeze.Predicate("Active", 'eq', 1);

            if (siteId) {
                var sitePred = new breeze.Predicate("SiteId", "eq", siteId);
                finalPred = breeze.Predicate.and([districtPred, activePred, sitePred]);
            } else {
                finalPred = breeze.Predicate.and([districtPred, activePred]);
            }

            var qry = breeze.EntityQuery
                .from('Sites')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .expand('Groups.SeasonClients.Client')
                .where(finalPred)
                .orderBy('Active, Name');
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetch group
        function fetchGroup(districtId, seasonId, siteId, groupId) {

            var finalPred;

            var districtPred = new breeze.Predicate("DistrictId", "eq", districtId);
            var activePred = new breeze.Predicate("Active", 'eq', 1);
            var sitePred = new breeze.Predicate("SiteId", "eq", siteId);
            var groupPred = new breeze.Predicate("GroupId", "eq", groupId);
            finalPred = breeze.Predicate.and([districtPred, activePred, sitePred, groupPred]);

            var qry = breeze.EntityQuery
                .from('Groups')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .expand('SeasonClients.Client')
                .where(finalPred)
                .orderBy('Active, Name');
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //todo start update to use client bundles & bundle input choices to calculate group total credit
        //fetch v season client credit
        function fetchVSeasonClientCredit(districtId, seasonId, clientId) {

            var finalPred;

            var districtPred = new breeze.Predicate('DistrictId', 'eq', districtId);
            var seasonPred = new breeze.Predicate('SeasonId', 'eq', seasonId);
            var clientPred = new breeze.Predicate('ClientId', 'eq', clientId);

            finalPred = breeze.Predicate.and([districtPred, seasonPred, clientPred]);

            var qry = breeze.EntityQuery
                .from('VSeasonClientCredits')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred);
            return bds.query(qry, districtId);
        }
        //todo end update to use client bundles & bundle input choices to calculate group total credit

        //fetch client
        function fetchClient(districtId, seasonId, groupId, clientId) {

            var finalPred;

            var districtPred = new breeze.Predicate("DistrictId", "eq", districtId);
            var seasonPred = new breeze.Predicate("SeasonId", "eq", seasonId);
            var groupPred = new breeze.Predicate("GroupId", "eq", groupId);
            var clientPred = new breeze.Predicate("ClientId", "eq", clientId);
            finalPred = breeze.Predicate.and([districtPred, seasonPred, groupPred, clientPred]);

            var qry = breeze.EntityQuery
                .from('SeasonClients')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .expand('Client')
                .where(finalPred)
                //.select('Client')
                .orderBy('DistrictId, ClientId');
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetch client phone numbers
        function fetchClientPhoneNumbers(districtId, globalClientId) {

            var finalPred;

            var globalClientIdPred = new breeze.Predicate("GlobalClientId", "eq", globalClientId);
            var activePred = new breeze.Predicate("IsInactive", "eq", 0);

            finalPred = breeze.Predicate.and([globalClientIdPred, activePred]);

            var qry = breeze.EntityQuery
                .from('ClientPhoneNumbers')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred)
                .orderBy('PhoneNumberTypeId');
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }
      
        //fetch the credit cycle
        function fetchCreditCycles(seasonId, districtId) {

            var finalPred;

            var seasonIdPred = new breeze.Predicate("SeasonId", "eq", seasonId);

            finalPred = breeze.Predicate.and([seasonIdPred]);

            var qry = breeze.EntityQuery
                .from('CreditCycles')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred)
                .orderBy('CreditCycleID');
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetch the bundles that are associated with the client in the credit cycle
        function fetchClientBundles(clientId, districtId) {
            
            var qry = new breeze.EntityQuery({
                from: "ClientBundles",
                expand: ["Bundle.BundleInputs.Input", "ClientBundleInputChoices.BundleInput.Input", "Bundle.CreditCycleBundles.CreditCycle", "Bundle.CreditCycleBundles"],
                where: {
                    and:
                        [
                            { "ClientId": { eq: clientId } },
                            { "DistrictId": { eq: districtId } }
                            //,{ "BundleId": { in: bundleIdList } }
                        ]
                    }

            });

            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context

            /*
            var finalPred;

            var creditCycleIdPred = new breeze.Predicate("CreditCycleId", "eq", creditCycleId);
            var districtIdPred = new breeze.Predicate("DistrictId", "eq", districtId);

            finalPred = breeze.Predicate.and([creditCycleIdPred, districtIdPred]);


            var qry = breeze.EntityQuery 
                .from('ClientBundles')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred)
                .orderBy('CreditCycleId');
            */
        }

        //fetches all the client bundle input choices
        function fetchClientBundleInputChoices(districtId) {
            var qry = new breeze.EntityQuery({
                from: "ClientBundleInputChoices",
                //expand: "Input",
                noTracking: false,
                where: {
                    and:
                        [
                            { "DistrictId": { eq: districtId } },
                        ]
                }

            });

            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        function fetchSeasonDistrictBundles(creditCycleId, districtId) {
            var qry = new breeze.EntityQuery({
                from: "Bundles",
                expand: "",
                where: {
                    and:
                        [
                            { "DistrictId": { eq: districtId } },
                            //{ "CreditCycleBundles.CreditCycleId": { eq: creditCycleId } }  
                        ]
                }

            });

            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        function fetchCreditCycleBundles(creditCycleId, districtId) {
            var qry = new breeze.EntityQuery({
                from: "CreditCycleBundles",
                expand: "",
                where: {
                    and:
                        [
                            { "DistrictId": { eq: districtId } },
                            { "CreditCycleId": { eq: creditCycleId } }  
                        ]
                }

            });

            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        function fetchBundleInputs(districtId, bundleIdList) {

            var qry = new breeze.EntityQuery({
                from: "BundleInputs",
                expand: "Input",
                where: {
                    and:
                        [
                            { "DistrictId": { eq: districtId } },
                            { "BundleId": { in: bundleIdList } }
                        ]
                }

            });

            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetches next max client id
        function fetchNextClientId(districtId) {

            var qry = breeze.EntityQuery
                .from('Clients')
                .noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where("DistrictId", "eq", districtId)
                .orderBy('ClientId desc')
                .select("ClientId");
            return bds.query(qry, districtId);
        }

        //fetches the next max client bundle id
        function fetchNextClientBundleId(districtId) {
            var qry = breeze.EntityQuery
                .from('ClientBundles')
                .noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where("DistrictId", "eq", districtId)
                .orderBy('ClientBundleId desc')
                .select("ClientBundleId");
            return bds.query(qry, districtId);
        }

        //fetches the next max client bundle inputice i chod
        function fetchNextClientBundleInputChoiceId(districtId, bundleId){
            
            var finalPred;

            var districtPred = new breeze.Predicate("DistrictId", "eq", districtId);
            var BundlePred = new breeze.Predicate("BundleId", "eq", bundleId);
            finalPred = breeze.Predicate.and([districtPred, BundlePred]);

            var qry = breeze.EntityQuery
                .from('ClientBundleInputChoice')
                .noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred)
                .orderBy('ClientBundleId desc')
                .select("ClientBundleId");
            return bds.query(qry, districtId);
        }

        function createNewClient(clientToCreate) {
            var newClient = bds.createEntity('Client', clientToCreate.DistrictId, clientToCreate);
            return newClient;
        }

        function createNewClientBundleInputChoice(districtId, clientBundleInputChoiceToCreate) {
            var newClientBundle = bds.createEntity('ClientBundleInputChoice', districtId, clientBundleInputChoiceToCreate);
            return newClientBundle;
        }

        function createNewClientBundle(clientBundleToCreate) {
            try{
                var newClientBundle = bds.createEntity('ClientBundle', clientBundleToCreate.DistrictId, clientBundleToCreate);
                
                console.log('Our reagents: ');
                console.log(clientBundleToCreate);
                console.log('Ok, we made one with our own bare hands');
                console.log(newClientBundle);

                return newClientBundle;
            } catch (ex) {
                console.log('ERRRRRRRRRRRRRRRR!!!!');
                console.log(ex);
            }
        }

        function createNewSeasonClient(seasonClientToCreate) {
            var newSeasonClient = bds.createEntity('SeasonClient', seasonClientToCreate.DistrictId, seasonClientToCreate);
            return newSeasonClient;
        }

        //calculate the total credit of a client by passing in the client object
        function calculateClientCredit(client) {
            //given a client record, we need to calculate the creddit that client has enrolled in

            //Initialize the credit
            var totalCredit = 0;
            var bundleCosts = [];
            var returnResponse = {
                totalCredit: 0,
                bundleCosts: []
            };

            angular.forEach(client.ClientBundles, function (clientBundle, index) {

                //Bundle related costs
                var bundleQuantity = 0;
                var bundleCostFixed = 0;
                var bundleCostIncremental = 0;
                var bundleCostTotal = 0;

                //Input related costs
                var inputCosts = [];

                bundleQuantity = clientBundle.BundleQuantity;
                bundleCostFixed = clientBundle.Bundle.BundleCost_Fixed;
                bundleCostIncremental = clientBundle.Bundle.BundleCost_PerBundle;

                angular.forEach(clientBundle.ClientBundleInputChoices, function (inputChoice, inputChoiceIndex) {

                    var inputCostFixed = 0;
                    var inputCostIncremental = 0;
                    var inputCostTotal = 0;

                    //determine cost of the components
                    inputCostFixed = inputChoice.BundleInput.CostAdjustment_PerBundle;
                    inputCostIncrementral = inputChoice.BundleInput.CostAdjustment_Fixed;

                    //Calculate the credit per input and save
                    inputCostTotal = inputCostFixed + (inputCostIncremental * bundleQuantity);
                    inputCosts.push(inputCostTotal);
                });

                //Add in the cost of the bundle to the total
                bundleCostTotal += bundleCostFixed + (bundleQuantity * bundleCostIncremental);

                //Add in the cost of each input
                angular.forEach(inputCosts, function (inputCost, index) {
                    bundleCostTotal += inputCost;
                });

                //Save the cost of the bundle back
                bundleCosts.push(bundleCostTotal);

                //add the cost as a property
                clientBundle.bundleCostTotal = bundleCostTotal;
            });

            //Return the sum of all the bundle costs
            angular.forEach(bundleCosts, function (bundleCost, index) {
                totalCredit += bundleCost;
            });

            //We want to append the total and the individual cost of each bundle
            returnResponse.totalCredit = totalCredit;
            returnResponse.bundleCost = bundleCosts;

            console.log(returnResponse.bundleCost);

            return returnResponse;

        }

        //gets the global data, gets the breeze em, exports the entities
        //clears the cache, imports the entities, and persists the local data
        function fetchGlobalData(districtId, seasonId, siteId) {

            //fetch global data
            return ds.fetchDistrict(districtId, seasonId, siteId)
                .then(function(data) {
                    if (data != null && data.length > 0) {
                        //get the breeze entity manager
                        var entityManager = bds.getManagers(0);

                        //export the entities
                        var exportedEntities = entityManager.exportEntities();

                        //clear the the breeze entity manager cache
                        bds.clearCache();

                        //import the entities
                        var importedEntities = entityManager.importEntities(exportedEntities);

                        //persist the data to the local persistence
                        return lp.persistToLocalData(importedEntities);
                    }
                })
                .catch(
                    function(err) {
                        console.dir(err);
                        return null;
                    });
        }

        //clears the cache, fetches the local data
        //gets the breeze em, and imports the entities
        function fetchLocalData() {
            //clear the the breeze entity manager cache
            bds.clearCache();            
            //fetch the data from the local persistence
            return lp.persistFromLocalData()
                .then(function(data) {
                    if (data != null) {
                        //get the breeze entity manager
                        var entityManager = bds.getManagers(0);
                        //import the entities
                        return entityManager.importEntities(data);
                    }                    
                })
                .catch(
                    function(err) {
                        console.dir(err);
                        return null;
                    });
        }

        //saves the changes globally
        //and also persists the changes locally
        function saveGlobalData() {

            //save the changes globally
            saveChanges()
                .then(function(data) {

                    //save the changes locally
                    saveLocalData();

                }).catch(
                    function(err) {
                        console.dir(err);
                        return null;
                    });
        }

        //persists the changes locally
        function saveLocalData() {

            //export the entities
            var exportedEntities = entityManager.exportEntities();

            //persist the data to the local persistence
            return lp.persistToLocalData(exportedEntities);
        }

        function saveChanges() {
        	return bds.saveChanges()
        		.then(function (data) {
        		    console.dir(data);
        		    return data;
        		}).catch(function (err) {
        		    console.dir(err);
        		    return data;
        		});
        }

 	}
})();