const { v4: uuid } = require('uuid')
const { farmerClaim } = require('../../../../app/constants/user-types')

describe('Auth plugin test', () => {
  let getByEmail
  const organisation = { name: 'my-org' }

  beforeAll(async () => {
    jest.resetAllMocks()

    jest.mock('../../../../app/config', () => {
      const originalModule = jest.requireActual('../../../../app/config')
      return {
        ...originalModule,
        authConfig: {
          defraId: {
            enabled: false
          }
        }
      }
    })
    jest.mock('../../../../app/session')
    const orgs = require('../../../../app/api-requests/users')
    getByEmail = orgs.getByEmail
    jest.mock('../../../../app/api-requests/users')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const validEmail = 'dairy@ltd.com'

  describe('GET requests to /login', () => {
    const url = '/claim/login'
    const email = uuid() + validEmail
    const redirectTo = `/claim/select-your-business?businessEmail=${email}`

    async function login () {
      const token = uuid()
      const options = {
        method: 'GET',
        url: `/claim/verify-login?email=${email}&token=${token}`
      }

      await global.__SERVER__.app.magiclinkCache.set(email, [token])
      await global.__SERVER__.app.magiclinkCache.set(token, { email, redirectTo, userType: farmerClaim })

      return global.__SERVER__.inject(options)
    }

    test('when logged in with nothing in session loads data into session', async () => {
      const loginResponse = await login()

      const cookieHeaders = loginResponse.headers['set-cookie'].map(x => x.split('; ')[0]).join('; ')

      const options = {
        method: 'GET',
        url,
        headers: { cookie: cookieHeaders }
      }
      getByEmail.mockResolvedValue(organisation)

      const res = await global.__SERVER__.inject(options)
      const cookieHeader = res.headers['set-cookie']

      const maxAgeOfCookieInSeconds = cookieHeader[0].split('; ').filter(x => x.split('=')[0].toLowerCase() === 'max-age')[0].split('=')[1]

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(redirectTo)
      expect(parseInt(maxAgeOfCookieInSeconds, 10) * 1000).toEqual(259200000)
    })

    test('when logged in with data in session redirected to select your business', async () => {
      const loginResponse = await login()

      const cookieHeaders = loginResponse.headers['set-cookie'].map(x => x.split('; ')[0]).join('; ')

      const options = {
        method: 'GET',
        url,
        headers: { cookie: cookieHeaders }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(redirectTo)
    })
  })
})
