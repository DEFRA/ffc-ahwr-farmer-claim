import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setAuthConfig, setMultiHerds } from '../../../../mocks/config.js'
import { sendHerdEvent } from '../../../../../app/event/send-herd-event.js'

const { urlPrefix } = config
const { endemicsHerdOthersOnSbi: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/event/send-herd-event.js', () => ({
  sendHerdEvent: jest.fn()
}))

describe('herd-others-on-sbi tests', () => {
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
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the only beef cattle herd associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
      expect($('.govuk-hint').text()).toContain('Tell us about this herd')
      const legend = $('.govuk-fieldset__legend--l')
      expect(legend.text().trim()).toBe(
        'Is this the only beef cattle herd associated with this Single Business Identifier (SBI)?'
      )
      expectPhaseBanner.ok($)
    })

    test('returns 200 with herd labels when species beef, also selects no', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        isOnlyHerdOnSbi: 'no'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the only beef cattle herd associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
      expect($('.govuk-radios__input[value="no"]').is(':checked')).toBeTruthy()
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
      expect($('title').text().trim()).toContain('Is this the only flock of sheep associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
      expect($('.govuk-hint').text()).toContain('Tell us about this flock')
      const legend = $('.govuk-fieldset__legend--l')
      expect(legend.text().trim()).toBe(
        'Is this the only flock of sheep associated with this Single Business Identifier (SBI)?'
      )
      expectPhaseBanner.ok($)
    })

    test('returns 200 with flock labels when species dairy', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'dairy'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the only dairy cattle herd associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
      expect($('.govuk-hint').text()).toContain('Tell us about this herd')
      const legend = $('.govuk-fieldset__legend--l')
      expect(legend.text().trim()).toBe(
        'Is this the only dairy cattle herd associated with this Single Business Identifier (SBI)?'
      )
      expectPhaseBanner.ok($)
    })

    test('returns 200 with flock labels when species pigs', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'pigs'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the only pigs herd associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/enter-cph-number')
      expect($('.govuk-hint').text()).toContain('Tell us about this herd')
      const legend = $('.govuk-fieldset__legend--l')
      expect(legend.text().trim()).toBe(
        'Is this the only pigs herd associated with this Single Business Identifier (SBI)?'
      )
      expectPhaseBanner.ok($)
    })
  })

  describe('POST', () => {
    beforeAll(async () => {
      crumb = await getCrumbs(server)
    })

    test('navigates to enter herd details when no existing herd and they select yes', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, isOnlyHerdOnSbi: 'yes' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(2)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'isOnlyHerdOnSbi', 'yes', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdReasons', ['onlyHerd'], { shouldEmitEvent: false })
      expect(sendHerdEvent).toHaveBeenCalled()
    })

    test('navigates to check herd details when no existing herd and they select no', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, isOnlyHerdOnSbi: 'no' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(1)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'isOnlyHerdOnSbi', 'no', { shouldEmitEvent: false })
      expect(sendHerdEvent).not.toHaveBeenCalled()
    })

    test('display errors with flock labels when no answer selected and typeOfLivestock is sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#isOnlyHerdOnSbi"]').text()).toContain('Select yes if this is the only flock of sheep associated with this SBI')
      expect($('title').text().trim()).toContain('Is this the only flock of sheep associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-hint').text()).toContain('Tell us about this flock')
    })

    test('display errors with herd labels when no answer selected and typeOfLivestock is not sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#isOnlyHerdOnSbi"]').text()).toContain('Select yes if this is the only beef cattle herd associated with this SBI')
      expect($('title').text().trim()).toContain('Is this the only beef cattle herd associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-hint').text()).toContain('Tell us about this herd')
    })
  })
})
