import { StatusCodes } from 'http-status-codes'
import { config } from '../config/index.js'
import { getEndemicsClaim } from '../session/index.js'
import { sessionKeys } from '../session/keys.js'

const { endemicsClaim: { organisation: organisationKey } } = sessionKeys

export const missingPagesRoutes = [{
  method: 'GET',
  path: '/{any*}',
  options: {
    auth: { mode: 'try' },
    handler: (request, h) => {
      const userIsSignedIn = Boolean(getEndemicsClaim(request, organisationKey))

      return h
        .view('error-pages/404',
          {
            signInLink: !userIsSignedIn ? `${config.dashboardServiceUri}/sign-in` : undefined,
            dashboardLink: `${config.dashboardServiceUri}/vet-visits`
          })
        .code(StatusCodes.NOT_FOUND)
    }
  }
}]
