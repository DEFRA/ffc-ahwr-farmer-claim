const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { setEndemicsAndOptionalPIHunt } = require('../../../../mocks/config')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/pi-hunt'

describe('PI Hunt tests when Optional PI Hunt is OFF', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reference: '12345' } })
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaimMock.mockImplementation(() => { })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: false })
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?')
      expect($('title').text().trim()).toContain('PI Hunt - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-radios__item').length).toEqual(2)
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
        payload: { crumb, laboratoryURN: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/test-urn')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error when payload is invalid', async () => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, piHunt: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select if a PI hunt was done')
    })
  })
})

describe('PI Hunt tests when Optional PI Hunt is ON', () => {
  let server

  beforeAll(async () => {
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaimMock.mockImplementation(() => { })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })
  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })
    test.each([
      { reviewTestResults: 'positive', expectedURL: '/claim/endemics/pi-hunt-all-animals' },
      { reviewTestResults: 'negative', expectedURL: '/claim/endemics/pi-hunt-recommended' }
    ])('Continue to eligible page if user select yes', async ({ reviewTestResults, expectedURL }) => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaimMock.mockImplementationOnce(() => { return { reviewTestResults } })
        .mockImplementationOnce(() => { return { reviewTestResults } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(expectedURL)
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, piHunt: 'no' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaimMock.mockImplementationOnce(() => { return { reviewTestResults: 'negative' } })
        .mockImplementationOnce(() => { return { reviewTestResults: 'negative' } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/biosecurity')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
  })
})
