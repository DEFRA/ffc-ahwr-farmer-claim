const CommonActions = require('./common-actions')
const pgp = require('pg-promise')();
// const { submitClaim } = require('../../../app/messaging/application')


const DB_USER=process.env.DB_USERNAME;
const DB_HOST=process.env.DB_HOST;
const DB_PORT=process.env.DB_PORT;
const DB_DATABASE=process.env.DB_DATABASE;
const databaseConfig = {
  user: DB_USER,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_DATABASE,
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

const SELECT_THE_TYPE_OF_REVIEW_ERROR='Select what you are claiming for'
const SELECT_THE_TYPE_OF_REVIEW_ERROR_ACTUAL='a[href="#typeOfReview"]'
//How many sample Tested _pig

const NO_OF_SAMPLES_TESTED='#numberOfSamplesTested'
const ACTUAL_NO_OF_SAMPLES_ERROR='a[href="#numberOfSamplesTested"]'
const ACTUAL_NO_OF_SAMPLES_ERROR_FOR_PIG='#main-content > div > div > p:nth-child(8) > a'
const EXPECTED_NO_OF_SAMPLES_ERROR='Enter the number of samples tested'
const EXPECTED_NO_OF_SAMPLES_ERROR_FOR_PIG='Enter the number of pigs samples were taken from.'
const ACTUAL_INCORRECT_NO_OF_SAMPLES='//*[@id="main-content"]/div/div/h1'
const Link_Enter_No_Of_Samples_Taken='//*[@id="main-content"]/div/div/p[6]/a'
const DISEASE_CATEGORY_PAGE_HEADER='//*[@id="main-content"]/div/div/div/div/h1'
const EXPECTED_INCORRECT_NO_OF_SAMPLES='You cannot continue with your claim'
const DISEASE_CATEGORY_PAGE='What is the disease status category?'
const DISEASE_CATEGORY_PAGE_ERROR='Enter the disease status category'
const DISEASE_CATEGORY_PAGE_ERROR_ACTUAL='a[href="#diseaseStatus"]'
const CHANGE_YOUR_ANSWER_IF_THE_VET_DID_A_PI_HUNT='a[href="/claim/endemics/pi-hunt"]'
const CHANGE_YOUR_ANSWER_IF_THE_VET_ASKED_A_PI_HUNT='a[href="/claim/endemics/pi-hunt-recommended"]'

// biosecurity 

const BIO_SECURITY_YES='#biosecurity'
const BIO_SECURITY_NO='#biosecurity-2'
const DISEASE_STATUS_CATEGORY='#diseaseStatus-2'
const BIO_SECURITY_PERCENTAGE='#assessmentPercentage'

const BIO_SECURITY_NO_OPTION_SELECTED='Select whether the vet did a biosecurity assessment' 	
const BIO_SECURITY_NO_PERCENTAGE_ENTERED='Enter the assessment percentage'
const BIO_SECURITY_ERROR_HEADER='a[href="#biosecurity"]'
const BIO_SECURITY_PERCENTAGE_ERROR_HEADER='a[href="#assessmentPercentage"]'
//TO BE USED ONCE CHANGES ARE DEPLOED IN PRE, UPDATE IN 223 AND 226
// const BIO_SECURITY_ERROR_HEADER='a[href="#biosecurity"]'
// const BIO_SECURITY_ERROR_HEADER_ASSESSMENT='a[href="#assessmentPercentage"]'
//Sheep
const SHEEP_HEALTH_PACKAGE='#sheepEndemicsPackage'
const SHEEP_VET_TEST='#sheepTests'
const POSITIVE_TEST_RESULT_SHEEP = '#testResult'
const GOV_BACK_LINK='.govuk-back-link'

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
const SELECT_PI_ERROR='Select if the vet did a PI hunt'
const SELECT_PI_ERROR_ACTUAL='a[href="#piHunt"]'
const ACTUAL_PIHUNT_HEADER='//*[@id="main-content"]/div/div/form/div/fieldset/legend/h1'
const EXPECTED_PIHUNT_HEADER='Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done?'
const EXPECTED_PIHUNT_ON_ALL_BEEF_HEADER='Was the PI hunt done on all beef cattle in the herd?'
const YES_PI_HUNT_ALL_ANIMALS='#piHuntAllAnimals'
const NO_PI_HUNT_ALL_ANIMALS='#piHuntAllAnimals-2'
const ERROR_ON_CLICKING_NO_FOR_PI_HUNT_ALLANIMALS='You cannot continue with your claim'
const CHANGE_YOUR_ANSWER='a[href="/claim/endemics/pi-hunt-all-animals"]'
const HEADER_ERROR_PIHUNT='.govuk-heading-l'
const PI_HUNT_RECOMENDED_NO='#piHuntRecommended-2'
const PI_HUNT_RECOMENDED_YES='#piHuntRecommended'
const CHANGE_YOUR_ANSWER_VET_DID_PIHUNT='a[href="/claim/endemics/pi-hunt"]'

//link validations for sample exception page

const CATTLE_LINK_SAMPLE_EXCEPTION_ACTUAL='//*[@id="main-content"]/div/div/ul/li[1]/a'
const CATTLE_LINK_SAMPLE_EXCEPTION_EXPECTED='Testing cattle for animal health and welfare review'
const BEEF_LINK_SAMPLE_EXCEPTION_ACTUAL='//*[@id="main-content"]/div/div/ul/li[2]/a'
const BEEF_LINK_SAMPLE_EXCEPTION_EXPECTED='Testing beef cattle for endemic disease follow-up'
const PIGS_LINK_SAMPLE_EXCEPTION_ACTUAL='//*[@id="main-content"]/div/div/ul/li[3]/a'
const PIGS_LINK_SAMPLE_EXCEPTION_EXPECTED='Testing pigs for animal health and welfare review'





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
async validateNoOfSamplesErrorForPig(){
    await this.elementToContainErrorText(ACTUAL_NO_OF_SAMPLES_ERROR_FOR_PIG,EXPECTED_NO_OF_SAMPLES_ERROR_FOR_PIG)
  } 
  async validateNoOfSamplesError(){
    await this.elementToContainErrorText(ACTUAL_NO_OF_SAMPLES_ERROR,EXPECTED_NO_OF_SAMPLES_ERROR)
  } 
  async validateSelectTheTypeOfReview(){
    await this.elementToContainErrorText(SELECT_THE_TYPE_OF_REVIEW_ERROR_ACTUAL,SELECT_THE_TYPE_OF_REVIEW_ERROR)
  }
  async validatePIHuntPage(){
    await this.elementToContainText(ACTUAL_PIHUNT_HEADER,EXPECTED_PIHUNT_HEADER)
  }
  async validatePIHuntPageOnAllBeefHerd(){
    await this.elementToContainText(ACTUAL_PIHUNT_HEADER,EXPECTED_PIHUNT_ON_ALL_BEEF_HEADER)
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
  async validateYouCannotContinueToClaimPIHunt(){
    await this.elementToContainErrorText(HEADER_ERROR_PIHUNT,EXPECTED_INCORRECT_NO_OF_SAMPLES)
  }  
  async click_EntenNoOfSamplesLink(){
    await this.clickOn( Link_Enter_No_Of_Samples_Taken)
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
  async clickNoForPIHunt(){
    await this.clickOn(PI_HUNT_NO)
  }
  async ChangeYourAnswerIfTheVetDidPIHunt(){
    await this.clickOn(CHANGE_YOUR_ANSWER_IF_THE_VET_DID_A_PI_HUNT)
  }
  async ChangeYourAnswerIfTheVetAskedPIHunt(){
    await this.clickOn(CHANGE_YOUR_ANSWER_IF_THE_VET_ASKED_A_PI_HUNT)
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
    await this.elementToContainErrorText(BIO_SECURITY_PERCENTAGE_ERROR_HEADER,BIO_SECURITY_NO_PERCENTAGE_ENTERED)
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
  async validateCattleLinksInExceptionPage(){
    await this.elementToContainErrorText(CATTLE_LINK_SAMPLE_EXCEPTION_ACTUAL,CATTLE_LINK_SAMPLE_EXCEPTION_EXPECTED)
  } 
  async validateBeefLinksInExceptionPage(){
    await this.elementToContainErrorText(BEEF_LINK_SAMPLE_EXCEPTION_ACTUAL,BEEF_LINK_SAMPLE_EXCEPTION_EXPECTED)
  } 
  async validatePigsLinksInExceptionPage(){
    await this.elementToContainErrorText(PIGS_LINK_SAMPLE_EXCEPTION_ACTUAL,PIGS_LINK_SAMPLE_EXCEPTION_EXPECTED)
  } 
  async clickYesPIHuntAllAnimals(){
    await this.clickOn(YES_PI_HUNT_ALL_ANIMALS)
  }
  async clickNoPIHuntAllAnimals(){
    await this.clickOn(NO_PI_HUNT_ALL_ANIMALS)
  }
  async validatePIHuntAllAnimalsErrorMessage(){
    await this.elementToContainErrorText(HEADER_ERROR_PIHUNT,ERROR_ON_CLICKING_NO_FOR_PI_HUNT_ALLANIMALS)
  } 
  async clickChangeAnswerForPIHuntAllAnimals(){
    await this.clickOn(CHANGE_YOUR_ANSWER)
  }
  async clickYesPIHuntRecommended(){
    await this.clickOn(PI_HUNT_RECOMENDED_YES)
  }
  async clickNoPIHuntRecommended(){
    await this.clickOn(PI_HUNT_RECOMENDED_NO)
  }
  async checkAnswerVetAskedToDo(){
    await this.clickOn(CHECK)
  }
  async clickGovBackLink(){
    await this.clickOn(GOV_BACK_LINK)
  }
  }





module.exports = EndemicsPageActions


