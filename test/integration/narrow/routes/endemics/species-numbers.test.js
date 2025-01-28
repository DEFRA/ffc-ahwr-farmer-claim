const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const { claimType } = require('../../../../../app/constants/claim')
const { getSpeciesEligibleNumberForDisplay } = require('../../../../../app/lib/display-helpers')
const { getReviewType } = require('../../../../../app/lib/get-review-type')
const raiseInvalidDataEvent = require('../../../../../app/event/raise-invalid-data-event')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const { setEndemicsAndOptionalPIHunt } = require('../../../../mocks/config')
const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/species-numbers'

describe('Species numbers test when Optional PI Hunt is OFF', () => {
  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaimMock.mockImplementation(() => { })
    getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: false })
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', reviewTestResults: 'negative' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', reviewTestResults: 'positive' }
    ])('returns 200', async ({ typeOfLivestock, typeOfReview, reviewTestResults }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview, reviewTestResults, reference: '12345' } })
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual(`Did you have 11 or more ${typeOfLivestock} cattle  on the date of the ${typeOfReview === claimType.review ? 'review' : 'follow-up'}?`)
      expect($('title').text().trim()).toContain('Number - Get funding to improve animal health and welfare')
      expect($('.govuk-hint').text().trim()).toEqual('You can find this on the summary the vet gave you.')
      expect($('.govuk-radios__item').length).toEqual(2)
      expectPhaseBanner.ok($)
    })

    test('returns 404 when there is no claim', async () => {
      getEndemicsClaimMock.mockReturnValueOnce({})
      getEndemicsClaimMock.mockReturnValueOnce({ reference: '12345' })
      getEndemicsClaimMock.mockReturnValue(undefined)
      const options = {
        auth,
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('404 - Not Found')
      expect($('#_404 div p').text()).toEqual('Not Found')
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

    test.each([
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'dairy', nextPageUrl: '/claim/endemics/vet-name' },
      { typeOfLivestock: 'sheep', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'pigs', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/vet-name', typeOfReview: 'E', reviewTestResults: 'negative' }
    ])('redirects to check answers page when payload is valid for $typeOfLivestock', async ({ nextPageUrl, typeOfLivestock, typeOfReview, reviewTestResults }) => {
      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview, reviewTestResults } })
        .mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview, reviewTestResults } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: 'yes' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining(nextPageUrl))
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, speciesNumbers: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaimMock.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/number-of-species-tested')
    })
    test('Continue to ineligible page if user select no', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, speciesNumbers: 'no' },
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
      const { isReview } = getReviewType('E')
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch(`Did you have ${getSpeciesEligibleNumberForDisplay({ typeOfLivestock: 'beef' }, true)} on the date of the ${isReview ? 'review' : 'follow-up'}?`)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(`Select if you had ${getSpeciesEligibleNumberForDisplay({ typeOfLivestock: 'beef' }, true)} on the date of the ${isReview ? 'review' : 'follow-up'}.`)
    })
    test('redirect the user to 404 page in fail action and no claim object', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaimMock.mockReturnValue(undefined)

      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('404 - Not Found')
    })
  })
})

describe('Species numbers test when Optional PI Hunt is ON', () => {
  let server

  beforeAll(async () => {
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    jest.resetAllMocks()
    await server.stop()
  })

  describe(`GET ${url} route`, () => {
    test.each([
      { typeOfLivestock: 'beef' },
      { typeOfLivestock: 'dairy' }
    ])('returns 200', async ({ typeOfLivestock }) => {
      getEndemicsClaimMock.mockImplementation(() => { return { typeOfLivestock, typeOfReview: 'E', reference: '12345' } })
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-back-link').attr('href')).toContain('endemics/date-of-visit')
      expectPhaseBanner.ok($)
    })
  })
})
