const { Given, When, Then } = require('@wdio/cucumber-framework')

const LandingPage = require('../page-objects/landing-page')
const FarmerApply = require('../page-objects/farmer/farmer-apply')
const FarmerLogin = require('../page-objects/farmer/farmer-login')
const VisitReview = require('../page-objects/farmer/visit-review')
const CheckAnswers = require('../page-objects/farmer/check-answers')
const VetVisitDate = require('../page-objects/farmer/vet-visit-date')
const VetName = require('../page-objects/farmer/vet-name')
const VetRcvs = require('../page-objects/farmer/vet-rcvs')
const UrnResult = require('../page-objects/farmer/urn-result')
const SubmitCliam = require('../page-objects/farmer/submit-claim')
const TermsPage = require('../page-objects/terms-page')
const DeclarationPage = require('../page-objects/declaration')
const pages = {
  formApply: FarmerApply,
  landing: LandingPage
}

Given('I am on the landing page', async () => {
 await LandingPage.open()
})

Given('farmer clicks on email link {string} {string}', async (token, email) => {
  await VisitReview.open(token, email)
  await browser.pause(5000)
  expect(await VisitReview.orgReviewQuestion.getText()).to.equals('Check review details')
})
Then('I click on farmer Apply', async () => {
  await LandingPage.gotoFarmerApply()
})
Then('I click on startNow', async () => {
  await browser.pause(5000)
  await FarmerClaim.open()
  await FarmerClaim.clickStartNow()
})

When('I enter my valid {string}', async function (email) {
  await FarmerLogin.enterEmail(email)
  await FarmerLogin.clickSignin()
  await browser.pause(5000)
  const elem = await browser.$('#email')
  const elText = await elem.getText()
  expect(elText).to.equals(email)
})
Then('I enter day month and year on vet visit date page', async () => {
  await browser.pause(5000)
  let date = new Date();
  await VetVisitDate.enterDay(date.getDate())
  await VetVisitDate.enterMonth(date.getMonth()+1)
  await VetVisitDate.enterYear(date.getFullYear())
  await browser.pause(5000)
  await VetVisitDate.clickContinue()

})
Then('I enter my vet\'s {string}',async function (name){
  await browser.pause(5000)
  await VetName.enterName(name)
  await browser.pause(5000)
  await VetName.clickContinue()
})
Then('I enter {string} on vet-rcvs page',async function (vetRcvs){
  await browser.pause(5000)
  await VetRcvs.enterVetRcvs(vetRcvs)
  await browser.pause(5000)
  await VetRcvs.clickContinue()
})
Then('I enter {string} on urn-result page',async function (reference){
  await browser.pause(5000)
  await UrnResult.enterUrnResultField(reference)
  await browser.pause(5000)
  await UrnResult.clickContinue()
})

When('I select yes my details are correct on farmer review page', async () => {
  await VisitReview.selectYes()
  await VisitReview.clickContinue()
})
When('I select No my details are not correct on farmer review page', async () => {
  await VisitReview.selectNo()
  await VisitReview.clickContinue()
})


Then('I click continue on check answers page', async () => {
  await CheckAnswers.clickContinue()
})

Then('I click continue on submit claim page',async ()=>{
  await SubmitCliam.clickSubmit()
  await browser.pause(5000)
})
Then('I check the terms and condition checkbox and click submit application', async () => {
  await TermsPage.selectAgreeRadioOption()
  await TermsPage.submit()
  await browser.pause(5000)
  wdioExpect(await DeclarationPage.applicationSuccessful).toHaveTextContaining('Application successful')
})

Then('I select reject offer',async ()=>{
  await TermsPage.reject()
  await browser.pause(5000)

})


Given('I go back to start page', async () => {
  await DeclarationPage.backToStart()
})
Then('I click startNow', async () => {
  await FarmerClaim.clickStartNow()
})


When('I enter my invalid {string}', async (email) => {
  await FarmerLogin.enterEmail(email)
  await FarmerLogin.clickSignin()
  await browser.pause(5000)
})
When('I should see an error {string}', async (email) => {
  await browser.pause(5000)
  await wdioExpect(await FarmerLogin.errorField).toHaveTextContaining(email)
})

