const { submitClaim } = require('../messaging/application')
const { claimed } = require('../session/keys').claim
const session = require('../session')
const states = require('../constants/states')
const { clearAuthCookie } = require('../auth')
const preDoubleSubmitHandler = require('./utils/pre-submission-handler')
const config = require('../../app/config/index')

function updateSession (request, claimed, claimStatus) {
  session.setClaim(request, claimed, claimStatus)
  session.clear(request)
  clearAuthCookie(request)
}

module.exports = [{
  method: 'GET',
  path: '/claim/submit-claim',
  options: {
    handler: async (_, h) => {
      return h.view('submit-claim')
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
      claim.data.dateOfClaim = new Date().toISOString()
      const submission = { reference, data: claim.data }
      const state = await submitClaim(submission, request.yar.id)

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
