const Wreck = require('@hapi/wreck')
const mockConfig = require('../../../../app/config')
jest.mock('@hapi/wreck')
const consoleLogSpy = jest.spyOn(console, 'log')
const consoleErrorSpy = jest.spyOn(console, 'error')
const mockApplicationApiUri = 'http://internal:3333/api'

const MOCK_NOW = new Date()

describe('Application API', () => {
  let applicationApi

  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)

    jest.mock('../../../../app/config', () => ({
      ...mockConfig,
      applicationApiUri: mockApplicationApiUri
    }))
    applicationApi = require('../../../../app/api-requests/application-service-api')
  })

  afterAll(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getLatestApplicationsByBusinessEmail', () => {
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
      const response = await applicationApi.getLatestApplicationsByEmail(BUSINESS_EMAIL_ADDRESS)
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
      const response = await applicationApi.getLatestApplicationsByEmail(BUSINESS_EMAIL_ADDRESS)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(`${MOCK_NOW.toISOString()} Getting latest applications by: ${JSON.stringify({
        businessEmail: BUSINESS_EMAIL_ADDRESS
      })}`)
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
      const response = await applicationApi.getLatestApplicationsByEmail(BUSINESS_EMAIL_ADDRESS)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${MOCK_NOW.toISOString()} Getting latest applications failed: ${JSON.stringify({
        businessEmail: BUSINESS_EMAIL_ADDRESS
      })}`, expectedError)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?businessEmail=${BUSINESS_EMAIL_ADDRESS}`,
        options
      )
    })
  })

  describe('getLatestApplicationsBySbi', () => {
    test('given an eligible sbi it returns business and their applicaton status', async () => {
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
      const SBI = 11333333
      Wreck.get = jest.fn().mockResolvedValue(expectedResponse)
      const response = await applicationApi.getLatestApplicationsBySbi(SBI)
      expect(response).not.toBeNull()
      expect(Wreck.get).toHaveBeenCalledTimes(1)
      expect(Wreck.get).toHaveBeenCalledWith(
          `${mockApplicationApiUri}/applications/latest?sbi=${SBI}`,
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
          message: statusMessage
        },
        res: {
          statusCode,
          statusMessage
        }
      }
      const options = {
        json: true
      }
      const SBI = 1133333
      Wreck.get = jest.fn().mockResolvedValue(expectedResponse)
      const response = await applicationApi.getLatestApplicationsBySbi(SBI)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(`${MOCK_NOW.toISOString()} Getting latest applications by: ${JSON.stringify({
        sbi: SBI
      })}`)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?sbi=${SBI}`,
        options
      )
    })
    test('given Wreck.get throws an error it logs the error and returns null', async () => {
      const expectedError = new Error('msg')
      const options = {
        json: true
      }
      const SBI = 1133333
      Wreck.get = jest.fn().mockRejectedValue(expectedError)
      const response = await applicationApi.getLatestApplicationsBySbi(SBI)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${MOCK_NOW.toISOString()} Getting latest applications failed: ${JSON.stringify({
        sbi: SBI
      })}`, expectedError)
      expect(response).toBeNull()
      expect(Wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?sbi=${SBI}`,
        options
      )
    })
  })
})
