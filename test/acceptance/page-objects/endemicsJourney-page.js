const CommonActions = require('./common-actions')
const pgp = require('pg-promise')();
// const { submitClaim } = require('../../../app/messaging/application')

const databaseConfig = {
  user: process.env.DB.USERNAME,
  host: process.env.DB.HOST,
  port: process.env.DB.PORT,
  database: process.env.DB.DATABASE,
  sslMode:'true',
};


const password = process.env.DB_PASSWORD;


// Create the connection string
const connectionString = `postgres://${databaseConfig.user}:${password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}?sslmode=require`;

// Create the database connection
const db = pgp(connectionString);


const TAG='//*[@id="main-content"]/div[2]/div/table/tbody/tr/td[2]/strong'
const CLAIM_AGREEMENT_NUMBER='//*[@id="main-content"]/div[2]/div/table/tbody/tr/td[1]'
let INCHECK='INCHECK'
let ONHOLD='ON HOLD'
//Pig Herd Vaccination

const HERD_VACCINATED='#herdVaccinationStatus'
const HERD_VACCINATED_NO='#herdVaccinationStatus-2'

//select a type of review error

const SELECT_THE_TYPE_OF_REVIEW_ERROR='Select which type of review you are claiming for'
const SELECT_THE_TYPE_OF_REVIEW_ERROR_ACTUAL='a[href="#typeOfReview"]'
//How many sample Tested _pig

const NO_OF_SAMPLES_TESTED='#numberOfSamplesTested'
const ACTUAL_NO_OF_SAMPLES_ERROR='a[href="#numberOfSamplesTested"]'
const EXPECTED_NO_OF_SAMPLES_ERROR='Enter the number of samples tested'
const ACTUAL_INCORRECT_NO_OF_SAMPLES='//*[@id="main-content"]/div/div/h1'
const DISEASE_CATEGORY_PAGE_HEADER='//*[@id="main-content"]/div/div/div/div/h1'
const EXPECTED_INCORRECT_NO_OF_SAMPLES='You cannot continue with your claim'
const DISEASE_CATEGORY_PAGE='What is the disease status category?'
const DISEASE_CATEGORY_PAGE_ERROR='Enter the disease status category'
const DISEASE_CATEGORY_PAGE_ERROR_ACTUAL='a[href="#diseaseStatus"]'

// biosecurity 

const BIO_SECURITY_YES='#biosecurity'
const BIO_SECURITY_NO='#biosecurity-2'
const DISEASE_STATUS_CATEGORY='#diseaseStatus-2'
const BIO_SECURITY_PERCENTAGE='#assessmentPercentage'

const BIO_SECURITY_NO_OPTION_SELECTED='Select whether the vet did a biosecurity assessment' 	
const BIO_SECURITY_NO_PERCENTAGE_ENTERED='Enter the assessment percentage'
const BIO_SECURITY_ERROR_HEADER='//*[@id="main-content"]/div/div/div/div[1]/div/ul'
//Sheep
const SHEEP_HEALTH_PACKAGE='#sheepEndemicsPackage'
const SHEEP_VET_TEST='#sheepTests'
const POSITIVE_TEST_RESULT_SHEEP = '#testResult'

//select a package screen error

const CLAIM_FOR_ENDEMICS_FOLLOW_UP='//*[contains(text(),"Claim for endemics follow-up")]'
const START_A_NEW_CLAIM='//*[contains(text(),"Start a new claim")]'
const SELECT_A_PACKAGE_ERROR='Select a package'
const SELECT_A_PACKAGE_ERROR_ACTUAL = 'a[href="#sheepEndemicsPackage"]'

//select a disease error 

const VET_TEST_ERROR='Select a disease or condition'
const VET_TEST_ERROR_ACTUAL = 'a[href="#sheepTests"]'

//select a test result error
const VET_TEST_RESULT_ERROR='Select a result'
const VET_TEST_RESULT_ERROR_ACTUAL='a[href="#testResult"]'

//Beef
const PI_HUNT_YES='#piHunt'
const PI_HUNT_NO='#piHunt-2'
const SELECT_PI_ERROR='Select yes or no'
const SELECT_PI_ERROR_ACTUAL='a[href="#piHunt"]'


class EndemicsPageActions extends CommonActions {

// Given string
async validateResultsErrorMessgae(tagToCheck,statusID) {
    try {
        const AGREEMENT_NUMBER = await this.elementGetText(CLAIM_AGREEMENT_NUMBER);
        const pattern = /AHWR-\w{4}-\w{4}/;
        // Extracting the pattern from the string
        const extractedString = AGREEMENT_NUMBER.match(pattern)[0];
        console.log(extractedString); // Output: AHWR-69DD-B341
        await db.connect();

        const updateStatusQuery = `
            UPDATE public.claim
            SET "statusId" = $1
            WHERE reference = $2;
        `;

        const statusId = statusID; // Your dynamic value
        const reference = extractedString; // Use the extracted string as the reference value

        // Execute the query with dynamic parameters
      // await conn.query(updateStatusQuery, [statusId, reference]);

        // Execute the query with the reference value as a parameter
        await db.none(updateStatusQuery, [statusId, reference]);

        console.log('Status updated successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Close the database connection (optional)
       // conn.done();
    }

    await this.open('/vet-visits')
    if(statusID==10){
        await this.elementToContainText(TAG,tagToCheck)
    }else if(statusID==8){
        await this.elementToContainText(TAG,tagToCheck)
    }else {
        await this.elementToContainText(TAG,tagToCheck)
    }
}



async click_Herd_Vaccination() {
    await this.clickOn(HERD_VACCINATED)
  }
  
async enterNoOfSamplesTested(sampleValue){

    switch (sampleValue) {
        case 'positive':
            await this.sendKey(NO_OF_SAMPLES_TESTED, 6);
            break;
        case 'negative':
            await this.sendKey(NO_OF_SAMPLES_TESTED, 30);
            break;
        case 'incorrect':
            await this.sendKey(NO_OF_SAMPLES_TESTED, 10);
            break;
        default:
            // Handle any other case or provide a default action
            break;
    }
     
  }
async validateNoOfSamplesError(){
    await this.elementToContainErrorText(ACTUAL_NO_OF_SAMPLES_ERROR,EXPECTED_NO_OF_SAMPLES_ERROR)
  } 
  async validateSelectTheTypeOfReview(){
    await this.elementToContainErrorText(SELECT_THE_TYPE_OF_REVIEW_ERROR_ACTUAL,SELECT_THE_TYPE_OF_REVIEW_ERROR)
  }

  async validatePackageError(){
    await this.elementToContainErrorText(SELECT_A_PACKAGE_ERROR_ACTUAL,SELECT_A_PACKAGE_ERROR)
  } 
  async validateVetTestError(){
    await this.elementToContainErrorText(VET_TEST_ERROR_ACTUAL,VET_TEST_ERROR)
  } 
  async validateVetTestResultError(){
    await this.elementToContainErrorText(VET_TEST_RESULT_ERROR_ACTUAL,VET_TEST_RESULT_ERROR)
  } 
async validateIncorrectNoOfSamplesError(){
    await this.elementToContainErrorText(ACTUAL_INCORRECT_NO_OF_SAMPLES,EXPECTED_INCORRECT_NO_OF_SAMPLES)
  }   
  async validateDiseaseStatusCategory(){
    await this.elementToContainErrorText(DISEASE_CATEGORY_PAGE_HEADER,DISEASE_CATEGORY_PAGE)
  }  
  async clickYesBiosecurityAssesssment(){
    await this.clickOn(BIO_SECURITY_YES)
  }
  async clickNoBiosecurityAssesssment(){
    await this.clickOn(BIO_SECURITY_NO)
  }
  async clickYesForPIHunt(){
    await this.clickOn(PI_HUNT_YES)
  }
    async clickOnDiseaseStatusCategory(){
    await this.clickOn(DISEASE_STATUS_CATEGORY)
  }   
  async enterBioSecurityPercentage(){
    await this.sendKey(BIO_SECURITY_PERCENTAGE,'80')
  } 
  async validateNoOptionSelectedForBiosecurity(){
    await this.elementToContainErrorText(BIO_SECURITY_ERROR_HEADER,BIO_SECURITY_NO_OPTION_SELECTED)
  } 
  async validateNoPercentageEntered(){
    await this.elementToContainErrorText(BIO_SECURITY_ERROR_HEADER,BIO_SECURITY_NO_PERCENTAGE_ENTERED)
  } 
  async chooseSheepHealthPackage(){
    await this.clickOn(SHEEP_HEALTH_PACKAGE)
  }
  async clickSheepVetTest(){
    await this.clickOn(SHEEP_VET_TEST)
  }
  async clickSheepPositiveTestResult(){
    await this.clickOn(POSITIVE_TEST_RESULT_SHEEP)
  }
  async clickClaimEndemicsFollowUp(){
    await this.clickOn(START_A_NEW_CLAIM)
  }
  async clickStartNewClaim(){
    await this.clickOn(START_A_NEW_CLAIM)
  }
  async validateSelectPIError(){
    await this.elementToContainErrorText(SELECT_PI_ERROR_ACTUAL,SELECT_PI_ERROR)
  } 
  async validateBlankDiseaseStatus(){
    await this.elementToContainErrorText(DISEASE_CATEGORY_PAGE_ERROR_ACTUAL,DISEASE_CATEGORY_PAGE_ERROR)
  } 

  }





module.exports = EndemicsPageActions


