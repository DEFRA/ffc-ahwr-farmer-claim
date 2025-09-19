import { config } from './config/index.js'
import catboxRedis from '@hapi/catbox-redis'
import catboxMemory from '@hapi/catbox-memory'
import Hapi from '@hapi/hapi'
import { headerPlugin } from './plugins/header.js'
import { crumbPlugin } from './plugins/crumb.js'
import { cookiePlugin } from './plugins/cookies.js'
import hapiInertPlugin from '@hapi/inert'
import hapiCookiePlugin from '@hapi/cookie'
import { authPlugin } from './plugins/auth-plugin.js'
import { errorPagesPlugin } from './plugins/error-pages.js'
import { loggingPlugin } from './plugins/logger.js'
import { loggingContextPlugin } from './plugins/logging-context.js'
import { redirectWhenClaimRefMissingPlugin } from './plugins/redirect-claim-ref-missing.js'
import { routerPlugin } from './plugins/router.js'
import { sessionPlugin } from './plugins/session.js'
import { viewsPlugin } from './plugins/views.js'
import { viewContextPlugin } from './plugins/view-context.js'

const catbox = config.useRedis
  ? catboxRedis
  : catboxMemory
const cacheConfig = config.useRedis ? config.cache.options : {}

export async function createServer () {
  const server = Hapi.server({
    cache: [{
      provider: {
        constructor: catbox,
        options: cacheConfig
      }
    }],
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  // 24 hours
  server.app.submissionCrumbCache = server.cache({
    expiresIn: 1000 * 60 * 60 * 24,
    segment: 'submissionCrumbs'
  })

  await server.register(crumbPlugin)
  await server.register(hapiCookiePlugin)
  await server.register(cookiePlugin)
  await server.register(hapiInertPlugin.plugin)
  await server.register(authPlugin)
  await server.register(errorPagesPlugin)
  await server.register(loggingPlugin)
  await server.register(loggingContextPlugin)
  await server.register(redirectWhenClaimRefMissingPlugin)
  await server.register(routerPlugin)
  await server.register(sessionPlugin)
  await server.register(viewContextPlugin)
  await server.register(viewsPlugin)
  await server.register(headerPlugin)

  return server
}
