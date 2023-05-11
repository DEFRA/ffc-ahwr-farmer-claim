const cheerio = require('cheerio')
const sessionMock = require('../../../../../app/session')
jest.mock('../../../../../app/session')
const authMock = require('../../../../../app/auth')
jest.mock('../../../../../app/auth')
const latestApplicationMock = require('../../../../../app/routes/models/latest-application')
jest.mock('../../../../../app/routes/models/latest-application')
const personMock = require('../../../../../app/api-requests/rpa-api/person')
jest.mock('../../../../../app/api-requests/rpa-api/person')
const organisationMock = require('../../../../../app/api-requests/rpa-api/organisation')
jest.mock('../../../../../app/api-requests/rpa-api/organisation')

const { NoApplicationFound, InvalidStateError } = require('../../../../../app/exceptions')

describe('FarmerApply defra ID redirection test', () => {
  jest.mock('../../../../../app/config', () => ({
    ...jest.requireActual('../../../../../app/config'),
    authConfig: {
      defraId: {
        enabled: true
      },
      ruralPaymentsAgency: {
        hostname: 'rpaHostname'
      }
    }
  }))

  const url = '/claim/signin-oidc'

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  describe(`GET requests to '${url}'`, () => {
    test.each([
      { code: '', state: '' },
      { code: 'sads', state: '' },
      { code: '', state: '83d2b160-74ce-4356-9709-3f8da7868e35' }
    ])('returns 400 and login failed view when empty required query parameters - %p', async ({ code, state }) => {
      const baseUrl = `${url}?code=${code}&state=${state}`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect($('.govuk-heading-l').text()).toMatch('Login failed')
    })

    test('returns 400 and login failed view when state missing', async () => {
      const baseUrl = `${url}?code=343432`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect($('.govuk-heading-l').text()).toMatch('Login failed')
    })

    test('returns 400 and login failed view when code missing', async () => {
      const baseUrl = `${url}?state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect($('.govuk-heading-l').text()).toMatch('Login failed')
    })

    test('redirects to defra id when state mismatch', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authMock.authenticate.mockImplementation(() => {
        throw new InvalidStateError('Invalid state')
      })

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(302)
      expect(authMock.authenticate).toBeCalledTimes(1)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
    })

    test('returns 400 and cannot claim for review view when no applciation to claim for', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authMock.authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      authMock.getClientCredentials.mockResolvedValueOnce('Bearer 2323')
      personMock.getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationMock.organisationIsEligible.mockResolvedValueOnce({
        organisation: {
          id: 7654321,
          name: 'Mrs Gill Black',
          sbi: 101122201,
          address: {
            address1: 'The Test House',
            address2: 'Test road',
            address3: 'Wicklewood',
            buildingNumberRange: '11',
            buildingName: 'TestHouse',
            street: 'Test ROAD',
            city: 'Test City',
            postalCode: 'TS1 1TS',
            country: 'United Kingdom',
            dependentLocality: 'Test Local'
          },
          email: 'org1@testemail.com'
        },
        organisationPermission: true
      })
      latestApplicationMock.mockRejectedValueOnce(new NoApplicationFound('No application found for SBI - 101122201'))

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      expect(authMock.authenticate).toBeCalledTimes(1)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect(latestApplicationMock).toBeCalledTimes(1)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot claim for a livestock review for this business')
    })

    test('returns 400 and cannot claim for review view when invalid persmissions', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authMock.authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      authMock.getClientCredentials.mockResolvedValueOnce('Bearer 2323')
      personMock.getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationMock.organisationIsEligible.mockResolvedValueOnce({
        organisation: {
          id: 7654321,
          name: 'Mrs Gill Black',
          sbi: 101122201,
          address: {
            address1: 'The Test House',
            address2: 'Test road',
            address3: 'Wicklewood',
            buildingNumberRange: '11',
            buildingName: 'TestHouse',
            street: 'Test ROAD',
            city: 'Test City',
            postalCode: 'TS1 1TS',
            country: 'United Kingdom',
            dependentLocality: 'Test Local'
          },
          email: 'org1@testemail.com'
        },
        organisationPermission: false
      })

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      expect(authMock.authenticate).toBeCalledTimes(1)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot claim for a livestock review for this business')
    })

    test('returns 302 and redirected to org view when authenticate successful', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authMock.authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      authMock.getClientCredentials.mockResolvedValueOnce('Bearer 2323')
      personMock.getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationMock.organisationIsEligible.mockResolvedValueOnce({
        organisation: {
          id: 7654321,
          name: 'Mrs Gill Black',
          sbi: 101122201,
          address: {
            address1: 'The Test House',
            address2: 'Test road',
            address3: 'Wicklewood',
            buildingNumberRange: '11',
            buildingName: 'TestHouse',
            street: 'Test ROAD',
            city: 'Test City',
            postalCode: 'TS1 1TS',
            country: 'United Kingdom',
            dependentLocality: 'Test Local'
          },
          email: 'org1@testemail.com'
        },
        organisationPermission: true
      })
      latestApplicationMock.mockResolvedValueOnce(
        {
          claimed: false,
          createdAt: '2023-01-17 14:55:20',
          createdBy: 'David Jones',
          data: {
            confirmCheckDetails: 'yes',
            declaration: true,
            eligibleSpecies: 'yes',
            offerStatus: 'accepted',
            organisation: {
              address: '1 Example Road',
              crn: 1111111111,
              email: 'business@email.com',
              farmerName: 'Mr Farmer',
              name: 'My Amazing Farm',
              sbi: 111111111
            },
            reference: 'string',
            whichReview: 'sheep'
          },
          id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
          reference: 'AHWR-5C1C-AAAA',
          statusId: 1,
          updatedAt: '2023-01-17 14:55:20',
          updatedBy: 'David Jones'
        }
      )

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/visit-review')
      expect(latestApplicationMock).toBeCalledTimes(1)
      expect(authMock.authenticate).toBeCalledTimes(1)
      expect(authMock.setAuthCookie).toBeCalledTimes(1)
      expect(sessionMock.setClaim).toBeCalledTimes(10)
    })
  })
})
