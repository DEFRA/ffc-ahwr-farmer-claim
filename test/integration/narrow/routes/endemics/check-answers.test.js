const cheerio = require('cheerio')
const Wreck = require('@hapi/wreck')
const getCrumbs = require('../../../../utils/get-crumbs')
const { livestockTypes, claimType } = require('../../../../../app/constants/claim')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const getEndemicsClaimMock = require('../../../../../app/session').getEndemicsClaim

jest.mock('../../../../../app/session')
jest.mock('@hapi/wreck')

describe('Check answers test', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/check-answers'
  const latestVetVisitApplicationWithInLastTenMonths = { createdAt: new Date().toISOString() }
  const latestVetVisitApplicationNotWithInLastTenMonths = { createdAt: '2023-01-01T00:00:01T00' }
  const sheepEndemicsPackage = 'reducedExternalParasites'
  const sheepTestResults = [
    { diseaseType: 'flystrike', result: 'clinicalSymptomsPresent' },
    { diseaseType: 'sheepScab', result: 'negative' },
    {
      diseaseType: 'other',
      result: [
        { diseaseType: 'disease one', testResult: 'test result one' },
        { diseaseType: 'disease two', testResult: 'test result two' }
      ]
    }
  ]
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

    test('returns 200 and shows all fields that have values', async () => {
      getEndemicsClaimMock.mockImplementation(() => {
        return {
          organisation: { name: 'business name' },
          typeOfLivestock: 'beef',
          typeOfReview: 'E',
          dateOfVisit: '2023-12-19T10:25:11.318Z',
          dateOfTesting: '2023-12-19T10:25:11.318Z',
          speciesNumbers: 'speciesNumbers',
          vetsName: 'vetsName',
          vetRCVSNumber: 'vetRCVSNumber',
          laboratoryURN: 'laboratoryURN',
          numberOfOralFluidSamples: 'numberOfOralFluidSamples',
          numberAnimalsTested: 'numberAnimalsTested',
          testResults: 'testResults',
          diseaseStatus: 'diseaseStatus',
          herdVaccinationStatus: 'herdVaccinationStatus',
          biosecurity: 'biosecurity'
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

      expect($('.govuk-summary-list__key').text()).toContain('Business name')
      expect($('.govuk-summary-list__value').text()).toContain('Business name')

      expect($('.govuk-summary-list__key').text()).toContain('Type of review')
      expect($('.govuk-summary-list__value').text()).toContain('Endemic disease follow-ups')

      expect($('.govuk-summary-list__key').text()).toContain('Date of review or follow-up')
      expect($('.govuk-summary-list__value').text()).toContain('19 December 2023')

      expect($('.govuk-summary-list__key').text()).toContain('Date of testing')
      expect($('.govuk-summary-list__value').text()).toContain('19 December 2023')

      expect($('.govuk-summary-list__key').text()).toContain('11 or more beef cattle')
      expect($('.govuk-summary-list__value').text()).toContain('SpeciesNumbers')

      expect($('.govuk-summary-list__key').text()).toContain("Vet's name")
      expect($('.govuk-summary-list__value').text()).toContain('VetsName')

      expect($('.govuk-summary-list__key').text()).toContain("Vet's RCVS number")
      expect($('.govuk-summary-list__value').text()).toContain('vetRCVSNumber')

      expect($('.govuk-summary-list__key').text()).toContain('URN')
      expect($('.govuk-summary-list__value').text()).toContain('laboratoryURN')

      expect($('.govuk-summary-list__key').text()).toContain('Number of tests')
      expect($('.govuk-summary-list__value').text()).toContain('numberOfOralFluidSamples')

      expect($('.govuk-summary-list__key').text()).toContain('Number of animals tested')
      expect($('.govuk-summary-list__value').text()).toContain('numberAnimalsTested')

      expect($('.govuk-summary-list__key').text()).toContain('Test results')
      expect($('.govuk-summary-list__value').text()).toContain('TestResults')

      expect($('.govuk-summary-list__key').text()).toContain('Diseases status category')
      expect($('.govuk-summary-list__value').text()).toContain('diseaseStatus')

      expect($('.govuk-summary-list__key').text()).toContain('Herd vaccination status')
      expect($('.govuk-summary-list__value').text()).toContain('HerdVaccinationStatus')

      expect($('.govuk-summary-list__key').text()).toContain('Biosecurity assessment')
      expect($('.govuk-summary-list__value').text()).toContain('Biosecurity')

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
    ])('check content and back links are correct for typeOfLivestock: $typeOfLivestock and whichReview $whichReview', async ({ typeOfLivestock, typeOfReview, content, backLink }) => {
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
          testResults: 'testResults',
          sheepEndemicsPackage,
          sheepTestResults
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

    test('check row doesnt appear if no value', async () => {
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
        typeOfReview: claimType.review,
        content: 'Annual health and welfare review'
      },
      {
        typeOfReview: claimType.endemics,
        content: 'Endemic disease follow-ups'
      }
    ])('check content and back links are correct for typeOfReview: $typeOfReview', async ({ typeOfReview, content }) => {
      getEndemicsClaimMock.mockImplementation(() => {
        return {
          organisation: { name: 'business name' },
          typeOfLivestock: 'beef',
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
      expect($('.govuk-summary-list__key').text()).toContain('Type of review')
      expect($('.govuk-summary-list__value').text()).toContain(content)
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
    ])('check content and back links are correct for typeOfLivestock: $typeOfLivestock', async ({ typeOfLivestock }) => {
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
          numberOfOralFluidSamples: 'numberOfOralFluidSamples',
          numberAnimalsTested: 'numberAnimalsTested',
          testResults: 'testResults',
          vetVisitsReviewTestResults: 'vetVisitsReviewTestResults',
          latestVetVisitApplication: latestVetVisitApplicationWithInLastTenMonths
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
            speciesNumbers: 'yes',
            vetsName: 'VetName',
            vetRCVSNumber: '123456',
            laboratoryURN: '123456',
            numberOfOralFluidSamples: '5',
            numberAnimalsTested: '30',
            testResults: 'positive',
            latestVetVisitApplication,
            latestEndemicsApplication: {
              reference: '123'
            }
          }
        })

        const mockResponse = {
          res: {
            statusCode: 200,
            statusMessage: 'OK'
          },
          payload: {
            reference: '123'
          }
        }

        Wreck.post.mockResolvedValue(mockResponse)

        jest.mock('../../../../../app/api-requests/claim-service-api.js', () => {
          return {
            submitNewClaim: jest.fn().mockReturnValue({
              reference: '123'
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
            speciesNumbers: 'yes',
            vetsName: 'VetName',
            vetRCVSNumber: '123456',
            laboratoryURN: '123456',
            numberOfOralFluidSamples: '5',
            numberAnimalsTested: '30',
            testResults: 'positive',
            latestVetVisitApplication,
            latestEndemicsApplication: {
              reference: '123'
            },
            sheepEndemicsPackage,
            sheepTestResults
          }
        })

        const mockResponse = {
          res: {
            statusCode: 200,
            statusMessage: 'OK'
          },
          payload: {
            reference: '123'
          }
        }

        Wreck.post.mockResolvedValue(mockResponse)

        jest.mock('../../../../../app/api-requests/claim-service-api.js', () => {
          return {
            submitNewClaim: jest.fn().mockReturnValue({
              reference: '123'
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
