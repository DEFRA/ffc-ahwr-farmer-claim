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
When(/^user typed in invalid password$/, async function () {
 await claimJourney.inputInvalidPassword()
});
Then(/^user click on sign in button$/, async function () {
 await claimJourney.signIn()
});
Then(/^error message is displayed on the screen$/, async function () {
 await claimJourney.errorMessage()
});
When(/^user input valid data$/, async function () {
 await claimJourney.validData()
});
