const session = require('../session')
const config = require('../config')
const { requestAuthorizationCodeUrl } = require('../auth')

module.exports = {
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      request.cookieAuth.clear()
      session.clear(request)
      return h.view('index', {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency,
        dateOfTestingEnabled: config.dateOfTesting.enabled
      })
    }
  }
}
