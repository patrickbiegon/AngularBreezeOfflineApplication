(function () {
    angular.module('Enrollment').factory('localpersistence',
    ['BaseDataService', '$q', '$rootScope', '$timeout', '$location', '$localForage', localpersistence]);

    function localpersistence(bds, $q, $rootScope, $timeout, $location, $lf) {

        var lp = {
            
            fetchDistrictData: fetchDistrict,
            fetchSites: fetchSites,
            fetchClientPhoneNumbers: fetchClientPhoneNumbers,
            fetchClientBundles: fetchClientBundles,
            fetchRegionalSettings: fetchRegionalSettings,

            persistToLocalData: persistToLocalData,
            persistFromLocalData: persistFromLocalData

        }

        return lp;

        //fetches district, sector, sites...
        //filters active groups, calculates group total enrolled & group total credit
        //filters season clients, calculates client total credit
        function fetchDistrict(districtId, seasonId, siteId) {

            fetchSite(districtId, seasonId, siteId)
                .then(function(data) {

                    //get active site(s)
                    var fetchedSites = data.results;
                    if (fetchedSites != null && fetchedSites.length > 0) {
                        fetchedSites.forEach(function(site) {

                            //filter groups on active groups
                            var groups = site.Groups.filter(function(group) {
                                return (group.DistrictId == site.DistrictId &&
                                    group.SiteId == site.SiteId &&
                                    group.Active == 1);
                            });

                            if (groups != null && groups.length > 0) {
                                groups.forEach(function(group) {

                                    //initialize group total enrolled
                                    group.TotalEnrolled = 0;
                                    //initialize group total credit
                                    group.TotalCredit = '--';

                                    //filter season clients on season
                                    var seasonClients = group.SeasonClients.filter(function(sc) {
                                        return sc.SeasonId == seasonId;
                                    });

                                    if (seasonClients != null && seasonClients.length > 0) {

                                        //calculate group total enrolled
                                        group.TotalEnrolled += seasonClients.length;

                                        seasonClients.forEach(function(seasonClient) {

                                            //get client
                                            var client = seasonClient.Client;
                                            if (client != null) {

                                                //is the client a group leader?
                                                if (client.Facilitator) {
                                                    client.GroupLeader = 1;
                                                }

                                                //is the client dropped?
                                                client.Dropped = seasonClient.Dropped ? 1 : 0;

                                                //get client bundles
                                                var clientId = client.ClientId;
                                                fetchClientBundles(districtId, clientId);

                                                //todo calculate client total credit
                                                client.TotalCredit = '--';

                                                //get client phone numbers
                                                var globalClientId = client.GlobalClientId;
                                                fetchClientPhoneNumbers(districtId, globalClientId)
                                                    .then(function(data) {
                                                        var clientPhoneNumbers = data.results;
                                                        if (clientPhoneNumbers != null && clientPhoneNumbers.length > 0) {
                                                            client.MainPhoneNumber = clientPhoneNumbers[0];
                                                        } else {
                                                            client.MainPhoneNumber = '';
                                                        }
                                                        if (clientPhoneNumbers != null && clientPhoneNumbers.length > 1) {
                                                            client.Mobile1PhoneNumber = clientPhoneNumbers[1];
                                                        } else {
                                                            client.Mobile1PhoneNumber = '';
                                                        }
                                                        if (clientPhoneNumbers != null && clientPhoneNumbers.length > 2) {
                                                            client.Mobile2PhoneNumber = clientPhoneNumbers[2];
                                                        } else {
                                                            client.Mobile2PhoneNumber = '';
                                                        }
                                                    })
                                                    .catch(
                                                        function(err) {
                                                            alert(err);
                                                            return null;
                                                        });

                                                //calculate group total credit                                                
                                                group.TotalCredit += client.TotalCredit;

                                                //update season client's client
                                                seasonClient.Client = client;
                                            }
                                        });

                                        //if no group total credit, then 0
                                        if (group.TotalCredit == '--') {
                                            group.TotalCredit = 0;
                                        }
                                        //update group's season clients
                                        group.SeasonClients = seasonClients;
                                    }
                                });
                                //update site's groups
                                site.Groups = groups;
                            }
                        });
                    }
                })
                .catch(
                    function(err) {
                        alert(err);
                        return null;
                    });
        }

        //fetches district, sector, sites, groups, season clients, clients
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
                .expand('District,Sector,Groups.SeasonClients.Client')
                .where(finalPred);

            return bds.query(qry, districtId);
        }

        //fetches client bundles, bundles, credit cycle bundles, credit cycle, season, and client bundle input choices
        function fetchClientBundles(districtId, seasonId, clientId) {

            var qry = new breeze.EntityQuery({
                from: "ClientBundles",
                expand:
                [
                    "Bundle.BundleInputs.Input",
                    "Bundle.CreditCycleBundles",
                    "Bundle.CreditCycleBundles.CreditCycle.Season",
                    "ClientBundleInputChoices.BundleInput.Input"
                ],
                where: {
                    and:
                    [
                        { "DistrictId": { eq: districtId } },
                        { "Bundle.CreditCycleBundles.CreditCycle.Season.SeasonId": { eq: seasonId } },
                        { "ClientId": { eq: clientId } }
                    ]
                }

            });

            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetches client phone numbers
        function fetchClientPhoneNumbers(districtId, globalClientId) {

            var finalPred;

            var globalClientPred = new breeze.Predicate("GlobalClientId", "eq", globalClientId);
            var activePred = new breeze.Predicate("IsInactive", "eq", 0);

            finalPred = breeze.Predicate.and([globalClientPred, activePred]);

            var qry = breeze.EntityQuery
                .from('ClientPhoneNumbers')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred)
                .orderBy('PhoneNumberTypeId');
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        //fetches regional settings
        function fetchRegionalSettings(countryId) {

            var finalPred;

            var countryPred = new breeze.Predicate("CountryId", "eq", countryId);
            var nationalIdMaskPred = new breeze.Predicate("SettingName", "eq", "NationalIDInputMask");

            finalPred = breeze.Predicate.and([countryPred, nationalIdMaskPred]);

            var qry = breeze.EntityQuery
                .from('RegionalSettings')
                //.noTracking(true) //false by default, set to true when we're NOT caching and NOT editing, which makes it quicker
                .where(finalPred);
            return bds.query(qry, districtId); //passing in a region, country or district(s) specifies the context
        }

        function persistToLocalData(entities) {
            //persist the data to the local persistence
            return $lf.setItem('Data', entities)
                .then(function() {
                    //persist the changes to the local persistence
                    $lf.setItem('Changes', '');
                });
        }

        function persistFromLocalData() {

            var entityManager = bds.getManagers(0);

            //persist the data from the local persistence
            return $lf.getItem('Data', false)
                .then(function(localData) {
                    if (localData != null) {
                        entityManager.importEntities(localData);
                    }
                    //persist the changes from the local persistence
                    $lf.getItem('Changes', false)
                        .then(function(localChanges) {
                            if (localChanges != null) {
                                entityManager.importEntities(localChanges);
                            }
                        });
                });
        }
    }
})();