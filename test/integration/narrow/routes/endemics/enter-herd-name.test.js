import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setAuthConfig, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'

const { urlPrefix } = config
const { endemicsEnterHerdName: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

describe('enter-herd-name tests', () => {
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

  const expectHerdText = ($) => {
    expect($('title').text().trim()).toContain('Enter the herd name - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
    expect($('.govuk-label--l').text().trim()).toBe('Enter the herd name')
    expect($('.govuk-hint').text().trim()).toContain('Tell us about this herd')
    expect($('.govuk-details__summary-text').text().trim()).toBe('I don\'t have the herd details from the vet')
    expect($('.govuk-details__text').text().trim()).toContain('Tell us about this herd')
    expectPhaseBanner.ok($)
  }

  const expectFlockText = ($) => {
    expect($('title').text().trim()).toContain('Enter the flock name - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
    expect($('.govuk-label--l').text().trim()).toBe('Enter the flock name')
    expect($('.govuk-hint').text().trim()).toContain('Tell us about this flock')
    expect($('.govuk-details__summary-text').text().trim()).toBe('I don\'t have the flock details from the vet')
    expect($('.govuk-details__text').text().trim()).toContain('Tell us about this flock')
  }

  describe('GET', () => {
    test('returns 200 with herd labels when species beef', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herds: [{
          id: '1'
        }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/select-the-herd')
      expectHerdText($)
      expectPhaseBanner.ok($)
    })

    test('returns 200 with herd labels when species beef, also correct herd name', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdName: 'Commercial Herd',
        herds: [{
          id: '1'
        }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)

      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/select-the-herd')
      expectHerdText($)
      expectPhaseBanner.ok($)
    })

    test('returns 200 with flock labels when species sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herds: [{
          id: '1'
        }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/select-the-herd')
      expectFlockText($)
      expectPhaseBanner.ok($)
    })

    test('returns 200 with back link to date of visit when no previous herds', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herds: []
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/date-of-visit')
      expectFlockText($)
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

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdName: '    Commercial Herd    ' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-cph-number')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('display errors when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herds: [{ id: 1 }]
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdName"]').text()).toContain('Name must be between 2 and 30 characters')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/select-the-herd')
      expectHerdText($)
    })

    test('returns 400 with back link to date of visit when no previous herds and sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdName"]').text()).toContain('Name must be between 2 and 30 characters')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/date-of-visit')
      expectFlockText($)
    })
  })
})
