const { clearEndemicsClaim, getEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency, customerSurvey } = require('../../config')
const { endemicsConfirmation, claimDashboard } = require('../../config/routes')
const { amount } = require('../../constants/claim')

const pageUrl = `${urlPrefix}/${endemicsConfirmation}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { reference, typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
        const getAmount = amount[typeOfReview][typeOfLivestock]

        clearEndemicsClaim(request)

        return h.view(endemicsConfirmation, {
          claimDashboard,
          reference,
          amount: getAmount,
          ruralPaymentsAgency: ruralPaymentsAgency,
          claimSurveyUri: customerSurvey.uri
        })
      }
    }
  }
]
