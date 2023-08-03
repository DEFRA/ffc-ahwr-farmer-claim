const mockSession = require('../../../../../app/session/index')
const mockJwtDecode = require('../../../../../app/auth/token-verify/jwt-decode')
const mockBase = require('../../../../../app/api-requests/rpa-api/base')
const person = require('../../../../../app/api-requests/rpa-api/person')
jest.mock('../../../../../app/session/index')
jest.mock('../../../../../app/auth/token-verify/jwt-decode')
jest.mock('../../../../../app/api-requests/rpa-api/base')

jest.mock('../../../../../app/config', () => {
  const originalModule = jest.requireActual('../../../../../app/config')
  return {
    ...originalModule,
    authConfig: {
      ruralPaymentsAgency: {
        hostname: 'hostname'
      },
      defraId: {
        tenantName: 'tenantName'
      }
    }
  }
})

describe('Person', () => {
  test('when getPersonSummary called - returns valid person data', async () => {
    const apimToken = 'apim_token'
    mockSession.getToken.mockResolvedValueOnce({ access_token: 1234567 })
    mockJwtDecode.mockResolvedValue({ contactId: 1234567 })
    mockBase.get.mockResolvedValueOnce({
      _data: {
        firstName: 'Bill',
        middleName: 'James',
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      }
    })

    const result = await person.getPersonSummary(expect.anything(), apimToken)

    expect(mockSession.getToken).toHaveBeenCalledTimes(1)
    expect(mockJwtDecode).toHaveBeenCalledTimes(1)
    expect(mockBase.get).toHaveBeenCalledTimes(1)
    expect(result.firstName).toMatch('Bill')
    expect(result.middleName).toMatch('James')
    expect(result.lastName).toMatch('Smith')
    expect(result.email).toMatch('billsmith@testemail.com')
    expect(result.id).toEqual(1234567)
    expect(result.customerReferenceNumber).toMatch('1103452436')
  })

  test.each([
    { firstName: 'Bill', middleName: 'James', lastName: 'Smith', expectedResult: 'Bill James Smith' },
    { firstName: 'Bill', middleName: '', lastName: '', expectedResult: 'Bill' },
    { firstName: '', middleName: 'James', lastName: '', expectedResult: 'James' },
    { firstName: '', middleName: '', lastName: 'Smith', expectedResult: 'Smith' },
    { firstName: 'Bill', middleName: '', lastName: 'Smith', expectedResult: 'Bill Smith' },
    { firstName: '', middleName: '', lastName: '', expectedResult: '' },
    { firstName: null, middleName: null, lastName: null, expectedResult: '' }
  ])('when getPersonName called with Firstname=$firstName Middlename=$middleName Lastname=$lastName returns $expectedResult', async ({ firstName, middleName, lastName, expectedResult }) => {
    const personSummary = {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName
    }
    const result = person.getPersonName(personSummary)
    expect(result).toEqual(expectedResult)
  })
})
