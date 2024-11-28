const Joi = require('joi')
const mqConfig = require('./messaging')
const authConfig = require('./auth')

const schema = Joi.object({
  appInsights: Joi.object(),
  namespace: Joi.string().optional(),
  cache: {
    expiresIn: Joi.number().required(),
    options: {
      host: Joi.string().required(),
      partition: Joi.string().required(),
      password: Joi.string().allow(''),
      port: Joi.number().required(),
      tls: Joi.object()
    }
  },
  cookie: {
    cookieNameCookiePolicy: Joi.string().required(),
    cookieNameAuth: Joi.string().required(),
    cookieNameSession: Joi.string().required(),
    isSameSite: Joi.string().required(),
    isSecure: Joi.boolean().default(true),
    password: Joi.string().min(32).required(),
    ttl: Joi.number().required()
  },
  cookiePolicy: {
    clearInvalid: Joi.bool().required(),
    encoding: Joi.string().valid('base64json').required(),
    isSameSite: Joi.string().default('Lax'),
    isSecure: Joi.bool().required(),
    password: Joi.string().min(32).required(),
    path: Joi.string().required(),
    ttl: Joi.number().required()
  },
  env: Joi.string().valid('development', 'test', 'production').default(
    'development'
  ),
  dashboardServiceUri: Joi.string().uri(),
  googleTagManagerKey: Joi.string().allow(null, ''),
  isDev: Joi.boolean().required(),
  port: Joi.number().required(),
  serviceName: Joi.string().required(),
  serviceUri: Joi.string().uri(),
  applyServiceUri: Joi.string().uri(),
  urlPrefix: Joi.string(),
  useRedis: Joi.boolean().required(),
  eligibilityApiUri: Joi.string().uri(),
  applicationApiUri: Joi.string().uri(),
  ruralPaymentsAgency: {
    loginUri: Joi.string().uri().required(),
    callChargesUri: Joi.string().uri().required(),
    email: Joi.string().email().required(),
    telephone: Joi.string().required()
  },
  customerSurvey: {
    uri: Joi.string().uri().optional()
  },
  wreckHttp: {
    timeoutMilliseconds: Joi.number().required()
  },
  claimExpiryTimeMonths: Joi.number(),
  endemicsClaimExpiryTimeMonths: Joi.number(),
  dateOfTesting: {
    enabled: Joi.bool().required()
  },
  endemics: {
    enabled: Joi.bool().required()
  },
  optionalPIHunt: {
    enabled: Joi.bool().required()
  },
  reviewClaimApprovedStatus: {
    enabled: Joi.bool().required()
  }
})

const config = {
  appInsights: require('applicationinsights'),
  namespace: process.env.NAMESPACE,
  cache: {
    expiresIn: 1000 * 3600 * 24 * 3, // 3 days
    options: {
      host: process.env.REDIS_HOSTNAME || 'redis-hostname.default',
      partition: 'ffc-ahwr-frontend',
      password: process.env.REDIS_PASSWORD,
      port: Number(process.env.REDIS_PORT) || 6379,
      tls: process.env.NODE_ENV === 'production' ? {} : undefined
    }
  },
  cookie: {
    cookieNameCookiePolicy: 'ffc_ahwr_cookie_policy',
    cookieNameAuth: 'ffc_ahwr_auth',
    cookieNameSession: 'ffc_ahwr_session',
    isSameSite: 'Lax',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD,
    ttl: 1000 * 3600 * 24 * 3 // 3 days
  },
  cookiePolicy: {
    clearInvalid: false,
    encoding: 'base64json',
    isSameSite: 'Lax',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD,
    path: '/',
    ttl: 1000 * 60 * 60 * 24 * 365 // 1 year
  },
  env: process.env.NODE_ENV,
  dashboardServiceUri: process.env.DASHBOARD_SERVICE_URI,
  googleTagManagerKey: process.env.GOOGLE_TAG_MANAGER_KEY,
  isDev: process.env.NODE_ENV === 'development',
  port: Number(process.env.PORT) || 3000,
  serviceName: 'Annual health and welfare review of livestock',
  serviceUri: process.env.SERVICE_URI,
  applyServiceUri: process.env.APPLY_SERVICE_URI,
  urlPrefix: '/claim',
  useRedis: process.env.NODE_ENV !== 'test',
  eligibilityApiUri: process.env.ELIGIBILITY_API_URI,
  applicationApiUri: process.env.APPLICATION_API_URI,
  ruralPaymentsAgency: {
    loginUri: 'https://www.ruralpayments.service.gov.uk',
    callChargesUri: 'https://www.gov.uk/call-charges',
    email: 'ruralpayments@defra.gov.uk',
    telephone: '03000 200 301'
  },
  customerSurvey: {
    uri: 'https://defragroup.eu.qualtrics.com/jfe/form/SV_4IsQyL0cOUbFDQG'
  },
  wreckHttp: {
    timeoutMilliseconds: Number(process.env.WRECK_HTTP_TIMEOUT_MILLISECONDS) || 10000
  },
  claimExpiryTimeMonths: 6,
  endemicsClaimExpiryTimeMonths: 10,
  dateOfTesting: {
    enabled: process.env.DATE_OF_TESTING_ENABLED || false
  },
  endemics: {
    enabled: process.env.ENDEMICS_ENABLED || false
  },
  optionalPIHunt: {
    enabled: process.env.OPTIONAL_PIHUNT_ENABLED || false
  },
  reviewClaimApprovedStatus: {
    enabled: process.env.REVIEW_CLAIM_APPROVED_STATUS_ENABLED || false
  }
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

module.exports = { ...config, mqConfig, authConfig }
