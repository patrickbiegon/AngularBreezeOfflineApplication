using System.Linq;
using System.Web.Http;
using Breeze.ContextProvider;
using Breeze.WebApi2;
using Newtonsoft.Json.Linq;
using OAF.Database.Models.Roster.Clients;
using OAF.Database.Models.Roster.Enrollment;
using OAF.Database.Models.Roster.Locations;
using OAF.Database.Models.Roster.Seasons;
using OAF.Website.Library.Membership;
using OAF.Website.Library.Web;

namespace OAF.Website.DistrictManagement.Enrollment.App
{

    [BreezeController]
    public class EnrollmentController : BreezeAbstractApiController
    {
        /// <summary>
        /// GET: breeze/Enrollment/Sites
        /// </summary>
        [HttpGet]
        [EnableBreezeQueryAttribute(MaxExpansionDepth = 3)]
        public IQueryable<Site> Sites()
        {
            return _dbContextProvider.Context.Sites;
        }

        /// <summary>
        /// GET: breeze/Enrollment/Groups
        /// </summary>
        [HttpGet]
        public IQueryable<Group> Groups()
        {
            return _dbContextProvider.Context.Groups;
        }

        /// <summary>
        /// GET: breeze/Enrollment/VSeasonClientCredits
        /// </summary>
        [HttpGet]
        public IQueryable<VSeasonClientCredit> VSeasonClientCredits()
        {
            return _dbContextProvider.Context.VSeasonClientCredits;
        }

        /// <summary>
        /// GET: breeze/Enrollment/ClientPhoneNumbers
        /// </summary>
        [HttpGet]
        public IQueryable<ClientPhoneNumber> ClientPhoneNumbers()
        {
            return _dbContextProvider.Context.ClientPhoneNumbers;
        }

        /// <summary>
        /// GET: breeze/Enrollment/ClientBundles
        /// </summary>
        [HttpGet]
        [EnableBreezeQueryAttribute(MaxExpansionDepth = 8)]
        public IQueryable<ClientBundle> ClientBundles()
        {
            return _dbContextProvider.Context.ClientBundles;
        }

        /// <summary>
        /// GET: breeze/Enrollment/Bundles
        /// </summary>
        [HttpGet]
        [EnableBreezeQueryAttribute(MaxExpansionDepth = 8)]
        public IQueryable<Bundle> Bundles()
        {
            return _dbContextProvider.Context.Bundles;
        }

        /// <summary>
        /// GET: breeze/Enrollment/ClientBundlesInputChoices
        /// </summary>
        [HttpGet]
        public IQueryable<ClientBundleInputChoice> ClientBundleInputChoices()
        {
            return _dbContextProvider.Context.ClientBundleInputChoices;
        }

        /// <summary>
        /// GET: breeze/Enrollment/BundleInputs
        /// </summary>
        [HttpGet]
        public IQueryable<BundleInput> BundleInputs()
        {
            return _dbContextProvider.Context.BundleInputs;
        }

        /// <summary>
        /// GET: breeze/Enrollment/Inputs
        /// </summary>
        [HttpGet]
        public IQueryable<Input> Inputs()
        {
            return _dbContextProvider.Context.Inputs;
        }

        /// <summary>
        /// GET: breeze/Enrollment/CreditCycles
        /// </summary>
        [HttpGet]
        public IQueryable<CreditCycle> CreditCycles()
        {
            return _dbContextProvider.Context.CreditCycles;
        }

        /// <summary>
        /// GET: breeze/Enrollment/CreditCycleBundles
        /// </summary>
        [HttpGet]
        public IQueryable<CreditCycleBundle> CreditCycleBundles()
        {
            return _dbContextProvider.Context.CreditCycleBundles;
        }

        /// <summary>
        /// POST: breeze/Enrollment/SaveChanges
        /// </summary>
		[HttpPost]
        [AuthorizeApi(Roles = OAFRoleManager.Role_OAFUser+","+OAFRoleManager.Role_OAFLocalUser + "," + OAFRoleManager.Role_SuperAdmin)]
		public override SaveResult SaveChanges(JObject saveChanges)
		{
            SaveResult sr = _dbContextProvider.SaveChanges(saveChanges);
            return sr;
		}

    }
}