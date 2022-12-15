const { usersContainer, usersFile } = require('../../../../app/config').storageConfig

const mockConfig = require('../../../../app/config')

describe('Get users from blob storage', () => {
  let downloadBlobMock
  let getByEmail
  let eligibilityApi
  const email = 'hit@email.com'

  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()

    jest.mock('../../../../app/config', () => ({
      ...mockConfig,
      eligibilityApiEnabled: false
    }))

    downloadBlobMock = require('../../../../app/lib/storage/download-blob')
    jest.mock('../../../../app/lib/storage/download-blob')

    const users = require('../../../../app/api-requests/users')
    getByEmail = users.getByEmail

    eligibilityApi = require('../../../../app/api-requests/eligibility-service')
    jest.mock('../../../../app/api-requests/eligibility-service')
  })

  test('makes request to download users blob', async () => {
    await getByEmail('email')

    expect(downloadBlobMock).toHaveBeenCalledTimes(1)
    expect(downloadBlobMock).toHaveBeenCalledWith(usersContainer, usersFile)
  })

  test.each([
    { fileContent: null },
    { fileContent: undefined }
  ])('return undefined when blob content is $fileContent', async ({ fileContent }) => {
    downloadBlobMock.mockResolvedValue(fileContent)

    const res = await getByEmail('email')

    expect(res).toEqual(undefined)
  })

  test('return undefined when email doesn\'t match any users', async () => {
    const fileContent = '[{ "email": "a@b.com" }]'
    downloadBlobMock.mockResolvedValue(fileContent)

    const res = await getByEmail('miss@email.com')

    expect(res).toEqual(undefined)
  })

  test('return user data when email is matched', async () => {
    const fileContent = `[{ "email": "${email}" }]`
    downloadBlobMock.mockResolvedValue(fileContent)

    const res = await getByEmail(email)

    expect(eligibilityApi.getEligibleUserByEmail).toHaveBeenCalledTimes(0)
    expect(res).toEqual(JSON.parse(fileContent)[0])
  })

  test.each([
    { fileContent: `[{ "email": "${email}" }]` },
    { fileContent: `[{ "email": "${email}" , "isTest": true }]` }
  ])('return user data when test email is matched but has different casing', async ({ fileContent }) => {
    downloadBlobMock.mockResolvedValue(fileContent)

    const res = await getByEmail(email.toUpperCase())

    expect(res).toEqual(JSON.parse(fileContent)[0])
    expect(res.isTest).toEqual(JSON.parse(fileContent)[0].isTest)
  })
})

describe('Get users from eligibility service', () => {
  let downloadBlobMock
  let getByEmail
  let eligibilityApi
  const email = 'hit@email.com'

  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()

    jest.mock('../../../../app/config', () => ({
      ...mockConfig,
      eligibilityApiEnabled: true
    }))

    downloadBlobMock = require('../../../../app/lib/storage/download-blob')
    jest.mock('../../../../app/lib/storage/download-blob')

    eligibilityApi = require('../../../../app/api-requests/eligibility-service')
    jest.mock('../../../../app/api-requests/eligibility-service')

    const users = require('../../../../app/api-requests/users')
    getByEmail = users.getByEmail
  })

  test('makes request to download users blob', async () => {
    await getByEmail('email')

    expect(downloadBlobMock).toHaveBeenCalledTimes(0)
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
