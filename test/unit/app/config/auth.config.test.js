import { getAuthConfig } from '../../../../app/config/auth.js'

describe('Auth config', () => {
  const env = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...env }
  })

  test.each([
    {
      processEnv: {
        tenant: 'testtenant',
        policy: 'testpolicy',
        clientId: 'dummyclientid',
        serviceId: 'dummyserviceid'
      },
      config: {
        defraId: {
          hostname: 'https://testtenant.b2clogin.com/testtenant.onmicrosoft.com',
          oAuthAuthorisePath: '/oauth2/v2.0/authorize',
          policy: 'testpolicy',
          clientId: 'dummyclientid',
          serviceId: 'dummyserviceid',
          scope: 'openid dummyclientid offline_access'
        }
      }
    }
  ])('GIVEN $processEnv EXPECT $config', (testCase) => {
    process.env.DEFRA_ID_TENANT = testCase.processEnv.tenant
    process.env.DEFRA_ID_POLICY = testCase.processEnv.policy
    process.env.DEFRA_ID_CLIENT_ID = testCase.processEnv.clientId
    process.env.DEFRA_ID_SERVICE_ID = testCase.processEnv.serviceId

    const config = getAuthConfig()

    expect(config).toEqual(testCase.config)
  })

  afterEach(() => {
    process.env = env
  })
})
