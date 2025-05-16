import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setAuthConfig, setMultiHerds } from '../../../../mocks/config.js'

const { urlPrefix } = config
const { endemicsSelectTheHerd: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

describe('select-the-herd tests', () => {
  const url = `${urlPrefix}/${pageUnderTest}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let server
  let crumb

  const fakeHerdId = '909bb722-3de1-443e-8304-0bba8f922050'

  beforeAll(async () => {
    setEndemicsClaim.mockImplementation(() => { })
    setAuthConfig()
    setMultiHerds(true)
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
    test('returns 200 with flock labels when species sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: []
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the same flock you have previously claimed for? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/date-of-visit')
      expectPhaseBanner.ok($)
    })

    test('returns 200 with herd labels when species beef, also selects correct herd', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [],
        herdId: fakeHerdId,
        tempHerdId: fakeHerdId,
        herds: []
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the same herd you have previously claimed for? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/date-of-visit')
      expect($('.govuk-radios__input[value="' + fakeHerdId + '"]').is(':checked')).toBeTruthy()
      expectPhaseBanner.ok($)
    })
  })

  describe('POST', () => {
    beforeAll(async () => {
      crumb = await getCrumbs(server)
    })

    test('navigates to the correct page when payload valid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } }
        ]
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdId: fakeHerdId }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('display errors when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdId"]').text()).toContain('Select the flock you are claiming for')
    })
  })
})
