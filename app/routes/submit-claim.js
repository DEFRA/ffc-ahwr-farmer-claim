const { submitClaim } = require('../messaging/application')
const { claimed } = require('../session/keys').claim
const session = require('../session')
const states = require('../constants/states')

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
    handler: async (request, h) => {
      const claim = session.getClaim(request)
      const { reference } = claim

      claim.data.detailsCorrect = claim.detailsCorrect
      claim.data.visitDate = claim.visitDate
      claim.data.vetName = claim.vetName
      claim.data.vetRcvs = claim.vetRcvs
      claim.data.urnResult = claim.urnResult
      const submission = { reference, data: claim.data }
      const state = await submitClaim(submission, request.yar.id)

      switch (state) {
        case states.alreadyClaimed:
          session.setClaim(request, claimed, states.alreadyClaimed)
          return h.view('already-claimed', { reference })
        case states.notFound:
          session.setClaim(request, claimed, states.notFound)
          return h.view('claim-not-found', { reference })
        case states.success:
          session.setClaim(request, claimed, states.success)
          return h.view('claim-success', { reference })
        default:
          session.setClaim(request, claimed, 'claim-failed')
          return h.view('claim-failed', { reference })
      }
    }
  }
}]
