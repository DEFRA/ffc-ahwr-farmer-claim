import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setAuthConfig, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'
import { getNextPage } from '../../../../../app/routes/endemics/date-of-visit-mh.js'

const { urlPrefix } = config
const { endemicsCheckHerdDetails: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/routes/endemics/date-of-visit-mh.js')

const assertLinkExistsFor = ($, spanText) => {
  const link = $('a.govuk-link').filter((_, el) => {
    return $(el).text().trim() === 'Change ' + spanText
  })
  return link.length > 0
}

describe('check-herd-details tests', () => {
  const url = `${urlPrefix}/${pageUnderTest}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let server
  let crumb

  beforeAll(async () => {
    setEndemicsClaim.mockImplementation(() => { })
    setAuthConfig()
    setMultiSpecies(true)
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
    test('returns 200 with herd labels when species beef, also change links are correct', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: '909bb722-3de1-443e-8304-0bba8fx§922050',
        herdVersion: 1,
        herdName: 'Commercial Herd',
        herdCph: '22/333/4444',
        herdOthersOnSbi: 'no',
        herdReasons: ['differentBreed']
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Check herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-details')
      expect(assertLinkExistsFor($, 'CPH number')).toBeTruthy()
      expect(assertLinkExistsFor($, 'herd details')).toBeTruthy()
      expect($('h1').text().trim()).toBe('Check herd details')
      expect(assertLinkExistsFor($, 'Only herd associated with SBI')).toBeTruthy()
      expectPhaseBanner.ok($)
    })

    test('returns 200 and displays flock labels when species is sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herdId: '909bb722-3de1-443e-8304-0bba8f922050',
        herdVersion: 1,
        herdName: 'Commercial Herd',
        herdCph: '22/333/4444',
        herdOthersOnSbi: 'no',
        herdReasons: ['differentBreed']
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Check flock details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-details')
      expect(assertLinkExistsFor($, 'CPH number')).toBeTruthy()
      expect(assertLinkExistsFor($, 'flock details')).toBeTruthy()
      expect(assertLinkExistsFor($, 'Only flock associated with SBI')).toBeTruthy()
      expect($('h1').text().trim()).toBe('Check flock details')
      expectPhaseBanner.ok($)
    })

    test('returns 200 and backLink to herdOthersOnSbi when herdOthersOnSbi is yes', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: '909bb722-3de1-443e-8304-0bba8f922050',
        herdVersion: 1,
        herdName: 'Commercial Herd',
        herdCph: '22/333/4444',
        herdOthersOnSbi: 'yes',
        herdReasons: ['differentBreed']
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Check herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
      expect(assertLinkExistsFor($, 'CPH number')).toBeTruthy()
      expect(assertLinkExistsFor($, 'herd details')).toBeTruthy()
      expectPhaseBanner.ok($)
    })

    test('returns 200 and backLink to enterHerdDetails when herdOthersOnSbi is no', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: '909bb722-3de1-443e-8304-0bba8f922050',
        herdVersion: 1,
        herdName: 'Commercial Herd',
        herdCph: '22/333/4444',
        herdOthersOnSbi: 'no',
        herdReasons: ['differentBreed']
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Check herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-details')
      expect(assertLinkExistsFor($, 'CPH number')).toBeTruthy()
      expect(assertLinkExistsFor($, 'herd details')).toBeTruthy()
      expectPhaseBanner.ok($)
    })
  })

  describe('POST', () => {
    beforeAll(async () => {
      crumb = await getCrumbs(server)
    })

    test('navigates to the correct page when payload valid and previous claims without herd assigned', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: '909bb722-3de1-443e-8304-0bba8f922050',
        herdVersion: 1,
        herdName: 'Commercial Herd',
        herdCph: '22/333/4444',
        herdOthersOnSbi: 'no',
        herdReasons: ['differentBreed'],
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } }
        ]
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/same-herd')
    })

    test('navigates to the correct page when payload valid and previous claims have herd assigned', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: '909bb722-3de1-443e-8304-0bba8f922050',
        herdVersion: 1,
        herdName: 'Commercial Herd',
        herdCph: '22/333/4444',
        herdOthersOnSbi: 'no',
        herdReasons: ['differentBreed'],
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef', herdId: 'abaf864a-bda6-49b0-a17f-4a170fedd9c1' } }
        ]
      })
      getNextPage.mockReturnValue('/claim/endemics/date-of-testing')

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
    })
  })
})
