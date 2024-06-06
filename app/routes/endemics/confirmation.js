const { clearEndemicsClaim, getEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency, customerSurvey } = require('../../config')
const { endemicsConfirmation, claimDashboard } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsConfirmation}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { reference, amount } = getEndemicsClaim(request)

        clearEndemicsClaim(request)

        return h.view(endemicsConfirmation, {
          claimDashboard,
          reference,
          amount,
          ruralPaymentsAgency,
          claimSurveyUri: customerSurvey.uri
        })
      }
    }
  }
]
