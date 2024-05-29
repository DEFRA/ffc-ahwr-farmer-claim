const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { getEndemicsClaim } = require('../../../../../app/session')
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim

jest.mock('../../../../../app/session')

const sheepTestResultsMockData = [
  { diseaseType: 'flystrike', result: '' },
  { diseaseType: 'sheepScab', result: '' },
  { diseaseType: 'other', result: '' }
]
describe('Sheep test result tests', () => {
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = '/claim/endemics/sheep-test-results'

  setEndemicsClaimMock.mockImplementation(() => { })
  jest.mock('../../../../../app/config', () => {
    const originalModule = jest.requireActual('../../../../../app/config')
    return {
      ...originalModule,
      authConfig: {
        defraId: {
          hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
          oAuthAuthorisePath: '/oauth2/v2.0/authorize',
          policy: 'b2c_1a_signupsigninsfi',
          redirectUri: 'http://localhost:3000/apply/signin-oidc',
          clientId: 'dummy_client_id',
          serviceId: 'dummy_service_id',
          scope: 'openid dummy_client_id offline_access'
        },
        ruralPaymentsAgency: {
          hostname: 'dummy-host-name',
          getPersonSummaryUrl: 'dummy-get-person-summary-url',
          getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
          getOrganisationUrl: 'dummy-get-organisation-url'
        }
      },
      endemics: {
        enabled: true
      }
    }
  })

  describe(`GET ${url} route`, () => {
    test(`Get ${url} Returns 200`, async () => {
      const options = {
        method: 'GET',
        url: `${url}?diseaseType=sheepScab`,
        auth
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: [...sheepTestResultsMockData, { diseaseType: 'sheepScab', result: '', isCurrentPage: true }]
      }))
      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/sheep-test-results?diseaseType=other')
    })
  })
  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('Post Returns 400 when test result is  not selected', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({ ...test, isCurrentPage: test.diseaseType === 'flystrike' }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('What was the Flystrike test result?')
      expect($('#testResult-error').text()).toMatch('Select a test result')
      expect($('.govuk-back-link').attr('href')).toContain('/claim/endemics/sheep-tests')
    })

    test('Post Returns 302 when test result is  selected', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, testResult: 'positive' },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({ ...test, isCurrentPage: test.diseaseType === 'sheepScab', result: 'positive' }))
      }))

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test('Post Returns 400 when disease type is Other and test and test result is not provided', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, diseaseType: '', testResult: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({ ...test, isCurrentPage: test.diseaseType === 'other' }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the name of the condition or disease')
      expect($('a').text()).toMatch('Enter the test result')
    })

    test('Post Returns 400 when disease type is Other and latest test and test result is not provided and Add another button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two', 'disease three', ''],
          testResult: ['test result one', 'test result two', 'test result three', ''],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the name of the condition or disease')
      expect($('a').text()).toMatch('Enter the test result')
    })

    test('Post Returns 302 when disease type is Other and test and test result is provided and Add continue button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: 'disease one',
          testResult: 'test result one',
          submitButton: 'continue'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result: test.diseaseType === 'other' ? [{ diseaseType: 'disease one', testResult: 'test result one' }] : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/claim/endemics/check-answers')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Post Returns 400 when disease type is Other and latest test is not provided and continue button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two', 'disease three', ''],
          testResult: ['test result one', 'test result two', 'test result three', 'test result three'],
          submitButton: 'continue'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the name of the condition or disease')
    })
    test('Post Returns 400 when disease type is Other and latest test result is not provided and continue button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two', 'disease three'],
          testResult: ['test result one', 'test result two', ''],
          submitButton: 'continue'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the test result')
    })

    test('Post Returns 400 when disease type is Other and test and test result is already in the list', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two', 'disease three', 'disease one'],
          testResult: ['test result one', 'test result two', 'test result three', 'test result one'],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' },
                  { diseaseType: 'disease three', testResult: 'test result three' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('You’ve already included this kind of disease')
    })

    test('Post Returns 400 when disease type is Other and test and test result is already in the list and multiple times repeated', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease one', 'disease one', 'disease two', 'disease three', 'disease one'],
          testResult: ['test result one', 'test result one', 'test result one', 'test result two', 'test result three', 'test result one'],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('You’ve already included this kind of disease')
    })

    test('Post Returns 400 when disease type is Other and test and test result is already in the list and multiple times repeated also there are multiple empty diseases', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease one', 'disease two', 'disease two', '', '', '', 'disease three', 'disease one'],
          testResult: ['test result one', 'test result one', 'test result two', 'test result two', '', '', '', 'test result three', 'test result one'],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('You’ve already included this kind of disease')
    })

    test('Post Returns 400 when disease type is Other and test and test result is not provided there are multiple empty diseases', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease', 'disease one', 'disease two', '', '', ''],
          testResult: ['test result', 'test result one', 'test result two', '', '', ''],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the name of the condition or disease')
    })

    test('Post Returns 400 when disease type is Other and test result is not provided', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease', 'disease one', 'disease two', 'disease three'],
          testResult: ['test result', 'test result one', 'test result two', ''],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the test result')
    })
    test('Post Returns 400 when one of the disease types is provided and Other is not provided', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['', 'disease one'],
          testResult: ['test result', ''],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Enter the test result')
    })

    test('Post Returns 400 when disease type is Other and test result is not provided and test is already in the list', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease', 'disease one', 'disease two', 'disease one'],
          testResult: ['test result', 'test result one', 'test result two', ''],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('You’ve already included this kind of disease')
      expect($('a').text()).toMatch('Enter the test result')
    })

    test('Post Returns 400 when disease type is Other and test result is provided with invalid information', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease', 'disease one', 'disease two', 'disease three@%$'],
          testResult: ['test result', 'test result one', 'test result two', 'test result three$%££@£'],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(400)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect($('a').text()).toMatch('Condition or disease must only include letters a to z, numbers, special characters such as hyphens and spaces')
      expect($('a').text()).toMatch('Test result must only include letters a to z, numbers, special characters such as hyphens and spaces')
    })

    test('Post Returns 302 when disease type is Other and test and test result is provided and continue button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two'],
          testResult: ['test result one', 'test result two'],
          submitButton: 'continue'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/claim/endemics/check-answers')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
    test('Post Returns 200 when disease type is Other and test and test result is provided when add another button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two'],
          testResult: ['test result one', 'test result two'],
          submitButton: 'addAnother'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test('Post Returns 200 when disease type is Other and delete button pressed', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          diseaseType: ['disease one', 'disease two'],
          testResult: ['test result one', 'test result two'],
          delete: '1'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      getEndemicsClaim.mockImplementation(() => ({
        typeOfLivestock: 'sheep',
        sheepEndemicsPackage: 'reducedExternalParasites',
        sheepTestResults: sheepTestResultsMockData.map((test) => ({
          ...test,
          result:
            test.diseaseType === 'other'
              ? [
                  { diseaseType: 'disease one', testResult: 'test result one' },
                  { diseaseType: 'disease two', testResult: 'test result two' }
                ]
              : '',
          isCurrentPage: test.diseaseType === 'other'
        }))
      }))

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toMatch('Give details of the other disease tested or sampled for')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
  })
})
