import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config/index.js'

const { endemicsWhichSpecies } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../../app/config')
  return {
    ...originalModule,
    endemics: {
      enabled: true
    },
    multiSpecies: {
      enabled: false
    }
  }
})

describe('Endemics which species test', () => {
  config.multiSpecies.enabled = false
  setEndemicsClaim.mockImplementation(() => { })

  jest.mock('../../../../../app/config/auth', () => {
    const originalModule = jest.requireActual('../../../../../app/config/auth')
    return {
      ...originalModule,
      authConfig: {
        defraId: {
          hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
          oAuthAuthorisePath: '/oauth2/v2.0/authorize',
          policy: 'b2c_1a_signupsigninsfi',
          redirectUri: 'http://localhost:3000/apply/signin-oidc',
          clientId: 'dummy_client_id',
          serviceId: 'dummy_service_id',
          scope: 'openid dummy_client_id offline_access'
        },
        ruralPaymentsAgency: {
          hostname: 'dummy-host-name',
          getPersonSummaryUrl: 'dummy-get-person-summary-url',
          getOrganisationPermissionsUrl:
            'dummy-get-organisation-permissions-url',
          getOrganisationUrl: 'dummy-get-organisation-url'
        }
      }
    }
  })
  const url = `/claim/${endemicsWhichSpecies}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(async () => {
    crumb = await getCrumbs(server)
  })

  test('Sheep should be selected when typeOfLivestock is sheep', async () => {
    const options = {
      method: 'GET',
      auth,
      url
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'sheep', reference: 'TEMP-6GSE-PIR8' })

    const res = await server.inject(options)
    const $ = cheerio.load(res.payload)
    const typeOfLivestock = 'sheep'

    expect($('input[name="typeOfLivestock"]:checked').val()).toEqual(
      typeOfLivestock
    )
    expect($('.govuk-back-link').text()).toMatch('Back')
  })
  test('Continue without selected livestock should return error', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, typeOfLivestock: '' }
    }

    getEndemicsClaim.mockReturnValue({})

    const res = await server.inject(options)
    const $ = cheerio.load(res.payload)
    const errorMessage = 'Select which species you are claiming for'

    expect($('p.govuk-error-message').text()).toMatch(errorMessage)
  })
  test('Continue with Sheep selected as a livestock', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, typeOfLivestock: 'sheep' }
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'sheep' })

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/date-of-visit')
    expect(setEndemicsClaim).toHaveBeenCalled()
  })
})
