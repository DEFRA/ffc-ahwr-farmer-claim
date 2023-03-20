const Joi = require('joi')
const session = require('../../session')
const auth = require('../../auth')
const sessionKeys = require('../../session/keys')
const latestApplicationForSbi = require('../models/latest-application')
const { farmerClaim } = require('../../constants/user-types')

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
        return h.view('verify-login-failed', {
          backLink: auth.getAuthenticationUrl(session, request)
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        const accessToken = await auth.authenticate(request, session)
        console.log(`Temporaily logging access token - ${accessToken}`)
        const latestApplication = await latestApplicationForSbi('113333333') // get actual SBI from claims
        if(!latestApplication) {
          console.log('No claimable application found for SBI - dummy SBI')
          return h.view('verify-login-failed', {
            backLink: auth.getAuthenticationUrl(session, request)
          }).code(400).takeover()
          // todo route to actual exception screen
        }
        // todo implement RPA api call for permissions
        // todo implement RPA api call for CPH check
        setAuthenticationState(latestApplication)
        return h.redirect('/claim/visit-review')
      } catch (e) {
        console.log(`Error when handling DEFRA ID redirect ${e.message}.`)
        return h.view('verify-login-failed', {
          backLink: auth.getAuthenticationUrl(session, request)
        }).code(400)
      }

      function setAuthenticationState(latestApplication) {
        session.setClaim(request, sessionKeys.farmerApplyData.organisation, latestApplication.data.organisation)
        Object.entries(latestApplication).forEach(([k, v]) => session.setClaim(request, k, v))
        auth.setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)
      }
    }
  }
}
]
