const { clearEndemicsClaim, getEndemicsClaim } = require('../../session')
const { urlPrefix, ruralPaymentsAgency, customerSurvey } = require('../../config')
const { endemicsConfirmation, vetVisits } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsConfirmation}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        clearEndemicsClaim(request)
        const { reference } = getEndemicsClaim(request)

        return h.view(endemicsConfirmation, {
          vetVisits,
          reference,
          ruralPaymentsAgency: ruralPaymentsAgency,
          claimSurveyUri: customerSurvey.uri
        })
      }
    }
  }
]
