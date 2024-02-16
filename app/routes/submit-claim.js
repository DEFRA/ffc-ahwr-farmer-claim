const { submitClaim } = require('../messaging/application')
const { claimed } = require('../session/keys').claim
const session = require('../session')
const logout = require('../lib/logout')
const states = require('../constants/states')
const preDoubleSubmitHandler = require('./utils/pre-submission-handler')
const config = require('../../app/config/index')
const appInsights = require('applicationinsights')
const { claim: { animalsTested: animalsTestedKey } } = require('../session/keys')

function updateSession (request, claimed, claimStatus) {
  session.setClaim(request, claimed, claimStatus)
  logout()
}

module.exports = [{
  method: 'GET',
  path: '/claim/submit-claim',
  options: {
    handler: async (request, h) => {
      const animalsTested = session.getClaim(request, animalsTestedKey)
      return h.view('submit-claim', { animalsTested: !!animalsTested })
    }
  }
},
{
  method: 'POST',
  path: '/claim/submit-claim',
  options: {
    pre: [{ method: preDoubleSubmitHandler }],
    handler: async (request, h) => {
      const claim = session.getClaim(request)
      const { reference } = claim

      claim.data.detailsCorrect = claim.detailsCorrect
      claim.data.visitDate = claim.visitDate
      claim.data.vetName = claim.vetName
      claim.data.vetRcvs = claim.vetRcvs
      claim.data.urnResult = claim.urnResult
      claim.data.animalsTested = claim.animalsTested
      claim.data.dateOfClaim = new Date().toISOString()
      if (config.dateOfTesting.enabled) {
        claim.data.dateOfTesting = claim.dateOfTesting
      }
      const submission = { reference, data: claim.data }
      const state = await submitClaim(submission, request.yar.id)
      appInsights.defaultClient.trackEvent({
        name: 'claim-submitted',
        properties: {
          reference: reference,
          state: state
        }
      })
      switch (state) {
        case states.alreadyClaimed:
          updateSession(request, claimed, states.alreadyClaimed)
          return h.view('already-claimed', { reference })
        case states.notFound:
          updateSession(request, claimed, states.notFound)
          return h.view('claim-not-found', { reference })
        case states.success:
          updateSession(request, claimed, states.success)
          return h.view('claim-success', { reference, ruralPaymentsAgency: config.ruralPaymentsAgency, claimSurveyUri: config.customerSurvey.uri })
        default:
          updateSession(request, claimed, 'claim-failed')
          return h.view('claim-failed', { reference })
      }
    }
  }
}]
