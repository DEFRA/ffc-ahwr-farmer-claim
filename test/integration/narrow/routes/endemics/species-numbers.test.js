import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setOptionalPIHunt } from '../../../../mocks/config.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { getReviewType } from '../../../../../app/lib/get-review-type.js'
import { claimConstants } from '../../../../../app/constants/claim.js'
import { getSpeciesEligibleNumberForDisplay } from '../../../../../app/lib/display-helpers.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../../../../app/lib/context-helper.js'
import { config } from '../../../../../app/config/index.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')
jest.mock('../../../../../app/lib/context-helper.js')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/species-numbers'

beforeEach(async () => {
  config.multiHerds.enabled = false
})

describe('Species numbers test when Optional PI Hunt is OFF', () => {
  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => { })
    setEndemicsClaim.mockImplementation(() => { })
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef' } })
    setOptionalPIHunt({ optionalPIHuntEnabled: false })
    server = await createServer()
    await server.initialize()
    isPIHuntEnabledAndVisitDateAfterGoLive.mockImplementation(() => { return false })
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
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview, reviewTestResults, reference: 'TEMP-6GSE-PIR8' } })
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual(`Did you have 11 or more ${typeOfLivestock} cattle  on the date of the ${typeOfReview === claimConstants.claimType.review ? 'review' : 'follow-up'}?`)
      expect($('title').text().trim()).toContain('Number - Get funding to improve animal health and welfare')
      expect($('.govuk-hint').text().trim()).toEqual('You can find this on the summary the vet gave you.')
      expect($('.govuk-radios__item').length).toEqual(2)
      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', typeOfReview: 'E', reviewTestResults: 'negative' },
      { typeOfLivestock: 'dairy', typeOfReview: 'R', reviewTestResults: 'positive' }
    ])('returns 200 when multi herds is enabled', async ({ typeOfLivestock, typeOfReview, reviewTestResults }) => {
      config.multiHerds.enabled = true
      getEndemicsClaim.mockImplementation(() => ({ typeOfLivestock, typeOfReview, reviewTestResults, reference: 'TEMP-6GSE-PIR8' }))
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual(`Did you have 11 or more ${typeOfLivestock} cattle in this herd on the date of the ${typeOfReview === claimConstants.claimType.review ? 'review' : 'follow-up'}?`)
      expect($('title').text().trim()).toContain('Number - Get funding to improve animal health and welfare')
      expect($('.govuk-hint').text().trim()).toEqual('You can find this on the summary the vet gave you.')
      expect($('.govuk-radios__item').length).toEqual(2)
      expectPhaseBanner.ok($)
    })

    test('returns 200 when multi herds is enabled and species is sheep', async () => {
      config.multiHerds.enabled = true
      getEndemicsClaim.mockImplementation(() => ({ typeOfLivestock: 'sheep', typeOfReview: 'R', reviewTestResults: 'negative', reference: 'TEMP-6GSE-PIR8' }))
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-fieldset__heading').text().trim()).toEqual('Did you have 21 or more sheep in this flock on the date of the review?')
      expect($('title').text().trim()).toContain('Number - Get funding to improve animal health and welfare')
      expect($('.govuk-hint').text().trim()).toEqual('You can find this on the summary the vet gave you.')
      expect($('.govuk-radios__item').length).toEqual(2)
      expectPhaseBanner.ok($)
    })

    test('returns 404 when there is no claim', async () => {
      getEndemicsClaim.mockReturnValueOnce({})
      getEndemicsClaim.mockReturnValueOnce({ reference: 'TEMP-6GSE-PIR8' })
      getEndemicsClaim.mockReturnValue(undefined)
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
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
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
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
    })

    test.each([
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'dairy', nextPageUrl: '/claim/endemics/vet-name' },
      { typeOfLivestock: 'sheep', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'pigs', nextPageUrl: '/claim/endemics/number-of-species-tested' },
      { typeOfLivestock: 'beef', nextPageUrl: '/claim/endemics/vet-name', typeOfReview: 'E', reviewTestResults: 'negative' }
    ])('redirects to check answers page when payload is valid for $typeOfLivestock', async ({ nextPageUrl, typeOfLivestock, typeOfReview, reviewTestResults }) => {
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock, typeOfReview, reviewTestResults } })
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
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('Continue to eligible page if user select yes', async () => {
      const options = {
        method: 'POST',
        payload: { crumb, speciesNumbers: 'yes' },
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
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
      getEndemicsClaim.mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })
        .mockImplementationOnce(() => { return { typeOfLivestock: 'beef' } })

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
    test('shows error when payload is invalid', async () => {
      const { isReview } = getReviewType('E')
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'beef', reviewTestResults: 'positive' } })
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

    test('shows error when payload is invalid and multi herds is enabled', async () => {
      config.multiHerds.enabled = true
      const { isReview } = getReviewType('E')
      getEndemicsClaim.mockImplementation(() => ({ typeOfLivestock: 'beef', reviewTestResults: 'positive' }))
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
      expect($('h1').text().trim()).toMatch(`Did you have ${getSpeciesEligibleNumberForDisplay({ typeOfLivestock: 'beef' }, true)}in this herd on the date of the ${isReview ? 'review' : 'follow-up'}?`)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch(`Select yes if you had ${getSpeciesEligibleNumberForDisplay({ typeOfLivestock: 'beef' }, true)}in this herd on the date of the ${isReview ? 'review' : 'follow-up'}.`)
    })

    test('redirect the user to 404 page in fail action and no claim object', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, speciesNumbers: undefined },
        headers: { cookie: `crumb=${crumb}` }
      }
      getEndemicsClaim.mockReturnValue(undefined)

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
    setOptionalPIHunt({ optionalPIHuntEnabled: true })
    server = await createServer()
    await server.initialize()
    isPIHuntEnabledAndVisitDateAfterGoLive.mockImplementation(() => { return true })
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
      getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock, typeOfReview: 'E', reference: 'TEMP-6GSE-PIR8' } })
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
