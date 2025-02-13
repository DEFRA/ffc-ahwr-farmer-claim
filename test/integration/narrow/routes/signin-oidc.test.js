import cheerio from 'cheerio'
import { requestAuthorizationCodeUrl } from '../../../../app/auth/auth-code-grant/request-authorization-code-url.js'
import { InvalidStateError } from '../../../../app/exceptions/invalid-state-error.js'
import { authenticate } from '../../../../app/auth/authenticate.js'
import { raiseIneligibilityEvent } from '../../../../app/event/raise-ineligibility-event.js'
import { retrieveApimAccessToken } from '../../../../app/auth/client-credential-grant/retrieve-apim-access-token.js'
import { getPersonSummary } from '../../../../app/api-requests/rpa-api/person.js'
import { organisationIsEligible } from '../../../../app/api-requests/rpa-api/organisation.js'
import { getLatestApplicationForSbi } from '../../../../app/routes/models/latest-application.js'
import { NoApplicationFoundError } from '../../../../app/exceptions/no-application-found.js'
import { ClaimHasExpiredError } from '../../../../app/exceptions/claim-has-expired.js'
import { ClaimHasAlreadyBeenMadeError } from '../../../../app/exceptions/claim-has-already-been-made.js'
import { setEndemicsClaim } from '../../../../app/session/index.js'
import { setAuthCookie } from '../../../../app/auth/cookie-auth/cookie-auth.js'
import { createServer } from '../../.././../app/server.js'

jest.mock('../../../../app/session')
jest.mock('../../../../app/routes/models/latest-application')
jest.mock('../../../../app/event/raise-ineligibility-event')
jest.mock('../../../../app/api-requests/rpa-api/person', () => ({
  ...jest.requireActual('../../../../app/api-requests/rpa-api/person'),
  getPersonSummary: jest.fn()
}))
jest.mock('../../../../app/api-requests/rpa-api/organisation', () => ({
  ...jest.requireActual('../../../../app/api-requests/rpa-api/organisation'),
  organisationIsEligible: jest.fn()
}))
jest.mock('../../../../app/auth/cookie-auth/cookie-auth')
jest.mock('../../../../app/auth/auth-code-grant/request-authorization-code-url')
jest.mock('../../../../app/auth/client-credential-grant/retrieve-apim-access-token')
jest.mock('../../../../app/auth/authenticate')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

jest.mock('@hapi/wreck', () => ({
  put: jest.fn().mockResolvedValue({ payload: {} })
}))

describe('FarmerApply defra ID redirection test', () => {
  let server

  beforeAll(async () => {
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      authConfig: {
        defraId: {
          enabled: true
        },
        ruralPaymentsAgency: {
          hostname: 'rpaHostname'
        }
      }
    }))
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

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

      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect($('.govuk-heading-l').text()).toMatch('Login failed')
    })

    test('returns 400 and login failed view when state missing', async () => {
      const baseUrl = `${url}?code=343432`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect($('.govuk-heading-l').text()).toMatch('Login failed')
    })

    test('returns 400 and login failed view when code missing', async () => {
      const baseUrl = `${url}?state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect($('.govuk-heading-l').text()).toMatch('Login failed')
    })

    test('redirects to defra id when state mismatch', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authenticate.mockImplementation(() => {
        throw new InvalidStateError('Invalid state')
      })

      const res = await server.inject(options)
      expect(res.statusCode).toBe(302)
      expect(authenticate).toBeCalledTimes(1)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledTimes(0)
    })

    test('returns 400 and cannot claim for review view when no application to claim for', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      retrieveApimAccessToken.mockResolvedValueOnce('Bearer 2323')
      getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationIsEligible.mockResolvedValueOnce({
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
      getLatestApplicationForSbi.mockRejectedValueOnce(new NoApplicationFoundError('No application found for SBI - 101122201'))

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(authenticate).toBeCalledTimes(1)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect(getLatestApplicationForSbi).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledWith(expect.anything(), undefined, undefined, undefined, 'NoApplicationFoundError', undefined)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot claim for a livestock review for this business')
    })

    test('returns 400 and cannot claim for review view when application has expired', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      retrieveApimAccessToken.mockResolvedValueOnce('Bearer 2323')
      getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationIsEligible.mockResolvedValueOnce({
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
      getLatestApplicationForSbi.mockRejectedValueOnce(new ClaimHasExpiredError('Claim has expired for reference - AHWR-1111-3213', {}, '1 Jan 2023', '2 Jun 2023'))

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(authenticate).toBeCalledTimes(1)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect(getLatestApplicationForSbi).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledWith(expect.anything(), undefined, undefined, undefined, 'ClaimHasExpired', undefined)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot claim for a livestock review for this business')
      expect($('.govuk-body').text()).toContain('You accepted your annual health and welfare agreement offer on 1 Jan 2023.')
      expect($('.govuk-body').text()).toContain('The 6 month deadline for this review was 2 Jun 2023')
    })

    test('returns 400 and cannot claim for review view when claim already made', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      retrieveApimAccessToken.mockResolvedValueOnce('Bearer 2323')
      getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationIsEligible.mockResolvedValueOnce({
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
      getLatestApplicationForSbi.mockRejectedValueOnce(new ClaimHasAlreadyBeenMadeError('Claim has already been made'))

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(authenticate).toBeCalledTimes(1)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expect(getLatestApplicationForSbi).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledTimes(1)
      expect(raiseIneligibilityEvent).toBeCalledWith(expect.anything(), undefined, undefined, undefined, 'ClaimHasAlreadyBeenMadeError', undefined)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot claim for a livestock review for this business')
    })

    test('returns 400 and cannot claim for review view when invalid permissions', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      retrieveApimAccessToken.mockResolvedValueOnce('Bearer 2323')
      getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })
      organisationIsEligible.mockResolvedValueOnce({
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

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(authenticate).toBeCalledTimes(1)
      expect(requestAuthorizationCodeUrl).toBeCalledTimes(1)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toMatch('You cannot claim for a livestock review for this business')
    })

    test('returns 302 and redirected to org view when authenticate successful', async () => {
      const baseUrl = `${url}?code=432432&state=83d2b160-74ce-4356-9709-3f8da7868e35`
      const options = {
        method: 'GET',
        url: baseUrl
      }

      authenticate.mockResolvedValueOnce({ accessToken: '2323' })
      retrieveApimAccessToken.mockResolvedValueOnce('Bearer 2323')
      getPersonSummary.mockResolvedValueOnce({
        firstName: 'Bill',
        middleName: null,
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      })

      organisationIsEligible.mockResolvedValueOnce({
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
          businessReference: 'BUSI-123',
          email: 'org1@testemail.com'
        },
        organisationPermission: true
      })

      getLatestApplicationForSbi.mockResolvedValueOnce(
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

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics?from=dashboard&sbi=101122201')
      expect(getLatestApplicationForSbi).toBeCalledTimes(1)
      expect(authenticate).toBeCalledTimes(1)
      expect(setAuthCookie).toBeCalledTimes(1)
      expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'organisation',
        {
          sbi: '101122201',
          farmerName: 'Bill Smith',
          name: 'Mrs Gill Black',
          email: 'billsmith@testemail.com',
          orgEmail: 'org1@testemail.com',
          address: 'The Test House,Test road,Wicklewood,11,TestHouse,Test ROAD,Test City,TS1 1TS,United Kingdom',
          crn: '1103452436',
          frn: 'BUSI-123'
        })
    })
  })
})
