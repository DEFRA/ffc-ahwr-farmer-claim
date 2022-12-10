import Pages from '../page'

class FarmerClaim extends Pages {
  get startNow () { return browser.$('//a[contains(.,\'Start now\')]') }
  get title () { return browser.$('//h1[@class=\'govuk-heading-l\'][contains(.,\'Claim funding for an annual health and welfare review of your livestock\')]') }

  open () {
    return super.open('/')
  }

  async clickStartNow () {
    await this.startNow.click()
  }

  async istTitleExist () {
    return this.title.isDisplayed()
  }
}

module.exports = new FarmerClaim()
