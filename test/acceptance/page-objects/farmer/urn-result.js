import Pages from '../page'

class UrnResult extends Pages {
    get urnResultTitle() {return browser.$('//h1[@class=\'govuk-heading-l\'][contains(.,\'What is the laboratory unique reference number for the test results?\')]')}
    get urnResultField () { return browser.$('//input[contains(@name,\'urn\')]') }
    open (token, email) {
        super.open('/verify-login?token=' + token + '&email=' + email)
        browser.pause(30000)
    }

    async enterUrnResultField(reference) {
        await (await this.urnResultField).setValue(reference)
    }
}

module.exports = new UrnResult()
