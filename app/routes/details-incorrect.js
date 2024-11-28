const ruralPaymentsAgency = require('../config').ruralPaymentsAgency

const getHandler = {
  method: 'GET',
  path: '/claim/details-incorrect',
  options: {
    handler: async (_, h) => {
      return h.view('details-incorrect', { ruralPaymentsAgency })
    }
  }
}

module.exports = { handlers: [getHandler] }
