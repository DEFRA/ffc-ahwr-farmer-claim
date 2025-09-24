import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { raiseInvalidDataEvent } from '../../../../../app/event/raise-invalid-data-event.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import expectPhaseBanner from 'assert'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { config } from '../../../../../app/config'

jest.mock('../../../../../app/session')
jest.mock('../../../../../app/event/raise-invalid-data-event')

const auth = { credentials: {}, strategy: 'cookie' }
const url = '/claim/endemics/number-of-samples-tested'

describe('Number of samples tested test', () => {
  let server

  beforeAll(async () => {
    raiseInvalidDataEvent.mockImplementation(() => {})
    setEndemicsClaim.mockImplementation(() => {})
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })
    config.pigUpdates.enabled = false
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many samples were tested?')
      expect($('title').text()).toContain('How many samples were tested? - Get funding to improve animal health and welfare')
      expect($('.govuk-hint').text().trim()).toEqual('You can find this on the summary the vet gave you.')

      expectPhaseBanner.ok($)
    })

    test('when not logged in redirects to /sign-in', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb

    beforeEach(async () => {
      crumb = await getCrumbs(server)
    })

    test('when not logged in redirects to /sign-in', async () => {
      const options = {
        method: 'POST',
        url,
        payload: { crumb, numberOfSamplesTested: '123' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(`${config.dashboardServiceUri}/sign-in`)
    })

    test('shows error when payload is invalid', async () => {
      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested: '' },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('How many samples were tested?')
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Enter the number of samples tested')
      expect($('#numberOfSamplesTested-error').text()).toMatch('Enter the number of samples tested')
    })

    describe('pig updates feature flag disabled', () => {
      test.each([
        { numberOfSamplesTested: '6', lastReviewTestResults: 'positive' },
        { numberOfSamplesTested: '30', lastReviewTestResults: 'negative' }
      ])('redirects to next page if $numberOfSamplesTested and $lastReviewTestResults', async ({ numberOfSamplesTested, lastReviewTestResults }) => {
        config.pigUpdates.enabled = false
        getEndemicsClaim.mockImplementation(() => { return { vetVisitsReviewTestResults: lastReviewTestResults } })

        const options = {
          method: 'POST',
          url,
          auth,
          payload: { crumb, numberOfSamplesTested },
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await server.inject(options)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location.toString()).toEqual('/claim/endemics/disease-status')
        expect(setEndemicsClaim).toHaveBeenCalled()
      })
    })

    test.each([
      { numberOfSamplesTested: '5', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '7', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '0', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '9999', lastReviewTestResults: 'positive' },
      { numberOfSamplesTested: '29', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '31', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '0', lastReviewTestResults: 'negative' },
      { numberOfSamplesTested: '9999', lastReviewTestResults: 'negative' }
    ])('redirects to exception page if $numberOfSamplesTested and $lastReviewTestResults dont match validation', async ({ numberOfSamplesTested, lastReviewTestResults }) => {
      getEndemicsClaim.mockImplementation(() => { return { vetVisitsReviewTestResults: lastReviewTestResults } })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text()).toMatch('You cannot continue with your claim')
      expect(raiseInvalidDataEvent).toHaveBeenCalled()
    })
  })
})

describe('pig updates feature flag enabled', () => {
  let pigUpdatesServer

  beforeAll(async () => {
    config.pigUpdates.enabled = true

    raiseInvalidDataEvent.mockImplementation(() => {})
    setEndemicsClaim.mockImplementation(() => {})
    getEndemicsClaim.mockImplementation(() => { return { typeOfLivestock: 'pigs', reference: 'TEMP-6GSE-PIR8' } })

    pigUpdatesServer = await createServer()
    await pigUpdatesServer.initialize()
  })

  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(pigUpdatesServer)
  })

  test('returns 200 when pig updates is enabled', async () => {
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await pigUpdatesServer.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toMatch('How many samples were tested?')
    expect($('title').text()).toContain('How many samples were tested? - Get funding to improve animal health and welfare')
    expect($('.govuk-hint').text().trim()).toEqual('Enter how many polymerase chain reaction (PCR) and enzyme-linked immunosorbent assay (ELISA) test results you got back. You can find this on the summary the vet gave you.')

    expectPhaseBanner.ok($)
  })

  test.each([
    {
      screen: 'PCR',
      numberOfSamplesTested: '6',
      lastReviewTestResults: 'positive',
      vaccinatedValue: 'notvaccinated',
      expectedLocation: '/claim/endemics/pigs-pcr-result'
    },
    {
      screen: 'ELISA',
      numberOfSamplesTested: '30',
      lastReviewTestResults: 'negative',
      vaccinatedValue: 'notvaccinated',
      expectedLocation: '/claim/endemics/pigs-elisa-result'
    },
    {
      screen: 'PCR',
      numberOfSamplesTested: '6',
      lastReviewTestResults: 'positive',
      vaccinatedValue: 'vaccinated',
      expectedLocation: '/claim/endemics/pigs-pcr-result'
    }
  ])(
    'redirects to $screen page if valid sample numbers, $vaccinatedValue and $lastReviewTestResults',
    async ({
      screen,
      numberOfSamplesTested,
      lastReviewTestResults,
      vaccinatedValue,
      expectedLocation
    }) => {
      getEndemicsClaim.mockImplementation(() => {
        return {
          vetVisitsReviewTestResults: lastReviewTestResults,
          herdVaccinationStatus: vaccinatedValue
        }
      })

      const options = {
        method: 'POST',
        url,
        auth,
        payload: { crumb, numberOfSamplesTested },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await pigUpdatesServer.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location.toString()).toEqual(expectedLocation)
      expect(setEndemicsClaim).toHaveBeenCalled()
    }
  )

  test('shows error when payload is empty', async () => {
    const options = {
      method: 'POST',
      url,
      auth,
      payload: { crumb, numberOfSamplesTested: '' },
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await pigUpdatesServer.inject(options)

    expect(res.statusCode).toBe(400)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toMatch('How many samples were tested?')
    expect($('#numberOfSamplesTested-error').text().trim()).toEqual('Error: Enter how many samples were tested. Use the number of PCR or ELISA test results you got back')
  })

  test('shows error when payload is of invalid type', async () => {
    const options = {
      method: 'POST',
      url,
      auth,
      payload: { crumb, numberOfSamplesTested: 'seven' },
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await pigUpdatesServer.inject(options)

    expect(res.statusCode).toBe(400)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toMatch('How many samples were tested?')
    expect($('#numberOfSamplesTested-error').text().trim()).toEqual('Error: The amount of samples tested must only include numbers. Use the number of PCR or ELISA test results you got back')
  })

  test('shows error when payload number is too high', async () => {
    const options = {
      method: 'POST',
      url,
      auth,
      payload: { crumb, numberOfSamplesTested: '10000000' },
      headers: { cookie: `crumb=${crumb}` }
    }

    const res = await pigUpdatesServer.inject(options)

    expect(res.statusCode).toBe(400)
    const $ = cheerio.load(res.payload)
    expect($('h1').text()).toMatch('How many samples were tested?')
    expect($('#numberOfSamplesTested-error').text().trim()).toEqual('Error: The number of samples tested should not exceed 9999. Use the number of PCR or ELISA test results you got back')
  })
})
