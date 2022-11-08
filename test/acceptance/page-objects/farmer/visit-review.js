import Pages from '../page'

class VisitReview extends Pages {
  get orgReviewQuestion () { return browser.$('//h1[contains(.,\'Check review details\')]') }
  get orgYesRadioOption () { return browser.$('//input[contains(@value,\'yes\')]') }
  get orgNoRadioOption () { return browser.$('//input[contains(@value,\'no\')]') }

  open (token, email) {
    super.open('/verify-login?token=' + token + '&email=' + email)
    browser.pause(30000)
  }
  async getOrgReviewQuestion () {
    await this.orgReviewQuestion.getText()
  }

  async selectYes () {
    await this.orgYesRadioOption.scrollIntoView()
    await browser.pause(3000)
    await (this.orgYesRadioOption).click()
  }

  async selectNo () {
    await this.orgNoRadioOption.click()
    await browser.pause(3000)
    await (this.orgNoRadioOption).click()
  }
}

module.exports = new VisitReview()
