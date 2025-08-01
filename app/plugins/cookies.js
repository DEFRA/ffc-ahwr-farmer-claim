import { config } from '../config/index.js'
import { getCurrentPolicy } from '../cookies.js'
import { StatusCodes } from 'http-status-codes'

const { cookie: { cookieNameCookiePolicy }, cookiePolicy } = config

export const cookiePlugin = {
  plugin: {
    name: 'cookies',
    register: (server, _) => {
      server.state(cookieNameCookiePolicy, cookiePolicy)

      server.ext('onPreResponse', (request, h) => {
        const statusCode = request.response.statusCode
        if (
          request.response.variety === 'view' &&
          statusCode !== StatusCodes.NOT_FOUND &&
          statusCode !== StatusCodes.INTERNAL_SERVER_ERROR &&
          request.response.source.manager._context
        ) {
          request.response.source.manager._context.cookiesPolicy =
            getCurrentPolicy(request, h)
        }
        return h.continue
      })
    }
  }
}
