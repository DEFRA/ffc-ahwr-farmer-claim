import { config } from '../../config/index.js'
import { setCustomer, setEndemicsClaim } from '../../session/index.js'
import { getPersonName } from '../../api-requests/rpa-api/person.js'
import { sessionKeys } from '../../session/keys.js'
import { getOrganisationAddress } from '../../api-requests/rpa-api/organisation.js'
import { setAuthCookie } from '../../auth/cookie-auth/cookie-auth.js'
import { getLatestApplicationForSbi } from '../models/latest-application.js'
import { farmerClaim } from '../../constants/constants.js'
import { NoApplicationFoundError } from '../../exceptions/no-application-found.js'

const urlPrefix = config.urlPrefix

const pageUrl = `${urlPrefix}/endemics/dev-sign-in`

const createDevDetails = async (sbi) => {
  const organisationSummary = {
    organisationPermission: {},
    organisation: {
      sbi,
      name: 'madeUpCo',
      email: 'org@company.com',
      frn: 'frn123456',
      address: {
        address1: 'Somewhere'
      }
    }
  }
  const personSummary = {
    email: 'farmer@farm.com',
    customerReferenceNumber: 'abc123',
    firstName: 'John',
    lastName: 'Smith'
  }

  return [personSummary, organisationSummary]
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view('endemics/dev-sign-in', {
      })
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
      request.logger.setBindings({ sbi })
      const [personSummary, organisationSummary] = await createDevDetails(sbi)

      try {
        const latestApplication = await getLatestApplicationForSbi(
          organisationSummary.organisation.sbi?.toString(),
          organisationSummary.organisation.name
        )

        setEndemicsClaim(
          request,
          sessionKeys.endemicsClaim.organisation,
          {
            sbi: organisationSummary.organisation.sbi?.toString(),
            farmerName: getPersonName(personSummary),
            name: organisationSummary.organisation.name,
            email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
            orgEmail: organisationSummary.organisation.email,
            address: getOrganisationAddress(organisationSummary.organisation.address),
            crn: personSummary.customerReferenceNumber,
            frn: organisationSummary.organisation.businessReference
          }
        )

        setCustomer(request, sessionKeys.customer.id, personSummary.id)
        setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)

        return h.redirect(`/claim/endemics?from=dashboard&sbi=${organisationSummary.organisation.sbi}`)
      } catch (error) {
        if (error instanceof NoApplicationFoundError) {
          const errorMessage = `${sbi} does not have an active agreement in the database.`
          return h.view('endemics/dev-sign-in-exception', { backLink: `${config.urlPrefix}/endemics/dev-sign-in`, sbi, errorMessage }).code(400).takeover()
        }

        throw error
      }
    }
  }
}

export const devSignInHandlers = [getHandler, postHandler]
