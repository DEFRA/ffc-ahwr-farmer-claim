import Pages from '../page'

class VetRcvs extends Pages {
    get vetRcvsField () { return browser.$('//input[contains(@name,\'rcvs\')]') }
    open (token, email) {
        super.open('/verify-login?token=' + token + '&email=' + email)
        browser.pause(30000)
    }

    async enterVetRcvs(vetRcvs ) {
        await (await this.vetRcvsField).setValue(vetRcvs)
    }
}

module.exports = new VetRcvs()
