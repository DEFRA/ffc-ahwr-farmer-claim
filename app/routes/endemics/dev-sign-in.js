import { config } from '../../config/index.js'
import { setCustomer, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'

const urlPrefix = config.urlPrefix
const sendTo = config.dashboardServiceUri

const pageUrl = `${urlPrefix}/endemics/dev-sign-in`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view('endemics/dev-sign-in', { backLink: '/claim/endemics' })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      const { sbi } = request.payload

      if (config.env === 'development') {
        setEndemicsClaim(
          request,
          sessionKeys.endemicsClaim.organisation,
          {
            sbi,
            farmerName: 'John Smith',
            name: 'madeUpCo',
            email: 'farmer@farm.com',
            orgEmail: 'org@company.com',
            address: 'somewhere',
            crn: '2054561445',
            frn: '1100918140'
          }
        )

        setCustomer(request, sessionKeys.customer.id, '1')
        setCustomer(request, sessionKeys.customer.crn, '2054561445')
        request.cookieAuth.set({ email: 'farmer@farm.com', userType: 'farmerApply' })
      }

      return h.redirect(`${sendTo}/dev-sign-in?sbi=${sbi}&cameFrom=claim`)
    }
  }
}

export const devSignInHandlers = [getHandler, postHandler]
