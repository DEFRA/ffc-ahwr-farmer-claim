import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'

const { urlPrefix } = config
const { endemicsEnterCphNumber: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/event/send-herd-event.js', () => ({
  sendHerdEvent: jest.fn()
}))

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
    expect($('title').text().trim()).toContain('Enter the CPH number for this herd - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
    expect($('.govuk-heading-l').text().trim()).toBe('Enter the County Parish Holding (CPH) number for this herd')
    expect($('.govuk-label--m').text().trim()).toBe('CPH number for this herd')
  }

  const expectFlockText = ($) => {
    expect($('title').text().trim()).toContain('Enter the CPH number for this flock - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
    expect($('.govuk-heading-l').text().trim()).toBe('Enter the County Parish Holding (CPH) number for this flock')
    expect($('.govuk-label--m').text().trim()).toBe('CPH number for this flock')
  }

  describe('GET', () => {
    test('returns 200 with herd labels when species beef', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-name')
      expectHerdText($)
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
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-name')
      expect($('input#herdCph').val()).toBe('22/333/4444')
      expectHerdText($)
      expectPhaseBanner.ok($)
    })

    test('returns 200 with flock labels when species sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-herd-name')
      expectFlockText($)
      expectPhaseBanner.ok($)
    })

    test('returns 200 with back link to select herd when updating an existing herd', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herdVersion: 2,
        herdCph: '22/333/4444'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/select-the-herd')
      expectFlockText($)
      expectPhaseBanner.ok($)
    })
  })

  describe('POST', () => {
    beforeAll(async () => {
      crumb = await getCrumbs(server)
    })

    test('navigates to herd others when no previous herds and payload is valid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdCph: '22/333/4444' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/herd-others-on-sbi')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('navigates to check herd details when there are previous herds and othersOnSbi is yes', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herds: [{ id: 'herd one' }],
        isOnlyHerdOnSbi: 'yes'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdCph: '22/333/4444' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('navigates to enter herd details when there are previous herds and othersOnSbi is no', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herds: [{ id: 'herd one' }],
        isOnlyHerdOnSbi: 'no'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdCph: '22/333/4444' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('display errors when cph number is missing', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdCph"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
      expect($('p[id="herdCph-error"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
      expectHerdText($)
    })

    test('display errors when cph number does not contain digits', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdCph: 'aa/222/3333' }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdCph"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
      expect($('p[id="herdCph-error"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
      expectHerdText($)
    })

    test('display errors with flock label when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdCph"]').text()).toContain('Enter the CPH for this flock, format should be nn/nnn/nnnn')
      expect($('p[id="herdCph-error"]').text()).toContain('Enter the CPH for this flock, format should be nn/nnn/nnnn')
      expectFlockText($)
    })

    test('display errors with back link to select herd when payload invalid and updating an existing herd', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdVersion: 2
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdCph"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
      expect($('p[id="herdCph-error"]').text()).toContain('Enter the CPH for this herd, format should be nn/nnn/nnnn')
      expectHerdText($)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/select-the-herd')
    })
  })
})
