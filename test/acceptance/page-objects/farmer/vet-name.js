import Pages from '../page'

class VetName extends Pages {
    get vetNameQuestion () { return browser.$('//h1[@class=\'govuk-heading-l\'][contains(.,\'What is the vet’s name?\')]') }
    get vetNameField () { return browser.$('//input[contains(@name,\'name\')]') }
    open (token, email) {
        super.open('/verify-login?token=' + token + '&email=' + email)
        browser.pause(30000)
    }

    async enterName (name) {
        await (await this.vetNameField).setValue(name)
    }
}

module.exports = new VetName()
