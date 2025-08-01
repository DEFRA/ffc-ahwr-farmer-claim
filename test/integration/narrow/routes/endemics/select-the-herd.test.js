import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import expectPhaseBanner from 'assert'
import { config } from '../../../../../app/config/index.js'
import links from '../../../../../app/config/routes.js'
import {
  getEndemicsClaim,
  removeSessionDataForSelectHerdChange,
  setEndemicsClaim
} from '../../../../../app/session/index.js'
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

  const fakeTemporaryHerdId = '909bb722-3de1-443e-8304-0bba8f922050'
  const fakeHerdId = '919bb722-3de1-443e-8304-0bba8f922055'

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
    test('returns 200 with flock labels when species sheep', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
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
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [],
        herdSelected: 'NEW_HERD',
        herdId: fakeTemporaryHerdId,
        herds: [{ herdId: '100bb722-3de1-443e-8304-0bba8f922050', herdName: 'Barn animals' }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the same herd you have previously claimed for? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/date-of-visit')
      expect($('.govuk-radios__input[value="NEW_HERD"]').is(':checked')).toBeTruthy()
      expectPhaseBanner.ok($)
    })

    test('returns 200 and displays multiple herds as radios when multiple herds exist', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [],
        herdSelected: 'NEW_HERD',
        herdId: fakeTemporaryHerdId,
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

      expect(radios.eq(3).find('input').val()).toBe('NEW_HERD')
      expect(radios.eq(3).text()).toContain('I am claiming for a different herd')
      expect(radios.eq(3).find('input').is(':checked')).toBeTruthy()
    })

    test('returns 200 and displays type value from previousClaims when only one herd and no pre-MH claims', async () => {
      getEndemicsClaim.mockReturnValue({
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'E',
        typeOfLivestock: 'sheep',
        previousClaims: [{ createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z', herdId: '100bb722-3de1-443e-8304-0bba8f922050' } }],
        herds: [{ herdId: '100bb722-3de1-443e-8304-0bba8f922050', herdName: 'Barn animals' }]
      })

      const res = await server.inject({ method: 'GET', url, auth })

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('title').text().trim()).toContain('Is this the same flock you have previously claimed for? - Get funding to improve animal health and welfare - GOV.UKGOV.UK')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/date-of-visit')
      expectPhaseBanner.ok($)

      const valueInTypeColumn = $('.govuk-summary-list__row').filter((_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Type').first().find('.govuk-summary-list__value').text().trim()
      expect(valueInTypeColumn).toBe('Review')
    })

    test('displays unnamed herd with most recent claim date without herd when multiple previous claims with and without herd exists', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef', dateOfVisit: '2025-04-05T00:00:00.000Z', herdId: '1' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef', dateOfVisit: '2025-04-01T00:00:00.000Z' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef', dateOfVisit: '2024-04-01T00:00:00.000Z' } }
        ],
        herdSelected: 'NEW_HERD',
        herdId: fakeTemporaryHerdId,
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

      expect(radios.length).toBe(5)

      expect(radios.eq(0).find('input').val()).toBe('100bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(0).text()).toContain('Barn animals')

      expect(radios.eq(1).find('input').val()).toBe('200bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(1).text()).toContain('Hilltop')

      expect(radios.eq(2).find('input').val()).toBe('300bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(2).text()).toContain('Field animals')

      expect(radios.eq(3).find('input').val()).toBe('UNNAMED_HERD')
      expect(radios.eq(3).text().trim()).toEqual('Unnamed herd (Last claim: review visit on the 1 April 2025)')

      expect(radios.eq(4).find('input').val()).toBe('NEW_HERD')
      expect(radios.eq(4).text()).toContain('I am claiming for a different herd')
      expect(radios.eq(4).find('input').is(':checked')).toBeTruthy()
    })

    test('displays unnamed herd with most recent follow-up claim date without herd when multiple previous claims with and without herd exists', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'beef',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef', dateOfVisit: '2025-04-05T00:00:00.000Z', herdId: '1' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef', dateOfVisit: '2025-04-01T00:00:00.000Z' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef', dateOfVisit: '2024-04-01T00:00:00.000Z' } }
        ],
        herdSelected: 'NEW_HERD',
        herdId: fakeTemporaryHerdId,
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

      expect(radios.length).toBe(5)

      expect(radios.eq(0).find('input').val()).toBe('100bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(0).text()).toContain('Barn animals')

      expect(radios.eq(1).find('input').val()).toBe('200bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(1).text()).toContain('Hilltop')

      expect(radios.eq(2).find('input').val()).toBe('300bb722-3de1-443e-8304-0bba8f922050')
      expect(radios.eq(2).text()).toContain('Field animals')

      expect(radios.eq(3).find('input').val()).toBe('UNNAMED_HERD')
      expect(radios.eq(3).text().trim()).toEqual('Unnamed herd (Last claim: review visit on the 1 April 2025)')

      expect(radios.eq(4).find('input').val()).toBe('NEW_HERD')
      expect(radios.eq(4).text()).toContain('I am claiming for a different herd')
      expect(radios.eq(4).find('input').is(':checked')).toBeTruthy()
    })
  })

  describe('POST', () => {
    beforeAll(async () => {
      crumb = await getCrumbs(server)
    })

    test('navigates to enter herd name when herds does not exist', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: [{ herdId: '1' }],
        dateOfVisit: '2025-04-14T00:00:00.000Z',
        organisation: {
          farmerName: 'John Doe'
        }
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdSelected: 'NEW_HERD' }, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSelected', 'NEW_HERD', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeTemporaryHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 1, { shouldEmitEvent: false })
      expect(canMakeClaim).toHaveBeenCalledWith({
        dateOfVisit: '2025-04-14T00:00:00.000Z',
        organisation: {
          farmerName: 'John Doe'
        },
        prevClaims: [],
        typeOfLivestock: 'sheep',
        typeOfReview: 'R'
      })
    })

    test('navigates to enter herd name when multiple herds exists and does not match herd id', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', herdId: '1' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z', herdId: '2' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: [{
          herdId: '1',
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['reasonOne']
        }, {
          herdId: '2'
        }],
        organisation: {
          farmerName: 'John Doe'
        },
        dateOfVisit: '2025-04-14T00:00:00.000Z'
      })

      const payload = { crumb, herdSelected: 'NEW_HERD' }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSelected', 'NEW_HERD', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeTemporaryHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 1, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'isOnlyHerdOnSbi', 'no', { shouldEmitEvent: false })
      expect(canMakeClaim).toHaveBeenCalledWith({
        dateOfVisit: '2025-04-14T00:00:00.000Z',
        organisation: {
          farmerName: 'John Doe'
        },
        prevClaims: [],
        typeOfLivestock: 'sheep',
        typeOfReview: 'R'
      })
    })

    test('navigates to enter herd name when herdId is unnamed herd', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-03-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z', herdId: '1' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: [{
          herdId: '1',
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['reasonOne']
        }, {
          herdId: '2'
        }],
        dateOfVisit: '2025-04-14T00:00:00.000Z',
        organisation: {
          farmerName: 'John Doe'
        }
      })

      const payload = { crumb, herdSelected: 'UNNAMED_HERD' }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/enter-herd-name')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(5)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSelected', 'UNNAMED_HERD', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeTemporaryHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 1, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'isOnlyHerdOnSbi', 'no', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSame', 'yes', { shouldEmitEvent: false })
      expect(canMakeClaim).toHaveBeenCalledWith({
        dateOfVisit: '2025-04-14T00:00:00.000Z',
        organisation: {
          farmerName: 'John Doe'
        },
        prevClaims: [
          {
            createdAt: '2025-03-01T00:00:00.000Z',
            data: {
              typeOfLivestock: 'sheep',
              claimType: 'R'
            }
          }
        ],
        typeOfLivestock: 'sheep',
        typeOfReview: 'R'
      })
    })

    test('navigates to check herd details when herd exists and matches herd id', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: [{
          herdId: fakeHerdId,
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['onlyHerd']
        }]
      })

      const payload = { crumb, herdSelected: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSelected', fakeHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 2, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdName', 'Barn animals', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdCph', '22/333/4444', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdReasons', ['onlyHerd'], { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'isOnlyHerdOnSbi', 'yes', { shouldEmitEvent: false })
    })

    test('navigates to check herd details when multiple herds exists and matches herd id', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', herdId: fakeHerdId } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z', herdId: fakeHerdId } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: [{
          herdId: fakeHerdId,
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['reasonOne']
        }, {
          herdId: '2'
        }],
        organisation: {
          farmerName: 'John Doe'
        },
        dateOfVisit: '2025-04-14T00:00:00.000Z'
      })

      const payload = { crumb, herdSelected: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/check-herd-details')
      expect(setEndemicsClaim).toHaveBeenCalledTimes(7)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSelected', fakeHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdVersion', 2, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdName', 'Barn animals', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdCph', '22/333/4444', { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdReasons', ['reasonOne'], { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'isOnlyHerdOnSbi', 'no', { shouldEmitEvent: false })
      expect(canMakeClaim).toHaveBeenCalledWith({
        dateOfVisit: '2025-04-14T00:00:00.000Z',
        organisation: {
          farmerName: 'John Doe'
        },
        prevClaims: [
          {
            createdAt: '2025-04-01T00:00:00.000Z',
            data: {
              herdId: fakeHerdId,
              typeOfLivestock: 'sheep',
              claimType: 'R'
            }
          },
          {
            createdAt: '2025-04-28T00:00:00.000Z',
            data: {
              herdId: fakeHerdId,
              typeOfLivestock: 'sheep',
              claimType: 'R',
              dateOfVisit: '2025-04-14T00:00:00.000Z'
            }
          }
        ],
        typeOfLivestock: 'sheep',
        typeOfReview: 'R'
      })
    })

    test('display errors when payload invalid', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      expect($('h2.govuk-error-summary__title').text()).toContain('There is a problem')
      expect($('a[href="#herdSelected"]').text()).toContain('Select the flock you are claiming for')
    })

    test('display errors when endemics and selects different herd', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'E',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: []
      })

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdSelected: 'NEW_HERD' }, headers: { cookie: `crumb=${crumb}` } })

      const $ = cheerio.load(res.payload)
      expect(res.statusCode).toBe(400)
      const externalLink = $('a.govuk-link[rel="external"][href*="https://www.gov.uk/guidance/farmers-how-to-apply-for-funding"]').text()
      expect(externalLink).toContain('You must have an approved review claim for the different herd or flock, before you can claim for a follow-up.')
      expect($('a.govuk-link[href*="claim"]').text()).toContain('Claim for a review')
      expect($('.govuk-warning-text__text').text()).toContain('Your claim will be checked by our team.')
    })

    test('display date errors when canMakeClaim returns false', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } },
          { createdAt: '2025-04-01T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep' } },
          { createdAt: '2025-04-28T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'sheep', dateOfVisit: '2025-04-14T00:00:00.000Z' } },
          { createdAt: '2025-04-30T00:00:00.000Z', data: { claimType: 'R', typeOfLivestock: 'beef' } }
        ],
        herds: [],
        dateOfVisit: '2025-05-01'
      })
      canMakeClaim.mockReturnValue('Invalid claim message')

      const res = await server.inject({ method: 'POST', url, auth, payload: { crumb, herdSelected: 'UNNAMED_HERD' }, headers: { cookie: `crumb=${crumb}` } })

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

    test('does call removeSessionDataForSelectHerdChange and sets herdId when herd selection changes', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [],
        herds: [{
          herdId: fakeHerdId,
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['onlyHerd']
        }],
        herdSelected: 'previously-selected-herdId',
        herdId: 'previously-selected-herdId'
      })

      const payload = { crumb, herdSelected: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(removeSessionDataForSelectHerdChange).toHaveBeenCalledTimes(1)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdSelected', fakeHerdId, { shouldEmitEvent: false })
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'herdId', fakeHerdId, { shouldEmitEvent: false })
    })

    test('does NOT call removeSessionDataForSelectHerdChange when herd selection stays the same', async () => {
      getEndemicsClaim.mockReturnValue({
        tempHerdId: fakeTemporaryHerdId,
        reference: 'TEMP-6GSE-PIR8',
        typeOfReview: 'R',
        typeOfLivestock: 'sheep',
        previousClaims: [],
        herds: [{
          herdId: fakeHerdId,
          herdName: 'Barn animals',
          herdVersion: 1,
          cph: '22/333/4444',
          herdReasons: ['onlyHerd']
        }],
        herdSelected: fakeHerdId,
        herdId: fakeHerdId
      })

      const payload = { crumb, herdSelected: fakeHerdId }
      const res = await server.inject({ method: 'POST', url, auth, payload, headers: { cookie: `crumb=${crumb}` } })

      expect(res.statusCode).toBe(302)
      expect(removeSessionDataForSelectHerdChange).toHaveBeenCalledTimes(0)
    })
  })
})
