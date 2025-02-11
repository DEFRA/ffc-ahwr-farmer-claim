import { config } from '../config/index.js'
import crumb from '@hapi/crumb'

export const crumbPlugin = {
  plugin: crumb,
  options: {
    cookieOptions: {
      isSecure: config.cookie.isSecure
    },
    skip: (request) => request.route.path === `${config.urlPrefix}/cookies` && request.method.toLowerCase() === 'post'
  }
}
