const session = require('../../session')
const config = require('../../config')
const { requestAuthorizationCodeUrl } = require('../../auth')
const { endemicsIndex } = require('../../config/routes')

module.exports = {
  method: 'GET',
  path: `${config.urlPrefix}/${endemicsIndex}`,
  options: {
    auth: false,
    handler: async (request, h) => {
      request.cookieAuth.clear()
      session.clear(request)
      return h.view(`${endemicsIndex}/index`, {
        defraIdLogin: requestAuthorizationCodeUrl(session, request),
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
