const { farmerClaim } = require('../../../../../app/constants/user-types')
let cacheData = { }
let sendMagicLinkEmail
let getToken
let sendEmail
const requestGetMock = {
  server:
      {
        app:
          {
            magiclinkCache: {
              get: (key) => {
                return cacheData[key]
              },
              set: (key, value) => {
                cacheData[key] = value
              }
            }
          }
      }
}

describe('Send Magic Link test', () => {
  const email = 'test@unit-test.com'
  const sendEmailResponse = true
  const testToken = '644a2a30-7487-4e98-a908-b5ecd82d5225'

  beforeAll(() => {
    jest.resetModules()
    jest.mock('../../../../../app/config', () => ({
      ...jest.requireActual('../../../../../app/config'),
      serviceName: 'Annual health and welfare review of livestock',
      serviceUri: 'http://localhost:3004'
    }))
    sendMagicLinkEmail = require('../../../../../app/lib/email/send-magic-link-email')

    getToken = require('../../../../../app/lib/auth/get-token')
    jest.mock('../../../../../app/lib/auth/get-token')

    sendEmail = require('../../../../../app/lib/email/send-email')
    jest.mock('../../../../../app/lib/email/send-email')
  })

  beforeEach(() => {
    cacheData = {}
    jest.resetAllMocks()

    sendEmail.mockResolvedValue(sendEmailResponse)
  })

  test('sends email for farmer claim', async () => {
    const token = testToken
    getToken.mockResolvedValue(token)

    const response = await sendMagicLinkEmail.sendFarmerClaimLoginMagicLink(requestGetMock, email)

    expect(response).toEqual(sendEmailResponse)
    expect(cacheData[email]).toEqual([token])
    expect(cacheData[token]).toEqual({ email, redirectTo: `select-your-business?businessEmail=${email}`, userType: farmerClaim })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith(expect.anything(), email, {
      personalisation: { magiclink: `http://localhost:3004/verify-login?token=${token}&email=${email}` },
      reference: token
    })
  })

  describe('Send Magic Link test with select your business enabled', () => {
    const email = 'test@unit-test.com'
    const sendEmailResponse = true
    const testToken = '644a2a30-7487-4e98-a908-b5ecd82d5225'

    beforeAll(() => {
      jest.resetModules()
      jest.mock('../../../../../app/config', () => ({
        ...jest.requireActual('../../../../../app/config'),
        serviceName: 'Annual health and welfare review of livestock',
        serviceUri: 'http://localhost:3004'
      }))
      sendMagicLinkEmail = require('../../../../../app/lib/email/send-magic-link-email')

      getToken = require('../../../../../app/lib/auth/get-token')
      jest.mock('../../../../../app/lib/auth/get-token')
      sendEmail = require('../../../../../app/lib/email/send-email')
      jest.mock('../../../../../app/lib/email/send-email')
    })

    beforeEach(() => {
      cacheData = {}
      jest.resetAllMocks()
      sendEmail.mockResolvedValue(sendEmailResponse)
    })

    test('sends email for farmer claim', async () => {
      const token = testToken
      getToken.mockResolvedValue(token)
      const response = await sendMagicLinkEmail.sendFarmerClaimLoginMagicLink(requestGetMock, email)
      expect(response).toEqual(sendEmailResponse)
      expect(cacheData[email]).toEqual([token])
      expect(cacheData[token]).toEqual({ email, redirectTo: 'select-your-business?businessEmail=test@unit-test.com', userType: farmerClaim })
      expect(sendEmail).toHaveBeenCalledTimes(1)
      expect(sendEmail).toHaveBeenCalledWith(expect.anything(), email, {
        personalisation: { magiclink: `http://localhost:3004/verify-login?token=${token}&email=${email}` },
        reference: token
      })
    })
  })
})
