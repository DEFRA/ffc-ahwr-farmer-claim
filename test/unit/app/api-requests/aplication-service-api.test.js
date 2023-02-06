const Wreck = require('@hapi/wreck')
const mockConfig = require('../../../../app/config')

jest.mock('@hapi/wreck')

const consoleLogSpy = jest.spyOn(console, 'log')
const consoleErrorSpy = jest.spyOn(console, 'error')

const mockApplicationApiUri = 'http://internal:3333/api'

describe('Application API', () => {
  let applicationApi

  beforeAll(() => {
    jest.mock('../../../../app/config', () => ({
      ...mockConfig,
      applicationApiUri: mockApplicationApiUri
    }))
    applicationApi = require('../../../../app/api-requests/application-service-api')
  })

  afterAll(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  describe('getLatestApplicationForEachSbi', () => {
    test('given an eligible business email address it returns business and their applicaton status', async () => {
      const expectedResponse = {
        payload: [
          {
            id: '48d2f147-614e-40df-9ba8-9961e7974e83',
            reference: 'AHWR-48D2-F147',
            data: {
              reference: null,
              declaration: true,
              offerStatus: 'accepted',
              whichReview: 'sheep',
              organisation: {
                crn: '112222',
                sbi: '122333',
                name: 'My Amazing Farm',
                email: 'liam.wilson@kainos.com',
                address: '1 Some Road',
                farmerName: 'Mr Farmer'
              },
              eligibleSpecies: 'yes',
              confirmCheckDetails: 'yes'
            },
            claimed: false,
            createdAt: '2023-02-01T13: 52: 14.176Z',
            updatedAt: '2023-02-01T13: 52: 14.207Z',
            createdBy: 'admin',
            updatedBy: null,
            statusId: 1
          },
          {
            id: '48d2f147-614e-40df-9ba8-9961e7974e82',
            reference: 'AHWR-48D2-F148',
            data: {
              reference: null,
              declaration: true,
              offerStatus: 'accepted',
              whichReview: 'pigs',
              organisation: {
                crn: '112222',
                sbi: '123456789',
                name: 'My Beautiful Farm',
                email: 'liam.wilson@kainos.com',
                address: '1 Some Road',
                farmerName: 'Mr Farmer'
              },
              eligibleSpecies: 'yes',
              confirmCheckDetails: 'yes'
            },
            claimed: false,
            createdAt: '2023-02-01T13: 52: 14.176Z',
            updatedAt: '2023-02-01T13: 52: 14.207Z',
            createdBy: 'admin',
            updatedBy: null,
            statusId: 1
          },
          {
            id: '48d2f147-614e-40df-9b568-9961e7974e82',
            reference: 'AHWR-48D2-F149',
            data: {
              reference: null,
              declaration: true,
              offerStatus: 'accepted',
              whichReview: 'pigs',
              organisation: {
                crn: '112222',
                sbi: '777777',
                name: 'My Beautiful Farm',
                email: 'liam.wilson@kainos.com',
                address: '1 Some Road',
                farmerName: 'Mr Farmer'
              },
              eligibleSpecies: 'yes',
              confirmCheckDetails: 'yes'
            },
            claimed: false,
            createdAt: '2023-02-01T13: 52: 14.176Z',
            updatedAt: '2023-02-01T13: 52: 14.207Z',
            createdBy: 'admin',
            updatedBy: null,
            statusId: 5
          }
        ],
        res: {
          statusCode: 200
        }
      }
      const options = {
        json: true
      }
      const BUSINESS_EMAIL_ADDRESS = 'name@email.com'
      Wreck.get = jest.fn().mockResolvedValue(expectedResponse)

      const response = await applicationApi.getLatestApplicationForEachSbi(BUSINESS_EMAIL_ADDRESS)

      expect(response).not.toBeNull()
      expect(Wreck.get).toHaveBeenCalledTimes(1)
      expect(Wreck.get).toHaveBeenCalledWith(
          `${mockApplicationApiUri}/applications/latest?businessEmail=${BUSINESS_EMAIL_ADDRESS}`,
          options
      )
    })

    test('given Wreck.get returns 400 it logs the issue and returns null', async () => {
      const statusCode = 400
      const statusMessage = 'A valid email address must be specified.'
      const expectedResponse = {
        payload: {
          statusCode,
          error: 'Bad Request',
          message: 'A valid email address must be specified.'
        },
        res: {
          statusCode,
          statusMessage
        }
      }
      const options = {
        json: true
      }
      const BUSINESS_EMAIL_ADDRESS = 'name@email.com'
      Wreck.get = jest.fn().mockResolvedValue(expectedResponse)

      const response = await applicationApi.getLatestApplicationForEachSbi(BUSINESS_EMAIL_ADDRESS)

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(`Bad response: ${statusCode} - ${statusMessage}`)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?businessEmail=${BUSINESS_EMAIL_ADDRESS}`,
        options
      )
    })

    test('given Wreck.get throws an error it logs the error and returns null', async () => {
      const expectedError = new Error('msg')
      const options = {
        json: true
      }
      const BUSINESS_EMAIL_ADDRESS = 'name@email.com'
      Wreck.get = jest.fn().mockRejectedValue(expectedError)

      const response = await applicationApi.getLatestApplicationForEachSbi(BUSINESS_EMAIL_ADDRESS)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(`applicationApiUri.getLatestApplicationForEachSbi failed: ${expectedError.message}`)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?businessEmail=${BUSINESS_EMAIL_ADDRESS}`,
        options
      )
    })
  })
})