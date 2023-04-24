const { Given, When, Then,} = require('@wdio/cucumber-framework')
const StartPage = require('../page-objects/start-page')
const startPage = new StartPage()

Given(/^user is on the (.*) landing page$/,async function (page) {
  await startPage.getHomepage(page)
});
When(/^user check the page title$/, async function () {
 await startPage.claimPageTitle()
});
When(/^user start the application$/, async function () {
 await startPage.startNow()
});

When(/^user input (.*)$/, async function (invalid) {
  await startPage.inputEmail(invalid)
  await startPage.proceed()

});
Then(/^an email error is displayed$/, async function () {
  await startPage.emailMessage()
});