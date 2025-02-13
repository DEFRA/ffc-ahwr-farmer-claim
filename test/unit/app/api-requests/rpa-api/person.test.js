import { getToken } from '../../../../../app/session/index.js'
import { decodeJwt } from '../../../../../app/auth/token-verify/jwt-decode.js'
import { get } from '../../../../../app/api-requests/rpa-api/base.js'
import { getPersonName, getPersonSummary } from '../../../../../app/api-requests/rpa-api/person.js'

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
    getToken.mockResolvedValueOnce({ access_token: 1234567 })
    decodeJwt.mockResolvedValue({ contactId: 1234567 })
    get.mockResolvedValueOnce({
      _data: {
        firstName: 'Bill',
        middleName: 'James',
        lastName: 'Smith',
        email: 'billsmith@testemail.com',
        id: 1234567,
        customerReferenceNumber: '1103452436'
      }
    })

    const result = await getPersonSummary(expect.anything(), apimToken)

    expect(getToken).toHaveBeenCalledTimes(1)
    expect(decodeJwt).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledTimes(1)
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
      firstName,
      middleName,
      lastName
    }
    const result = getPersonName(personSummary)
    expect(result).toEqual(expectedResult)
  })
})
