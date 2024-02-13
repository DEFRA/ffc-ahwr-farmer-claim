const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const { endemicsConfirmation, vetVisits } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsConfirmation}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        return h.view(endemicsConfirmation, {
          vetVisits,
          reference: request?.query?.reference,
          ruralPaymentsAgency: ruralPaymentsAgency
        })
      }
    }
  }
]
