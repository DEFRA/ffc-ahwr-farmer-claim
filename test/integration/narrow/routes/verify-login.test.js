describe('verify-login route', () => {
  let lookupToken
  let setAuthCookie

  beforeAll(async () => {
    jest.resetAllMocks()
    jest.mock('ffc-ahwr-event-publisher')
    jest.mock('../../../../app/api-requests/users')

    jest.mock('../../../../app/auth', () => {
      return {
        lookupToken: jest.fn().mockImplementation(() => {
          return { email: 'someemail@email.com' }
        }),
        setAuthCookie: jest.fn()
      }
    })

    const auth = require('../../../../app/auth')
    lookupToken = auth.lookupToken
    setAuthCookie = auth.lookupToken

    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      authConfig: {
        defraId: {
          enabled: false
        }
      }
    }))
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('GET /verify-login returns 400 when missing token', async () => {
    const options = {
      method: 'GET',
      url: '/claim/verify-login?email=test@test.com'
    }

    const result = await global.__SERVER__.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('GET /verify-login returns 400 when cached email does not match email query param', async () => {
    const options = {
      method: 'GET',
      url: '/claim/verify-login?email=test@test.com&token=0c8f9708-453b-11ed-b878-0242ac120002'
    }

    const result = await global.__SERVER__.inject(options)
    expect(result.statusCode).toBe(400)
  })

  test('GET /verify-login returns 302', async () => {
    const cacheDropSpy = jest.spyOn(global.__SERVER__.app.magiclinkCache, 'drop')
    const magiclinkCache = global.__SERVER__.app.magiclinkCache
    const options = {
      method: 'GET',
      url: '/claim/verify-login?email=someemail@email.com&token=0c8f9708-453b-11ed-b878-0242ac120002'
    }

    const result = await global.__SERVER__.inject(options)
    expect(result.statusCode).toBe(302)
    expect(lookupToken).toBeCalledTimes(1)
    expect(setAuthCookie).toBeCalledTimes(1)
    expect(cacheDropSpy).toBeCalledTimes(2)
    expect(cacheDropSpy).toHaveBeenNthCalledWith(1, 'someemail@email.com')
    expect(cacheDropSpy).toHaveBeenNthCalledWith(2, '0c8f9708-453b-11ed-b878-0242ac120002')
    expect(await magiclinkCache.get('someemail@email.com')).toEqual(null)
    expect(await magiclinkCache.get('0c8f9708-453b-11ed-b878-0242ac120002')).toEqual(null)
    cacheDropSpy.mockRestore()
  })
})
