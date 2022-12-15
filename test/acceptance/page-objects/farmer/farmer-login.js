import Pages from '../page'

class FarmerLogin extends Pages {
  get email () { return $('#email') }
  get signin () { return $('#submit') }
  get errorField () { return browser.$('//p[contains(@class,\'govuk-error-message\')]') }

  open () {
    super.open('')
    browser.pause(3000)
  }

  async enterEmail (email) {
    await (await this.email).setValue(email)
  }

  async clickSignin () {
    await (await this.signin).click()
  }

}

module.exports = new FarmerLogin()
