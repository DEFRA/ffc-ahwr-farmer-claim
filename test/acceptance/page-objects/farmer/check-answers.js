import Page from '../page'

class CheckAnswers extends Page {
  get confirm () { return browser.$("//a[contains(.,'Continue')]") }

  open () {
    super.open('')
    browser.pause(3000)
  }



  async clickContinue () {
    await (await this.confirm).click()
    await browser.pause(1000)
  }
}

module.exports = new CheckAnswers()
