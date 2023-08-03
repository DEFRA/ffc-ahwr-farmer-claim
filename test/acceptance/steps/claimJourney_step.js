const { Given, When, Then,} = require('@wdio/cucumber-framework')
const ClaimJourney = require('../page-objects/claimJourney-page')
const claimJourney = new ClaimJourney()

Given(/^user is on the (.*) landing page$/,async function (page) {
  await claimJourney.getHomepage(page)
});
When(/^user check the page title$/, async function () {
 await claimJourney.claimPageTitle()
});
When(/^user start the application$/, async function () {
 await claimJourney.startNow()
});
When(/^click on the option when vet visited the farm to carry out the review$/, async function () {
  await claimJourney.clickonSameDay()
});
Then(/^click on another date$/, async function () {
  await claimJourney.clickonAnotherDay()
});
When(/^redirected to Defra ID page$/, async function () {
 await claimJourney.DefraIdPage()
});

When(/^enter the future date to check if the error message is displayed$/, async function () {
  await claimJourney.VerifyError_PastDate()
});

When(/^enter the past date to check if the error message is displayed$/, async function () {
  await claimJourney.VerifyError_BeforeApplicationDate()
});
When(/^user input invalid crn$/, async function () {
 await claimJourney.inputInvalidCrn()
});
When(/^user input invalid password$/, async function () {
 await claimJourney.inputInvalidPassword()
});
Then(/^user click on sign in button$/, async function () {
 await claimJourney.signIn()
});
Then(/^validate the error message$/, async function () {
  await claimJourney.validate_Error()
});
Then(/^validation of the error message$/, async function () {
  await claimJourney.validate_Application_DateError()
});
Then(/^error message is displayed on the screen$/, async function () {
 await claimJourney.errorMessage()
});
When(/^user input valid data$/, async function () {
 await claimJourney.validData()
});
//.......org-review

When(/^the agreement number is shown$/, async function () {
 await claimJourney.agreementNumber()
});
When(/^the business name is correct$/, async function () {
 await claimJourney.nameOfBusiness()
});
When(/^user type of review is correct$/, async function () {
 await claimJourney.animalType()
});
When(/^user accept the displayed business details to be correct$/, async function () {
 await claimJourney.confirmDetail()
});
Then(/^user continue to claim$/, async function () {
 await claimJourney.proceedClaim()
});
// Vet-Date
Given(/^user is on vet visit date page$/, async function () {
 await claimJourney.visitDatePage()
});
When(/^asked about the date the review was completed$/, async function () {
 await claimJourney.visitHeadings()
});
When(/^user input the date in correct order$/, async function () {
 await claimJourney.inputCurrentDate()
});
Then(/^clicked on continue button$/, async function () {
 await claimJourney.continueAfterInputData()
});
//..... Vet-Name
Given(/^user is on vet name page$/, async function () {
 await  claimJourney.vetNamePage()
});
When(/^check the question on the page$/, async function () {
 await claimJourney.pageQuestion()
});
When(/^enter vet's full name$/, async function () {
 await claimJourney.inputVetName()
});
Then(/^click to continue the claim$/, async function () {
 await claimJourney.continueAfterInputData()
});
Given(/^user navigate to vet rcvs page$/, async function () {
 await claimJourney.vet_rcvsPage()
});
When(/^user read the question$/, async function () {
 await claimJourney.displayedQuestion()
});
When(/^user enter the rcvs number$/, async function () {
 await claimJourney.numberBox()
});
Then(/^proceed to next page$/,  async function () {
 await claimJourney.continueAfterInputData()
});
Given(/^user is on urn result page$/, async function () {
 await claimJourney.urnPage()
});
When(/^check what's required$/, async function () {
 await claimJourney.pageDisplay()
});
When(/^user input the test unique reference number$/, async function () {
 await claimJourney.urnInputField()
});
// check-answer page
Given(/^user confirm to be on check answer page$/, async function () {
 await claimJourney.checkAnswerPage()
});
When(/^user is required to go through the answer provided$/, async function () {
 await claimJourney.confirmAnswerProvided()
});
When(/^confirm the business name to be true$/, async function () {
 await claimJourney.containBusinessName()
});
When(/^correct sbi number is displayed$/, async function () {
 await claimJourney.sbiIsCorrect()
});
When(/^confirm to have the minimum require livestock for the review$/, async function () {
 await claimJourney.livestockNumberCorrect()
});
Then(/^continue to next page$/, async function () {
 await claimJourney.continueToSubmitClaim()
});
Given(/^user is on the final page$/, async function () {
 await claimJourney.submitClaimUrl()
});
When(/^user check the information displayed$/, async function () {
 await claimJourney.pageInformation()
});
Then(/^user submit the claim$/, async function () {
 await claimJourney.claimSubmitButton()
});
When(/^user is on submit claim page$/, async function () {
 await claimJourney.completeClaimPage()
});
When(/^User complete the claim$/, async function () {
 await claimJourney.claimCompleteMessage()
});
When(/^success message is displayed$/, async function () {
 await claimJourney.claimSuccessMessage()
});
Then(/^the agreement number is presented$/, async function () {
 await claimJourney.claimAgreementNumber()
});