let mockSession
let mockJwtDecode
let mockBase
let organisation
jest.mock('../../../../../app/session/index')
jest.mock('../../../../../app/auth/token-verify/jwt-decode')
jest.mock('../../../../../app/api-requests/rpa-api/base')

describe('Organisation', () => {
  const env = process.env

  beforeEach(async () => {
    process.env = { ...env }

    jest.mock('../../../../../app/config', () => ({
      ...jest.requireActual('../../../../../app/config'),
      authConfig: {
        defraId: {
          enabled: true
        },
        ruralPaymentsAgency: {
          hostname: 'dummy-host-name',
          getPersonSummaryUrl: 'dummy-get-person-summary-url',
          getOrganisationPermissionsUrl: 'dummy-get-organisationId-permissions-url',
          getOrganisationUrl: 'dummy-get-organisationId-url'
        }
      }
    }))
    mockSession = require('../../../../../app/session/index')
    mockJwtDecode = require('../../../../../app/auth/token-verify/jwt-decode')
    mockBase = require('../../../../../app/api-requests/rpa-api/base')
    organisation = require('../../../../../app/api-requests/rpa-api/organisation')
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.resetModules()

    process.env = env
  })

  test('when organisationIsEligible called and has valid permissions - returns valid organisation', async () => {
    const personId = 1234567
    const apimToken = 'apim_token'
    mockSession.getToken.mockResolvedValueOnce({ access_token: 1234567 })
    mockJwtDecode.mockResolvedValue({ currentRelationshipId: 1234567 })
    mockBase.get.mockResolvedValueOnce({
      data: {
        personRoles: [
          {
            personId,
            role: 'Business Partner'
          }
        ],
        personPrivileges: [
          {
            personId,
            privilegeNames: [
              'Full permission - business'
            ]
          },
          {
            personId,
            privilegeNames: [
              'Submit - bps'
            ]
          }
        ]
      }
    })
    mockBase.get.mockResolvedValueOnce({
      _data: {
        id: personId,
        name: 'Mrs Jane Black',
        sbi: 106979907,
        address: {
          address1: '1 Test House',
          address2: 'Test Road',
          address3: '',
          address4: null,
          address5: null,
          pafOrganisationName: null,
          flatName: null,
          buildingNumberRange: '1',
          buildingName: 'TEST HOUSE',
          street: 'TEST ROAD',
          city: 'Test City',
          county: 'Test County',
          postalCode: 'TS1 1TS',
          country: 'Test Country',
          uprn: '',
          dependentLocality: '',
          doubleDependentLocality: null,
          addressTypeId: null
        },
        email: null,
        businessReference: '1100165525'
      }
    })

    const result = await organisation.organisationIsEligible(expect.anything(), personId, apimToken)

    expect(mockSession.getToken).toHaveBeenCalledTimes(1)
    expect(mockJwtDecode).toHaveBeenCalledTimes(1)
    expect(mockBase.get).toHaveBeenCalledTimes(2)
    expect(result.organisationPermission).toBeTruthy()
    expect(result.organisation.id).toEqual(1234567)
    expect(result.organisation.name).toMatch('Mrs Jane Black')
    expect(result.organisation.sbi).toEqual(106979907)
    expect(result.organisation.address.address1).toMatch('1 Test House')
    expect(result.organisation.address.city).toMatch('Test City')
    expect(result.organisation.address.county).toMatch('Test County')
    expect(result.organisation.address.postalCode).toMatch('TS1 1TS')
  })

  test('when organisationIsEligible called and has invalid permissions - throws error', async () => {
    const personId = 7654321
    const organisationId = 1234567
    const apimToken = 'apim_token'
    mockSession.getToken.mockResolvedValueOnce({ access_token: organisationId })
    mockJwtDecode.mockImplementation(() => {
      return {
        currentRelationshipId: organisationId
      }
    })
    mockBase.get.mockResolvedValueOnce({
      data: {
        personRoles: [
          {
            personId,
            role: 'Fake Permission'
          }
        ],
        personPrivileges: [
          {
            personId,
            privilegeNames: [
              'Invalid permission'
            ]
          }
        ]
      }
    })

    try {
      await organisation.organisationIsEligible(expect.anything(), personId, apimToken)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error).toHaveProperty('message', `Person id ${personId} does not have the required permissions for organisation id ${organisationId}`)
    }
    expect(mockSession.getToken).toHaveBeenCalledTimes(1)
    expect(mockJwtDecode).toHaveBeenCalledTimes(1)
    expect(mockBase.get).toHaveBeenCalledTimes(2)
  })

  test.each([
    { address1: '1 Test House', city: 'Test City', county: 'Test County', postalCode: 'Test Postcode', expectedResult: '1 Test House,Test City,Test County,Test Postcode' },
    { address1: '1 Test House', city: '', county: 'Test County', postalCode: 'Test Postcode', expectedResult: '1 Test House,Test County,Test Postcode' },
    { address1: '1 Test House', city: 'Test City', county: '', postalCode: 'Test Postcode', expectedResult: '1 Test House,Test City,Test Postcode' },
    { address1: '1 Test House', city: 'Test City', county: 'Test County', postalCode: '', expectedResult: '1 Test House,Test City,Test County' },
    { address1: '', city: '', county: '', postalCode: '', expectedResult: '' },
    { address1: null, city: null, county: null, postalCode: null, expectedResult: '' }
  ])('when getOrganisationAddress called with individual address fields, returns full address as $expectedResult',
    async ({ address1, city, county, postalCode, expectedResult }) => {
      const address = {
        address1,
        city,
        county,
        postalCode
      }
      const result = organisation.getOrganisationAddress(address)
      expect(result).toEqual(expectedResult)
    })
})
