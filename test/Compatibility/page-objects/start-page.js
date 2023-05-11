const CommonActions = require('./common-actions')

// page element
const COOKIES = '[value="accept"]'
const START = '[role="button"]'
const PAGE_TITLE = 'Claim funding - Annual health and welfare review of livestock'
const EMAIL = '#email'
const SUBMIT = '#submit'
const ERROR_MESSAGE = '#email-error'
const DISPLAYED_ERROR = 'Enter an email address in the correct format'
const SENT_EMAIL = '.govuk-heading-l'
const SUCCESS_MESSAGE = 'Check your email'
//const DEFRA = 'azdcuspoc5.b2clogin.com'

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
  async inputEmail(invalid){
    await this.sendKey(EMAIL,invalid)
  }
  async proceed(){
    await this.clickOn(SUBMIT)
  }
  async emailMessage(){
    await this.elementToContainText(ERROR_MESSAGE,DISPLAYED_ERROR)
  }
 async magicLinkMessage(){
    await this.elementTextShouldBe(SENT_EMAIL,SUCCESS_MESSAGE)
 }
}
module.exports = StartPageActions