import Wreck from '@hapi/wreck'
import appInsights from 'applicationinsights'

import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { claimConstants } from '../../../../../app/constants/claim.js'
import {
  beefEndemicsFollowUpClaim,
  beefReviewClaim,
  dairyEndemicsFollowUpClaim,
  dairyEndemicsFollowUpClaimPiHuntDeclined,
  dairyReviewClaim,
  expectedEndemicsFollowUpBeef,
  expectedEndemicsFollowUpDairy,
  expectedEndemicsFollowUpDairyPiHuntDeclined,
  expectedEndemicsFollowUpPigs,
  expectedEndemicsFollowUpSheep,
  expectedReviewBeef,
  expectedReviewDairy,
  expectedReviewPigs,
  expectedReviewSheep,
  getRowActionTexts,
  getRowContents,
  getRowKeys,
  getRowLinks,
  pigEndemicsFollowUpClaim,
  pigsReviewClaim,
  sheepEndemicsFollowUpClaim,
  sheepReviewClaim,
  sheepTestResults
} from '../../../../utils/check-answers.js'
import { getEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config/index.js'
import { isMultipleHerdsUserJourney } from '../../../../../app/lib/context-helper.js'
import { submitNewClaim } from '../../../../../app/api-requests/claim-service-api.js'

const { livestockTypes } = claimConstants

jest.mock('../../../../../app/session')
jest.mock('@hapi/wreck')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../../app/lib/context-helper.js')
jest.mock('../../../../../app/api-requests/claim-service-api.js')

describe('Check answers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/check-answers'
  const latestVetVisitApplicationWithInLastTenMonths = { createdAt: new Date().toISOString() }
  const latestVetVisitApplicationNotWithInLastTenMonths = { createdAt: '2023-01-01T00:00:01T00' }

  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('when not logged in redirects to /sign-in', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test('shows fields for a review claim in the correct order for each species for beef', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return beefReviewClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedReviewBeef.rowKeys)
      expect(rowContents).toEqual(expectedReviewBeef.rowContents)
      expect(rowActionTexts).toEqual(expectedReviewBeef.rowActionTexts)
      expect(rowLinks).toEqual(expectedReviewBeef.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for a review claim in the correct order for each species for dairy', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return dairyReviewClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)
      const $ = cheerio.load(res.payload)

      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toMatch('Check your answers - Get funding to improve animal health and welfare')
      expect(res.statusCode).toBe(200)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedReviewDairy.rowKeys)
      expect(rowContents).toEqual(expectedReviewDairy.rowContents)
      expect(rowActionTexts).toEqual(expectedReviewDairy.rowActionTexts)
      expect(rowLinks).toEqual(expectedReviewDairy.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for a review claim in the correct order for each species for pigs', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return pigsReviewClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedReviewPigs.rowKeys)
      expect(rowContents).toEqual(expectedReviewPigs.rowContents)
      expect(rowActionTexts).toEqual(expectedReviewPigs.rowActionTexts)
      expect(rowLinks).toEqual(expectedReviewPigs.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for a review claim in the correct order for each species for sheep', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return sheepReviewClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedReviewSheep.rowKeys)
      expect(rowContents).toEqual(expectedReviewSheep.rowContents)
      expect(rowActionTexts).toEqual(expectedReviewSheep.rowActionTexts)
      expect(rowLinks).toEqual(expectedReviewSheep.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for a review claim in the correct order for each species when species is sheep, including flock information', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          ...sheepReviewClaim,
          herdName: 'Flock one'
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }
      isMultipleHerdsUserJourney.mockReturnValueOnce(true)
        .mockReturnValueOnce(true)

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      const multiHerdsRowKeys = [...expectedReviewSheep.rowKeys]
      multiHerdsRowKeys[multiHerdsRowKeys.indexOf('Livestock')] = 'Species'
      multiHerdsRowKeys.splice(multiHerdsRowKeys.indexOf('Species') + 1, 0, 'Flock name')

      const multiHerdsRowContents = [...expectedReviewSheep.rowContents]
      multiHerdsRowContents.splice(multiHerdsRowContents.indexOf('Sheep') + 1, 0, 'Flock one')

      expect(rowKeys).toEqual(multiHerdsRowKeys)
      expect(rowContents).toEqual(multiHerdsRowContents)
      expect(rowActionTexts).toEqual(expectedReviewSheep.rowActionTexts)
      expect(rowLinks).toEqual(expectedReviewSheep.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species for beef', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return beefEndemicsFollowUpClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedEndemicsFollowUpBeef.rowKeys)
      expect(rowContents).toEqual(expectedEndemicsFollowUpBeef.rowContents)
      expect(rowActionTexts).toEqual(expectedEndemicsFollowUpBeef.rowActionTexts)
      expect(rowLinks).toEqual(expectedEndemicsFollowUpBeef.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species for dairy', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return dairyEndemicsFollowUpClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedEndemicsFollowUpDairy.rowKeys)
      expect(rowContents).toEqual(expectedEndemicsFollowUpDairy.rowContents)
      expect(rowActionTexts).toEqual(expectedEndemicsFollowUpDairy.rowActionTexts)
      expect(rowLinks).toEqual(expectedEndemicsFollowUpDairy.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species for dairy with no date of testing', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return dairyEndemicsFollowUpClaimPiHuntDeclined
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedEndemicsFollowUpDairyPiHuntDeclined.rowKeys)
      expect(rowContents).toEqual(expectedEndemicsFollowUpDairyPiHuntDeclined.rowContents)
      expect(rowActionTexts).toEqual(expectedEndemicsFollowUpDairyPiHuntDeclined.rowActionTexts)
      expect(rowLinks).toEqual(expectedEndemicsFollowUpDairyPiHuntDeclined.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species for pigs', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return pigEndemicsFollowUpClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      const expected = expectedEndemicsFollowUpPigs()

      expect(rowKeys).toEqual(expected.rowKeys)
      expect(rowContents).toEqual(expected.rowContents)
      expect(rowActionTexts).toEqual(expected.rowActionTexts)
      expect(rowLinks).toEqual(expected.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species for sheep', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return sheepEndemicsFollowUpClaim
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)
      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      expect(rowKeys).toEqual(expectedEndemicsFollowUpSheep.rowKeys)
      expect(rowContents).toEqual(expectedEndemicsFollowUpSheep.rowContents)
      expect(rowActionTexts).toEqual(expectedEndemicsFollowUpSheep.rowActionTexts)
      expect(rowLinks).toEqual(expectedEndemicsFollowUpSheep.rowLinks)

      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species for unknown species', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return { ...sheepEndemicsFollowUpClaim, typeOfLivestock: 'unknown' }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowContents = getRowContents($)

      expect(rowContents).toContain('Unknown cattle')
      expectPhaseBanner.ok($)
    })

    test('shows fields for an endemics claim in the correct order for each species and herd information displayed for multi herds claim', async () => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          ...dairyEndemicsFollowUpClaim,
          herdName: 'Herd one'
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }
      isMultipleHerdsUserJourney
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      const rowKeys = getRowKeys($)

      const rowContents = getRowContents($)
      const rowActionTexts = getRowActionTexts($)
      const rowLinks = getRowLinks($)

      const multiHerdsRowKeys = [...expectedEndemicsFollowUpDairy.rowKeys]
      multiHerdsRowKeys[multiHerdsRowKeys.indexOf('Livestock')] = 'Species'
      multiHerdsRowKeys.splice(multiHerdsRowKeys.indexOf('Species') + 1, 0, 'Herd name')

      const multiHerdsRowContents = [...expectedEndemicsFollowUpDairy.rowContents]
      multiHerdsRowContents.splice(multiHerdsRowContents.indexOf('Dairy cattle') + 1, 0, 'Herd one')

      expect(rowKeys).toEqual(multiHerdsRowKeys)
      expect(rowContents).toEqual(multiHerdsRowContents)
      expect(rowActionTexts).toEqual(expectedEndemicsFollowUpDairy.rowActionTexts)
      expect(rowLinks).toEqual(expectedEndemicsFollowUpDairy.rowLinks)

      expectPhaseBanner.ok($)
    })

    test.each([
      {
        typeOfLivestock: livestockTypes.beef,
        typeOfReview: 'R',
        content: '11 or more beef cattle',
        backLink: '/claim/endemics/test-results'
      },
      {
        typeOfLivestock: livestockTypes.dairy,
        typeOfReview: 'R',
        content: '11 or more dairy cattle',
        backLink: '/claim/endemics/test-results'
      },
      {
        typeOfLivestock: livestockTypes.pigs,
        typeOfReview: 'R',
        content: '51 or more pigs',
        backLink: '/claim/endemics/test-results'
      },
      {
        typeOfLivestock: livestockTypes.sheep,
        typeOfReview: 'R',
        content: '21 or more sheep',
        backLink: '/claim/endemics/test-urn'
      },
      {
        typeOfLivestock: livestockTypes.beef,
        typeOfReview: 'E',
        content: '11 or more beef cattle',
        backLink: '/claim/endemics/biosecurity'
      },
      {
        typeOfLivestock: livestockTypes.dairy,
        typeOfReview: 'E',
        content: '11 or more dairy cattle',
        backLink: '/claim/endemics/biosecurity'
      },
      {
        typeOfLivestock: livestockTypes.pigs,
        typeOfReview: 'E',
        content: '51 or more pigs',
        backLink: '/claim/endemics/biosecurity'
      },
      {
        typeOfLivestock: livestockTypes.sheep,
        typeOfReview: 'E',
        content: '21 or more sheep',
        backLink: '/claim/endemics/sheep-test-results'
      }
    ])('check species content and back links are correct for typeOfLivestock: $typeOfLivestock and typeOfReview: $typeOfReview}', async ({ typeOfLivestock, typeOfReview, content, backLink }) => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          organisation: { name: 'business name' },
          typeOfLivestock,
          typeOfReview,
          dateOfVisit: '2023-12-19T10:25:11.318Z',
          dateOfTesting: '2023-12-19T10:25:11.318Z',
          speciesNumbers: 'speciesNumbers',
          vetsName: 'vetsName',
          vetRCVSNumber: 'vetRCVSNumber',
          laboratoryURN: 'laboratoryURN',
          numberOfOralFluidSamples: 'numberOfOralFluidSamples',
          numberAnimalsTested: 'numberAnimalsTested',
          testResults: 'testResults',
          reference: 'TEMP-6GSE-PIR8',
          latestEndemicsApplication: { flags: [] }
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toMatch('Check your answers - Get funding to improve animal health and welfare')
      expect($('.govuk-summary-list__key').text()).toContain(content)
      expect($('.govuk-summary-list__value').text()).toContain('SpeciesNumbers')
      expect($('.govuk-back-link').attr('href')).toEqual(backLink)
    })

    test("check row doesn't appear if no value", async () => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          organisation: { name: 'business name' },
          typeOfLivestock: 'sheep',
          typeOfReview: 'typeOfReview',
          dateOfVisit: '2023-12-19T10:25:11.318Z',
          dateOfTesting: '2023-12-19T10:25:11.318Z',
          speciesNumbers: 'speciesNumbers',
          vetsName: 'vetsName',
          vetRCVSNumber: 'vetRCVSNumber',
          laboratoryURN: 'laboratoryURN',
          numberOfOralFluidSamples: 'numberOfOralFluidSamples',
          numberAnimalsTested: 'numberAnimalsTested',
          testResults: undefined,
          reference: 'TEMP-6GSE-PIR8',
          latestEndemicsApplication: { flags: [] }
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toMatch('Check your answers - Get funding to improve animal health and welfare')
      expect($('.govuk-summary-list__key').text()).not.toContain('Test results\n')
      expect($('.govuk-summary-list__value').text()).not.toContain('TestResults')
    })

    test.each([
      {
        typeOfLivestock: livestockTypes.beef
      },
      {
        typeOfLivestock: livestockTypes.pigs
      },
      {
        typeOfLivestock: livestockTypes.dairy
      }
    ])('check vetVisitsReviewTestResults is included when provided for typeOfLivestock: $typeOfLivestock', async ({ typeOfLivestock }) => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          organisation: { name: 'business name' },
          typeOfReview: 'E',
          typeOfLivestock,
          dateOfVisit: '2023-12-19T10:25:11.318Z',
          dateOfTesting: '2023-12-19T10:25:11.318Z',
          speciesNumbers: 'speciesNumbers',
          vetsName: 'vetsName',
          vetRCVSNumber: 'vetRCVSNumber',
          laboratoryURN: 'laboratoryURN',
          vetVisitsReviewTestResults: 'vetVisitsReviewTestResults',
          reference: 'TEMP-6GSE-PIR8',
          latestEndemicsApplication: { flags: [] }
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toMatch('Check your answers - Get funding to improve animal health and welfare')
      expect($('.govuk-summary-list__key').text()).toContain('Review test result')
      expect($('.govuk-summary-list__value').text()).toContain('VetVisitsReviewTestResults')
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
      jest.resetAllMocks()
    })

    function expectAppInsightsEventRaised (tempClaimReference, claimReference, status) {
      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith({
        name: 'claim-submitted',
        properties: {
          tempClaimReference,
          claimReference,
          state: status,
          scheme: 'new-world'
        }
      })
    }

    test.each([{ latestVetVisitApplication: latestVetVisitApplicationWithInLastTenMonths }, { latestVetVisitApplication: latestVetVisitApplicationNotWithInLastTenMonths }])(
      'When post new claim (pigs review), it should redirect to confirmation page',
      async ({ latestVetVisitApplication }) => {
        const options = {
          method: 'POST',
          url,
          auth,
          payload: { crumb },
          headers: { cookie: `crumb=${crumb}` }
        }

        getEndemicsClaim.mockImplementation(() => {
          return {
            typeOfLivestock: 'pigs',
            typeOfReview: 'R',
            dateOfVisit: '2023-12-19T10:25:11.318Z',
            dateOfTesting: '2023-12-19T10:25:11.318Z',
            speciesNumbers: 'Yes',
            vetsName: 'VetName',
            vetRCVSNumber: '123456',
            laboratoryURN: '123456',
            latestVetVisitApplication,
            latestEndemicsApplication: {
              reference: 'TEMP-6GSE-PIR8'
            },
            reference: 'tempClaimReference'
          }
        })
        submitNewClaim.mockImplementation(() => ({ reference: 'TEMP-6GSE-PIR8' }))

        const mockResponse = {
          res: {
            statusCode: 200,
            statusMessage: 'OK'
          },
          payload: { reference: 'TEMP-6GSE-PIR8' }
        }
        Wreck.post.mockResolvedValue(mockResponse)

        const res = await server.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('/claim/endemics/confirmation'))

        // verify data passed to submitNewClaim when not sheep follow-up or multiple herd claim
        expect(submitNewClaim).toBeCalledWith(
          {
            applicationReference: 'TEMP-6GSE-PIR8',
            createdBy: 'admin',
            data: {
              biosecurity: undefined,
              dateOfTesting: '2023-12-19T10:25:11.318Z',
              dateOfVisit: '2023-12-19T10:25:11.318Z',
              diseaseStatus: undefined,
              herdVaccinationStatus: undefined,
              laboratoryURN: '123456',
              numberAnimalsTested: undefined,
              numberOfOralFluidSamples: undefined,
              numberOfSamplesTested: undefined,
              piHunt: undefined,
              piHuntAllAnimals: undefined,
              piHuntRecommended: undefined,
              reviewTestResults: undefined,
              sheepEndemicsPackage: undefined,
              speciesNumbers: 'Yes',
              testResults: undefined,
              typeOfLivestock: 'pigs',
              vetRCVSNumber: '123456',
              vetVisitsReviewTestResults: undefined,
              vetsName: 'VetName'
            },
            reference: 'tempClaimReference',
            type: 'R'
          },
          expect.any(Object))

        expectAppInsightsEventRaised('tempClaimReference', 'TEMP-6GSE-PIR8')
      })

    test.each([{ latestVetVisitApplication: latestVetVisitApplicationWithInLastTenMonths }, { latestVetVisitApplication: latestVetVisitApplicationNotWithInLastTenMonths }])(
      'When post new claim (sheep endemics), it should pass correct data to submitNewClaim and redirect to confirmation page',
      async ({ latestVetVisitApplication }) => {
        const options = {
          method: 'POST',
          url,
          auth,
          payload: { crumb },
          headers: { cookie: `crumb=${crumb}` }
        }

        getEndemicsClaim.mockImplementation(() => {
          return {
            typeOfLivestock: 'sheep',
            typeOfReview: 'E',
            dateOfVisit: '2023-12-19T10:25:11.318Z',
            dateOfTesting: '2023-12-19T10:25:11.318Z',
            speciesNumbers: 'Yes',
            vetsName: 'VetName',
            vetRCVSNumber: '123456',
            laboratoryURN: '123456',
            latestVetVisitApplication,
            sheepTestResults,
            latestEndemicsApplication: {
              reference: 'TEMP-6GSE-PIR8'
            },
            reference: 'tempClaimReference'
          }
        })
        submitNewClaim.mockImplementation(() => ({ reference: 'TEMP-6GSE-PIR8' }))

        const mockResponse = {
          res: {
            statusCode: 200,
            statusMessage: 'OK'
          },
          payload: { reference: 'TEMP-6GSE-PIR8' }
        }
        Wreck.post.mockResolvedValue(mockResponse)

        const res = await server.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('/claim/endemics/confirmation'))

        // verify data passed to submitNewClaim when is sheep follow-up but not multiple herd claim
        expect(submitNewClaim).toBeCalledWith(
          {
            applicationReference: 'TEMP-6GSE-PIR8',
            createdBy: 'admin',
            data: {
              biosecurity: undefined,
              dateOfTesting: '2023-12-19T10:25:11.318Z',
              dateOfVisit: '2023-12-19T10:25:11.318Z',
              diseaseStatus: undefined,
              herdVaccinationStatus: undefined,
              laboratoryURN: '123456',
              numberAnimalsTested: undefined,
              numberOfOralFluidSamples: undefined,
              numberOfSamplesTested: undefined,
              piHunt: undefined,
              piHuntAllAnimals: undefined,
              piHuntRecommended: undefined,
              reviewTestResults: undefined,
              sheepEndemicsPackage: undefined,
              speciesNumbers: 'Yes',
              testResults: [
                { diseaseType: 'flystrike', result: 'clinicalSymptomsPresent' },
                { diseaseType: 'sheepScab', result: 'negative' },
                {
                  diseaseType: 'other',
                  result: [
                    { diseaseType: 'disease one', result: 'test result one' },
                    { diseaseType: 'disease two', result: 'test result two' }
                  ]
                }
              ],
              typeOfLivestock: 'sheep',
              vetRCVSNumber: '123456',
              vetVisitsReviewTestResults: undefined,
              vetsName: 'VetName'
            },
            reference: 'tempClaimReference',
            type: 'E'
          },
          expect.any(Object))

        expectAppInsightsEventRaised('tempClaimReference', 'TEMP-6GSE-PIR8')
      }
    )

    test('verify data passed to submitNewClaim when is sheep follow-up and multiple herd claim', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => {
        return {
          typeOfLivestock: 'sheep',
          typeOfReview: 'E',
          dateOfVisit: '2025-05-02T12:00:00.000Z',
          dateOfTesting: '2025-05-02T12:00:00.000Z',
          speciesNumbers: 'Yes',
          vetsName: 'VetName',
          vetRCVSNumber: '123456',
          laboratoryURN: '123456',
          latestVetVisitApplication: latestVetVisitApplicationWithInLastTenMonths,
          sheepTestResults,
          latestEndemicsApplication: {
            reference: 'TEMP-6GSE-PIR8',
            flags: []
          },
          reference: 'tempClaimReference',
          herdCph: '22/333/4444',
          herdId: '24b2f256-4bcf-4ef7-b527-fc8a17437691',
          herdName: 'Sheep Flock 1',
          herdReasons: ['onlyHerd'],
          herdSame: 'yes',
          herdVersion: 1
        }
      })
      isMultipleHerdsUserJourney.mockReturnValue(true)
      submitNewClaim.mockImplementation(() => ({ reference: 'TEMP-6GSE-PIR8' }))

      const mockResponse = {
        res: {
          statusCode: 200,
          statusMessage: 'OK'
        },
        payload: { reference: 'TEMP-6GSE-PIR8' }
      }
      Wreck.post.mockResolvedValue(mockResponse)

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('/claim/endemics/confirmation'))

      // verify data passed to submitNewClaim when is sheep follow-up and multiple herd claim
      expect(submitNewClaim).toBeCalledWith(
        {
          applicationReference: 'TEMP-6GSE-PIR8',
          createdBy: 'admin',
          data: {
            biosecurity: undefined,
            dateOfVisit: '2025-05-02T12:00:00.000Z',
            dateOfTesting: '2025-05-02T12:00:00.000Z',
            diseaseStatus: undefined,
            herdVaccinationStatus: undefined,
            laboratoryURN: '123456',
            numberAnimalsTested: undefined,
            numberOfOralFluidSamples: undefined,
            numberOfSamplesTested: undefined,
            piHunt: undefined,
            piHuntAllAnimals: undefined,
            piHuntRecommended: undefined,
            reviewTestResults: undefined,
            sheepEndemicsPackage: undefined,
            speciesNumbers: 'Yes',
            testResults: [
              { diseaseType: 'flystrike', result: 'clinicalSymptomsPresent' },
              { diseaseType: 'sheepScab', result: 'negative' },
              {
                diseaseType: 'other',
                result: [
                  { diseaseType: 'disease one', result: 'test result one' },
                  { diseaseType: 'disease two', result: 'test result two' }
                ]
              }
            ],
            herd: {
              cph: '22/333/4444',
              herdId: '24b2f256-4bcf-4ef7-b527-fc8a17437691',
              herdName: 'Sheep Flock 1',
              herdReasons: ['onlyHerd'],
              herdSame: 'yes',
              herdVersion: 1
            },
            typeOfLivestock: 'sheep',
            vetRCVSNumber: '123456',
            vetVisitsReviewTestResults: undefined,
            vetsName: 'VetName'
          },
          reference: 'tempClaimReference',
          type: 'E'
        },
        expect.any(Object))

      expectAppInsightsEventRaised('tempClaimReference', 'TEMP-6GSE-PIR8')
    })

    test('when not logged in redirects to /sign-in', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })
  })
})
