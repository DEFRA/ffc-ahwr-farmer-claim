import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setMultiSpecies, setMultiHerds } from '../../../../mocks/config.js'
import { getReviewWithinLast10Months } from '../../../../../app/api-requests/claim-service-api.js'
import { canMakeClaim } from '../../../../../app/lib/can-make-claim.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/lib/can-make-claim')
jest.mock('../../../../../app/event/raise-invalid-data-event')

describe('select-the-herd tests', () => {
  const url = '/claim/endemics/same-herd'
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let server
  let crumb

  beforeAll(async () => {
    setEndemicsClaim.mockImplementation(() => { })
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
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/check-herd-details')
      expectPhaseBanner.ok($)
    })

    test('returns 200 with herd labels when species beef, also selects correct herd', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [],
        herds: [],
        herdSame: 'yes'
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the same herd you have previously claimed for? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/check-herd-details')
      expect($('.govuk-radios__input[value="yes"]').is(':checked')).toBeTruthy()
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

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdSame: 'yes' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-testing')
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
      expect($('a[href="#herdSame"]').text()).toContain('Select yes if it is the same flock')
    })

    test('error when claiming for follow-up and not within 10months of review', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'E',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2024-01-01T00:00:00.000Z' } }
        ]
      })
      getReviewWithinLast10Months.mockReturnValue({ createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2024-01-01T00:00:00.000Z' } })
      canMakeClaim.mockReturnValue('There must be no more than 10 months between your reviews and follow-ups.')

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdSame: 'yes' }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h1.govuk-heading-l').text().trim()).toBe('You cannot continue with your claim')
      const link = $('h1.govuk-heading-l').nextAll('p.govuk-body').first().find('a.govuk-link')
      expect(link.attr('href')).toBe('https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')
      expect(link.text().trim()).toBe('There must be no more than 10 months between your reviews and follow-ups.')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })

    test('error when claiming for follow-up and choose not to link to previous review', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'E',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2024-01-01T00:00:00.000Z' } }
        ]
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdSame: 'no' }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h1.govuk-heading-l').text().trim()).toBe('You cannot continue with your claim')
      const link = $('h1.govuk-heading-l').nextAll('p.govuk-body').first().find('a.govuk-link')
      expect(link.attr('href')).toBe('https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')
      expect(link.text().trim()).toBe('You must have an approved review claim for this species, before you can claim for a follow-up.')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
  })
})
