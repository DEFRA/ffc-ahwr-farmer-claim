const Joi = require('joi')
const config = require('../../config')
const auth = require('../../auth')
const session = require('../../session')
const sessionKeys = require('../../session/keys')
const latestApplicationForSbi = require('../models/latest-application')
const { farmerClaim } = require('../../constants/user-types')
const { getPersonSummary, getPersonName, organisationIsEligible, getOrganisationAddress } = require('../../api-requests/rpa-api')
const { NoApplicationFound, DoNotHaveRequiredPermission, ClaimHasAlreadyBeenMade } = require('../../exceptions')

module.exports = [{
  method: 'GET',
  path: '/claim/signin-oidc',
  options: {
    auth: false,
    validate: {
      query: Joi.object({
        code: Joi.string().required(),
        state: Joi.string().uuid().required()
      }).options({
        stripUnknown: true
      }),
      failAction (request, h, err) {
        console.log(`Validation error caught during DEFRA ID redirect - ${err.message}.`)
        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request)
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await auth.authenticate(request, session)

        const apimAccessToken = await auth.getClientCredentials(request)
        const personSummary = await getPersonSummary(request, apimAccessToken)
        const organisationSummary = await organisationIsEligible(request, personSummary.id, apimAccessToken)

        if (!organisationSummary.organisationPermission) {
          throw new DoNotHaveRequiredPermission(`Person id ${personSummary.id} does not have the required permissions for organisation id ${organisationSummary.organisation.id}`)
        }
        const latestApplication = await latestApplicationForSbi(
          organisationSummary.organisation.sbi.toString(),
          organisationSummary.organisation.name
        )
        console.log(`${new Date().toISOString()} Claimable application found: ${JSON.stringify({
          sbi: latestApplication.data.organisation.sbi
        })}`)
        Object.entries(latestApplication).forEach(([k, v]) => session.setClaim(request, k, v))
        session.setCustomer(request, sessionKeys.customer.id, personSummary.id)
        session.setClaim(
          request,
          sessionKeys.farmerApplyData.organisation,
          {
            sbi: organisationSummary.organisation.sbi.toString(),
            farmerName: getPersonName(personSummary),
            name: organisationSummary.organisation.name,
            email: organisationSummary.organisation.email ? organisationSummary.organisation.email : personSummary.email,
            address: getOrganisationAddress(organisationSummary.organisation.address)
          }
        )
        auth.setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)
        return h.redirect('/claim/visit-review')
      } catch (error) {
        console.error(error)
        switch (true) {
          case error instanceof DoNotHaveRequiredPermission:
          case error instanceof NoApplicationFound:
          case error instanceof ClaimHasAlreadyBeenMade:
            return h.view('defra-id/you-cannot-claim-for-a-livestock-review', {
              error,
              hasMultipleBusineses: session.getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses),
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              backLink: auth.requestAuthorizationCodeUrl(session, request)
            }).code(400).takeover()
          default:
            return h.view('verify-login-failed', {
              backLink: auth.requestAuthorizationCodeUrl(session, request)
            }).code(400).takeover()
        }
      }
    }
  }
}]
