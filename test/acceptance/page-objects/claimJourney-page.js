const CommonActions = require('./common-actions')
// const { submitClaim } = require('../../../app/messaging/application')

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
const PAST_DATE_ERROR_EXPECTED ='The date of testing must be in the past'
const APPLICATION_DATE_ERROR_EXPECTED='The date of testing must be the same'



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
  async errorMessage(){
    await this.elementToContainText(ERROR_MESSAGE,DISPLAYED_ERROR)
  }
  async inputValidCrn (crn) {
    await this.sendKey(DEFRA_CRN, crn)
  }
  async inputPassword (password) {
    await this.sendKey(DEFRA_PASSWORD, password)
  }

  async validData(){
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(5000)
    await this.inputValidCrn(process.env.CRN_CLAIM)
    await this.inputPassword(process.env.CRN_PASSWORD)
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

  async inputCurrentDate(){
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
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

  async VerifyError_PastDate() {
    await this.clickOn(ANOTHER_DAY_BUTTON)
    const currentDate = new Date();
    const day = currentDate.getDate() + 1;
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    await this.sendKey(DIFFERENT_DAY, day)
    await this.sendKey(DIFFERENT_MONTH, month)
    await this.sendKey(DIFFERENT_YEAR, year)
  }
  async VerifyError_BeforeApplicationDate() {
    await this.clickOn(ANOTHER_DAY_BUTTON)
    const currentDate = new Date();
    const day = currentDate.getDate() + 1;
    const month = currentDate.getMonth() - 1;
    const year = currentDate.getFullYear();
    await this.sendKey(DIFFERENT_DAY, day)
    await this.sendKey(DIFFERENT_MONTH, month)
    await this.sendKey(DIFFERENT_YEAR, year)
  }
  async validate_Application_DateError(){
    await this.elementToContainText(PAST_DATE_ERROR,APPLICATION_DATE_ERROR_EXPECTED)
  }
  async validate_Error(){
    await this.elementToContainText(PAST_DATE_ERROR,PAST_DATE_ERROR_EXPECTED)
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
    await this.elementToContainText(ANIMAL,'21 or more sheep')
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
}
module.exports = StartPageActions