const cheerio = require('cheerio')
const { livestockTypes } = require('../../../../../app/constants/claim')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
jest.mock('../../../../../app/session')

describe('Check answers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/check-answers'

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
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
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
    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test('returns 200 and shows all fields that have values', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return {
            organisation: { name: 'business name' },
            typeOfLivestock: 'beef',
            typeOfReview: 'typeOfReview',
            dateOfVisit: 'dateOfVisit',
            dateOfTesting: 'dateOfTesting',
            speciesNumbers: 'speciesNumbers',
            vetsName: 'vetsName',
            vetRCVSNumber: 'vetRCVSNumber',
            laboratoryURN: 'laboratoryURN',
            numberOfOralFluidSamples: 'numberOfOralFluidSamples',
            numberAnimalsTested: 'numberAnimalsTested',
            testResults: 'testResults'
          }
        })
        const options = {
          method: 'GET',
          url,
          auth
        }
  
        const res = await global.__SERVER__.inject(options)
  
        expect(res.statusCode).toBe(200)
        const $ = cheerio.load(res.payload)

        expect($('h1').text()).toMatch('Check your answers')
        expect($('title').text()).toEqual('Check your answers - Annual health and welfare review of livestock')
  
        expect($('.govuk-summary-list__key').text()).toContain('Business name')
        expect($('.govuk-summary-list__value').text()).toContain('business name')
  
        expect($('.govuk-summary-list__key').text()).toContain('Type of review')
        expect($('.govuk-summary-list__value').text()).toContain('typeOfReview')
  
        expect($('.govuk-summary-list__key').text()).toContain('Date of visit')
        expect($('.govuk-summary-list__value').text()).toContain('dateOfVisit')
  
        expect($('.govuk-summary-list__key').text()).toContain('Date of testing')
        expect($('.govuk-summary-list__value').text()).toContain('dateOfTesting')
  
        expect($('.govuk-summary-list__key').text()).toContain('11 or more beef cattle')
        expect($('.govuk-summary-list__value').text()).toContain('speciesNumbers')
  
        expect($('.govuk-summary-list__key').text()).toContain('Vet\'s name')
        expect($('.govuk-summary-list__value').text()).toContain('vetsName')
  
        expect($('.govuk-summary-list__key').text()).toContain('Vet\'s RCVS number')
        expect($('.govuk-summary-list__value').text()).toContain('vetRCVSNumber')
  
        expect($('.govuk-summary-list__key').text()).toContain('URN')
        expect($('.govuk-summary-list__value').text()).toContain('laboratoryURN')
  
        expect($('.govuk-summary-list__key').text()).toContain('Number of tests')
        expect($('.govuk-summary-list__value').text()).toContain('numberOfOralFluidSamples')
  
        expect($('.govuk-summary-list__key').text()).toContain('Number of animals tested')
        expect($('.govuk-summary-list__value').text()).toContain('numberAnimalsTested')
  
        expect($('.govuk-summary-list__key').text()).toContain('Test results')
        expect($('.govuk-summary-list__value').text()).toContain('testResults')
  
        expectPhaseBanner.ok($)
      })

      test.each([
        { typeOfLivestock: livestockTypes.beef, content: '11 or more beef cattle', backLink: 'endemics/test-results' },
        { typeOfLivestock: livestockTypes.dairy, content: '11 or more dairy cattle', backLink: 'endemics/test-results' },
        { typeOfLivestock: livestockTypes.pigs, content: '51 or more pigs', backLink: 'endemics/test-results' },
        { typeOfLivestock: livestockTypes.sheep, content: '21 or more sheep', backLink: 'endemics/test-urn' }
      ])('check content and back links are correct for $typeOfLivestock', async ({ typeOfLivestock, content, backLink }) => {
        getEndemicsClaimMock.mockImplementation(() => {
          return {
            organisation: { name: 'business name' },
            typeOfLivestock,
            typeOfReview: 'typeOfReview',
            dateOfVisit: 'dateOfVisit',
            dateOfTesting: 'dateOfTesting',
            speciesNumbers: 'speciesNumbers',
            vetsName: 'vetsName',
            vetRCVSNumber: 'vetRCVSNumber',
            laboratoryURN: 'laboratoryURN',
          }
        })
        const options = {
          method: 'GET',
          url,
          auth
        }
  
        const res = await global.__SERVER__.inject(options)
  
        expect(res.statusCode).toBe(200)
        const $ = cheerio.load(res.payload)

        expect($('h1').text()).toMatch('Check your answers')
        expect($('title').text()).toEqual('Check your answers - Annual health and welfare review of livestock')
  
        expect($('.govuk-summary-list__key').text()).toContain(content)
        expect($('.govuk-summary-list__value').text()).toContain('speciesNumbers')

        expect($('.govuk-back-link').attr('href')).toEqual(backLink)
      })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
  })
})
