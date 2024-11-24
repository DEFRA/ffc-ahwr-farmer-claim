const config = require('../config/index')

// is this file/route needed? it doesnt get added to the router

const getHandler = {
  method: 'GET',
  path: '/claim/single-business-claim-expired',
  options: {
    handler: async (request, h) => {
      return h.view('single-business-claim-expired', {
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}

module.exports = { handlers: [getHandler] }
