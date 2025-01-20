const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { endemicsWhichSpecies } = require('../../../../../app/config/routes')
const { getEndemicsClaim } = require('../../../../../app/session')
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim

jest.mock('../../../../../app/session')
describe('Endemics which species test', () => {
  setEndemicsClaimMock.mockImplementation(() => { })
  jest.mock('../../../../../app/config', () => {
    const originalModule = jest.requireActual('../../../../../app/config')
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
      },
      endemics: {
        enabled: true
      }
    }
  })
  const url = `/claim/${endemicsWhichSpecies}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(global.__SERVER__)
  })

  test('Sheep should be selected when typeOfLivestock is sheep', async () => {
    const options = {
      method: 'GET',
      auth,
      url
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'sheep' })

    const res = await global.__SERVER__.inject(options)
    const $ = cheerio.load(res.payload)
    const typeOfLivestock = 'sheep'

    expect($('input[name="typeOfLivestock"]:checked').val()).toEqual(
      typeOfLivestock
    )
    expect($('.govuk-back-link').text()).toMatch('Back')
  })
  test('Continue without seleceted livestock should return error', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, typeOfLivestock: '' }
    }

    getEndemicsClaim.mockReturnValue({})

    const res = await global.__SERVER__.inject(options)
    const $ = cheerio.load(res.payload)
    const errorMessage = 'Select which species you are claiming for'

    expect($('p.govuk-error-message').text()).toMatch(errorMessage)
  })
  test('Continue with Sheep seleceted as a livestock', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, typeOfLivestock: 'sheep' }
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'sheep' })

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-type-of-review')
    expect(setEndemicsClaimMock).toHaveBeenCalled()
  })
})
