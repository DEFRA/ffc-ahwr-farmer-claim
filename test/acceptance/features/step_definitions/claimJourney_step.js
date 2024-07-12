const { Given, When, Then,} = require('@wdio/cucumber-framework')
const ClaimJourney = require('../../page-objects/claimJourney-page')
const EndemicsJourney = require('../../page-objects/endemicsJourney-page')
const claimJourney = new ClaimJourney()
const endemicsJourney = new EndemicsJourney()

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
});
When(/^validate date of visit error message for (.*) date/, async function (dateFormat) {
  await claimJourney.inputCurrentDate(dateFormat)
 });
When(/^enter the (.*) date to check if the error message is displayed$/, async function (day) {
  await claimJourney.verifyDate_Error(day)
 });
Then(/^validate the error message$/, async function () {
 await claimJourney.validate_Error()
});
When(/^user input missing (.*) or (.*) or (.*)$/, async function (day,month,year) {
await claimJourney.invalidDateFormat(day, month,year)
});
When(/^farmer input missing (.*) or (.*) or (.*) for samples taken$/, async function (day,month,year) {
  await claimJourney.invalidDateFormatSampleTaken(day, month,year)
  });

Then(/^validation of error message Date of review must include a day and a year$/, async function(){
await claimJourney.dateAndYearmissing_Error_Validation()
});
Then(/^validation of error message Date of review must be a real date$/, async function(){
  await claimJourney.realDate_Error_Validation()
  });
Then(/^validation of error message for (.*) date format for Date errors$/, async function(dateError){
    await claimJourney.validateDateOfVisitError(dateError)
    });
Then(/^validation of error message for (.*) date format for Enter the date of vet testing$/, async function(dateError){
      await claimJourney.inputDifferentDate(dateError)
      });
 

  Then(/^enter the name with more than 50 characters$/, async function(){
  await claimJourney.errorVetName()
  });
  Then(/^enter no value value in vets name$/, async function(){
    await claimJourney.errorVetNamBlankValue ()
  }); 
  Then(/^validation for more characters in vets visits name$/, async function(){
    await claimJourney.name_error_validation()
  });  
  Then(/^validation for more characters in vets visits name for endemics$/, async function(){
    await claimJourney.name_error_validation_endemics()
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
  When(/^validate the Date of testing cannot be blank$/, async function () {
  await claimJourney.blank_Error_Validation_For_AnotherDate()
  })

Then(/^click on another date$/, async function () {
 await claimJourney.clickOnAnotherDay()
});

When(/^click on the option when vet visited the farm to carry out the review$/, async function () {
 await claimJourney.clickOnSameDay()
})
Then(/^close browser$/, async function () {
  await claimJourney.closeBrowser()
})

Then(/^clicked on continue button$/, async function () {
 await claimJourney.continueAfterInputData()
});
Then(/^clicked on continue button for endemics$/, async function () {
  await claimJourney.continueAfterEndemicsInputData()
 });
 Then(/^clicked on back button biosecurity page$/, async function () {
  await claimJourney.click_BackLink_BioSecurity()
 });
 
//..... Vet-Name
Given(/^user is on vet name page$/, async function () {
 await  claimJourney.vetNamePage()
});
Given(/^user enters the (.*) name and (.*)$/, async function (species,value) {
  await  claimJourney.animalTestingValidationTest(species,value)
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
Then(/^validate pigs error message$/, async function () {
  await claimJourney.validateBeefandPigsErrorMessage()
});
Then(/^validate beef error message$/, async function () {
  await claimJourney.validateBeefandPigsErrorMessage()
});
Then(/^validate sheep error message$/, async function () {
  await claimJourney.validatesheepErrorMessage()
});

Then(/^validate blank error message$/, async function () {
  await claimJourney.validateSpeciesBlankErrorMessage()
});
Then (/^validate select a package error$/,async function () {
    await endemicsJourney.validatePackageError()
});
Then (/^validate vet test error$/,async function () {
  await endemicsJourney.validateVetTestError()
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
When(/^user enter the rcvs number in endemics$/, async function () {
  await claimJourney.numberBoxEndemics()
 });
Then(/^proceed to next page$/,  async function () {
 await claimJourney.continueAfterInputData()
});
Given(/^user is on urn result page$/, async function () {
 await claimJourney.urnPage()
});
Given(/^user is on urn result page of endemics$/, async function () {
  await claimJourney.urnPageEndemics()
 });

When(/^check what's required$/, async function () {
 await claimJourney.pageDisplay()
});
When(/^user input the test unique reference number$/, async function () {
 await claimJourney.urnInputField()
});
When(/^user input the test unique reference number in endemics$/, async function () {
  await claimJourney.urnInputFieldEndemics()
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

When(/^user clicks on endemics claim submit$/, async function () {
  await claimJourney.clickOnSubmit()
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
Then(/^validation of error message for special characters in the vets visits name for endemics$/, async function () {
  await claimJourney.errorValidationVetNameSplCharactersEndemics()
});

Then(/^user enter the rcvs number with (.*) characters$/, async function (condition) {
  await claimJourney.numberBoxError(condition)
});

Then(/^user enter the rcvs number with (.*) characters in endemics$/, async function (condition) {
  await claimJourney.numberRCVSBoxError(condition)
});

Then(/^Validation of RCVS error message$/, async function () {
  await claimJourney.errorValidationRCVS()
});

Then(/^Validation of RCVS error message for endemics$/, async function () {
  await claimJourney.errorValidationEndemicsRCVS()
});

When(/^Enter URN field for endemics with (.*)$/, async function (condition) {
  await claimJourney.urnInputFieldErrorEndemics(condition)
});

When(/^Enter URN field with (.*)$/, async function (condition) {
  await claimJourney.urnInputFieldError(condition)
});

Then(/^Validation of URN error message for (.*) characters$/, async function (condition) {
  await claimJourney.errorValidationURN(condition)
});
Then(/^Endemics validation of URN error message for (.*) characters$/, async function (condition) {
  await claimJourney.errorValidationURNEndemics(condition)
});

Then(/^Create an Entry in the database$/,async function (){
  await claimJourney.connectTODatabase()
});

Then(/^update the date to after 24 hours$/,async function() {
  await claimJourney.generateDate()
});

//EndemicsClaim
When(/^user clicks on Start now$/, async function () {
  await claimJourney.startNow()
 });
  When(/^user validate the header of the page$/, async function () {
  await claimJourney.claimNumberOfSpeciesPageHeader()
 });
 When(/^user validate the header of the page of OralSamples$/, async function () {
  await claimJourney.claimNumberOfOralSamplesPageHeader()
 });
  Then(/^accept the cookies$/, async function () {
  await claimJourney.acceptCookies()
})
When(/^user enters the no of animals (.*)$/, async function (value) {
  await  claimJourney.numberOfanimalTestingValidation(value)
 });
 When(/^user enters the no of samples (.*)$/, async function (value) {
  await  claimJourney.numberOfOralSamplesTestingValidation(value)
 });
 When(/^click to species continue the claim$/, async function () {
  await claimJourney.continueAfterInputSpeciesData()
});
When(/^click to oral samples continue the claim$/, async function () {
  await claimJourney.continueAfterInputOralSamplesData()
});
 Then(/^validate the exception screen for no of animals tested$/, async function(){
  await claimJourney.validateClaimEndemicsExceptionHeader()
 })
 Then(/^validate the exception for oral samples screen$/, async function(){
  await claimJourney.validateExceptionOralSamplesHeader()
 })

 Then(/^validate the ypu cannot continue to claim/, async function(){
  await claimJourney.validateExceptionOralSamplesHeader()
 })
 Then(/^validate the error message for special character$/, async function(){
  await claimJourney.validate_SpecialChar_Error()
 })
 Then(/^validate the error message for blank input$/, async function(){
  await claimJourney.validate_Blank_Error()
 })
 Then(/^validate the error message for blank input vet name screen$/, async function(){
  await claimJourney.validate_Blank_Error_Vet_Name()
 })
 Then(/^validate the error message for blank input oral samples screen$/, async function(){
  await claimJourney.validate_Blank_Error_Oral_Sample()
 })
 Then(/^validate the cattle testing link in exception screen$/, async function(){
  await claimJourney.cattleTestingLink()
 })
 Then(/^validate the sheep testing link in exception screen$/, async function(){
  await claimJourney.sheepTestingLink()
 })
 Then(/^validate the pig testing link in exception screen$/, async function(){
  await claimJourney.pigTestingLink()
 })
Then(/^clicks back$/, async function(){
  await claimJourney.clickBrowserback()
})
 Then(/^validate the enter the no of animals tested link in exception screen$/, async function(){
  await claimJourney.enterNoOfAnimalsTestingLink()
 })
 Then(/^validate the at least five oral fluid samples tested link$/, async function(){
  await claimJourney.atleastFiveOralFluidSamplesLink()
 })
 Then(/^validate the enter the no of oral fluid samples tested link$/, async function(){
  await claimJourney.enterNoOfOralFluidSamplesLink()
 })
Then(/^click on the back link$/,async function(){
  await claimJourney.click_BackLink()
})
Then(/^validate user can see get help with your claim header$/, async function(){
  await claimJourney.getHelpForClaimHeader()
})
Then(/^validate user can see get help with your claim header for oral samples$/, async function(){
  await claimJourney.getHelpForClaimOralSamplesHeader()
})
Then(/^check defra email ID exists$/,async function(){
  await claimJourney.defraEmaiIDValidate()
})
Then(/^check phone number exists$/,async function(){
  await claimJourney.phoneNumberValidate()
})
Then(/^validate the test results error message$/,async function(){
  await claimJourney.validateTestResultsErrorMessage();
})
Then(/^click on the positive test results$/, async function(){
  await claimJourney.clickPositiveTestResults();
})
Then(/^validate the results exception error message$/, async function(){
  await claimJourney.validateResultsErrorMessgae()
})
Then(/^check phone number exists for oral samples$/,async function(){
  await claimJourney.phoneNumberOralSamplesValidate()
})
//check-detail page
When(/^user check the business details$/, async function () {
  await claimJourney.singleUserBusinessDetail()
})
When(/^user confirm the org-review page$/, async function () {
  await claimJourney.checkFarmerDetails()
})
When(/^user agreed the business details is correct$/, async function () {
  await claimJourney.farmerAcceptDetails()
})
Then(/^user continue to next page$/, async function () {
  await claimJourney.proceedWithApplication()
})
When(/^user choose (.*) cattle for review$/, async function (LiveStockName) {
  await claimJourney.liveStockReview(LiveStockName)
})
Then(/^user clicks on Manage your claim$/, async function (){
  await claimJourney.clickManageclaim()
})
When(/^user confirm to meet the requirement$/, async function () {
  await claimJourney.accurateLivestockNumber()
})
When(/^user doesnt confirm to meet the requirement$/, async function () {
  await claimJourney.noAccurateLivestockNumber()
})
When(/^click on change your answers$/, async function () {
await claimJourney.clickChangeTheAnswers()
})
Then(/^click on the minimum livestock review link$/, async function (){
  await claimJourney.validateMinimumLivestock()
})
Then(/^click change your answerfor number of livestock$/, async function (){
  await claimJourney.validatechangeyouranswer()
})
Then(/^validate the no option selected error message for date of testing$/, async function () {
await claimJourney.noOptionSelectedErrorValidation()
})
When(/^click on another date which is earlier than review date$/, async function () {
await claimJourney.clickOnAnotherDay_WrongMonth()
})
Then(/^validate the Date of testing cannot be before the review visit date$/, async function () {
await claimJourney.earlyReviewDateErrorValidation()
})
When(/^validate that date is missing for data of visit in endemics$/, async function () {
await claimJourney.dateMissing_Visit_Error_Validation()
})
When(/^validate that year is missing for data of visit in endemics$/, async function () {
await claimJourney.yearMissing_Visit_Error_Validation()
})
When(/^validate that month is missing for data of visit in endemics$/, async function () {
await claimJourney.monthMissing_Visit_Error_Validation()
}) 
When(/^Validate if Agreement is generated$/, async function () {
  await claimJourney.validateReferenceNumber()
})
When(/^Validate if amount is displayed$/, async function () {
await claimJourney.validateAmount()
})
When(/^check Guidance click$/, async function () {
await claimJourney.clickGuidanceLink()
})
When(/^check Manage your claims$/, async function () {
await claimJourney.clickManageYourClaim
})
When(/^check what is that you think of this service$/, async function () {
  await claimJourney.clickWhatYOuLikeAboutThisIsService()
})
Then(/^click on gov.uk in the left pane$/,async function (){ 
  await claimJourney.clickGovUKPane()
})
Then(/^validate if the user redirected to gov.uk$/,async function (){ 
  await claimJourney.urlValidation()
})
Then(/^user is able to see the Annual health and welfare review of livestock link on the middle top of the header$/,async function  (){ 
  await claimJourney.getHeaderText()
})
Then(/^user clicks on the service name link$/,async function (){ 
  await claimJourney.clickAHWR()
})
Then(/^user must be redirected to service guidance start pages$/,async function (){ 
  await claimJourney.urlValidationAHWR()
})


Then(/^click on Endemics disease follow up review$/, async function (){
  await claimJourney.clickEndemicDiseaseFollowUpReview()
 })

 Then(/^Validate the no option clicked for type of review message$/, async function () {
  await claimJourney.validateTypeOfReviewErrorMessage()
 })

 Then(/^validate if the user landded on Date of Visit page$/, async function(){
  await claimJourney.validateDateOfVisitHeader()
 })

 Then(/^Validate the Type Of Review URL$/, async function(){
  await claimJourney.typeOfReviewUrlValidation()
 })

 Then(/^click on the enter the animal tested$/, async function(){
 await claimJourney.sheep_error_link_enter_the_animal_tested()
 })

 Then(/^click on the continue with your claim$/, async function(){
  await claimJourney.sheep_error_link_continue_to_claim()
  })
 
  Then(/^check (.*) for the (.*) for the agreement$/, async function(tagToCheck,status){
    await endemicsJourney.validateResultsErrorMessgae(tagToCheck,status)
    })

  Then(/^click on the HerdVaccination postive$/, async function(){
      await endemicsJourney.click_Herd_Vaccination()
    })
  Then(/^enter the (.*) no of pig samples that were tested$/, async function(sampleValue){
      await endemicsJourney.enterNoOfSamplesTested(sampleValue)
    })

  Then(/^validate the sample error message for pig$/, async function(){
    await endemicsJourney.validateNoOfSamplesErrorForPig()
  })
  Then(/^validate the sample error message$/, async function(){
    await endemicsJourney.validateNoOfSamplesError()
  })
  Then(/^validate incorrect number of samples error message$/, async function(){
    await endemicsJourney.validateIncorrectNoOfSamplesError()
  })  
  Then(/^click on the link enter no of samples tested$/,async function(){
    await endemicsJourney.click_EntenNoOfSamplesLink()
  })
  Then(/^validate the disease status category$/, async function(){
    await endemicsJourney.validateDiseaseStatusCategory()
  })  
  
Then(/^validate type of review header$/, async function () {
  await claimJourney.validateReviewErrorMessgae()
 });
 Then(/^validate you cannot continue to claim$/, async function () {
  await claimJourney.validateReviewClaimError()
 });
 Then(/^click on ten month guidance link$/, async function () {
  await claimJourney.ten_month_guidance_link()
 });
 Then(/^click on date of visit link$/, async function () {
  await claimJourney.date_of_visit_link()
 });
 Then(/^click on AHWR link$/, async function () {
  await claimJourney.ahwr_radio()
 });
 Then(/^click on the disease category$/, async function () {
  await  endemicsJourney.clickOnDiseaseStatusCategory()
 });
 Then(/^click yes on biosecurity link$/, async function () {
  await endemicsJourney.clickYesBiosecurityAssesssment()
 });
 Then(/^click no on biosecurity link$/, async function () {
  await endemicsJourney.clickNoBiosecurityAssesssment()
 });
 Then(/^Enter the percentage$/, async function () {
  await  endemicsJourney.enterBioSecurityPercentage()
 });
 Then(/^check if user had landed in the check your answers page$/, async function () {
  await claimJourney.ahwr_radio()
 });
Then(/^validate that no options selected for assessment error message$/, async function () {
  await endemicsJourney.validateNoOptionSelectedForBiosecurity()
 });
 Then(/^validate no assessment percentage is entered$/, async function () {
  await endemicsJourney.validateNoPercentageEntered()
 });
 Then(/^choose the sheep health package$/, async function () {
  await endemicsJourney.chooseSheepHealthPackage()
});
Then(/^choose What did the vet test or sample for$/, async function () {
  await endemicsJourney.clickSheepVetTest()
});
Then(/^choose What was the Sheep scab test result$/, async function () {
  await endemicsJourney.clickSheepPositiveTestResult()
});
Then(/^user clicks on click for endemics follow-up$/, async function () {
  await endemicsJourney.clickClaimEndemicsFollowUp()
});
Then(/^validate no result is selected$/, async function () {
  await endemicsJourney.validateVetTestResultError()
});
Then(/^click yes for PI Hunt$/, async function () {
  await endemicsJourney.clickYesForPIHunt()
});
Then(/^click start new claim$/, async function () {
  await endemicsJourney.clickStartNewClaim()
});
Then(/^validate the error message for no review selected$/, async function () {
  await endemicsJourney.validateSelectTheTypeOfReview()
});
Then(/^validate the error if PI is not selected$/, async function () {
  await endemicsJourney.validateSelectPIError()
})
Then(/^validate disease status category not selected$/, async function () {
  await endemicsJourney.validateBlankDiseaseStatus()
})
//Connect to database to change status to Ready to Pay
When(/^fetch the claim number$/, async function () {
  await claimJourney.getClaimNumber()
})
When(/^pass the claim number to (.*)$/, async function (type) {
  await claimJourney.connectTODatabase(type)
})
When(/^user validates the existence of Cattle link$/, async function () {
  await endemicsJourney.validateCattleLinksInExceptionPage()
 });
 When(/^user validates the existence of Beef link$/, async function () {
  await endemicsJourney.validateBeefLinksInExceptionPage()
 });
 When(/^user validates the existence of Pigs link$/, async function () {
  await endemicsJourney.validatePigsLinksInExceptionPage()
 });


