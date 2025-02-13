import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setEndemicsAndOptionalPIHunt, setMultiSpecies } from '../../../../mocks/config.js'
import expectPhaseBanner from 'assert'
import { isCattleEndemicsClaimForOldWorldReview } from '../../../../../app/api-requests/claim-service-api.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'

const { urlPrefix } = config
const { endemicsWhichTypeOfReview } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/event/raise-invalid-data-event')

raiseInvalidDataEvent.mockResolvedValue({})

describe('Which type of review test', () => {
  const url = `${urlPrefix}/${endemicsWhichTypeOfReview}`
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
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: false })
    setMultiSpecies(true)
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
      // this call is made by the pre-handler for logging context
      getEndemicsClaim
        .mockReturnValueOnce({ typeOfReview: 'R' })
        .mockReturnValueOnce({ reference: 'TEMP-6GSE-PIR8' })
    })

    test('returns 200 and renders page', async () => {
      getEndemicsClaim
        .mockReturnValueOnce({ typeOfReview: 'R' })
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
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/which-species')
      expectPhaseBanner.ok($)
    })
  })

  describe('POST', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      crumb = await getCrumbs(server)
      // this call is made by the pre-handler for logging context
      getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'R', latestEndemicsApplication: { reference: 'AHWR-2470-6BA9' } })
    })

    test('Returns 400 and shows error message when payload is invalid', async () => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'beef' })
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

    test('user can select review and be redirected', async () => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'beef', previousClaims: [] })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: 'review'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-visit')
      expect(setEndemicsClaim).toBeCalledTimes(1)
    })

    test('user can select endemics and be redirected IF they have a review for that species', async () => {
      getEndemicsClaim.mockReturnValueOnce({
        typeOfLivestock: 'beef',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'beef',
            dateOfVisit: '2024-12-12'
          }
        }]
      })
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
      expect(setEndemicsClaim).toBeCalledTimes(1)
    })

    test(`user can select endemics and be redirected IF they have dont have a new world review for the species,
    but they have an old world application which contains a review for that species`, async () => {
      getEndemicsClaim.mockReturnValueOnce({
        typeOfLivestock: 'beef',
        previousClaims: [],
        latestVetVisitApplication: {
          reference: 'AHWR-2470-6BA9',
          createdAt: new Date('2023/01/01'),
          data: {
            visitDate: '2023-01-01',
            whichReview: 'beef'
          },
          statusId: 1,
          type: 'VV'
        }
      })
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
      expect(res.headers.location).toEqual('/claim/endemics/vet-visits-review-test-results') // because of isCattleEndemicsClaimForOldWorldReview check
      expect(setEndemicsClaim).toBeCalledTimes(1)
    })

    test('user is redirected to exception page when they select endemics and they dont have a review for that species', async () => {
      getEndemicsClaim.mockReturnValueOnce({
        typeOfLivestock: 'beef',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'dairy',
            dateOfVisit: '2024-12-12'
          }
        }]
      })
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

      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)

      expect(setEndemicsClaim).toBeCalledWith(expect.any(Object), 'typeOfReview', 'E')
      expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'typeOfReview', 'Cannot claim for endemics without a previous review.')
    })

    test('user is redirected to exception page when they select endemics and they dont have a review for that species (they have an old world application but different species)', async () => {
      getEndemicsClaim.mockReturnValueOnce({
        typeOfLivestock: 'beef',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'dairy',
            dateOfVisit: '2024-12-12'
          }
        }],
        latestVetVisitApplication: {
          reference: 'AHWR-2470-6BA9',
          createdAt: new Date('2023/01/01'),
          data: {
            visitDate: '2023-01-01',
            whichReview: 'pigs'
          },
          statusId: 1,
          type: 'VV'
        }
      })
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

      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)

      expect(setEndemicsClaim).toBeCalledWith(expect.any(Object), 'typeOfReview', 'E')
      expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalledWith(expect.any(Object), 'typeOfReview', 'Cannot claim for endemics without a previous review.')
    })

    test('Returns 400 and redirects to error page for dairy follow-up when optionalPiHunt flag is false', async () => {
      getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'dairy', previousClaims: [] })
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

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
      expectPhaseBanner.ok($)
    })

    test('Returns 302 and redirects to next page for dairy follow-up when optionalPiHunt flag is TRUE', async () => {
      setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
      getEndemicsClaim.mockReturnValueOnce({
        typeOfLivestock: 'dairy',
        previousClaims: [{
          reference: 'REBC-C2EA-C718',
          applicationReference: 'AHWR-2470-6BA9',
          statusId: 1,
          type: 'R',
          createdAt: '2024-12-12T10:25:11.318Z',
          data: {
            typeOfLivestock: 'dairy',
            dateOfVisit: '2024-12-12'
          }
        }]
      })
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
