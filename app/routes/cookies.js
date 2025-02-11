import Joi from 'joi'
import { config } from '../config/index.js'

import { ViewModel } from './models/cookies-policy.js'
import { updatePolicy } from '../cookies.js'

const { cookie: { cookieNameCookiePolicy } } = config

const getHandler = {
  method: 'GET',
  path: '/claim/cookies',
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view('cookies/cookie-policy', new ViewModel(request.state[cookieNameCookiePolicy], request.query.updated))
    }
  }
}

const postHandler = {
  method: 'POST',
  path: '/claim/cookies',
  options: {
    auth: false,
    plugins: {
      crumb: false
    },
    validate: {
      payload: Joi.object({
        analytics: Joi.boolean(),
        async: Joi.boolean().default(false)
      })
    },
    handler: (request, h) => {
      updatePolicy(request, h, request.payload.analytics)
      if (request.payload.async) {
        return h.response('ok')
      }
      return h.redirect('/claim/cookies?updated=true')
    }
  }
}

export const cookiesHandlers = [getHandler, postHandler]
