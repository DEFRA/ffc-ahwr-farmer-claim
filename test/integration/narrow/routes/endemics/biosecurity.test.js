const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { getEndemicsClaim } = require('../../../../../app/session')
const { urlPrefix } = require('../../../../../app/config')
const {
  endemicsBiosecurity,
  endemicsCheckAnswers,
  endemicsBiosecurityException
} = require('../../../../../app/config/routes')

jest.mock('../../../../../app/session')

describe('Biosecurity test', () => {
  const url = `/claim/${endemicsBiosecurity}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(global.__SERVER__)
  })

  beforeAll(() => {
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
  })
  afterAll(() => {
    jest.resetAllMocks()
  })
  describe(`GET ${url} route`, () => {
    test('redirect if not logged in / authorized', async () => {
      const options = {
        method: 'GET',
        url
      }

      const response = await global.__SERVER__.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
    test('Returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const response = await global.__SERVER__.inject(options)

      expect(response.statusCode).toBe(200)
    })
    test('display question text', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const response = await global.__SERVER__.inject(options)

      const $ = cheerio.load(response.payload)

      expect($('h1').text()).toMatch('Did the vet do a biosecurity assessment?')
    })
    test("select 'yes' when biosecurity is 'yes'", async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      getEndemicsClaim.mockReturnValue({ biosecurity: 'yes' })

      const response = await global.__SERVER__.inject(options)
      const $ = cheerio.load(response.payload)
      const biosecurity = 'yes'

      expect($('input[name="biosecurity"]:checked').val()).toEqual(biosecurity)
      expect($('.govuk-back-link').text()).toMatch('Back')
    })
  })
  describe(`POST ${url}`, () => {
    test('show inline Error if continue is pressed and biosecurity answer not selected', async () => {
      const typeOfLivestock = 'pigs'
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, typeOfLivestock, biosecurity: '', assessmentPercentage: '' }
      }
      getEndemicsClaim.mockReturnValue({ biosecurity: '', assessmentPercentage: '' })

      const response = await global.__SERVER__.inject(options)
      const $ = cheerio.load(response.payload)
      const errorMessage = 'Select whether the vet did a biosecurity assessment'

      expect($('p.govuk-error-message').text()).toMatch(errorMessage)
    })
    test('show inline error if continue is pressed and no answer is selected for assessmentPercentage', async () => {
      const typeOfLivestock = 'pigs'
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, typeOfLivestock, biosecurity: 'yes', assessmentPercentage: '' }
      }
      getEndemicsClaim.mockReturnValue({ biosecurity: 'yes', assessmentPercentage: '' })

      const response = await global.__SERVER__.inject(options)
      const $ = cheerio.load(response.payload)
      const errorMessage = 'Enter the assessment percentage'

      expect(response.statusCode).toBe(400)
      expect($('p.govuk-error-message').text()).toMatch(errorMessage)
      expect($('#main-content > div > div > div > div > ul > li > a').text()).toMatch('Enter the assessment percentage')
    })
    test('continue to next page when biosecurity and assessment are provided for Pigs journey', async () => {
      const typeOfLivestock = 'pigs'
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, typeOfLivestock, biosecurity: 'yes', assessmentPercentage: '1' }
      }
      getEndemicsClaim.mockReturnValue({ biosecurity: 'yes', assessmentPercentage: '1' })

      const response = await global.__SERVER__.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toEqual(`${urlPrefix}/${endemicsCheckAnswers}`)
    })
    test('continue to next page when biosecurity is "yes" for other journeys besides pig', async () => {
      const typeOfLivestock = 'dairy'
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, typeOfLivestock, biosecurity: 'yes' }
      }
      getEndemicsClaim.mockReturnValue({ biosecurity: 'yes' })

      const response = await global.__SERVER__.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toEqual(`${urlPrefix}/${endemicsCheckAnswers}`)
    })
    test('continue to Exception page when biosecurity  is "no" for any journey', async () => {
      const typeOfLivestock = 'pigs'
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, typeOfLivestock, biosecurity: 'no' }
      }
      getEndemicsClaim.mockReturnValue({ biosecurity: 'no' })

      const response = await global.__SERVER__.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toEqual(`${urlPrefix}/${endemicsBiosecurityException}`)
    })
  })
})
