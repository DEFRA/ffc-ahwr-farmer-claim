import { authConfig } from '../config/auth.js'
import { config } from '../config/index.js'
import { requestAuthorizationCodeUrl } from '../auth/auth-code-grant/request-authorization-code-url.js'
import { StatusCodes } from "http-status-codes"

export const signInHandler = {
  method: 'GET',
  path: '/claim/signin-oidc',
  options: {
    auth: false,
    handler: async (request, h) => {
      try {
        const { referer } = request.headers
        const { code, state } = request.query

        const loggerInfo = {
          source: 'claim/signin-oidc',
          referer,
          code,
          state,
          remoteAddress: request.info.remoteAddress,
          userAgent: request.headers['user-agent']
        }

        request.logger.info(loggerInfo, 'Claim signin-oidc handler invoked:')

        request.logger.info('Redirecting user on to dashboard signin-oidc...')

        const query = new URLSearchParams(request.query).toString()
        const queryString = query ? `?${query}` : ''
        const redirectUrl = `${authConfig.defraId.dashboardRedirectUri}${queryString}`

        return h.redirect(redirectUrl)
      } catch (error) {
        request.logger.setBindings({ err: error })

        return h
          .view('verify-login-failed', {
            backLink: requestAuthorizationCodeUrl(request),
            ruralPaymentsAgency: config.ruralPaymentsAgency
          })
          .code(StatusCodes.BAD_REQUEST)
          .takeover()
      }
    }
  }
}
