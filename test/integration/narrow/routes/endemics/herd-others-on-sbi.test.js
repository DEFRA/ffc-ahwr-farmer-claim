import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setAuthConfig, setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'

const { urlPrefix } = config
const { endemicsHerdOthersOnSbi: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

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
        herdOthersOnSbi: 'no'
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

    test('navigates to the correct page when payload valid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdOthersOnSbi: 'no' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalled()
    })

    test('display errors with flock labels when payload invalid and typeOfLivestock is sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdOthersOnSbi"]').text()).toContain('Select yes if this is the only flock of sheep associated with this SBI')
      expect($('title').text().trim()).toContain('Is this the only flock of sheep associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-hint').text()).toContain('Tell us about this flock')
    })

    test('display errors with herd labels when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef'
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdOthersOnSbi"]').text()).toContain('Select yes if this is the only beef cattle herd associated with this SBI')
      expect($('title').text().trim()).toContain('Is this the only beef cattle herd associated with this Single Business Identifier (SBI)? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-hint').text()).toContain('Tell us about this herd')
    })
  })
})
