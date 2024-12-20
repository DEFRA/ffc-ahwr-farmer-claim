const { clearEndemicsClaim, getEndemicsClaim } = require('../../session')
const {
  urlPrefix,
  ruralPaymentsAgency,
  customerSurvey
} = require('../../config')
const { endemicsConfirmation, claimDashboard } = require('../../config/routes')
const { getReviewType } = require('../../lib/get-review-type')

const pageUrl = `${urlPrefix}/${endemicsConfirmation}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { reference, amount, typeOfReview } = getEndemicsClaim(request)
      const { isReview } = getReviewType(typeOfReview)

      clearEndemicsClaim(request)

      return h.view(endemicsConfirmation, {
        claimTypeText: isReview
          ? 'animal health and welfare review'
          : 'endemic disease follow-up',
        claimDashboard,
        reference,
        amount,
        ruralPaymentsAgency,
        claimSurveyUri: customerSurvey.uri
      })
    }
  }
}

module.exports = { handlers: [getHandler] }
