const { getYesNoRadios } = require('./form-component/yes-no-radios')
const { getTypeOfReviewRowForDisplay, getEligibleNumberRowForDisplay } = require('../../lib/display-helpers')
const { detailsCorrect } = require('../../session/keys').claim
const config = require('../../config')

const legendText = 'Are these details correct?'

const getRows = (claim) => {
  const claimData = claim.data

  const rows = [
    { key: { text: 'Agreement number' }, value: { text: claim.reference } },
    { key: { text: 'Business name' }, value: { text: claimData.organisation.name } },
    getTypeOfReviewRowForDisplay(claimData),
    getEligibleNumberRowForDisplay(claimData)
  ]

  return rows
}

function getClaim (claim, errorText) {
  return {
    backLink: {
      href: config.selectYourBusiness.enabled
        ? `/claim/select-your-business?businessEmail=${claim.data.organisation.email}`
        : '/claim/start'
    },
    ...getYesNoRadios(legendText, detailsCorrect, claim[detailsCorrect], errorText, { isPageHeading: false, legendClasses: 'govuk-fieldset__legend--m', inline: true }),
    listData: { rows: getRows(claim) },
    email: claim.data.organisation.email
  }
}

module.exports = getClaim
