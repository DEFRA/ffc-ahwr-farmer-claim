import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { setAuthConfig, setMultiHerds } from '../../../../mocks/config.js'
import { canMakeClaim } from '../../../../../app/lib/can-make-claim.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'

const { urlPrefix } = config
const { endemicsSelectTheHerd: pageUnderTest } = links

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')
jest.mock('../../../../../app/lib/can-make-claim.js')
jest.mock('../../../../../app/event/raise-invalid-data-event.js')

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

    test('returns 200 and displays multiple herds as radios when multiple herds exist', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [],
        herdId: fakeHerdId,
        tempHerdId: fakeHerdId,
        herds: [
          {
            herdId: '100bb722-3de1-443e-8304-0bba8f922050',
            herdName: 'Barn animals'
          },
          {
            herdId: '200bb722-3de1-443e-8304-0bba8f922050',
            herdName: 'Hilltop'
          },
          {
            herdId: '300bb722-3de1-443e-8304-0bba8f922050',
            herdName: 'Field animals'
          }
        ]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Select the herd you are claiming for - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expectPhaseBanner.ok($)

      const radios = $('.govuk-radios__item')

      expect(radios.length).toBe(4)

      expect(radios.eq(0).find('input').val()).toBe('100bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(0).text()).toContain('Barn animals')

      expect(radios.eq(1).find('input').val()).toBe('200bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(1).text()).toContain('Hilltop')

      expect(radios.eq(2).find('input').val()).toBe('300bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(2).text()).toContain('Field animals')

      expect(radios.eq(3).find('input').val()).toBe(fakeHerdId)
      expect(radios.eq(3).text()).toContain('I am claiming for a different herd')
      expect(radios.eq(3).find('input').is(':checked')).toBeTruthy()
    })
  })

  describe('POST', () => {
    beforeAll(async () => {
      crumb = await getCrumbs(server)
    })

    test('navigates to enter herd name when herds does not exist', async () => {
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

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdId: fakeHerdId }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 1)
    })

    test('navigates to enter herd name when multiple herds exists and does not match herd id', async () => {
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
        herds: [{
          herdId: '1',
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['reasonOne']
        }, {
          herdId: '2'
        }]
      })

      const payload = { crumb, herdId: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 1)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdOthersOnSbi', 'no')
    })

    test('navigates to check herd details when herd exists and matches herd id', async () => {
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
        herds: [{
          herdId: fakeHerdId,
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['onlyHerd']
        }]
      })

      const payload = { crumb, herdId: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 2)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdName', 'Barn animals')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdCph', '22/333/4444')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdReasons', ['onlyHerd'])
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdOthersOnSbi', 'yes')
    })

    test('navigates to check herd details when multiple herds exists and matches herd id', async () => {
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
        herds: [{
          herdId: fakeHerdId,
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['reasonOne']
        }, {
          herdId: '2'
        }]
      })

      const payload = { crumb, herdId: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 2)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdName', 'Barn animals')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdCph', '22/333/4444')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdReasons', ['reasonOne'])
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdOthersOnSbi', 'no')
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

    test('display erorrs when endemics and previous herd does not exist', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'E',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { typeOfReview: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdId: fakeHerdId }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      const externalLink = $('a.govuk-link[rel="external"][href*="https://www.gov.uk/guidance/farmers-how-to-apply-for-funding"]').text()
      expect(externalLink).toContain('You must have an approved review claim for the different herd or flock, before you can claim for a follow-up.')
      expect($('a.govuk-link[href*="claim"]').text()).toContain('Claim for a review')
      expect($('.govuk-warning-text__text').text()).toContain('Your claim will be checked by our team.')
    })

    test('display date errors when canMakeClaim returns false', async () => {
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
        herds: [],
        dateOfVisit: '2025-05-01'
      })
      canMakeClaim.mockReturnValue('Invalid claim message')

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdId: fakeHerdId }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)

      expect(raiseInvalidDataEvent).toBeCalledWith(expect.any(Object), 'dateOfVisit', 'Value 2025-05-01 is invalid. Error: Invalid claim message')
      expect($('h1.govuk-heading-l').text().trim()).toBe('You cannot continue with your claim')
      const link = $('h1.govuk-heading-l').nextAll('p.govuk-body').first().find('a.govuk-link')
      expect(link.attr('href')).toBe('https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')
      expect(link.text().trim()).toBe('Invalid claim message')
      expect($('p.govuk-body').eq(2).text().trim()).toBe(
        'Enter the date the vet last visited your farm for this review.'
      )
      expect($('p.govuk-body').eq(2).find('a.govuk-link').attr('href')).toBe(
        '/claim/endemics/date-of-visit'
      )
      expect($('.govuk-warning-text__text').text()).toContain('Your claim will be checked by our team.')
      expect($('#back').attr('href')).toEqual('/claim/endemics/select-the-herd')
    })
  })
})
