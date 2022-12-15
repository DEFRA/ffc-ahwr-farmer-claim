import Pages from '../page'

class VetVisitDate extends Pages {
    get orgReviewQuestion () { return browser.$('//h1[@class=\'govuk-heading-l\'][contains(.,\'Check review details\')]') }
    get vetVisitDayField () { return browser.$('//input[contains(@name,\'visit-date-day\')]') }
    get vetVisitMonthField () { return browser.$('//input[contains(@name,\'visit-date-month\')]') }
    get vetVisitYearField () { return browser.$('//input[contains(@name,\'visit-date-year\')]') }
    open (token, email) {
        super.open('/verify-login?token=' + token + '&email=' + email)
        browser.pause(30000)
    }

    async getOrgReviewQuestion () {
        await this.orgReviewQuestion.getText()
    }

    async enterDay (day) {
        await (await this.vetVisitDayField).setValue(day)
    }
    async enterMonth (month) {
        await (await this.vetVisitMonthField).setValue(month)
    }
    async enterYear (year) {
        await (await this.vetVisitYearField).setValue(year)
    }
}

module.exports = new VetVisitDate()
