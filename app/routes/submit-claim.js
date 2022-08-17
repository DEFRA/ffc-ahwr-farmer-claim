const { submitClaim } = require('../messaging/application')
const session = require('../session')
const states = require('../constants/states')

module.exports = [{
  method: 'GET',
  path: '/submit-claim',
  options: {
    handler: async (_, h) => {
      return h.view('submit-claim')
    }
  }
},
{
  method: 'POST',
  path: '/submit-claim',
  options: {
    handler: async (request, h) => {
      const claim = session.getClaim(request)
      const { reference } = claim

      const submission = { reference }
      const state = await submitClaim(submission, request.yar.id)

      switch (state) {
        case states.alreadyClaimed:
          return h.view('already-claimed', { reference })
        case states.notFound:
          return h.view('claim-not-found', { reference })
        case states.success:
          return h.view('claim-success', { reference })
        default:
          return h.view('claim-failed', { reference })
      }
    }
  }
}]
