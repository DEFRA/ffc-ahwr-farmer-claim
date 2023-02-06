const sendMagicLinkEmail = require('../../../../../app/lib/email/send-magic-link-email')
const { templateIdFarmerClaimLogin } = require('../../../../../app/config').notifyConfig
const { farmerClaim } = require('../../../../../app/constants/user-types')

const getToken = require('../../../../../app/lib/auth/get-token')
jest.mock('../../../../../app/lib/auth/get-token')

const sendEmail = require('../../../../../app/lib/email/send-email')
jest.mock('../../../../../app/lib/email/send-email')
let cacheData = { }
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

const config = require('../../../../../app/config')
jest.mock('../../../../../app/config', () => ({
  ...jest.requireActual('../../../../../app/config'),
  serviceName: 'Annual health and welfare review of livestock',
  serviceUri: 'http://localhost:3004',
  selectYourBusiness: {
    enabled: false
  }
}))
const serviceUri = config.serviceUri

describe('Send Magic Link test', () => {
  const email = 'test@unit-test.com'
  const sendEmailResponse = true
  const testToken = '644a2a30-7487-4e98-a908-b5ecd82d5225'

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
    expect(cacheData[token]).toEqual({ email, redirectTo: 'visit-review', userType: farmerClaim })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith(templateIdFarmerClaimLogin, email, {
      personalisation: { magiclink: `${serviceUri}/verify-login?token=${token}&email=${email}` },
      reference: token
    })
  })
})
