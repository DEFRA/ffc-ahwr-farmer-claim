const { getYesNoRadios } = require('./form-component/yes-no-radios')
const { getClaimAmount } = require('../../lib/get-claim-amount')
const { getTypeOfReviewRowForDisplay } = require('../../lib/display-helpers')
const { detailsCorrect } = require('../../session/keys').claim

const legendText = 'Are these details correct?'

const getRows = (claim) => {
  const claimData = claim.data
  const paymentAmount = getClaimAmount(claimData)

  const rows = [
    { key: { text: 'Business name' }, value: { text: claimData.organisation.name } },
    getTypeOfReviewRowForDisplay(claimData)
  ]

  rows.push({ key: { text: 'Payment amount' }, value: { text: `£${paymentAmount}` } })

  return rows
}

function getClaim (claim, errorText) {
  return {
    ...getYesNoRadios(legendText, detailsCorrect, claim[detailsCorrect], errorText, { isPageHeading: false, legendClasses: 'govuk-fieldset__legend--m', inline: true }),
    listData: { rows: getRows(claim) },
    email: claim.data.organisation.email
  }
}

module.exports = getClaim
