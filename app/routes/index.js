const session = require('../session')
const config = require('../config')
const { requestAuthorizationCodeUrl } = require('../auth')
const { submitDeadLetter } = require('../messaging/application')

module.exports = {
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      request.cookieAuth.clear()
      session.clear(request)
      console.log('submitting dead letter')
      console.log(await submitDeadLetter({ reference: 'AHWR-0000-1111-2222', data: { text: 'random data' } }, request.yar.id))
      return h.view('index', {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
