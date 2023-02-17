describe('Get users from eligibility service', () => {
  let getByEmail
  let eligibilityApi
  const email = 'hit@email.com'

  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()

    jest.mock('../../../../app/config')

    eligibilityApi = require('../../../../app/api-requests/eligibility-service')
    jest.mock('../../../../app/api-requests/eligibility-service')

    const users = require('../../../../app/api-requests/users')
    getByEmail = users.getByEmail
  })

  test('makes request to download users blob', async () => {
    await getByEmail('email')

    expect(eligibilityApi.getEligibleUserByEmail).toHaveBeenCalledTimes(1)
    expect(eligibilityApi.getEligibleUserByEmail).toHaveBeenCalledWith('email')
  })

  test('return null when email doesn\'t match any users', async () => {
    eligibilityApi.getEligibleUserByEmail.mockResolvedValue(null)

    const res = await getByEmail('miss@email.com')

    expect(res).toEqual(null)
  })

  test('return user data when email is matched', async () => {
    const response = `{ "email": "${email}" }`
    eligibilityApi.getEligibleUserByEmail.mockResolvedValue(response)

    const res = await getByEmail(email)

    expect(res).toEqual(response)
  })
})
