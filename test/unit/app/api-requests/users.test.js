const { usersContainer, usersFile } = require('../../../../app/config').storageConfig

describe('Get users', () => {
  let downloadBlobMock
  let getByEmail
  const email = 'hit@email.com'

  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()

    downloadBlobMock = require('../../../../app/lib/storage/download-blob')
    jest.mock('../../../../app/lib/storage/download-blob')

    const users = require('../../../../app/api-requests/users')
    getByEmail = users.getByEmail
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
