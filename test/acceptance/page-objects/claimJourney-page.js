const CommonActions = require('./common-actions')
const pgp = require('pg-promise')();
// const { submitClaim } = require('../../../app/messaging/application')
const databaseConfig = {
  user: 'adminuser@sndffcdbssq1002',
  host: 'sndffcdbssq1002.postgres.database.azure.com',
  port: 5432,
  database: 'ffc_ahwr_application',
  sslMode: 'true',
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
const INVALID_PASSWORD = 'ADCDEFGHIJKLNOP'
const CONTENT = '#main-content :nth-child(1)>dd'
const HINT = '#main-content :nth-child(2)>dt'
const ANIMAL = '#main-content :nth-child(3)>dt'
const CONFIRM_BUTTON = '#detailsCorrect'
const CONTINUE_BUTTON = '#btnContinue'
const HEADING = '.govuk-fieldset__heading'
const VISIT_DAY = '#visit-date-day'
const VISIT_MONTH = '#visit-date-month'
const VISIT_YEAR = '#visit-date-year'
const SAME_AS_REVIEW_RADIO = '#whenTestingWasCarriedOut'
const DATE_CONTINUE = '#btnContinue'
const DATE_CONTINUE_ENDEMICS = '#continue'
const VET_QUESTION_ElEMENT = '.govuk-label-wrapper'
const VET_QUESTION = 'What is the vet’s name'
const VET_NAME = '#vetsName'
const RCVS_BOX = '#rcvs'
const RCVS_BOX_ENDEMICS = '#vetRCVSNumber'
const URN_QUESTION = 'What is the laboratory unique reference number for the test results?'
const URN_FIELD = '#urn'
const URN_FIELD_ENDEMICS = '#laboratoryURN'
const BACK_BUTTON = '#back'
const BUSINESS_NAME = '#main-content :nth-child(1)>dt'
const PROCEED_TO_SUBMIT = '[role="button"]'
const CLAIM_SUBMIT = '#submitClaimForm > button'
const CLAIM_SUCCESS_MESSAGE = '#main-content>div>div>p:nth-child(2)'
const AGREEMENT_NUMBER = '#main-content strong'
const ANOTHER_DAY_BUTTON = '#whenTestingWasCarriedOut-2'
const DIFFERENT_DAY = '#on-another-date-day'
const DIFFERENT_MONTH = '#on-another-date-month'
const DIFFERENT_YEAR = '#on-another-date-year'
const PAST_DATE_ERROR = 'a[href*="#when-was-endemic-disease-or-condition-testing-carried-out"]'
const PAST_DATE_ERROR_EXPECTED = 'Date of testing must be in the past'
const APPLICATION_DATE_ERROR_EXPECTED = 'Date of testing must be the same'
const DATE_ERROR = 'a[href="#when-was-the-review-completed"]'
const DATE_ERROR_ENDEMICS = 'a[href="#when-was-endemic-disease-or-condition-testing-carried-out"]'
const DATE_BLANK_ERROR_EXPECTED = 'Enter the date the vet completed the review'
const DATE_BLANK_ERROR_EXPECTED_FOR_REVIEW = 'Enter the date the vet completed testing'
const CLICK_RADIO_BUTTON_ERROR = 'a[href="#when-was-endemic-disease-or-condition-testing-carried-out"]'
const CLICK_RADIO_BUTTON_ERROR_EXPECTED = 'Select if testing was carried out when the vet visited the farm or on another date'
const INVALID_DATE_ERROR = 'Date of review must be a real date'
const MISSING_YEAR_AND_DATE = 'Date of review must include a day and a year'
const MISSING_DATE_AND_MONTH = 'Date of review must include a day and a month'
const MISSING_MONTH_AND_YEAR = 'Date of review must include a month and a year'
const DATEVISIT_PRIOR_TO_AGREEMENT='Date of visit cannot be before the date your agreement began'
const MISSING_MONTH = 'Date of review must include a month'
const MISSING_DATE = 'Date of review must include a day'
const MISSING_YEAR = 'Date of review must include a year'
const TYPEOF_REVIEW = '//dt[contains(text(),"Type")]/following-sibling::dd'
const MUTLIPLE_BUSINESS_CONTINUE = '#continueReplacement'
var another_day;
var another_month;
var another_year;
//Exception
const EXCEPTION_HEADER = '.govuk-heading-l'
const NO_OF_ANIMAL_TESTED = '#number-of-animals-tested'
const NO_OF_ANIMAL_TESTED_ENDEMICS = '#numberAnimalsTested'
const ORAL_SAMPLE_Blank_ERROR_ACTUAL = '#numberOfOralFluidSamples-error'
const ORAL_SAMPLE_Blank_ERROR_EXPECTED = 'Enter the number of oral fluid samples collected'
const HEADER_ERROR_MESSAGE_EXPECTED = 'You cannot claim for a livestock review for this business'
const EXCEPTION_ERROR_MESSAGE = '.govuk-heading-l+.govuk-body'
const EXCEPTION_ERROR_MESSAGE_EXPECTED = 'You do not have the required permission to act for Test Estate - SBI 114441446.'
const EXCEPTION_ERROR_MESSAGE_EXPECTED_NOT_APPLIED = 'Mr A Slack - SBI 106864909 has not applied for an annual health and welfare review of livestock.'
const EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_PERMISSION = 'You do not have the required permission to act for Dale Hitchens - SBI 107224622.'
const EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_APPLIED = 'Michael Dixon - SBI 114293653 has not applied for an annual health and welfare review of livestock.'
//const CALL_CHARGES='//a[text()="Find out about call charges (opens in a new tab)"]'
const CALL_CHARGES = '//a[contains(@href, "https://www.gov.uk/call-charges")]'
const CALL_CHARGES_TITLE = 'Call charges and phone numbers - GOV.UK'
const REAL_DATE_ERROR = 'Date of review must be a real date'
const VET_NAME_ERROR_MESSAGE = 'Vet’s name must be 50 characters or fewer'
const VET_FULL_NAME = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const VET_NAME_ERROR = '[role="vetsName"]'
const RCVS_ERROR = '#rcvs-error'
const RCVS_ERROR_ENDEMICS = 'a[href="#vetRCVSNumber}"]'
const URN_ERROR = '#urn-error'
const URN_ERROR_ENDEMICS = 'a[href="#laboratoryURN"]'
const RCVS_ERRORMESSAGE = 'An RCVS number is a 7 digit number or a 6 digit number ending in a letter.'
const URN_SPL_CHARACTERERRORMESSAGE = 'URN must only include letters a to z, numbers and a hyphen'
const URN_ERRORMESSAGE = 'URN must be 50 characters or fewer'
const URN_EMPTY_ERRORMESSAGE = 'Enter the URN'
const VET_NAME_SPLCHARACTER_ERRORMESSAGE = 'Vet’s name must only include letters a to z, numbers and special characters such as hyphens, spaces, apostrophes, ampersands, commas, brackets or a forward slash'
const EXPECTED_NOOFSPECIES_ERRORMESSAGE = 'The number of animals you have entered does not meet the minimum required for the type of review you are claiming for.'
const ACTUAL_NOOFSPECIES_ERRORMESSAGE = 'body > div:nth-child(7) > main:nth-child(2) > div:nth-child(1) > div:nth-child(1) > p:nth-child(2)'
const EXPECTED_ONLYNUMBERS_ERRORMESSAGE = 'Number of animals tested must only include numbers'
const ACTUAL_ERRORMESSAGE = 'a[href="#number-of-animals-tested"]'
const EXPECTED_BLANK_ERRORMESSAGE = 'Enter the number of animals tested'
const ANIMAL_SPECIES_BLANK = 'a[href="#numberAnimalsTested}"]'

//EndemicsClaim
const COOKIES_ACCEPT = '[value="accept"]'
const COOKIES_HIDE = '/html/body/div[1]/div/div[2]/div[2]'
const NUMBER_OF_SPECIES_EXCEPTION_EXPECTED = 'You cannot continue with your claim'
const NUMBER_OF_SPECIES_EXCEPTION_ACTUAL = '.govuk-heading-l'
const NUMBER_OF_TESTS_EXCEPTION_ACTUAL = '#main-content > div > div > h1'
const NUMBER_OF_TESTS_EXCEPTION_EXPECTED = 'You cannot continue with your claim'
const CATTLE_TESTING_LINK_ACTUAL = '//a[text()="cattle: testing required for an annual health and welfare review"]'
const CATTLE_TESTING_LINK_EXPECTED = 'cattle: testing required for an annual health and welfare review'
const SHEEP_TESTING_LINK_ACTUAL = '//a[text()="sheep: testing required for an annual health and welfare review"]'
const SHEEP_TESTING_LINK_EXPECTED = 'sheep: testing required for an annual health and welfare review'
const PIG_TESTING_LINK_ACTUAL = '//a[text()="pigs: testing required for an annual health and welfare review"]'
const PIG_TESTING_LINK_EXPECTED = 'pigs: testing required for an annual health and welfare review'
const ENTER_NO_OF_ANIMALS_TESTING_LINK_ACTUAL = '//a[text()="Enter the number of animals tested"]'
const ENTER_NO_OF_ANIMALS_TESTING_LINK_EXPECTED = 'Enter the number of animals tested'
const BACK_LINK = '#back'
const GET_HELP_FOR_CLAIM_HEADER_EXPECTED = 'Get help with your claim'
const GET_HELP_FOR_CLAIM_HEADER_ACTUAL = '#main-content > div > div > h2:nth-child(11)'
const GET_HELP_FOR_CLAIM_ORAL_SAMPLES_HEADER_ACTUAL = '//*[@id="main-content"]/div/div/h2'
const ATLEAST_FIVE_ORAL_SAMPLES_LINK_EXPECTED = 'There must have been at least five oral fluid samples tested'
const ATLEAST_FIVE_ORAL_SAMPLES_LINK_ACTUAL = '#main-content > div > div > p:nth-child(2) > a'
const ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_EXPECTED = 'Enter the number of oral fluid samples tested'
const ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_ACTUAL = '#main-content > div > div > p:nth-child(4) > a'
const Blank_ERROR_ACTUAL = '#numberAnimalsTested-error'
const Blank_ERROR_EXPECTED = 'Enter the number of animals tested'
const CHAR_ERROR_ACTUAL = '#numberAnimalsTested-error'
const CHAR_ERROR_EXPECTED = 'Number of animals tested must only include numbers'
const VET_NAME_Blank_ERROR_ACTUAL = '#vetsName-error'
const VET_NAME_Blank_ERROR_EXPECTED = 'Enter the vet\'s name'
const DEFRA_EMAIL_ID_EXPECTED = 'ruralpayments@defra.gov.uk'
const DEFRA_EMAIL_ID_ACTUAL = '//a[text()="ruralpayments@defra.gov.uk"]'
const PHONE_NUMBER_EXPECTED = 'Telephone: 03000 200 301'
const PHONE_NUMBER_ACTUAL = '//*[@class="govuk-list"]//li[3]'
const PHONE_NUMBER_ORAL_SAMPLES_ACTUAL = '//*[@class="govuk-list"]//li[3]'
const NUMBER_OF_ANIMALS_HEADER_EXPECTED = 'How many animals did the vet test?'
const NUMBER_OF_ANIMALS_HEADER_ACTUAL = '//*[@id="main-content"]/div/div/form/h1'
const NUMBER_OF_ORAL_FLUID_SAMPLES_HEADER_ACTUAL = '//*[contains(text(),"How many oral fluid samples did the vet take?")]'
const NUMBER_OF_ORAL_FLUID_SAMPLES_EXPECTED = 'How many oral fluid samples did the vet take?'
const NO_OF_SPECIES_TESTED = '#numberAnimalsTested'
const NO_OF_ORAL_TESTED = '#numberOfOralFluidSamples'
const SPECIES_NUMBER_CONTINUE = '#btnContinue'
const ORAL_SAMPLES_CONTINUE = '#continue'
const CHECK_DETAILS = '.govuk-heading-l'
const FARMER_DETAILS = '.govuk-summary-list'
const DETAILS_BUTTON = '#confirmCheckDetails'
const CONTINUE_BUTTON1 = '#btnContinue'
const DETAILS = 'Check your details'
const CONTENT1 = 'Business name'
const MANAGE_CLAIM = '//*[contains(text(),"Start a new claim")]'


const SHEEP = '#typeOfLivestock-3'
const PIGS = '#typeOfLivestock-4'
const DAIRY_CATTLE = '#typeOfLivestock-2'
const BEEF_CATTLE = '#typeOfLivestock'
const ELIGIBLE_SPECIES = '#speciesNumbers'
const NO_ELIGIBLE_SPECIES = '#speciesNumbers-2'
const CHECK_YOUR_LIVESTOCK_LINK = '//*[@id="main-content"]/div/div/p[3]/a'
const MINIMUM_LIVESTOCK_LINK = '//*[@id="main-content"]/div/div/p[1]/a'
const POSITIVE_TEST_RESULTS = '#testResults'
const NEGATIVE_TEST_RESULTS = '#testResults-2'
const ACTUAL_TEST_RESULTS_ERROR_MESSAGE = '//ul//li//a'
const EXPECTED_TEST_RESULTS_ERROR_MESSAGE = 'Select a test result'
//Date of testing
const VALIDATION_HEADER='//*[@id="main-content"]/div/div/div/div/ul/li/a'
const NO_OPTION_SELECTED = '[href="#when-was-endemic-disease-or-condition-testing-carried-out"]'
const NO_OPTION_SELECTED_ERROR_MESSAGE = 'Enter the date the vet completed testing'
const EARLY_REVIEW_VISIT_DATE_ERROR_MESSAGE = 'Date of testing cannot be before the review visit date'
const EARLY_REVIEW_VISIT_DATE_ERROR = '.govuk-error-summary__body'
const MISSING_VISIT_YEAR_AND_DATE = 'Date of visit must include a day and a year'
const MISSING_VISIT_DATE_AND_MONTH = 'Date of visit must include a day and a month'
const MISSING_VISIT_MONTH_AND_YEAR = 'Date of visit must include a month and a year'
const MISSING_VISIT_MONTH = 'Date of testing must include a month'
const MISSING_VISIT_DATE = 'Date of testing must include a day'
const MISSING_VISIT_YEAR = 'Date of testing must include a year'
const BLANK_DATE_OF_VISIT_REVIEWCLAIM='Enter the date the vet completed the review'
const MISSING_VISIT_YEAR_REVIEWCLAIM = 'Date of visit must include a year'
const MISSING_VISIT_DATE_REVIEWCLAIM = 'Date of visit must include a day'
const MISSING_VISIT_MONTH_REVIEWCLAIM = 'Date of visit must include a month'
const INCORRECT_DATE_FORMAT='Date of visit must be a real date'
const REVIEW_PAGE_HEADER='//*[@id="main-content"]/div/div/form/div/fieldset/legend/h1'
const ACTUAL_REVIEW_PAGE_HEADER='Which type of review are you claiming for beef cattle?'

//Sheep error for min live stock

const PIGANDBEEF_ERROR_ACTUAL = '//*[@id="main-content"]/div/div/p[1]'
const PIGANDBEEF_ERROR_EXPECTED = 'The number of animals you have entered does not meet the minimum required.'
const SHEEP_ERROR_ACTUAL = '//*[@id="main-content"]/div/div/h1'
const SHEEP_ERROR_EXPECTED = 'There could be a problem with your claim'
const REFERENCE_NUMBER = '#reference'
const AMOUNT = '//*[@id="main-content"]/div/div/p[4]'
const AMOUNT_TEXT = 'We will process your claim within 28 days. If your claim is successful, you will get £[amount]'
const GUIDANCE_LINK = 'a[href="https://apply-for-an-annual-health-and-welfare-review.defra.gov.uk/apply/guidance-for-farmers"]'
const LINK_OF_WHAT_DO_YOU_THINK_OF_THIS_SERVICE = '[href=""]'
const MANAGE_YOUR_CLAIMS = 'a[href="https://ffc-ahwr-farmer-test.azure.defra.cloud/vet-visits"]'
const CLAIM_SUBMIT_ENDEMICS = '#submit-claim'
//

let GOV_UK = '.govuk-header__logotype-text'
let GOV_UK_LINK = 'https://www.gov.uk/'
let AHWR_HEADER = '.govuk-header__content'
let EXPECTED_AHWR_HEADER = 'Annual health and welfare review of livestock'
let AHWR_URL = 'https://ffc-ahwr-farmer-test.azure.defra.cloud/'

//Endemics-type of review

let TYPE_OF_REVIEW='#typeOfReview-2'
let TYPE_OF_REVIEW_EXPECTED_ERROR_MESSAGE='Select which type of review you are claiming for'
let TYPE_OF_REVIEW_ACTUAL_ERROR_MESSAGE='a[href="#typeOfReview"]'
let DATE_OF_VISIT_HEADER_ACTUAL='Date of visit'
let DATE_OF_VISIT_HEADER_EXPECTED='//*[@id="main-content"]/div/div/h1'
let TYPE_OF_REVIEW_URL='https://ffc-ahwr-farmer-test.azure.defra.cloud/claim/endemics/which-type-of-review'
let CHANGE_YOUR_ANSWERS='//*[@id="main-content"]/div/div/p[3]/a'


//sheep error page links

let SHEEP_ERROR_LINK_ENTER_THE_ANIMAL_TESTED='a[href="/claim/endemics/number-of-species-tested"]'
let SHEEP_ERROR_LINK_CONTINUE_TO_CLAIM='a[href="/claim/endemics/vet-name"]'

//Endemics-TestREsults Error screen

let RESULTS_ERROR_MESSAGE_EXPECTED='a[href="#testResults"]'
let RESULTS_ERROR_MESSAGE_ACTUAL='Select a test result'
let BIOMRTERIC_BACK_LINK='.govuk-back-link'

//Expection Date of Visit 


const REVIEWCALIM_LESSTHAN10MONTHS_EXCEPTION_ACTUAL='You cannot continue with your claim'
const REVIEWCALIM_LESSTHAN10MONTHS_EXCEPTION_EXPECTED='//*[@id="main-content"]/div/div/h1'
const AHWR_LINK='#typeOfReview'
const TENMONTH_GUIDANCE_LINK='//*[@id="main-content"]/div/div/p[1]/a'
const DATE_OF_VISIT_LINK='//*[@id="main-content"]/div/div/p[3]/a'


class StartPageActions extends CommonActions {

  async getHomepage(page) {
    await this.open(page)
  }
  async claimPageTitle() {
    await this.getPageTitle(PAGE_TITLE)
  }
  async startNow() {
    await this.clickOn(START)
  }
  async DefraIdPage() {
    await this.urlContain(URL_CONTENT)
  }
  async inputInvalidCrn() {
    await this.sendKey(DEFRA_CRN, INVALID_CRN)
  }
  async inputInvalidPassword() {
    await this.sendKey(DEFRA_PASSWORD, INVALID_PASSWORD)
  }
  async signIn() {
    await this.clickOn(SUBMIT)
  }
  async back() {
    await this.clickOn(SUBMIT)
  }
  async errorMessage() {
    await this.elementToContainText(ERROR_MESSAGE, DISPLAYED_ERROR)
  }
  async inputValidCrn(crn) {
    await this.sendKey(DEFRA_CRN, crn)
  }
  async inputPassword(password) {
    await this.sendKey(DEFRA_PASSWORD, password)
  }

  async validData(business) {
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

      case 'Multiple':

        await this.inputValidCrn(process.env.CRN_CLAIM_MULTIPLE);
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

  async agreementNumber() {
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    await this.elementToContainText(CONTENT, 'AHWR')
  }
  async nameOfBusiness() {
    await this.elementToContainText(HINT, 'Business name')
  }
  async animalType() {
    await this.elementTextShouldBe(ANIMAL, 'Type of review')
  }
  async confirmDetail() {
    await this.clickOn(CONFIRM_BUTTON)

  } async proceedClaim() {
    await this.clickOn(CONTINUE_BUTTON)
  }
  async clickChangeTheAnswers() {
    await this.clickOn(CHANGE_YOUR_ANSWERS)
  }
  async visitDatePage() {
    await this.urlContain('vet-visit-date')
  }
  async visitHeadings() {
    await this.elementToContainText(HEADING, 'completed?')
  }

  async validateDateOfVisitError(dateFormat) {
    switch (dateFormat) {
      case 'blank':{
        await this.elementToContainText( VALIDATION_HEADER,BLANK_DATE_OF_VISIT_REVIEWCLAIM)
      }
      case 'incorrect':{
        await this.elementToContainText( VALIDATION_HEADER,INCORRECT_DATE_FORMAT)
      }
      case 'monthisblank':{
        await this.elementToContainText( VALIDATION_HEADER,MISSING_VISIT_MONTH_REVIEWCLAIM)
      }
      case 'dateisblank':{
        await this.elementToContainText( VALIDATION_HEADER,MISSING_VISIT_DATE_REVIEWCLAIM)
      }
      case 'yearisblank':{
        await this.elementToContainText( VALIDATION_HEADER,MISSING_VISIT_YEAR_REVIEWCLAIM)
      }
      case 'agreementdateprior':{
        await this.elementToContainText(VALIDATION_HEADER,DATEVISIT_PRIOR_TO_AGREEMENT)
      
  }
  }
}
  async inputCurrentDate(dateFormat) {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    switch (dateFormat) {
        case 'correct':
            await this.sendKey(VISIT_DAY, day);
            await this.sendKey(VISIT_MONTH, month);
            await this.sendKey(VISIT_YEAR, year);
            const date = `${day},${month},${year}`;
            return date;

        case 'blank':
            await this.sendKey(VISIT_DAY, '');
            await this.sendKey(VISIT_MONTH, '');
            await this.sendKey(VISIT_YEAR, '');
            break;

        case 'monthisblank':
            await this.sendKey(VISIT_DAY, '02');
            await this.sendKey(VISIT_MONTH, '');
            await this.sendKey(VISIT_YEAR, '2024');
            break;

        case 'dateisblank':
            await this.sendKey(VISIT_DAY, '');
            await this.sendKey(VISIT_MONTH, '02');
            await this.sendKey(VISIT_YEAR, '2024');
            break;

        case 'yearisblank':
            await this.sendKey(VISIT_DAY, '02');
            await this.sendKey(VISIT_MONTH, '');
            await this.sendKey(VISIT_YEAR, '');
            break;

        case 'invalid':
            await this.sendKey(VISIT_DAY, '31');
            await this.sendKey(VISIT_MONTH, '02');
            await this.sendKey(VISIT_YEAR, '2023');
            break;
        case 'agreementdateprior':
            await this.sendKey(VISIT_DAY, '01');
            await this.sendKey(VISIT_MONTH, '02');
            await this.sendKey(VISIT_YEAR, '2023');
            break;

        default:
            // Handle unknown format
            break;
    }
}

  async invalidDateFormat(day, month, year) {
    await this.sendKey(VISIT_DAY, day)
    await this.sendKey(VISIT_MONTH, month)
    await this.sendKey(VISIT_YEAR, year)

  }
  async clickOnAnotherDay_WrongMonth() {
    await this.clickOn(ANOTHER_DAY_BUTTON)
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    await this.sendKey(DIFFERENT_DAY, day)
    await this.sendKey(DIFFERENT_MONTH, month)
    await this.sendKey(DIFFERENT_YEAR, year)
  }

  async dateFormat() {
    const date_Value = this.inputCurrentDate();
    const arrayOfDate = (await date_Value).split(",");
    another_day = arrayOfDate[0]
    another_month = arrayOfDate[1]
    another_year = arrayOfDate[2]
  }
  async clickOnAnotherDay() {
    await this.clickOn(ANOTHER_DAY_BUTTON)
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    await this.sendKey(DIFFERENT_DAY, day);
    await this.sendKey(DIFFERENT_MONTH, month);
    await this.sendKey(DIFFERENT_YEAR, year);
  }

  async verifyDate_Error(day) {
    await this.clickOn(ANOTHER_DAY_BUTTON)
    await this.dateFormat();
    if (day == 'future') {
      await this.sendKey(DIFFERENT_DAY, parseInt(another_day) + 1)
      await this.sendKey(DIFFERENT_MONTH, parseInt(another_month) + 1)
      await this.sendKey(DIFFERENT_YEAR, another_year)
    }
    else {
      await this.sendKey(DIFFERENT_DAY, parseInt(another_day) + 1)
      await this.sendKey(DIFFERENT_MONTH, parseInt(another_month) - 1)
      await this.sendKey(DIFFERENT_YEAR, parseInt(another_year) - 1)

    }
  }

  async validate_Application_DateError() {
    await this.elementToContainText(PAST_DATE_ERROR, APPLICATION_DATE_ERROR_EXPECTED)
  }
  async validate_Error() {
    await this.elementToContainText(PAST_DATE_ERROR, PAST_DATE_ERROR_EXPECTED)
  }
  async blankErrorValidation() {
    await this.elementToContainText(DATE_ERROR, DATE_BLANK_ERROR_EXPECTED);
    await this.elementToContainText(CLICK_RADIO_BUTTON_ERROR, CLICK_RADIO_BUTTON_ERROR_EXPECTED);
  }
  async blank_Error_Validation_For_AnotherDate() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, DATE_BLANK_ERROR_EXPECTED_FOR_REVIEW);

  }
  async dateAndYearmissing_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, MISSING_YEAR_AND_DATE)
  }
  async realDate_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, REAL_DATE_ERROR)
  }
  async dateAndMonthmissing_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, MISSING_DATE_AND_MONTH)
  }
  async yearAndMonthmissing_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, MISSING_MONTH_AND_YEAR)
  }
  async monthmissing_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, MISSING_MONTH)
  }
  async yearmissing_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, MISSING_YEAR)
  }
  async datemissing_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, MISSING_DATE)
  }

  async invalidDateValidate() {
    await this.elementToContainText(DATE_ERROR, INVALID_DATE_ERROR)
  }

  async clickOnSameDay() {
    await this.clickOn(SAME_AS_REVIEW_RADIO)
  }
  async continueAfterInputData() {
    await this.clickOn(DATE_CONTINUE)
  }
  async continueAfterEndemicsInputData() {
    await this.clickOn(DATE_CONTINUE_ENDEMICS)
  }
  async vetNamePage() {
    await this.urlContain('vet-name')
  }
  async pageQuestion() {
    await this.elementToContainText(VET_QUESTION_ElEMENT, VET_QUESTION)
  }
  async inputVetName() {
    await this.sendKey(VET_NAME, 'Automation')
  }
  async vet_rcvsPage() {
    await this.urlContain('vet-rcvs')
  }
  async displayedQuestion() {
    await this.elementToContainText(VET_QUESTION_ElEMENT, 'Veterinary Surgeons (RCVS) number?')
  }
  async numberBox() {
    await this.sendKey(RCVS_BOX, 1234567)
  }
  async numberBoxEndemics() {
    await this.sendKey(RCVS_BOX_ENDEMICS, 1234567)
  }
  async urnPage() {
    await this.urlContain('urn-result')
  }
  async urnPageEndemics() {
    await this.urlContain('test-urn')
  }
  async pageDisplay() {
    await this.elementToContainText(VET_QUESTION_ElEMENT, URN_QUESTION)
  }
  async urnInputField() {
    await this.sendKey(URN_FIELD, 'automation')
  }
  async urnInputFieldEndemics() {
    await this.sendKey(URN_FIELD_ENDEMICS, 'automation')
  }
  async checkAnswerPage() {
    await this.urlContain('check-answers')
  }
  async confirmAnswerProvided() {
    await this.elementToContainText(VET_QUESTION_ElEMENT, 'Check your answers')
  }
  async containBusinessName() {
    await this.elementToContainText(BUSINESS_NAME, 'Business name')
  }
  async sbiIsCorrect() {
    await this.elementToContainText(HINT, 'SBI')
  }
  async livestockNumberCorrect() {
    let liveStockName = await this.elementGetText(TYPEOF_REVIEW)
    switch (liveStockName) {
      case 'Sheep':
        await this.elementToContainText(ANIMAL, '21 or more sheep')
        break;
      case 'Beef cattle':
        await this.elementToContainText(ANIMAL, '11 or more cattle')
        break;
      case 'Pigs':
        await this.elementToContainText(ANIMAL, '51 or more pigs')
        break;
      case 'Dairy cattle':
        await this.elementToContainText(ANIMAL, '11 or more cattle')
        break;
    }

  }
  async continueToSubmitClaim() {
    await this.clickOn(PROCEED_TO_SUBMIT)
  }
  async submitClaimUrl() {
    await this.urlContain('submit-claim')
  }

  async clickOnSubmit() {
    await this.clickOn(CLAIM_SUBMIT_ENDEMICS)

  }
  async pageInformation() {
    await this.elementToContainText(VET_QUESTION_ElEMENT, 'Submit your claim')

  }
  async claimSubmitButton() {
    await this.clickOn(CLAIM_SUBMIT)
  }
  async click_BackButton() {
    await this.clickOn(BACK_BUTTON)

  }
  async completeClaimPage() {
    await this.urlContain('submit-claim')
  }
  async claimCompleteMessage() {
    await this.elementToContainText(VET_QUESTION_ElEMENT, 'Claim complete')
  }
  async claimSuccessMessage() {
    await this.elementToContainText(CLAIM_SUCCESS_MESSAGE, 'successfully submitted.')
  }
  async claimAgreementNumber() {
    await this.elementToContainText(AGREEMENT_NUMBER, 'AHWR-')
  }

  //Exception
  async validateExceptionHeader() {
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    await this.elementToContainText(EXCEPTION_HEADER, HEADER_ERROR_MESSAGE_EXPECTED)
  }

  async exceptionErrorMessage(typeOfException) {
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    if (typeOfException == 'SB-NO Permission') {
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE, EXCEPTION_ERROR_MESSAGE_EXPECTED)
    } else if (typeOfException == 'SB-NOT Applied') {
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE, EXCEPTION_ERROR_MESSAGE_EXPECTED_NOT_APPLIED)
    } else if (typeOfException == 'MB-NO Permission') {
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE, EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_PERMISSION)
    } else if (typeOfException == 'MB-NOT Applied') {
      await this.elementToContainText(EXCEPTION_ERROR_MESSAGE, EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_APPLIED)
    }
  }

  async validateCallCharges() {
    await this.clickOn(CALL_CHARGES)
    const windowHandles = await browser.getWindowHandles();
    await browser.switchToWindow(windowHandles[1]);
    let expectedPageTitle = await this.getPageTitle(CALL_CHARGES_TITLE)
    console.log(expectedPageTitle)
    await this.screenShot()
    await browser.closeWindow();
    await browser.switchToWindow(windowHandles[0]);
  }

  async validateMinimumLivestock() {
    await this.clickOn(MINIMUM_LIVESTOCK_LINK)

  }
  async validatechangeyouranswer() {
    await this.clickOn(CHECK_YOUR_LIVESTOCK_LINK)


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

  async errorVetName() {
    await this.sendKey(VET_NAME, VET_FULL_NAME)
  }

  async name_error_validation() {
    await this.elementToContainErrorText(VET_NAME_ERROR, VET_NAME_ERROR_MESSAGE)
  }
  async noOptionSelectedErrorValidation() {
    await this.elementToContainErrorText(NO_OPTION_SELECTED, NO_OPTION_SELECTED_ERROR_MESSAGE)
  }

  async earlyReviewDateErrorValidation() {
    await this.elementToContainErrorText(EARLY_REVIEW_VISIT_DATE_ERROR, EARLY_REVIEW_VISIT_DATE_ERROR_MESSAGE)
  }

  async errorVetNameSplCharacters() {
    await this.sendKey(VET_NAME, '££££££')
  }

  async errorVetNamBlankValue() {
    await this.sendKey(VET_NAME, '')
  }
  async errorValidationVetNameSplCharacters() {
    await this.elementToContainSplCharError(VET_NAME_ERROR, VET_NAME_SPLCHARACTER_ERRORMESSAGE)
  }
  async errorValidationVetNameSplCharactersEndemics() {
    await this.elementToContainSplCharError(VET_NAME_Blank_ERROR_ACTUAL, VET_NAME_SPLCHARACTER_ERRORMESSAGE)
  }

  async numberBoxError(condition) {
    if (condition = 'more') {
      await this.sendKey(RCVS_BOX, 12345672333)
    } else if (condition = 'less') {
      await this.sendKey(RCVS_BOX, 12345672333)
    } else if (condition = 'specialcharacters') {
      await this.sendKey(RCVS_BOX, '$%^&&&&&')
    }
  }

  async numberRCVSBoxError(condition) {
    if (condition = 'more') {
      await this.sendKey(RCVS_BOX_ENDEMICS, 12345672333)
    } else if (condition = 'less') {
      await this.sendKey(RCVS_BOX_ENDEMICS, 12345672333)
    } else if (condition = 'specialcharacters') {
      await this.sendKey(RCVS_BOX_ENDEMICS, '$%^&&&&&')
    }
  }
  async errorValidationRCVS() {
    await this.elementToContainSplCharError(RCVS_ERROR, RCVS_ERRORMESSAGE)
  }

  async errorValidationEndemicsRCVS() {
    await this.elementToContainSplCharError(RCVS_ERROR_ENDEMICS, RCVS_ERRORMESSAGE)
  }
  async urnInputFieldErrorEndemics(condition) {
    if (condition = '50 characters') {
      await this.sendKey(URN_FIELD_ENDEMICS, 'wererrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	')
    } else if (condition = 'empty') {
      await this.sendKey(URN_FIELD_ENDEMICS, '')
    } else if (condition = 'specialcharacters') {
      await this.sendKey(URN_FIELD_ENDEMICS, 'auto%$^^mation')
    }
  }

  async urnInputFieldError(condition) {
    if (condition = '50 characters') {
      await this.sendKey(URN_FIELD, 'wererrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	')
    } else if (condition = 'empty') {
      await this.sendKey(URN_FIELD, '')
    } else if (condition = 'specialcharacters') {
      await this.sendKey(URN_FIELD, 'auto%$^^mation')
    }
  }

  async errorValidationURN(condition) {

    if (condition = 'more') {
      await this.elementToContainSplCharError(URN_ERROR, URN_ERRORMESSAGE)
    } else if (condition = 'specialcharacters') {
      await this.elementToContainSplCharError(URN_ERROR, URN_SPL_CHARACTERERRORMESSAGE)
    } else if (condition = 'empty') {
      await this.elementToContainSplCharError(URN_ERROR, URN_EMPTY_ERRORMESSAGE)
    }
  }

  async errorValidationURNEndemics(condition) {

    if (condition = 'more') {
      await this.elementToContainSplCharError(URN_ERROR_ENDEMICS, URN_ERRORMESSAGE)
    } else if (condition = 'specialcharacters') {
      await this.elementToContainSplCharError(URN_ERROR_ENDEMICS, URN_SPL_CHARACTERERRORMESSAGE)
    } else if (condition = 'empty') {
      await this.elementToContainSplCharError(URN_ERROR_ENDEMICS, URN_EMPTY_ERRORMESSAGE)
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
      console.log('*****************************' + formattedDate);

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
    catch (err) {
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


  async animalTestingValidation(species, noOfSpecies) {
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
  //Endemics
  async animalTestingValidationTest(species, noOfSpecies) {
    switch (species) {
      case 'Sheep':
        await this.sendKey(NO_OF_ANIMAL_TESTED_ENDEMICS, noOfSpecies);
        break;
      case 'Beef':
        await this.sendKey(NO_OF_ANIMAL_TESTED_ENDEMICS, noOfSpecies);
        break;
      case 'Pigs':
        await this.sendKey(NO_OF_ANIMAL_TESTED_ENDEMICS, noOfSpecies);
        break;
      // Add additional cases as needed
    }

  }

  async noOfSpeciesErrorValidation(type) {
    switch (type) {
      case 'invalidspecies':
        await this.elementToContainText(ACTUAL_NOOFSPECIES_ERRORMESSAGE, EXPECTED_NOOFSPECIES_ERRORMESSAGE)
        break;
      case 'blank':
        await this.elementToContainText(ACTUAL_ERRORMESSAGE, EXPECTED_BLANK_ERRORMESSAGE)
        break;
      case 'specialcharacter':
        await this.elementToContainText(ACTUAL_ERRORMESSAGE, EXPECTED_ONLYNUMBERS_ERRORMESSAGE)
        break;

    }

  }

  //EndemicsClaim

  async claimNumberOfSpeciesPageHeader() {
    await this.elementToContainText(NUMBER_OF_ANIMALS_HEADER_ACTUAL, NUMBER_OF_ANIMALS_HEADER_EXPECTED)
  }
  async claimNumberOfOralSamplesPageHeader() {
    await this.elementToContainText(NUMBER_OF_ORAL_FLUID_SAMPLES_HEADER_ACTUAL, NUMBER_OF_ORAL_FLUID_SAMPLES_EXPECTED)
  }
  async numberOfanimalTestingValidation(numberOfSpecies) {
    await this.sendKey(NO_OF_SPECIES_TESTED, numberOfSpecies)
  }
  async numberOfOralSamplesTestingValidation(numberOfOralSamples) {
    await this.sendKey(NO_OF_ORAL_TESTED, numberOfOralSamples)
  }
  async acceptCookies() {
    await this.clickOn(COOKIES_ACCEPT)
    await this.clickOn(COOKIES_HIDE)
  }
  async continueAfterInputSpeciesData() {
    await this.clickOn(SPECIES_NUMBER_CONTINUE)
  }
  async continueAfterInputOralSamplesData() {
    await this.clickOn(ORAL_SAMPLES_CONTINUE)
  }
  async cattleTestingLink() {
    await this.elementToContainText(CATTLE_TESTING_LINK_ACTUAL, CATTLE_TESTING_LINK_EXPECTED)
    await this.clickOn(CATTLE_TESTING_LINK_ACTUAL)
    await this.screenShot()
    await browser.back()
  }
  async sheepTestingLink() {
    await this.elementToContainText(SHEEP_TESTING_LINK_ACTUAL, SHEEP_TESTING_LINK_EXPECTED)
    await this.clickOn(SHEEP_TESTING_LINK_ACTUAL)
    await this.screenShot()
    await browser.back()
  }
  async pigTestingLink() {
    await this.elementToContainText(PIG_TESTING_LINK_ACTUAL, PIG_TESTING_LINK_EXPECTED)
    await this.clickOn(PIG_TESTING_LINK_ACTUAL)
    await this.screenShot()
    await browser.back()
  }
  async enterNoOfAnimalsTestingLink() {
    await this.elementToContainText(ENTER_NO_OF_ANIMALS_TESTING_LINK_ACTUAL, ENTER_NO_OF_ANIMALS_TESTING_LINK_EXPECTED)
    await this.clickOn(ENTER_NO_OF_ANIMALS_TESTING_LINK_ACTUAL)
    await this.screenShot()

  }
  async atleastFiveOralFluidSamplesLink() {
    await this.elementToContainText(ATLEAST_FIVE_ORAL_SAMPLES_LINK_ACTUAL, ATLEAST_FIVE_ORAL_SAMPLES_LINK_EXPECTED)
    await this.clickOn(ATLEAST_FIVE_ORAL_SAMPLES_LINK_ACTUAL)
    await this.screenShot()
    await browser.back()
  }
  async enterNoOfOralFluidSamplesLink() {
    await this.elementToContainText(ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_ACTUAL, ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_EXPECTED)
    await this.clickOn(ENTER_NO_OF_ORAL_FLUID_SAMPLES_LINK_ACTUAL)
    await this.screenShot()
  }

  async click_BackLink() {
    await this.clickOn(BACK_LINK)
  }

  async click_BackLink_BioSecurity() {
    await this.clickOn(BIOMRTERIC_BACK_LINK)
  }

  async clickBrowserback() {
    await this.navigateBack()
  }
  async getHelpForClaimHeader() {
    await this.elementToContainText(GET_HELP_FOR_CLAIM_HEADER_ACTUAL, GET_HELP_FOR_CLAIM_HEADER_EXPECTED)
  }
  async getHelpForClaimOralSamplesHeader() {
    await this.elementToContainText(GET_HELP_FOR_CLAIM_ORAL_SAMPLES_HEADER_ACTUAL, GET_HELP_FOR_CLAIM_HEADER_EXPECTED)
  }


  async defraEmaiIDValidate() {
    await this.elementToContainText(DEFRA_EMAIL_ID_ACTUAL, DEFRA_EMAIL_ID_EXPECTED)
  }

  async phoneNumberValidate() {
    await this.elementToContainText(PHONE_NUMBER_ACTUAL, PHONE_NUMBER_EXPECTED)
  }
  async phoneNumberOralSamplesValidate() {
    await this.elementToContainText(PHONE_NUMBER_ORAL_SAMPLES_ACTUAL, PHONE_NUMBER_EXPECTED)
  }
  // Exception
  async validateClaimEndemicsExceptionHeader() {
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    await this.elementToContainText(NUMBER_OF_SPECIES_EXCEPTION_ACTUAL, NUMBER_OF_SPECIES_EXCEPTION_EXPECTED)
  }

  async validateExceptionOralSamplesHeader() {
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(10000)
    await this.elementToContainText(NUMBER_OF_TESTS_EXCEPTION_ACTUAL, NUMBER_OF_TESTS_EXCEPTION_EXPECTED)
  }

  // Error message
  async validate_Blank_Error() {
    await this.elementToContainText(Blank_ERROR_ACTUAL, Blank_ERROR_EXPECTED)
  }
  async validate_Blank_Error_Vet_Name() {
    await this.elementToContainErrorText(VET_NAME_Blank_ERROR_ACTUAL, VET_NAME_Blank_ERROR_EXPECTED)
  }
  async validate_Blank_Error_Oral_Sample() {
    await this.elementToContainErrorText(ORAL_SAMPLE_Blank_ERROR_ACTUAL, ORAL_SAMPLE_Blank_ERROR_EXPECTED)
  }
  async validate_SpecialChar_Error() {
    await this.elementToContainText(CHAR_ERROR_ACTUAL, CHAR_ERROR_EXPECTED)
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

  async clickManageclaim() {
    await this.clickOn(MANAGE_CLAIM)
  }

  async liveStockReview(LiveStockName) {
    switch (LiveStockName) {
      case 'Sheep':
        await this.clickOn(SHEEP);
        break;
      case 'Beef':
        await this.clickOn(BEEF_CATTLE);
        break;
      case 'Dairy':
        await this.clickOn(DAIRY_CATTLE);
        break;
      case 'Pigs':
        await this.clickOn(PIGS);
        break;
      default:
        // Handle the default case if needed
        break;
    }
  }

  async accurateLivestockNumber() {
    await this.clickOn(ELIGIBLE_SPECIES)
  }
  async noAccurateLivestockNumber() {
    await this.clickOn(NO_ELIGIBLE_SPECIES)
  }
  async clickPositiveTestResults() {
    await this.clickOn(POSITIVE_TEST_RESULTS)
  }
  async clickNegativeTestResults() {
    await this.clickOn(NEGATIVE_TEST_RESULTS)
  }

  async validateTestResultsErrorMessage() {
    await this.elementToContainText(ACTUAL_TEST_RESULTS_ERROR_MESSAGE, EXPECTED_TEST_RESULTS_ERROR_MESSAGE)

  }

  async invalidDateFormatSampleTaken(day, month, year) {
    await this.sendKey(DIFFERENT_DAY, day)
    await this.sendKey(DIFFERENT_MONTH, month)
    await this.sendKey(DIFFERENT_YEAR, year)

  }


  async inputDifferentDate(dateFormat) {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    if (dateFormat == 'correct') {
      await this.sendKey(DIFFERENT_DAY, day)
      await this.sendKey(DIFFERENT_MONTH, month)
      await this.sendKey(DIFFERENT_YEAR, year)
      const date = day + "," + month + "," + year
      return date;
    }
    else if (dateFormat == 'incorrect') {
      await this.sendKey(DIFFERENT_DAY, '')
      await this.sendKey(DIFFERENT_MONTH, '')
      await this.sendKey(DIFFERENT_YEAR, '')

    }
    else if (dateFormat == 'invalid') {
      await this.sendKey(DIFFERENT_DAY, '31')
      await this.sendKey(DIFFERENT_MONTH, '02')
      await this.sendKey(DIFFERENT_YEAR, '2023')
    }
  }

  async dateAndYearMissing_Visit_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, MISSING_VISIT_YEAR_AND_DATE)
  }
  async realDate_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, REAL_DATE_ERROR)
  }
  async dateAndMonthMissing_Visit_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, MISSING_VISIT_DATE_AND_MONTH)
  }
  async yearAndMonthMissing_Visit_Error_Validation() {
    await this.elementToContainText(DATE_ERROR, MISSING_VISIT_MONTH_AND_YEAR)
  }
  async monthMissing_Visit_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, MISSING_VISIT_MONTH)
  }
  async yearMissing_Visit_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, MISSING_VISIT_YEAR)
  }
  async dateMissing_Visit_Error_Validation() {
    await this.elementToContainText(DATE_ERROR_ENDEMICS, MISSING_VISIT_DATE)
  }
  async closeBrowser() {
    await this.closeBrowser1()
  }
  async validateBeefandPigsErrorMessage() {
    await this.elementToContainText(PIGANDBEEF_ERROR_ACTUAL, PIGANDBEEF_ERROR_EXPECTED)

  }
  async validatesheepErrorMessage() {
    await this.elementToContainText(SHEEP_ERROR_ACTUAL, SHEEP_ERROR_EXPECTED)

  }
  async validateSpeciesBlankErrorMessage() {
    await this.elementToContainText(ANIMAL_SPECIES_BLANK, EXPECTED_BLANK_ERRORMESSAGE)

  }
  async validateReferenceNumber() {
    await this.elementToContainText(REFERENCE_NUMBER, 'AHWR')
  }

  async validateAmount() {
    await this.elementToContainText(AMOUNT, AMOUNT_TEXT)
  }

  async clickGuidanceLink() {
    await this.clickOn(GUIDANCE_LINK)
    await browser.back()
  }

  async clickManageYourClaim() {
    await this.clickOn(MANAGE_YOUR_CLAIMS)
    await browser.back()
  }
  async clickWhatYOuLikeAboutThisIsService() {
    await this.clickOn(LINK_OF_WHAT_DO_YOU_THINK_OF_THIS_SERVICE)
  }

  async clickGovUKPane() {
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(5000)
    const zoomPercentage1 = 100;
    browser.execute((zoom) => {
      document.body.style.zoom = `${zoom}%`;
    }, zoomPercentage1);
    // await this.clickOn(HIDE_COOKIES)
    // await this.clickOn(SIGN_IN_BUTTON)
    await this.clickOn(GOV_UK)

  }

  async urlValidation() {
    await this.urlContain(GOV_UK_LINK)
  }
  async getHeaderText() {
    await this.elementToContainText(AHWR_HEADER, EXPECTED_AHWR_HEADER)
  }
  async clickAHWR() {
    await this.clickOn(AHWR_HEADER)
  }
  async urlValidationAHWR() {
    await this.urlContain(AHWR_URL)
  }
  async clickEndemicDiseaseFollowUpReview(){
    await this.clickOn(TYPE_OF_REVIEW)
  }
  async validateTypeOfReviewErrorMessage() {
    await this.elementToContainText(TYPE_OF_REVIEW_ACTUAL_ERROR_MESSAGE, TYPE_OF_REVIEW_EXPECTED_ERROR_MESSAGE)
  }
  async validateDateOfVisitHeader() {
    await this.elementToContainText( DATE_OF_VISIT_HEADER_EXPECTED,DATE_OF_VISIT_HEADER_ACTUAL)
  }
  async typeOfReviewUrlValidation() {
    await this.urlContain(TYPE_OF_REVIEW_URL)
  }

  async sheep_error_link_continue_to_claim() {
    await this.clickOn(SHEEP_ERROR_LINK_CONTINUE_TO_CLAIM)
  }
  async sheep_error_link_enter_the_animal_tested(){
    await this.clickOn(SHEEP_ERROR_LINK_ENTER_THE_ANIMAL_TESTED)
  }
  async validateResultsErrorMessgae() {
    await this.elementToContainText( RESULTS_ERROR_MESSAGE_EXPECTED,RESULTS_ERROR_MESSAGE_ACTUAL)
  }
  async validateReviewErrorMessgae() {
    await this.elementToContainText( REVIEW_PAGE_HEADER,ACTUAL_REVIEW_PAGE_HEADER)
  }

 


async validateReviewClaimError() {
  await this.elementToContainText( REVIEWCALIM_LESSTHAN10MONTHS_EXCEPTION_EXPECTED,REVIEWCALIM_LESSTHAN10MONTHS_EXCEPTION_ACTUAL)

}
async ahwr_radio() {
  await this.clickOn(AHWR_LINK)
}
async ten_month_guidance_link(){
  await this.elementToContainText(TENMONTH_GUIDANCE_LINK)
  browser.back();
}
async date_of_visit_link(){
  await this.elementToContainText(DATE_OF_VISIT_LINK)
}
}



module.exports = StartPageActions

