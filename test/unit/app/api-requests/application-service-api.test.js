import wreck from '@hapi/wreck'
import { getAllApplicationsBySbi } from '../../../../app/api-requests/application-service-api.js'

const mockApplicationApiUri = 'http://internal:3333/api'
jest.mock('@hapi/wreck')
jest.mock('../../../../app/config/index.js', () => {
  const originalModule = jest.requireActual('../../../../app/config/index.js')
  return {
    ...originalModule,
    config: {
      applicationApiUri: 'http://internal:3333/api'
    }
  }
})

const MOCK_NOW = new Date()

describe('Application API', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)
  })

  afterAll(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllApplicationsBySbi', () => {
    test('given an eligible sbi it returns business and their application status', async () => {
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
      wreck.get = jest.fn().mockResolvedValue(expectedResponse)
      const response = await getAllApplicationsBySbi(SBI)
      expect(response).not.toBeNull()
      expect(wreck.get).toHaveBeenCalledTimes(1)
      expect(wreck.get).toHaveBeenCalledWith(
          `${mockApplicationApiUri}/applications/latest?sbi=${SBI}`,
          options
      )
    })

    test('given a 404 an empty array is returned', async () => {
      const expectedResponse = {
        output: {
          statusCode: 404
        }
      }
      const options = {
        json: true
      }
      const SBI = 1133333
      wreck.get = jest.fn().mockRejectedValue(expectedResponse)
      const response = await getAllApplicationsBySbi(SBI)

      expect(response).toEqual([])
      expect(wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?sbi=${SBI}`,
        options
      )
    })

    test('errors are thrown', async () => {
      const expectedResponse = {
        output: {
          statusCode: 500
        }
      }
      const options = {
        json: true
      }
      const SBI = 1133333
      wreck.get = jest.fn().mockRejectedValue(expectedResponse)

      const logger = { setBindings: jest.fn() }
      await expect(async () => {
        await getAllApplicationsBySbi(SBI, logger)
      }).rejects.toEqual(expectedResponse)

      expect(wreck.get).toHaveBeenCalledWith(
        `${mockApplicationApiUri}/applications/latest?sbi=${SBI}`,
        options
      )
    })
  })
})
