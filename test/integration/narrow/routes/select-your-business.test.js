const { when, resetAllWhenMocks } = require('jest-when')
const cheerio = require('cheerio')
const getCrumbs = require('../../../utils/get-crumbs')
const config = require('../../../../app/config')
const sessionKeys = require('../../../../app/session/keys')

const MOCK_NOW = new Date()

const API_URL = '/claim/select-your-business'

describe('API select-your-business', () => {
  let dateSpy
  let logSpy
  let session

  beforeAll(() => {
    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => MOCK_NOW)
    Date.now = jest.fn(() => MOCK_NOW.valueOf())

    logSpy = jest.spyOn(console, 'log')

    session = require('../../../../app/session')
    jest.mock('../../../../app/session')

    jest.mock('../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../app/config')
      return {
        ...originalModule,
        selectYourBusiness: {
          enabled: true
        }
      }
    })
  })

  afterAll(() => {
    jest.clearAllMocks()
    jest.resetModules()
    resetAllWhenMocks()
    dateSpy.mockRestore()
  })

  describe('GET', () => {
    test.each([
      {
        toString: () => 'HTTP 200',
        given: {
        },
        when: {
        },
        expect: {
          consoleLogs: [
            `${MOCK_NOW.toISOString()} Log message: ${JSON.stringify({})}`
          ]
        }
      }
    ])('%s', async (testCase) => {
      const options = {
        method: 'GET',
        url: `${API_URL}`,
        auth: {
          credentials: { reference: '1111', sbi: '122333' },
          strategy: 'cookie'
        }
      }

      const response = await global.__SERVER__.inject(options)
      const $ = cheerio.load(response.payload)

      expect(response.statusCode).toBe(200)
      expect(session.setSelectYourBusiness).toHaveBeenCalledTimes(1)
      expect(session.setSelectYourBusiness).toHaveBeenCalledWith(
        expect.anything(),
        sessionKeys.selectYourBusiness.eligibleBusinesses,
        expect.anything()
      )
      expect($('title').text()).toEqual(config.serviceName)
      expect($('.govuk-fieldset__heading').first().text().trim()).toEqual('Choose the SBI you would like to apply for:')
    })
  })

  describe('POST', () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test.each([
      {
        toString: () => 'HTTP 200',
        given: {
          payload: {
            whichBusiness: '122333'
          }
        },
        when: {
        },
        expect: {
          consoleLogs: [
            `${MOCK_NOW.toISOString()} Latest application is eligible to claim : ${JSON.stringify({
              sbi: '122333'
            })}`,
            `${MOCK_NOW.toISOString()} Latest application is eligible to claim : ${JSON.stringify({
              sbi: '123456789'
            })}`,
            `${MOCK_NOW.toISOString()} Selected business: ${JSON.stringify({
              sbi: '122333'
            })}`
          ]
        }
      }
    ])('%s', async (testCase) => {
      const options = {
        method: 'POST',
        url: `${API_URL}`,
        payload: { crumb, ...testCase.given.payload },
        headers: { cookie: `crumb=${crumb}` },
        auth: {
          credentials: { reference: '1111', sbi: '122333' },
          strategy: 'cookie'
        }
      }
      const businesses = [
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
        }
      ]
      when(session.getSelectYourBusiness)
        .calledWith(
          expect.anything(),
          sessionKeys.selectYourBusiness.eligibleBusinesses
        )
        .mockReturnValue(businesses)

      const response = await global.__SERVER__.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toEqual('visit-review')
      expect(session.setSelectYourBusiness).toHaveBeenCalledTimes(2)
      expect(session.setSelectYourBusiness).toHaveBeenCalledWith(
        expect.anything(),
        sessionKeys.selectYourBusiness.eligibleBusinesses,
        businesses
      )
      expect(session.setSelectYourBusiness).toHaveBeenCalledWith(
        expect.anything(),
        sessionKeys.selectYourBusiness.whichBusiness,
        '122333'
      )
      testCase.expect.consoleLogs.forEach(
        (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
      )
    })

    test.each([
      {
        toString: () => 'HTTP 400 - empty payload',
        given: {
          payload: {}
        }
      }
    ])('%s', async (testCase) => {
      const options = {
        method: 'POST',
        url: `${API_URL}`,
        payload: { crumb, ...testCase.given.payload },
        headers: { cookie: `crumb=${crumb}` },
        auth: {
          credentials: { reference: '1111', sbi: '111111111' },
          strategy: 'cookie'
        }
      }
      when(session.getSelectYourBusiness)
        .calledWith(
          expect.anything(),
          sessionKeys.selectYourBusiness.eligibleBusinesses
        )
        .mockReturnValue([])

      const response = await global.__SERVER__.inject(options)
      const $ = cheerio.load(response.payload)

      expect(response.statusCode).toBe(400)
      expect(response.statusMessage).toEqual('Bad Request')
      expect($('title').text()).toEqual(config.serviceName)
      expect($('.govuk-fieldset__heading').first().text().trim()).toEqual('Choose the SBI you would like to apply for:')
    })
  })
})
