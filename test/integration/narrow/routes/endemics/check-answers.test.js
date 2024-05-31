const cheerio = require('cheerio')
const Wreck = require('@hapi/wreck')
const getCrumbs = require('../../../../utils/get-crumbs')
const { livestockTypes } = require('../../../../../app/constants/claim')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim
const {
  beefReviewClaim,
  dairyReviewClaim,
  pigsReviewClaim,
  sheepReviewClaim,
  beefEndemicsFollowUpClaim,
  dairyEndemicsFollowUpClaim,
  pigEndemicsFollowUpClaim,
  sheepEndemicsFollowUpClaim,
  expectedReviewBeef,
  expectedReviewDairy,
  expectedReviewPigs,
  expectedReviewSheep,
  expectedEndemicsFollowUpBeef,
  expectedEndemicsFollowUpDairy,
  expectedEndemicsFollowUpPigs,
  expectedEndemicsFollowUpSheep,
  getRowKeys,
  getRowContents,
  getRowActionTexts,
  getRowLinks
} = require('../../../../utils/check-answers')

jest.mock('../../../../../app/session')
jest.mock('@hapi/wreck')

describe('Check answers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/check-answers'
  const latestVetVisitApplicationWithInLastTenMonths = { createdAt: new Date().toISOString() }
  const latestVetVisitApplicationNotWithInLastTenMonths = { createdAt: '2023-01-01T00:00:01T00' }

  beforeAll(() => {
    jest.mock('../../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../../app/config')
      return {
        ...originalModule,
        authConfig: {
          defraId: {
            hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
            oAuthAuthorisePath: '/oauth2/v2.0/authorize',
            policy: 'b2c_1a_signupsigninsfi',
            redirectUri: 'http://localhost:3000/apply/signin-oidc',
            clientId: 'dummy_client_id',
            serviceId: 'dummy_service_id',
            scope: 'openid dummy_client_id offline_access'
          },
          ruralPaymentsAgency: {
            hostname: 'dummy-host-name',
            getPersonSummaryUrl: 'dummy-get-person-summary-url',
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        },
        endemics: {
          enabled: true
        }
      }
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })

    describe('shows fields for a review claim in the correct order for each species', () => {
      test('for beef', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return beefReviewClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

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

      test('for dairy', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return dairyReviewClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)
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

      test('for pigs', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return pigsReviewClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

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

      test('for sheep', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return sheepReviewClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

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
    })

    describe('shows fields for an endemics claim in the correct order for each species', () => {
      test('for beef', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return beefEndemicsFollowUpClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

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

      test('for dairy', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return dairyEndemicsFollowUpClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

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

      test('for pigs', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return pigEndemicsFollowUpClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(200)
        const $ = cheerio.load(res.payload)

        const rowKeys = getRowKeys($)
        const rowContents = getRowContents($)
        const rowActionTexts = getRowActionTexts($)
        const rowLinks = getRowLinks($)

        expect(rowKeys).toEqual(expectedEndemicsFollowUpPigs.rowKeys)
        expect(rowContents).toEqual(expectedEndemicsFollowUpPigs.rowContents)
        expect(rowActionTexts).toEqual(expectedEndemicsFollowUpPigs.rowActionTexts)
        expect(rowLinks).toEqual(expectedEndemicsFollowUpPigs.rowLinks)

        expectPhaseBanner.ok($)
      })

      test('for sheep', async () => {
        getEndemicsClaimMock.mockImplementation(() => {
          return sheepEndemicsFollowUpClaim
        })
        const options = {
          method: 'GET',
          url,
          auth
        }

        const res = await global.__SERVER__.inject(options)

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
      getEndemicsClaimMock.mockImplementation(() => {
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
          testResults: 'testResults'
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)

      expect($('h1').text()).toMatch('Check your answers')
      expect($('title').text()).toMatch('Check your answers - Get funding to improve animal health and welfare')
      expect($('.govuk-summary-list__key').text()).toContain(content)
      expect($('.govuk-summary-list__value').text()).toContain('SpeciesNumbers')
      expect($('.govuk-back-link').attr('href')).toEqual(backLink)
    })

    test("check row doesn't appear if no value", async () => {
      getEndemicsClaimMock.mockImplementation(() => {
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
          testResults: undefined
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

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
      getEndemicsClaimMock.mockImplementation(() => {
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
          vetVisitsReviewTestResults: 'vetVisitsReviewTestResults'
        }
      })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

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
      crumb = await getCrumbs(global.__SERVER__)
    })

    test.each([{ latestVetVisitApplication: latestVetVisitApplicationWithInLastTenMonths }, { latestVetVisitApplication: latestVetVisitApplicationNotWithInLastTenMonths }])(
      'When post new claim, it should redirect to confirmation page',
      async ({ latestVetVisitApplication }) => {
        const options = {
          method: 'POST',
          url,
          auth,
          payload: { crumb },
          headers: { cookie: `crumb=${crumb}` }
        }

        getEndemicsClaimMock.mockImplementation(() => {
          return {
            typeOfLivestock: 'pigs',
            typeOfReview: 'review',
            dateOfVisit: '2023-12-19T10:25:11.318Z',
            dateOfTesting: '2023-12-19T10:25:11.318Z',
            speciesNumbers: 'Yes',
            vetsName: 'VetName',
            vetRCVSNumber: '123456',
            laboratoryURN: '123456',
            latestVetVisitApplication,
            latestEndemicsApplication: {
              reference: '123'
            },
            reference: 'tempClaimReference'
          }
        })

        const mockResponse = {
          res: {
            statusCode: 200,
            statusMessage: 'OK'
          },
          payload: {
            dataValues: {
              reference: '123'
            }
          }
        }

        Wreck.post.mockResolvedValue(mockResponse)

        jest.mock('../../../../../app/api-requests/claim-service-api.js', () => {
          return {
            submitNewClaim: jest.fn().mockReturnValue({
              dataValues: {
                reference: '123'
              }
            })
          }
        })
        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('/claim/endemics/confirmation'))
      }
    )

    test.each([{ latestVetVisitApplication: latestVetVisitApplicationWithInLastTenMonths }, { latestVetVisitApplication: latestVetVisitApplicationNotWithInLastTenMonths }])(
      'When post new claim, it should redirect to confirmation page',
      async ({ latestVetVisitApplication }) => {
        const options = {
          method: 'POST',
          url,
          auth,
          payload: { crumb },
          headers: { cookie: `crumb=${crumb}` }
        }

        getEndemicsClaimMock.mockImplementation(() => {
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
            latestEndemicsApplication: {
              reference: '123'
            },
            reference: 'tempClaimReference'
          }
        })

        const mockResponse = {
          res: {
            statusCode: 200,
            statusMessage: 'OK'
          },
          payload: {
            dataValues: {
              reference: '123'
            }
          }
        }

        Wreck.post.mockResolvedValue(mockResponse)

        jest.mock('../../../../../app/api-requests/claim-service-api.js', () => {
          return {
            submitNewClaim: jest.fn().mockReturnValue({
              dataValues: {
                reference: '123'
              }
            })
          }
        })
        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual(expect.stringContaining('/claim/endemics/confirmation'))
      }
    )

    test('when not logged in redirects to defra id', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expect.stringContaining('https://tenant.b2clogin.com/tenant.onmicrosoft.com/oauth2/v2.0/authorize'))
    })
  })
})
