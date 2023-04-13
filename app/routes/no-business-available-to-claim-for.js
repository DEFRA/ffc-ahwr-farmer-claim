const config = require('../config/index')

module.exports = {
  method: 'GET',
  path: '/claim/no-business-available-to-claim-for',
  options: {
    handler: async (request, h) => {
      return h.view('no-business-available-to-claim-for', {
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
