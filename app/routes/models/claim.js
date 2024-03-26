const { getYesNoRadios } = require('./form-component/yes-no-radios')
const { getTypeOfReviewRowForDisplay, getEligibleNumberRowForDisplay } = require('../../lib/display-helpers')
const { detailsCorrect } = require('../../session/keys').claim

const legendText = 'Are these details correct?'

const getRows = (claim) => {
  const claimData = claim.data
  console.log('@@@@@@@@@', claim)
  const rows = [
    { key: { text: 'Agreement number' }, value: { text: claim.reference } },
    { key: { text: 'Business name' }, value: { text: claimData.organisation.name } },
    getTypeOfReviewRowForDisplay(claimData),
    getEligibleNumberRowForDisplay(claimData),
    { key: { text: 'Organisation email address' }, value: { text: claim.organisation.orgEmail } },
    { key: { text: 'User email address' }, value: { text: claim.organisation.email } }
  ]

  return rows
}

function getClaimViewData (claim, backLink, errorText) {
  return {
    backLink: {
      href: backLink
    },
    ...getYesNoRadios(legendText, detailsCorrect, claim[detailsCorrect], errorText, { isPageHeading: false, legendClasses: 'govuk-fieldset__legend--m', inline: true }),
    listData: { rows: getRows(claim) },
    email: claim.data.organisation.email
  }
}

module.exports = getClaimViewData
