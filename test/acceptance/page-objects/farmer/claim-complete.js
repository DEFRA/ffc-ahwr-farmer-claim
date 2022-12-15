import Pages from '../page'

class ClaimComplete extends Pages {
    get claimCompleteTitle() {return browser.$('//h1[@class=\'govuk-panel__title\'][contains(.,\'Claim complete\')]')} 
    open (token, email) {
        super.open('/verify-login?token=' + token + '&email=' + email)
        browser.pause(30000)
    }

    async getOrgReviewQuestion () {
        await this.orgReviewQuestion.getText()
    }

    async selectYes () {
        await this.orgYesRadioOption.scrollIntoView()
        await browser.pause(3000)
        await (this.orgYesRadioOption).click()
    }

    async selectNo () {
        await this.orgNoRadioOption.click()
        await browser.pause(3000)
        await (this.orgNoRadioOption).click()
    }
}

module.exports = new ClaimComplete()