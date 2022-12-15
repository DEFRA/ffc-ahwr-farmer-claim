import Page from './page'
class TermsPage extends Page {
  get agreeRadioOption () { return browser.$('#terms') }
  get submitBtn () { return browser.$("//button[contains(.,'Submit application')]") }
  get rejectBtn () { return browser.$("//a[contains(.,'Reject offer')]") }
  async selectAgreeRadioOption () {
    await (await this.agreeRadioOption).scrollIntoView()
    await (await this.agreeRadioOption).click()
  }

  async submit () {
    await (await this.submitBtn).scrollIntoView()
    await (await this.submitBtn).click()
    await browser.pause(4000)
  }
  async reject () {
    await (await this.rejectBtn).scrollIntoView()
    await (await this.rejectBtn).click()
    await browser.pause(4000)
  }
}

module.exports = new TermsPage()
