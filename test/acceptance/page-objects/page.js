module.exports = class Page {
  get continueBtn () { return browser.$('//button[contains(.,\'Continue\')]') }

  /**
   * Opens a sub page of the page
   * @param path path of the sub page (e.g. /path/to/page.html)
   */
  open (path) {
    const url = browser.options.baseUrl + path
    return browser.url(url)
  }

  async clickContinue () {
    await (await this.continueBtn).click()
  }
}
