const Joi = require('joi')
const config = require('../../config')
const auth = require('../../auth')
const session = require('../../session')
const sessionKeys = require('../../session/keys')
const latestApplicationForSbi = require('../models/latest-application')
const { farmerClaim } = require('../../constants/user-types')
const { NoAgreementFoundForThisBusiness } = require('../../exceptions')

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
        const accessToken = await auth.authenticate(request, session)
        console.log(`Temporaily logging access token - ${accessToken}`)
        const latestApplication = await latestApplicationForSbi('113333333') // get actual SBI from claims
        if (!latestApplication) {
          console.log('No claimable application found for SBI - dummy SBI')
          throw new NoAgreementFoundForThisBusiness()
        }
        // todo implement RPA api call for permissions
        // todo implement RPA api call for CPH check
        setAuthenticationState(latestApplication)
        return h.redirect('/claim/visit-review')
      } catch (error) {
        if (error instanceof NoAgreementFoundForThisBusiness) {
          return h.view('defra-id/you-cannot-claim-for-a-livestock-review', {
            backLink: auth.requestAuthorizationCodeUrl(session, request),
            noAgreementFoundForThisBusiness: error instanceof NoAgreementFoundForThisBusiness,
            // todo change
            organisation: {
              sbi: '123456789',
              name: 'Business Name'
            },
            hasMultipleBusineses: session.getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses),
            ruralPaymentsAgency: config.ruralPaymentsAgency
          }).code(400).takeover()
        }
        console.log(`Error when handling DEFRA ID redirect ${error.message}.`)
        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request)
        }).code(400).takeover()
      }

      function setAuthenticationState (latestApplication) {
        session.setClaim(request, sessionKeys.farmerApplyData.organisation, latestApplication.data.organisation)
        Object.entries(latestApplication).forEach(([k, v]) => session.setClaim(request, k, v))
        auth.setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)
      }
    }
  }
}
]
