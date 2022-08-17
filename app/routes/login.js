const Joi = require('joi')
const { getByEmail } = require('../api-requests/users')
const { email: emailValidation } = require('../lib/validation/email')
const { getClaim } = require('../messaging/application')
const { clear, setClaim } = require('../session')

function cacheClaim (claim, request) {
  Object.entries(claim).forEach(([k, v]) => setClaim(request, k, v))
}

module.exports = [{
  method: 'GET',
  path: '/login',
  options: {
    handler: async (_, h) => {
      return h.view('login')
    }
  }
},
{
  method: 'POST',
  path: '/login',
  options: {
    validate: {
      payload: Joi.object({
        email: emailValidation
      }),
      failAction: async (request, h, error) => {
        return h.view('login', { ...request.payload, errorMessage: { text: error.details[0].message }, hintText: 'Oh dear!!' }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { email } = request.payload
      const organisation = await getByEmail(email)

      if (!organisation) {
        return h.view('login', { ...request.payload, errorMessage: { text: `No user found with email address "${email}"` }, hintText: 'Oh dear!!' }).code(400).takeover()
      }

      const claim = await getClaim(email, request.yar.id)

      if (!claim) {
        return h.view('login', { ...request.payload, errorMessage: { text: `No application found for ${email}. Please call the Rural Payments Agency on 03000 200 301 if you believe this is an error.`, hintText: 'Oh dear!!!' } }).code(400).takeover()
      }

      clear(request)
      cacheClaim(claim, request)

      return h.redirect('/visit-review')
    }
  }
}]
