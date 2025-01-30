const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const createServer = require('../../../../../app/server')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
jest.mock('../../../../../app/session')

describe('Endemics package test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/sheep-endemics-package'

  let server

  beforeAll(async () => {
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })
    process.env.ENDEMICS_ENABLED = 'true'

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

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('Returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('Which sheep health package did you choose?')
      expect($('title').text()).toContain('Sheep Endemics Package - Get funding to improve animal health and welfare')

      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test('backlink', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/vet-rcvs')
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, herdVaccinationStatus: 'vaccinated' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    test.each([
      { sheepEndemicsPackage: undefined, errorMessage: 'Select a package' },
      { sheepEndemicsPackage: null, errorMessage: 'Select a package' },
      { sheepEndemicsPackage: 'impossible', errorMessage: 'Select a package' }
    ])('returns 400 when payload is invalid - %p', async ({ sheepEndemicsPackage, errorMessage }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, sheepEndemicsPackage },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('Which sheep health package did you choose?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(errorMessage)
      expect($('#sheepEndemicsPackage-error').text()).toMatch(errorMessage)
    })

    test.each([
      { sheepEndemicsPackage: 'improvedEwePerformance' },
      { sheepEndemicsPackage: 'improvedReproductivePerformance' },
      { sheepEndemicsPackage: 'improvedLambPerformance' },
      { sheepEndemicsPackage: 'improvedNeonatalLambSurvival' },
      { sheepEndemicsPackage: 'reducedExternalParasites' },
      { sheepEndemicsPackage: 'reducedLameness' }

    ])('returns 200 when payload is valid and stores in session (sheepEndemicsPackage= $sheepEndemicsPackage)', async ({ sheepEndemicsPackage }) => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, sheepEndemicsPackage },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/sheep-tests')
    })
  })
})
