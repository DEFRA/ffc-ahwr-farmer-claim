const urlPrefix = require('../../config').urlPrefix
const session = require('../../session')
const sessionKeys = require('../../session/keys')
const { getPersonName, getOrganisationAddress } = require('../../api-requests/rpa-api')
const latestApplicationForSbi = require('../models/latest-application')
const auth = require('../../auth')
const { farmerClaim } = require('../../constants/user-types')

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

      session.setOrganisation(
        request,
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

      const latestApplication = await latestApplicationForSbi(
        organisationSummary.organisation.sbi?.toString(),
        organisationSummary.organisation.name
      )

      session.setCustomer(request, sessionKeys.customer.id, personSummary.id)
      auth.setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)

      return h.redirect(`/claim/endemics?from=dashboard&sbi=${organisationSummary.organisation.sbi}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
