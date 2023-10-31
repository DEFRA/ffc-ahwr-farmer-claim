require('webdriverio/build/commands/browser/$')
const { expect } = require('chai')
require('constants')
require("dotenv").config({path:`.env.${process.env.ENV}`})

class CommonActions {
  async open (path) {
    const url = process.env.TEST_ENVIRONMENT_ROOT_URL + path
    await browser.url(url)
  }

  async clickOn (element) {
    const locator = browser.$(element)
    await locator.click()
  }

  async sendKey (element, text) {
    const locator = browser.$(element)
    await locator.setValue(text)
  }

async elementGetText(element){
  const locator = await browser.$(element)
  let Text =await locator.getText()
  return Text
}

  async elementToContainText (element, text) {
    const locator = await browser.$(element)
    let errormessage=await locator.getText()
    console.log(errormessage)
    expect(await locator.getText()).to.include(text)
  }

  async elementToContainErrorText (element, text) {
    const locator = await browser.$(element)
    let errormessage=await locator.getText()
    console.log(errormessage)
      const cleanedMessage = await errormessage.replace(/^Error:\n/, '');
    console.log(cleanedMessage);
     let final_text = await cleanedMessage.replace(/Vet's/g, "Vet’s");
// Output the updated string
    console.log(final_text);
    await expect(final_text).to.include(text)

  }
  async elementToContainSplCharError(element, text) {
    const locator = await browser.$(element)
    let errormessage=await locator.getText()
    console.log(errormessage)
         let final_text = await errormessage.replace(/Vet's/g, "Vet’s");
// Output the updated string
    console.log(final_text);
    await expect(final_text).to.include(text)

  }

  async elementTextShouldBe (element, text) {
    const locator = await browser.$(element)
    expect(await locator.getText()).to.equal(text)
  }

  async getPageTitle (expectedTitle) {
    const actualTitle = await browser.getTitle()
    expect(actualTitle).to.be.equal(expectedTitle)
  }

  async urlContain (expectedUrl) {
    const actualUrl = await browser.getUrl()
    expect(actualUrl).to.include(expectedUrl)
  }

  async isElementExist (element) {
    const locator = await browser.$(element)
    return locator.isExisting()
  }
}

module.exports = CommonActions
