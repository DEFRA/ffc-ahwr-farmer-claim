import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setEndemicsAndOptionalPIHunt, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'

const { urlPrefix } = config
const { endemicsCheckHerdDetails: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

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
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: false })
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
    // TODO MultiHerds duplicate test to check flock when sheep
    test('returns 200 with herd labels when species beef, also change links are correct', async () => {
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

    test('navigates to the correct page when payload valid', async () => {
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

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
    })
  })
})
