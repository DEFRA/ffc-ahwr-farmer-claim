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

When(/^redirected to Defra ID page$/, async function () {
 await claimJourney.DefraIdPage()
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
Then(/^error message is displayed on the screen$/, async function () {
 await claimJourney.errorMessage()
});
When(/^user login with (.*) business crn and password\(for DefraId\)$/, async function (business) {
 await claimJourney.validData(business)
});
//......org-review

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
When(/^user input the date in (.*) order$/, async function (dateFormat) {
 await claimJourney.inputCurrentDate(dateFormat)
})

When(/^enter the (.*) date to check if the error message is displayed$/, async function (day) {
  await claimJourney.verifyDate_Error(day)
 });
Then(/^validate the error message$/, async function () {
 await claimJourney.validate_Error()
});
When(/^user input missing (.*) or (.*) or (.*)$/, async function (day,month,year) {
await claimJourney.invalidDateFormat(day, month,year)
});

Then(/^validation of error message Date of review must include a day and a year$/, async function(){
await claimJourney.dateAndYearmissing_Error_Validation()
});
Then(/^validation of error message Date of review must be a real date$/, async function(){
  await claimJourney.realDate_Error_Validation()
  });

  Then(/^enter the name with more than 50 characters$/, async function(){
  await claimJourney.errorVetName()
  });
  Then(/^validation for more characters in vets visits name$/, async function(){
    await claimJourney.name_error_validation()
  });  
Then(/^validation of error message Date of review must include a day and a month$/, async function(){
  await claimJourney.dateAndMonthmissing_Error_Validation()
  });
Then(/^validation of error message Date of review must include a month and a year$/, async function(){
    await claimJourney.yearAndMonthmissing_Error_Validation()
    });
Then(/^validation of error message Date of review must include a month$/, async function(){
    await claimJourney.monthmissing_Error_Validation()
     });
Then(/^validation of error message Date of review must include a year$/, async function(){
      await claimJourney.yearmissing_Error_Validation()
       });
Then(/^validation of error message Date of review must include a date$/, async function(){
        await claimJourney.datemissing_Error_Validation()
         });

Then(/^validation of invalid error message$/, async function () {
  await claimJourney.invalidDateValidate()
 });

When(/^validation of Error$/, async function () {
  await claimJourney.blankErrorValidation()
 });
When(/^enter the past date to check if the error message is displayed$/, async function () {
 await claimJourney.VerifyError_BeforeApplicationDate()
});
Then(/^validation of the error message$/, async function () {
 await claimJourney.validate_Application_DateError()
});

Then(/^click on another date$/, async function () {
 await claimJourney.clickOnAnotherDay()
});

When(/^click on the option when vet visited the farm to carry out the review$/, async function () {
 await claimJourney.clickOnSameDay()
})
Then(/^clicked on continue button$/, async function () {
 await claimJourney.continueAfterInputData()
});
//..... Vet-Name
Given(/^user is on vet name page$/, async function () {
 await  claimJourney.vetNamePage()
});
Given(/^user enters the (.*) name and (.*)$/, async function (species,value) {
  await  claimJourney.animalTestingValidation(species,value)
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
Then(/^validate the error for (.*) error message$/, async function (type) {
  await claimJourney.noOfSpeciesErrorValidation(type)
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
Then(/^click on the back button$/, async function () {
  await claimJourney.click_BackButton();
});
//Exception

When(/^validate the error message in the Header$/,async function(){
  await claimJourney.validateExceptionHeader()
})
When(/^validate exception error message for (.*)$/,async function(typeOfException){
  await claimJourney.exceptionErrorMessage(typeOfException)
})
When(/^validate call charges screen$/,async function(){
  await claimJourney.validateCallCharges()
})

//MultiBusiness

When(/^select the (.*) for application$/, async function (businessName) {
  await claimJourney.clickOnBusiness(businessName)
});
When(/^click on continue button$/, async function () {
  await claimJourney.clickOnContinue()
});

Then(/^validation of special characters in the vets visits name$/, async function () {
  await claimJourney.errorVetNameSplCharacters()
});

Then(/^validation of error message for special characters in the vets visits name$/, async function () {
  await claimJourney.errorValidationVetNameSplCharacters()
});


Then(/^user enter the rcvs number with (.*) characters$/, async function (condition) {
  await claimJourney.numberBoxError(condition)
});

Then(/^Validation of RCVS error message$/, async function () {
  await claimJourney.errorValidationRCVS()
});

When(/^Enter URN field with (.*)$/, async function (condition) {
  await claimJourney.urnInputFieldError(condition)
});

Then(/^Validation of URN error message for (.*) characters$/, async function (condition) {
  await claimJourney.errorValidationURN(condition)
});

Then(/^Create an Entry in the database$/,async function (){
  await claimJourney.connectTODatabase()
});

Then(/^update the date to after 24 hours$/,async function() {
  await claimJourney.generateDate()
});