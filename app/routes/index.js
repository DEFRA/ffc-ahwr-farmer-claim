const session = require('../session')
const config = require('../config')
const { requestAuthorizationCodeUrl } = require('../auth')
const logout = require('../lib/logout')

module.exports = {
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      logout()
      return h.view('index', {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency,
        dateOfTestingEnabled: config.dateOfTesting.enabled
      })
    }
  }
}
