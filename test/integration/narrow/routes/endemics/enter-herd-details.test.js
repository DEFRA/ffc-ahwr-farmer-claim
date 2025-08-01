import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { ONLY_HERD } from '../../../../../app/constants/constants.js'

const { urlPrefix } = config
const { endemicsEnterHerdDetails: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/event/send-herd-event.js', () => ({
  sendHerdEvent: jest.fn()
}))

describe('enter-herd-details tests', () => {
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
      expect($('title').text().trim()).toContain('Enter the herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
      expect($('.govuk-heading-l').text().trim()).toBe('Enter the herd details')
      expect($('.govuk-hint').text().trim()).toContain('Tell us about this herd')
      const legendText = $('.govuk-fieldset__legend--m').text().trim()
      expect(legendText).toBe('The herd is a separate herd (epidemiologically distinct unit) of this species because:')
      expectPhaseBanner.ok($)

      const actualHintTexts = $('.govuk-checkboxes__item')
        .map((_, el) => $(el).find('.govuk-hint').text().trim())
        .get()
      const expectedHintTexts = [
        'for example, year-round or block calving',
        'for example, different vaccination schedules',
        'for example, breed types kept completely separately',
        'for example, breeding, conservation grazing, cultural or heritage purposes like showing',
        'for example, at a different location, housing or grazing area'
      ]
      expect(actualHintTexts).toEqual(expectedHintTexts)
    })

    test('returns 200 with herd labels when species beef, also selects differentBreed and other', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdReasons: ['differentBreed', 'keptSeparate']
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Enter the herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
      expect($('.govuk-checkboxes__input[value="differentBreed"]').is(':checked')).toBeTruthy()
      expect($('.govuk-checkboxes__input[value="keptSeparate"]').is(':checked')).toBeTruthy()
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
      expect($('title').text().trim()).toContain('Enter the flock details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
      expect($('.govuk-heading-l').text().trim()).toBe('Enter the flock details')
      expect($('.govuk-hint').text().trim()).toContain('Tell us about this flock')
      const legendText = $('.govuk-fieldset__legend--m').text().trim()
      expect(legendText).toBe('The flock is a separate flock (epidemiologically distinct unit) of this species because:')
      expectPhaseBanner.ok($)
    })

    test(`returns 200 with back link to enter cph number when previous herds but herd reason not ${ONLY_HERD}`, async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: 'herd-one',
        herds: [{ herdId: 'herd-one', herdReasons: ['foo'] }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Enter the herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
      expect($('.govuk-heading-l').text().trim()).toBe('Enter the herd details')
      expect($('.govuk-hint').text().trim()).toContain('Tell us about this herd')
      const legendText = $('.govuk-fieldset__legend--m').text().trim()
      expect(legendText).toBe('The herd is a separate herd (epidemiologically distinct unit) of this species because:')
      expectPhaseBanner.ok($)
    })

    test(`returns 200 with back link to herd-others-on-sbi when previous herds and herd reason is ${ONLY_HERD}`, async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdId: 'herd-one',
        herds: [{ herdId: 'herd-one', herdReasons: [ONLY_HERD] }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Enter the herd details - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
      expect($('.govuk-heading-l').text().trim()).toBe('Enter the herd details')
      expect($('.govuk-hint').text().trim()).toContain('Tell us about this herd')
      const legendText = $('.govuk-fieldset__legend--m').text().trim()
      expect(legendText).toBe('The herd is a separate herd (epidemiologically distinct unit) of this species because:')
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
        herdReasons: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdReasons: ['differentBreed'] }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('display errors when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdReasons: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdReasons"]').text()).toContain('Select the reasons for this separate herd')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
    })

    test('display errors and no reasons selected when reasons stored in session but payload is now invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        herdReasons: ['differentBreed']
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdReasons"]').text()).toContain('Select the reasons for this separate herd')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/herd-others-on-sbi')
      expect($('.govuk-checkboxes__input[value="differentBreed"]').is(':checked')).toBeFalsy()
    })

    test('display errors with flock labels when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        herdReasons: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdReasons"]').text()).toContain('Select the reasons for this separate flock')
    })
  })

  test('display errors with back link to enter cph number when previous herds', async () => {
    getEndemicsClaim.mockReturnValue({
      reference: 'TEMP-6GSE-PIR8',
      typeOfReview: 'R',
      typeOfLivestock: 'sheep',
      herdReasons: [],
      herds: [{ id: 'herdOne' }]
    })

    const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

    const $ = cheerio.load(res.payload)
    expect(res.statusCode).toBe(400)
    expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
    expect($('a[href="#herdReasons"]').text()).toContain('Select the reasons for this separate flock')
    expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
  })
})
