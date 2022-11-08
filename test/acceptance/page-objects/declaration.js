import Page from './page'
class DeclarationPage extends Page {
  get applicationSuccessful () { return browser.$("//h1[@class='govuk-panel__title'][contains(.,'Application successful')]") }
  get landingPageLink () { return browser.$("//a[contains(@class,'govuk-header__link govuk-header__link--service-name')]") }
  async backToStart () {
    await (await this.landingPageLink).click()
    await browser.pause(4000)
  }
}

module.exports = new DeclarationPage()
