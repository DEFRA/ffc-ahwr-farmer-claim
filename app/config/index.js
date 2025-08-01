import Joi from 'joi'
import appInsights from 'applicationinsights'

const threeDaysInMs = 1000 * 3600 * 24 * 3
const oneYearInMs = 1000 * 3600 * 24 * 365
const DEFAULT_APP_PORT = 3000
const DEFAULT_REDIS_PORT = 6379

export const getConfig = () => {
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
    applicationApiUri: Joi.string().uri(),
    customerSurvey: {
      uri: Joi.string().uri().optional()
    },
    wreckHttp: {
      timeoutMilliseconds: Joi.number().required()
    },
    claimExpiryTimeMonths: Joi.number(),
    endemicsClaimExpiryTimeMonths: Joi.number(),
    multiHerds: {
      releaseDate: Joi.string().required()
    },
    devLogin: {
      enabled: Joi.bool().required()
    },
    pigUpdates: {
      enabled: Joi.bool().required()
    }
  })

  const mainConfig = {
    appInsights,
    namespace: process.env.NAMESPACE,
    cache: {
      expiresIn: threeDaysInMs,
      options: {
        host: process.env.REDIS_HOSTNAME || 'redis-hostname.default',
        partition: 'ffc-ahwr-frontend',
        password: process.env.REDIS_PASSWORD,
        port: Number(process.env.REDIS_PORT) || DEFAULT_REDIS_PORT,
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
      ttl: threeDaysInMs
    },
    cookiePolicy: {
      clearInvalid: false,
      encoding: 'base64json',
      isSameSite: 'Lax',
      isSecure: process.env.NODE_ENV === 'production',
      password: process.env.COOKIE_PASSWORD,
      path: '/',
      ttl: oneYearInMs
    },
    env: process.env.NODE_ENV,
    dashboardServiceUri: process.env.DASHBOARD_SERVICE_URI,
    googleTagManagerKey: process.env.GOOGLE_TAG_MANAGER_KEY,
    isDev: process.env.NODE_ENV === 'development',
    port: Number(process.env.PORT) || DEFAULT_APP_PORT,
    serviceName: 'Annual health and welfare review of livestock',
    serviceUri: process.env.SERVICE_URI,
    applyServiceUri: process.env.APPLY_SERVICE_URI,
    urlPrefix: '/claim',
    useRedis: process.env.NODE_ENV !== 'test',
    applicationApiUri: process.env.APPLICATION_API_URI,
    customerSurvey: {
      uri: process.env.CUSTOMER_SURVEY_CLAIM_URI
    },
    wreckHttp: {
      timeoutMilliseconds: Number(process.env.WRECK_HTTP_TIMEOUT_MILLISECONDS) || 10000
    },
    claimExpiryTimeMonths: 6,
    endemicsClaimExpiryTimeMonths: 10,
    multiHerds: {
      releaseDate: process.env.MULTI_HERDS_RELEASE_DATE || '2025-05-01'
    },
    devLogin: {
      enabled: process.env.DEV_LOGIN_ENABLED === 'true'
    },
    pigUpdates: {
      enabled: process.env.PIG_UPDATES_ENABLED === 'true'
    }
  }

  const { error } = schema.validate(mainConfig, {
    abortEarly: false
  })

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`)
  }

  return mainConfig
}

export const config = getConfig()
