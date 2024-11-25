const config = require('../config/index')

module.exports = {
  method: 'GET',
  path: '/claim/single-business-claim-expired',
  options: {
    handler: async (_, h) => {
      return h.view('single-business-claim-expired', {
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
