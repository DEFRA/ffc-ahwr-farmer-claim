const CommonActions = require('./common-actions')
const pgp = require('pg-promise')();
// const { submitClaim } = require('../../../app/messaging/application')
const databaseConfig = {
  user: 'adminuser@sndffcdbssq1002',
  host: 'sndffcdbssq1002.postgres.database.azure.com',
  port: 5432,
  database: 'ffc_ahwr_application',
  sslMode:'true',
};
// const databaseConfig = {
//   user: 'adminuser@devffcdbssq1001',
//   host: 'devffcdbssq1001.postgres.database.azure.com',
//   port: 5432,
//   database: 'ffc-ahwr-application-dev',
//   sslMode:'true',
// };

//const db = pgp('postgres://adminuser@devffcdbssq1001:ufj2Wm3CQpXj@devffcdbssq1001.postgres.database.azure.com:5432/ffc-ahwr-application-dev');
// Dynamically set the password based on your requirements
const password = process.env.DB_PASSWORD;


// Create the connection string
const connectionString = `postgres://${databaseConfig.user}:${password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}?sslmode=require`;

// Create the database connection
const db = pgp(connectionString);
// page element
const START = '[role="button"]'
const PAGE_TITLE = 'Claim funding - Annual health and welfare review of livestock'
const SUBMIT = '#next:nth-child(1)'
const ERROR_MESSAGE = '#error-summary-title'
const DISPLAYED_ERROR = 'There is a problem'
const URL_CONTENT = 'dcidm'
const DEFRA_CRN = '#crn'
const DEFRA_PASSWORD = '#password'
const INVALID_CRN = '1111100000'
const INVALID_PASSWORD='ADCDEFGHIJKLNOP'
const CONTENT = '#main-content :nth-child(1)>dd'
const HINT = '#main-content :nth-child(2)>dt'
const ANIMAL ='#main-content :nth-child(3)>dt'
const CONFIRM_BUTTON = '#detailsCorrect'
const CONTINUE_BUTTON ='#btnContinue'
const HEADING = '.govuk-fieldset__heading'
const VISIT_DAY = '#visit-date-day'
const VISIT_MONTH = '#visit-date-month'
const VISIT_YEAR = '#visit-date-year'
const SAME_AS_REVIEW_RADIO ='#whenTestingWasCarriedOut'
const DATE_CONTINUE = '#continue'
const VET_QUESTION_ElEMENT = '#main-content h1'
const VET_QUESTION = 'What is the vet’s name'
const VET_NAME = '#name'
const RCVS_BOX = '#rcvs'
const URN_QUESTION = 'What is the laboratory unique reference number for the test results?'
const URN_FIELD = '#urn'
const BACK_BUTTON='#back'
const BUSINESS_NAME = '#main-content :nth-child(1)>dt'
const PROCEED_TO_SUBMIT = '[role="button"]'
const CLAIM_SUBMIT = '#submitClaimForm > button'
const CLAIM_SUCCESS_MESSAGE = '#main-content>div>div>p:nth-child(2)'
const AGREEMENT_NUMBER = '#main-content strong'
const ANOTHER_DAY_BUTTON ='#whenTestingWasCarriedOut-2'
const DIFFERENT_DAY='#on-another-date-day'
const DIFFERENT_MONTH='#on-another-date-month'
const DIFFERENT_YEAR='#on-another-date-year'
const PAST_DATE_ERROR='a[href*="#when-was-endemic-disease-or-condition-testing-carried-out"]'
const PAST_DATE_ERROR_EXPECTED ='Date of testing must be in the past'
const APPLICATION_DATE_ERROR_EXPECTED='Date of testing must be the same'
const DATE_ERROR='a[href="#when-was-the-review-completed"]'
const DATE_BLANK_ERROR_EXPECTED='Enter the date the vet completed the review'
const CLICK_RADIO_BUTTON_ERROR='a[href="#when-was-endemic-disease-or-condition-testing-carried-out"]' 
const CLICK_RADIO_BUTTON_ERROR_EXPECTED='Select if testing was carried out when the vet visited the farm or on another date'
const INVALID_DATE_ERROR='Date of review must be a real date'
const MISSING_YEAR_AND_DATE='Date of review must include a day and a year'
const MISSING_DATE_AND_MONTH='Date of review must include a day and a month'
const MISSING_MONTH_AND_YEAR='Date of review must include a month and a year'
const MISSING_MONTH='Date of review must include a month'
const MISSING_DATE='Date of review must include a day'
const MISSING_YEAR='Date of review must include a year'
const TYPEOF_REVIEW='//dt[contains(text(),"Type")]/following-sibling::dd'
const MUTLIPLE_BUSINESS_CONTINUE = '#continueReplacement'
var another_day;
var another_month;
var another_year;
//Exception
const EXCEPTION_HEADER='.govuk-heading-l'
const NO_OF_ANIMAL_TESTED='#number-of-animals-tested'
const ORAL_SAMPLE_Blank_ERROR_ACTUAL='#numberOfOralFluidSamples-error'
const ORAL_SAMPLE_Blank_ERROR_EXPECTED='Enter the number of oral fluid samples collected'
const HEADER_ERROR_MESSAGE_EXPECTED='You cannot claim for a livestock review for this business'
const EXCEPTION_ERROR_MESSAGE='.govuk-heading-l+.govuk-body'
const EXCEPTION_ERROR_MESSAGE_EXPECTED='You do not have the required permission to act for Test Estate - SBI 114441446.'
const EXCEPTION_ERROR_MESSAGE_EXPECTED_NOT_APPLIED='Mr A Slack - SBI 106864909 has not applied for an annual health and welfare review of livestock.'
const EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_PERMISSION='You do not have the required permission to act for Dale Hitchens - SBI 107224622.'
const EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_APPLIED='Michael Dixon - SBI 114293653 has not applied for an annual health and welfare review of livestock.'
//const CALL_CHARGES='//a[text()="Find out about call charges (opens in a new tab)"]'
const CALL_CHARGES='//a[contains(@href, "https://www.gov.uk/call-charges")]'
const CALL_CHARGES_TITLE='Call charges and phone numbers - GOV.UK'
const REAL_DATE_ERROR='Date of review must be a real date'
const VET_NAME_ERROR_MESSAGE='Vet’s name must be 50 characters or fewer'
const VET_FULL_NAME='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const VET_NAME_ERROR='#name-error'
const RCVS_ERROR='#rcvs-error'
const URN_ERROR='#urn-error'
const RCVS_ERRORMESSAGE='RCVS number must be 7 characters and only include letters a to z and numbers, like 1234567'
const URN_SPL_CHARACTERERRORMESSAGE='URN must only include letters a to z, numbers and a hyphen'
const URN_ERRORMESSAGE='URN must be 50 characters or fewer'
const URN_EMPTY_ERRORMESSAGE='Enter the URN'
const VET_NAME_SPLCHARACTER_ERRORMESSAGE='Vet’s name must only include letters a to z, numbers and special characters such as hyphens, spaces, apostrophes, ampersands, commas, brackets or a forward slash'
const EXPECTED_NOOFSPECIES_ERRORMESSAGE='The number of animals you have entered does not meet the minimum required for the type of review you are claiming for.'
const ACTUAL_NOOFSPECIES_ERRORMESSAGE='body > div:nth-child(7) > main:nth-child(2) > div:nth-child(1) > div:nth-child(1) > p:nth-child(2)'
const EXPECTED_ONLYNUMBERS_ERRORMESSAGE='Number of animals tested must only include numbers'
const ACTUAL_ERRORMESSAGE='a[href="#number-of-animals-tested"]'
const EXPECTED_BLANK_ERRORMESSAGE='Enter the number of animals tested'

//EndemicsClaim
const COOKIES_ACCEPT = '[value="accept"]'
const COOKIES_HIDE='/html/body/div[1]/div/div[2]/div[2]'
const NUMBER_OF_SPECIES_EXCEPTION_EXPECTED='You cannot continue with your claim'
const NUMBER_OF_SPECIES_EXCEPTION_ACTUAL='.govuk-heading-l' 
const NUMBER_OF_TESTS_EXCEPTION_ACTUAL='#main-content > div > div > h1'
const NUMBER_OF_TESTS_EXCEPTION_EXPECTED='You cannot continue with your claim'
const CATTLE_TESTING_LINK_ACTUAL='//a[text()="cattle: testing required for an annual health and welfare review"]'
const CATTLE_TESTING_LINK_EXPECTED='cattle: testing required for an annual health and welfare review'
const SHEEP_TESTING_LINK_ACTUAL='//a[text()="sheep: testing required for an annual health and welfare review"]'
const SHEEP_TESTING_LINK_EXPECTED='sheep: testing required for an annual health and welfare review'
const PIG_TESTING_LINK_ACTUAL='//a[text()="pigs: testing required for an annual health and welfare review"]'
const PIG_TESTING_LINK_EXPECTED='pigs: testing required for an annual health and welfare review'
const ENTER_NO_OF_ANIMALS_TESTING_LINK_ACTUAL='//a[text()="Enter the number of animals tested"]'
const ENTER_NO_OF_ANIMALS_TESTING_LINK_EXPECTED='Enter the number of animals tested'
const BACK_LINK='#back'
const GET_HELP_FOR_CLAIM_HEADER_EXPECTED='Get help with your claim'
const GET_HELP_FOR_CLAIM_HEADER_ACTUAL='#main-content > div > div > h2:nth-child(11)'
const GET_HELP_FOR_CLAIM_ORAL_SAMPLES_HEADER_ACTUAL='//*[@id="main-content"]/div/div/h2'
const ATLEAST_FIVE_ORAL_SAMPLES_LINK_EXPECTED='There must have been at least five oral fluid samples tested'
const ATLEAST_FIVE_ORAL_SAMPLES_LINK_ACTUAL='#main-content > div > div > p:nth-child(2) > a'
const ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_EXPECTED='Enter the number of oral fluid samples tested'
const ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_ACTUAL='#main-content > div > div > p:nth-child(4) > a'
const Blank_ERROR_ACTUAL='#numberAnimalsTested-error'
const Blank_ERROR_EXPECTED='Enter the number of animals tested'
const CHAR_ERROR_ACTUAL='#numberAnimalsTested-error'
const CHAR_ERROR_EXPECTED='Number of animals tested must only include numbers'
const VET_NAME_Blank_ERROR_ACTUAL='#vetsName-error'
const VET_NAME_Blank_ERROR_EXPECTED='Enter the vet’s name'
const DEFRA_EMAIL_ID_EXPECTED='ruralpayments@defra.gov.uk'
const DEFRA_EMAIL_ID_ACTUAL='//a[text()="ruralpayments@defra.gov.uk"]'
const PHONE_NUMBER_EXPECTED='Telephone: 03000 200 301'
const PHONE_NUMBER_ACTUAL='#main-content > div > div > p:nth-child(14)'
const PHONE_NUMBER_ORAL_SAMPLES_ACTUAL='//*[@id="main-content"]/div/div/div[2]/div/ul/li[2]'
const NUMBER_OF_ANIMALS_HEADER_EXPECTED='How many animals did the vet test?'
const NUMBER_OF_ANIMALS_HEADER_ACTUAL='//*[@id="main-content"]/div/div/form/h1'
const NUMBER_OF_ORAL_FLUID_SAMPLES_HEADER_ACTUAL='//*[@id="main-content"]/div/div/form/h1'
const NUMBER_OF_ORAL_FLUID_SAMPLES_EXPECTED='How many oral fluid samples did the vet take?'
const NO_OF_SPECIES_TESTED='#numberAnimalsTested'
const NO_OF_ORAL_TESTED='#numberOfOralFluidSamples'
const SPECIES_NUMBER_CONTINUE='#btnContinue'
const ORAL_SAMPLES_CONTINUE='#continue'
const CHECK_DETAILS = '.govuk-heading-l'
const FARMER_DETAILS = '.govuk-summary-list'
const DETAILS_BUTTON = '#confirmCheckDetails'
const CONTINUE_BUTTON1 = '#btnContinue'
const DETAILS = 'Check your details'
const CONTENT1 = 'Farmer name'

class StartPageActions extends CommonActions {

  async getHomepage(page){
    await this.open(page)
  }
  async claimPageTitle(){
    await this.getPageTitle(PAGE_TITLE)
  }
  async startNow(){
    await this.clickOn(START)
  }
  async DefraIdPage(){
    await this.urlContain(URL_CONTENT)
  }
  async inputInvalidCrn(){
    await this.sendKey(DEFRA_CRN, INVALID_CRN)
  }
  async inputInvalidPassword () {
    await this.sendKey(DEFRA_PASSWORD, INVALID_PASSWORD)
  }
  async signIn(){
    await this.clickOn(SUBMIT)
  }
  async back(){
    await this.clickOn(SUBMIT)
  }
  async errorMessage(){
    await this.elementToContainText(ERROR_MESSAGE,DISPLAYED_ERROR)
  }
  async inputValidCrn (crn) {
    await this.sendKey(DEFRA_CRN, crn)
  }
  async inputPassword (password) {
    await this.sendKey(DEFRA_PASSWORD, password)
  }

  async validData(business){
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    switch (business) {
      case 'Single':
        await this.inputValidCrn(process.env.CRN_CLAIM);
        await this.inputPassword(process.env.CRN_PASSWORD);
        break;

      case 'Pigs':
        
        await this.inputValidCrn(process.env.CRN_CLAIM_PIGS);
        await this.inputPassword(process.env.CRN_PASSWORD);
        break;

      case 'Beef':
        
        await this.inputValidCrn(process.env.CRN_CLAIM_BEEF);
        await this.inputPassword(process.env.CRN_PASSWORD);
        break;
    
      case 'Exception-SB-NP':
        console.log(process.env.CRN_EXCEPTION_USERNAME);
        await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME);
        await this.inputPassword(process.env.CRN_EXCEPTION_PASSWORD);
        break;
    
      case 'Exception-SB-NA':
        console.log(process.env.CRN_EXCEPTION_USERNAME);
        await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME_NONA);
        await this.inputPassword(process.env.CRN_PASSWORD);
        break;
    
      case 'Exception-MB-NP':
        console.log(process.env.CRN_EXCEPTION_USERNAME);
        await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME_MB_NP);
        await this.inputPassword(process.env.CRN_PASSWORD);
        break;
    
      case 'Exception-MB-NA':
        console.log(process.env.CRN_EXCEPTION_USERNAME);
        await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME_MB_NONA);
        await this.inputPassword(process.env.CRN_PASSWORD);
        break;
    
      default:
        // Handle default case if necessary
        break;
    }
    
  }
  //....org review

  async agreementNumber(){
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    await this.elementToContainText(CONTENT,'AHWR')
  }
  async nameOfBusiness(){
    await this.elementToContainText(HINT,'Business name')
  }
  async animalType(){
    await this.elementTextShouldBe(ANIMAL,'Type of review')
  }
  async confirmDetail(){
    await this.clickOn(CONFIRM_BUTTON)

  } async proceedClaim(){
    await this.clickOn(CONTINUE_BUTTON)
  }
  async visitDatePage(){
    await this.urlContain('vet-visit-date')
  }
  async visitHeadings(){
    await this.elementToContainText(HEADING, 'completed?')
  }



  async inputCurrentDate(dateFormat){
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    if(dateFormat=='correct'){
    await this.sendKey(VISIT_DAY,day)
    await this.sendKey(VISIT_MONTH,month)
    await this.sendKey(VISIT_YEAR,year)
    const date= day+","+month+","+year
    return date;
  }
    else if(dateFormat=='incorrect') {
      await this.sendKey(VISIT_DAY,'')
      await this.sendKey(VISIT_MONTH,'')
      await this.sendKey(VISIT_YEAR,'')
          
    }
    else if (dateFormat=='invalid'){
      await this.sendKey(VISIT_DAY,'31')
      await this.sendKey(VISIT_MONTH,'02')
      await this.sendKey(VISIT_YEAR,'2023')
    }
   
  }
  async invalidDateFormat(day,month,year){
    await this.sendKey(VISIT_DAY,day)
    await this.sendKey(VISIT_MONTH,month)
    await this.sendKey(VISIT_YEAR,year)

  }
  async clickOnAnotherDay(){
    await this.clickOn(ANOTHER_DAY_BUTTON)
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth()+1;
    const year = currentDate.getFullYear();
    await this.sendKey(DIFFERENT_DAY,day)
    await this.sendKey(DIFFERENT_MONTH,month)
    await this.sendKey(DIFFERENT_YEAR,year)
  }

  async dateFormat(){
    const date_Value= this.inputCurrentDate('correct');
    const arrayOfDate=(await date_Value).split(",");
    another_day=arrayOfDate[0]
    another_month=arrayOfDate[1]
    another_year=arrayOfDate[2]
  }
  async clickOnAnotherDay(){
    await this.clickOn(ANOTHER_DAY_BUTTON)
    await this.sendKey(DIFFERENT_DAY,another_day);
    await this.sendKey(DIFFERENT_MONTH,another_month);
    await this.sendKey(DIFFERENT_YEAR,another_month);
     }

  async verifyDate_Error(day) {
       await this.clickOn(ANOTHER_DAY_BUTTON)
       await this.dateFormat();
   if(day=='future'){
    await this.sendKey(DIFFERENT_DAY,parseInt(another_day)+1)
    await this.sendKey(DIFFERENT_MONTH,parseInt(another_month)+1)
    await this.sendKey(DIFFERENT_YEAR, another_year)
       }
       else{
    await this.sendKey(DIFFERENT_DAY, parseInt(another_day)+1)
    await this.sendKey(DIFFERENT_MONTH,parseInt(another_month)-1)
    await this.sendKey(DIFFERENT_YEAR,parseInt(another_year)-1)
    
  }
  }

  async validate_Application_DateError(){
    await this.elementToContainText(PAST_DATE_ERROR,APPLICATION_DATE_ERROR_EXPECTED)
  }
  async validate_Error(){
    await this.elementToContainText(PAST_DATE_ERROR,PAST_DATE_ERROR_EXPECTED)
  }
  async blankErrorValidation(){
    await this.elementToContainText(DATE_ERROR,DATE_BLANK_ERROR_EXPECTED);
    await this.elementToContainText(CLICK_RADIO_BUTTON_ERROR,CLICK_RADIO_BUTTON_ERROR_EXPECTED);
  }
  async blank_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,DATE_BLANK_ERROR_EXPECTED);
    await this.elementToContainText(CLICK_RADIO_BUTTON_ERROR,CLICK_RADIO_BUTTON_ERROR_EXPECTED);
  }
  async dateAndYearmissing_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,MISSING_YEAR_AND_DATE)
  }
  async realDate_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,REAL_DATE_ERROR)
  }
  async dateAndMonthmissing_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,MISSING_DATE_AND_MONTH)
  }
  async yearAndMonthmissing_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,MISSING_MONTH_AND_YEAR)
  }
  async monthmissing_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,MISSING_MONTH)
  }
  async yearmissing_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,MISSING_YEAR)
  }
  async datemissing_Error_Validation(){
    await this.elementToContainText(DATE_ERROR,MISSING_DATE)
  }

  async invalidDateValidate(){
    await this.elementToContainText(DATE_ERROR,INVALID_DATE_ERROR)
  }

  async clickOnSameDay(){
    await this.clickOn(SAME_AS_REVIEW_RADIO)
  }
 async continueAfterInputData(){
    await this.clickOn(DATE_CONTINUE)
 }

 async vetNamePage(){
    await this.urlContain('vet-name')
 }
 async pageQuestion(){
    await this.elementToContainText(VET_QUESTION_ElEMENT,VET_QUESTION)
 }
 async inputVetName(){
    await this.sendKey(VET_NAME, 'Automation')
 }
 async vet_rcvsPage(){
    await this.urlContain('vet-rcvs')
 }
async displayedQuestion(){
    await this.elementToContainText(VET_QUESTION_ElEMENT, 'Veterinary Surgeons (RCVS) number?')
}
async numberBox(){
    await this.sendKey(RCVS_BOX,1234567)
}
  async urnPage() {
    await this.urlContain('urn-result')
  }
  async pageDisplay(){
    await this.elementToContainText(VET_QUESTION_ElEMENT, URN_QUESTION)}
async urnInputField(){
    await this.sendKey(URN_FIELD,'automation')
}
async checkAnswerPage(){
    await this.urlContain('check-answers')
}
async confirmAnswerProvided(){
    await this.elementToContainText(VET_QUESTION_ElEMENT,'Check your answers')
}
async containBusinessName(){
    await this.elementToContainText(BUSINESS_NAME,'Business name')
}
async sbiIsCorrect(){
    await this.elementToContainText(HINT,'SBI')
}
async livestockNumberCorrect(){
  let liveStockName= await this.elementGetText(TYPEOF_REVIEW)
  switch(liveStockName){
    case 'Sheep':
      await this.elementToContainText(ANIMAL,'21 or more sheep')
      break;
    case 'Beef cattle':
      await this.elementToContainText(ANIMAL,'11 or more cattle')
      break;
    case 'Pigs':
      await this.elementToContainText(ANIMAL,'51 or more pigs')
      break;
    case 'Dairy cattle':
      await this.elementToContainText(ANIMAL,'11 or more cattle')
      break;
  }
   
}
async continueToSubmitClaim(){
    await this.clickOn(PROCEED_TO_SUBMIT)
}
async submitClaimUrl(){
    await this.urlContain('submit-claim')
}
async pageInformation(){
    await this.elementToContainText(VET_QUESTION_ElEMENT,'Submit your claim')

}
async claimSubmitButton(){
    await this.clickOn(CLAIM_SUBMIT)
}
async click_BackButton(){
 await this.clickOn(BACK_BUTTON)

}
async completeClaimPage(){
    await this.urlContain('submit-claim')
}
async claimCompleteMessage(){
    await this.elementToContainText(VET_QUESTION_ElEMENT, 'Claim complete')
}
async claimSuccessMessage(){
    await this.elementToContainText(CLAIM_SUCCESS_MESSAGE,'successfully submitted.')
}
async claimAgreementNumber(){
    await this.elementToContainText(AGREEMENT_NUMBER,'AHWR-')
}

//Exception
async validateExceptionHeader(){
  const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
  await sleep(10000)
   await this.elementToContainText(EXCEPTION_HEADER,HEADER_ERROR_MESSAGE_EXPECTED)
     }

async exceptionErrorMessage(typeOfException){
  const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
  await sleep(10000)
     if(typeOfException=='SB-NO Permission'){
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE,EXCEPTION_ERROR_MESSAGE_EXPECTED)
     }else if (typeOfException=='SB-NOT Applied'){
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE,EXCEPTION_ERROR_MESSAGE_EXPECTED_NOT_APPLIED)
     }else if (typeOfException=='MB-NO Permission'){
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE,EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_PERMISSION)
     }else if (typeOfException=='MB-NOT Applied'){
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE,EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_APPLIED)
     }
        }
async validateCallCharges(){
      await this.clickOn(CALL_CHARGES)
      const windowHandles = await browser.getWindowHandles();
      await browser.switchToWindow(windowHandles[1]);
      let expectedPageTitle =await this.getPageTitle(CALL_CHARGES_TITLE)
      console.log(expectedPageTitle)
      await this.screenShot()
      await browser.closeWindow();
      await browser.switchToWindow(windowHandles[0]);
}
  //MultiBusiness

async clickOnBusiness(businessName) {
  const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
  await sleep(5000)
    // Define the xPath function
    function xPath(businessName) {
      return `//*[@id="resultsContainer"]/div/fieldset/div/div[label[contains(text(),"${businessName}")]]/label`;
    }
    // Generate the XPath expression using the xPath function
    const xPathExpression = xPath(businessName);
    // Now you can use the xPathExpression in your WebDriverIO code
    const radio_Button = await $(xPathExpression);
    await this.clickOn(radio_Button)
  }    
    
  async clickOnContinue() {
    await this.clickOn(MUTLIPLE_BUSINESS_CONTINUE)
  } 

  async errorVetName(){
          await this.sendKey(VET_NAME,VET_FULL_NAME)
   }  
   
  async name_error_validation(){
          await this.elementToContainErrorText(VET_NAME_ERROR, VET_NAME_ERROR_MESSAGE)
   }

   async errorVetNameSplCharacters(){
    await this.sendKey(VET_NAME,'££££££')
    }  

    async errorValidationVetNameSplCharacters(){
    await this.elementToContainSplCharError(VET_NAME_ERROR, VET_NAME_SPLCHARACTER_ERRORMESSAGE)
    }

    async numberBoxError(condition){
      if(condition='more'){
      await this.sendKey(RCVS_BOX,12345672333)
      }else if(condition='less'){
        await this.sendKey(RCVS_BOX,12345672333)
      }else if(condition='specialcharacters'){
        await this.sendKey(RCVS_BOX,'$%^&&&&&')
  }
}
  async errorValidationRCVS(){
    await this.elementToContainSplCharError(RCVS_ERROR,RCVS_ERRORMESSAGE)
    }
    async urnInputFieldError(condition){
      if(condition='50 characters'){
      await this.sendKey(URN_FIELD,'wererrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	')
    }else if(condition='empty'){
      await this.sendKey(URN_FIELD,'')
    }else if(condition='specialcharacters'){
      await this.sendKey(URN_FIELD,'automation')
    }
  }
  
  async errorValidationURN(condition){
     
    if(condition='more'){
      await this.elementToContainSplCharError(URN_ERROR,URN_ERRORMESSAGE)
    }else if(condition='specialcharacters'){
      await this.elementToContainSplCharError(URN_ERROR,URN_SPL_CHARACTERERRORMESSAGE)
    }  else if(condition='empty'){
      await this.elementToContainSplCharError(URN_ERROR,URN_EMPTY_ERRORMESSAGE)
    }
}



async connectTODatabase() {
  const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
  await sleep(5000)
  try {
    // Step 1: Define the Azure SQL Database connection configuration
   // await db.connect();
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().replace('T', ' ').substring(0, 23) + '+00';
    console.log('*****************************'+formattedDate);

    const updateStatusQuery = `INSERT INTO public.application ("id","reference","data","createdAt","updatedAt","createdBy","updatedBy","claimed","statusId")
    VALUES 
      ('5fc79fd8-7952-45ec-8c02-d71d5e09592e', 'AHWR-5FC7-9FD8',
       '{"reference": null, "declaration": true, "offerStatus": "accepted", "whichReview": "beef",
        "organisation": {""sbi"": ""113744304"", ""name"": ""Mrs Heather Tyler"", ""email"": ""judithmuird@riumhtidujl.com.test"", ""address"": ""35e Lower South Wraxall,NORTH DEIGHTON,MARKET DRAYTON,WR10 3LH,United Kingdom"", ""farmerName"": ""Judith Anthony Muir""}, 
        "eligibleSpecies": "yes", "confirmCheckDetails": "yes"}',
        '${formattedDate}', '${formattedDate}','admin','admin','false','11','VV');`
    
        

       db.none(updateStatusQuery)
  .then(() => {
    console.log('Status updated successfully.');
  })
  .catch(error => {
    console.error('Error updating status:', error);
  })
  .finally(() => {
    // Close the database connection (optional)
   
  });
  }
catch(err){
await console.log(err)
}

}
async generateDate() {
// Get the current date
let currentDate = new Date();

// Add one day to the current date
currentDate.setDate(currentDate.getDate() + 1);

// Format the date as a string in the desired format (YYYY-MM-DD HH:mm:ss)
let formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");

console.log(formattedDate);
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
await sleep(5000)
try {
  // Step 1: Define the Azure SQL Database connection configuration
  const conn = await db.connect();

  let query = `
UPDATE public.application
SET "createdAt" = $1,
    "updatedAt" = $1'
WHERE reference = AHWR-89D1-4456;
`;
//AGREEMENT_NUMBER_VALUE='AHWR-8092-E593'
db.none(query, [formattedDate])
.then(() => {
  console.log('Status updated successfully.');
})
.catch(error => {
  console.error('Error updating status:', error);
})
.finally(() => {
  // Close the database connection (optional)
 
});

  } catch (err) {
  console.error('Error:', err);
}

// Close the WebDriverIO browser session when done
await browser.deleteSession();
}
 


//Animal testing


async animalTestingValidation(species,noOfSpecies){
  switch (species) {
    case 'Sheep':
      await this.sendKey(NO_OF_ANIMAL_TESTED, noOfSpecies);
      break;
    case 'Beef':
      await this.sendKey(NO_OF_ANIMAL_TESTED, noOfSpecies);
      break;
    case 'Pigs':
      await this.sendKey(NO_OF_ANIMAL_TESTED, noOfSpecies);
      break;
    // Add additional cases as needed
      }
  
}

async noOfSpeciesErrorValidation(type){
  switch(type) {
    case 'invalidspecies':
      await this.elementToContainText(ACTUAL_NOOFSPECIES_ERRORMESSAGE,EXPECTED_NOOFSPECIES_ERRORMESSAGE)
      break;
    case 'blank':
      await this.elementToContainText(ACTUAL_ERRORMESSAGE,EXPECTED_BLANK_ERRORMESSAGE)
      break;
    case 'specialcharacter':
      await this.elementToContainText(ACTUAL_ERRORMESSAGE,EXPECTED_ONLYNUMBERS_ERRORMESSAGE)
      break;
  
  }

}

//EndemicsClaim

async claimNumberOfSpeciesPageHeader(){
   await this.elementToContainText(NUMBER_OF_ANIMALS_HEADER_ACTUAL,NUMBER_OF_ANIMALS_HEADER_EXPECTED)
}
async claimNumberOfOralSamplesPageHeader(){
  await this.elementToContainText(NUMBER_OF_ORAL_FLUID_SAMPLES_HEADER_ACTUAL,NUMBER_OF_ORAL_FLUID_SAMPLES_EXPECTED)
}
async numberOfanimalTestingValidation(numberOfSpecies){
  await this.sendKey(NO_OF_SPECIES_TESTED,numberOfSpecies)
}
async numberOfOralSamplesTestingValidation(numberOfOralSamples){
  await this.sendKey(NO_OF_ORAL_TESTED,numberOfOralSamples)
}
async acceptCookies() {
  await this.clickOn(COOKIES_ACCEPT)
  await this.clickOn(COOKIES_HIDE)
  }
async continueAfterInputSpeciesData(){
  await this.clickOn(SPECIES_NUMBER_CONTINUE)
}
async continueAfterInputOralSamplesData(){
  await this.clickOn(ORAL_SAMPLES_CONTINUE)
}
async cattleTestingLink(){
  await this.elementToContainText(CATTLE_TESTING_LINK_ACTUAL,CATTLE_TESTING_LINK_EXPECTED)
  await this.clickOn(CATTLE_TESTING_LINK_ACTUAL)
  await this.screenShot()
  await browser.back()
  }
async sheepTestingLink(){
  await this.elementToContainText(SHEEP_TESTING_LINK_ACTUAL,SHEEP_TESTING_LINK_EXPECTED)
  await this.clickOn(SHEEP_TESTING_LINK_ACTUAL)
  await this.screenShot()
  await browser.back()
  }
async pigTestingLink(){
  await this.elementToContainText(PIG_TESTING_LINK_ACTUAL,PIG_TESTING_LINK_EXPECTED)
  await this.clickOn(PIG_TESTING_LINK_ACTUAL)
  await this.screenShot()
  await browser.back()
  }
async enterNoOfAnimalsTestingLink(){
  await this.elementToContainText(ENTER_NO_OF_ANIMALS_TESTING_LINK_ACTUAL,ENTER_NO_OF_ANIMALS_TESTING_LINK_EXPECTED)
  await this.clickOn(ENTER_NO_OF_ANIMALS_TESTING_LINK_ACTUAL)
  await this.screenShot()
  }
async atleastFiveOralFluidSamplesLink(){
  await this.elementToContainText(ATLEAST_FIVE_ORAL_SAMPLES_LINK_ACTUAL,ATLEAST_FIVE_ORAL_SAMPLES_LINK_EXPECTED)
  await this.clickOn(ATLEAST_FIVE_ORAL_SAMPLES_LINK_ACTUAL)
  await this.screenShot()
  await browser.back()
  }
async enterNoOfOralFluidSamplesLink(){
  await this.elementToContainText(ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_ACTUAL,ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_EXPECTED)
  await this.clickOn(ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_ACTUAL)
  await this.screenShot()
  }
  
async click_BackLink(){
  await this.clickOn(BACK_LINK)
 
 }
async getHelpForClaimHeader(){
  await this.elementToContainText(GET_HELP_FOR_CLAIM_HEADER_ACTUAL,GET_HELP_FOR_CLAIM_HEADER_EXPECTED)
  }
  async getHelpForClaimOralSamplesHeader(){
    await this.elementToContainText(GET_HELP_FOR_CLAIM_ORAL_SAMPLES_HEADER_ACTUAL,GET_HELP_FOR_CLAIM_HEADER_EXPECTED)
    }
  

async defraEmaiIDValidate(){
  await this.elementToContainText(DEFRA_EMAIL_ID_ACTUAL,DEFRA_EMAIL_ID_EXPECTED)
    }

async phoneNumberValidate(){
  await this.elementToContainText(PHONE_NUMBER_ACTUAL,PHONE_NUMBER_EXPECTED)
      }
async phoneNumberOralSamplesValidate(){
        await this.elementToContainText(PHONE_NUMBER_ORAL_SAMPLES_ACTUAL,PHONE_NUMBER_EXPECTED)
            }
// Exception
  async validateClaimEndemicsExceptionHeader(){
     const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
   await sleep(10000)
   await this.elementToContainText(NUMBER_OF_SPECIES_EXCEPTION_ACTUAL,NUMBER_OF_SPECIES_EXCEPTION_EXPECTED)
     }

  async validateExceptionOralSamplesHeader(){
      const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    await this.elementToContainText(NUMBER_OF_TESTS_EXCEPTION_ACTUAL,NUMBER_OF_TESTS_EXCEPTION_EXPECTED)
      }
     
// Error message
async validate_Blank_Error(){
  await this.elementToContainText(Blank_ERROR_ACTUAL,Blank_ERROR_EXPECTED)
}
async validate_Blank_Error_Vet_Name(){
  await this.elementToContainErrorText(VET_NAME_Blank_ERROR_ACTUAL,VET_NAME_Blank_ERROR_EXPECTED)
}
async validate_Blank_Error_Oral_Sample(){
  await this.elementToContainErrorText(ORAL_SAMPLE_Blank_ERROR_ACTUAL,ORAL_SAMPLE_Blank_ERROR_EXPECTED)
}
async validate_SpecialChar_Error(){
  await this.elementToContainText(CHAR_ERROR_ACTUAL,CHAR_ERROR_EXPECTED)
}

// check-detail page
async singleUserBusinessDetail() {
   
  const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
  await sleep(5000)
 
    await this.elementTextShouldBe(CHECK_DETAILS, DETAILS)
     
}

async checkFarmerDetails() {
  
  await this.elementToContainText(FARMER_DETAILS, CONTENT1)
}

async farmerAcceptDetails() {
  await this.clickOn(DETAILS_BUTTON)
}

async proceedWithApplication() {
  await this.clickOn(CONTINUE_BUTTON1)
}


  }
module.exports = StartPageActions

