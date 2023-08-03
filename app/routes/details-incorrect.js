const ruralPaymentsAgency = require('../config').ruralPaymentsAgency

module.exports = {
  method: 'GET',
  path: '/claim/details-incorrect',
  options: {
    handler: async (_, h) => {
      return h.view('details-incorrect', { ruralPaymentsAgency })
    }
  }
}
