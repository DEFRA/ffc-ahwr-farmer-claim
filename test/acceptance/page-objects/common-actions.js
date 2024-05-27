require('webdriverio/build/commands/browser/$')
const { expect } = require('chai')
require('constants')
require("dotenv").config({path:`.env.${process.env.ENV}`})

class CommonActions {
  async open (path) {
    try{
    const url = process.env.TEST_ENVIRONMENT_ROOT_URL + path
    await browser.url(url)
      // }
  }
  catch (error) {
    // Handle the "invalid session id" error by restarting the WebDriver session
    if (error.message.includes('invalid session id')) {
      console.log('Invalid session ID encountered. Restarting the session...');
      await browser.reloadSession(); // Assuming reloadSession is available in your setup
      
    const url = process.env.TEST_ENVIRONMENT_ROOT_URL + path
      await browser.url(url); // Retry the navigation
    } else {
     // this.skip();
     console.log(error)
      
    }
  }
  }

  async clickOn (element) {
    const locator = browser.$(element)
    await locator.click()
  }

  async navigateBack(){
       await browser.back()

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

async normalizeString(str) {
  return str.normalize('NFKC'); // Normalize using Compatibility Decomposition followed by Canonical Composition
}

  async elementToContainText (element, text) {
    const locator = await browser.$(element)
    let errormessage=await locator.getText()
    this.normalizeString(errormessage)
    console.log(errormessage)
    expect(await locator.getText()).to.include(text)
  }


  async openNewTab(){
   const windowHandles = await browser.getWindowHandles();
    await browser.switchToWindow(windowHandles[1]);
    await this.screenShot()
   
}


async closeNewTab(){
  const windowHandles = await browser.getWindowHandles();
  await browser.closeWindow();
  await browser.switchToWindow(windowHandles[0]);

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

  async getPageTitle(expectedTitle) {
    const actualTitle = await browser.getTitle()
    expect(actualTitle).to.be.equal(expectedTitle)
  }

  async urlContain (expectedUrl) {
    const actualUrl = await browser.getUrl()
    expect(actualUrl).to.include(expectedUrl)
  }

  async screenShot(){
    const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))
    await sleep(5000)
    var date=Date.now();
    const screenshots=await browser.saveScreenshot('./screenShots/chrome-'+date+'.png')
  }

  async isElementExist (element) {
    const locator = await browser.$(element)
    return locator.isExisting()
  }

  async closeBrowser1() {
    try {
        await browser.closeWindow();
        console.log('Window closed successfully.');
    } catch (error) {
        // Check if the error is due to an invalid session ID
        if (error.message.includes('invalid session id')) {
            console.error('Encountered an invalid session ID. Starting a new session...');
            
            try {
                // Start a new WebDriver session (replace with your specific setup)
                // Example: browser = webdriverio.remote(options);
                
                // Retry closing the window after starting a new session
                await browser.closeWindow();
                console.log('Window closed successfully after starting a new session.');
            } catch (newError) {
                console.error('Error closing the window after starting a new session:', newError);
            }
        } else {
            console.error('Error closing the window:', error);
        }
    }
}


}

module.exports = CommonActions
