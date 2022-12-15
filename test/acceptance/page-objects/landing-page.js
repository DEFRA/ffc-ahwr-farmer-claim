const Page = require('./page')

/**
 * sub page containing specific selectors and methods for a specific page
 */
class LandingPage extends Page {
  get farmerApplyBtn () { return browser.$('//a[contains(.,\'Farmer Apply\')]') }
  open () {
    return super.open('/')
  }

  async gotoFarmerApply () {
    browser.pause(100000000)
    await this.farmerApplyBtn.click()
  }
}

module.exports = new LandingPage()
