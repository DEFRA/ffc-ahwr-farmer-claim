import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { config } from '../../../../../app/config/index.js'
import { setAuthConfig, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { isCattleEndemicsClaimForOldWorldReview } from '../../../../../app/api-requests/claim-service-api.js'
import links from '../../../../../app/config/routes.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

describe('Which type of review test', () => {
  const url = `${config.urlPrefix}/${links.endemicsWhichTypeOfReview}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb
  const previousClaims = [{ data: { typeOfLivestock: 'sheep' } }]
  const latestVetVisitApplication = { data: { whichReview: 'beef' } }
  let server

  beforeAll(async () => {
    setEndemicsClaim.mockImplementation(() => { })
    setMultiSpecies(false)
    setMultiHerds(false)
    setAuthConfig()
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    beforeEach(() => {
      // this call is made by the pre-handler for logging context and reference
      getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'R' })
        .mockReturnValueOnce({ reference: 'TEMP-6GSE-PIR8' })
    })

    test('sets typeOfLivestock from old world applications', async () => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'R' })
        .mockReturnValueOnce({ typeOfLivestock: 'beef', previousClaims: [], latestVetVisitApplication })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Which type of review - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
      expect(setEndemicsClaim.mock.calls).toEqual([
        [expect.any(Object), 'typeOfLivestock', 'beef']
      ])
    })

    test('sets typeOfLivestock from new world claims if present', async () => {
      const endemicsValue = { typeOfReview: 'review', latestVetVisitApplication, previousClaims }
      getEndemicsClaim.mockReturnValueOnce(endemicsValue)
        .mockReturnValueOnce(endemicsValue)
      const options = {
        method: 'GET',
        url,
        auth
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Which type of review - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)

      expect(setEndemicsClaim.mock.calls).toEqual([
        [expect.any(Object), 'typeOfLivestock', 'sheep']
      ])
    })
  })

  describe('POST', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      crumb = await getCrumbs(server)
      // this call is made by the pre-handler for logging context
      getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'R' })
    })

    test('Returns 400 and shows error message when payload is invalid', async () => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'beef' })
        .mockReturnValueOnce({ typeOfLivestock: 'beef' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: undefined
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select what you are claiming for')
    })

    test('Returns 302 and redirect to vet visit review test result', async () => {
      const endemicsMockValue = { typeOfReview: 'endemics', typeOfLivestock: 'beef', latestVetVisitApplication, previousClaims }
      getEndemicsClaim.mockReturnValueOnce(endemicsMockValue)
        .mockReturnValueOnce(endemicsMockValue)
      isCattleEndemicsClaimForOldWorldReview.mockReturnValueOnce(true)

      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: 'endemics'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/vet-visits-review-test-results')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test.each([
      { typeOfReview: 'review', nextPageUrl: '/claim/endemics/which-species', expectSetEndemicsCalls: 0 },
      { typeOfReview: 'endemics', nextPageUrl: '/claim/endemics/date-of-visit', expectSetEndemicsCalls: 1 }
    ])('Returns 302 and redirects to next page if payload is valid', async ({ typeOfReview, nextPageUrl, expectSetEndemicsCalls }) => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'beef' })
        .mockReturnValueOnce({ typeOfLivestock: 'beef' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(nextPageUrl)
      expect(setEndemicsClaim).toBeCalledTimes(expectSetEndemicsCalls)
    })

    test('Returns 302 and redirects to next page for dairy follow-up', async () => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'dairy' })
        .mockReturnValueOnce({ typeOfLivestock: 'dairy' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: 'endemics'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-visit')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })
  })
})
