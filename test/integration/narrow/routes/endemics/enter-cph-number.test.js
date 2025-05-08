import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setOptionalPIHunt, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'

const { urlPrefix } = config
const { endemicsEnterCphNumber: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

describe('enter-cph-number tests', () => {
  const url = `${urlPrefix}/${pageUnderTest}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let server
  let crumb

  beforeAll(async () => {
    setEndemicsClaim.mockImplementation(() => { })
    setOptionalPIHunt({ optionalPIHuntEnabled: false })
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
    test('returns 200 with herd labels when species beef', async () => {
      // TODO MultiHerds change test to check flock when sheep
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Enter the CPH number for this herd - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-name')
      expectPhaseBanner.ok($)
    })

    test('returns 200 with herd labels when species beef, also correct cph number', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdCph: '22/333/4444'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Enter the CPH number for this herd - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-name')
      expect($('input#herdCph').val()).toBe('22/333/4444')
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
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdCph: '22/333/4444' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('display errors when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdCph"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
    })
  })
})
