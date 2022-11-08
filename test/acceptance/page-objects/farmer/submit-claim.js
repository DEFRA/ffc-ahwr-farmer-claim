import Pages from '../page'

class SubmitCliam extends Pages {
    get submitCliamTitle() {return browser.$('//h1[contains(@class,\'govuk-heading-l\')]')}
    get submitBtn () { return browser.$('//button[contains(.,\'Submit\')]') }
    open (token, email) {
        super.open('/verify-login?token=' + token + '&email=' + email)
        browser.pause(30000)
    }

    async clickSubmit () {
        await (await this.submitBtn).click()
    }
}

module.exports = new SubmitCliam()
