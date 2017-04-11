(function () {

    angular.module('Enrollment').factory('EnrollmentServiceClass',
        ['$q', '$timeout', EnrollmentServiceClass]);

    function EnrollmentServiceClass($q, $scope, $timeout) {
        
        //return the functions that we want to expose
        return {
            createClientBundleInputChoices: function (districtId, dataservice, clientBundleInputChoicesToCreate, clientBundle) {
                var clientBundleInputChoices = [];

                //Iterate through each item provided in the array provided
                angular.forEach(clientBundleInputChoicesToCreate, function (clientBundleInputChoiceToCreate, index) {
                    var clientBundleInputChoice;
                    var clientBundleInputChoiceBase = {
                        DistrictId: -1,
                        BundleInputId: -1,
                        ClientBundleId: -1
                    };

                    console.log('Client Bundle');
                    console.log(clientBundle[0]);

                    clientBundleInputChoiceBase.DistrictId = clientBundle[0].DistrictId;
                    clientBundleInputChoiceBase.ClientBundleId = clientBundle[0].ClientBundleId;
                    clientBundleInputChoiceBase.BundleInputId = clientBundleInputChoiceToCreate.selection;

                    clientBundleInputChoice = dataservice.createNewClientBundleInputChoice(districtId, clientBundleInputChoiceBase);

                    console.log('created a new client bundle input choice thing');
                    console.log(clientBundleInputChoice);
                });

                //dataservice.saveChanges();
                return clientBundleInputChoices;
            },

            createClientBundle: function (dataservice, clientBundleToCreate) {
                var clientBundle;

                //logic to create a new client bundle based on the parameters that we pass in
                clientBundle = dataservice.createNewClientBundle(clientBundleToCreate);

                return clientBundle;
            },
            //calculate the total credit of a client by passing in the client object
            calculateClientCredit: function (client) {
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

                    //variable cost per bundleinputs chosen
                    angular.forEach(clientBundle.ClientBundleInputChoices, function (inputChoice, inputChoiceIndex) {

                        var inputCostFixed = 0;
                        var inputCostIncremental = 0;
                        var inputCostTotal = 0;
                        var MinReqQuantity = 0;
                        var MaxReqQuantity = 0;

                        //determine cost of the components
                        inputCostFixed = inputChoice.BundleInput.CostAdjustment_PerBundle;
                        inputCostIncrementral = inputChoice.BundleInput.CostAdjustment_Fixed;
                        //complex pricing
                        if ((inputChoice.BundleInputs.RequiredBundleQuantityFrom || inputChoice.BundleInputs.RequiredBundleQuantityFrom !== '' || inputChoice.BundleInputs.RequiredBundleQuantityFrom !== undefined)) {

                            MinReqQuantity = inputChoice.BundleInputs.RequiredBundleQuantityFrom;
                        }
                        if ((inputChoice.BundleInputs.RequiredBundleQuantityTo || inputChoice.BundleInputs.RequiredBundleQuantityTo !== '' || inputChoice.BundleInputs.RequiredBundleQuantityTo !== undefined)) {

                            MaxReqQuantity = inputChoice.BundleInputs.RequiredBundleQuantityTo;
                        }

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

            },

            sayHello: function (clientBundle) {

                //simply console.log the object banck
                console.log('Keep enrolling clients in these great bundles');
                console.log(clientBundle);
            }
        }
    };

})();
