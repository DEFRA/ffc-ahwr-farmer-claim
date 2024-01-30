const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const { getEndemicsClaim } = require('../../../../../app/session')

jest.mock('../../../../../app/session')
describe('Species numbers test', () => {
  const url = '/claim/endemics/species-numbers'
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(global.__SERVER__)
  })

  test('returns 200', async () => {
    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'beef' })
    const options = {
      method: 'GET',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, speciesNumber: 'beef' }
    }

    const res = await global.__SERVER__.inject(options)
    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('.govuk-fieldset__heading').text().trim()).toEqual('Did you have 11 or more cattle  on the date of the review?')
    expect($('title').text().trim()).toEqual('Number - Annual health and welfare review of livestock')
    expect($('.govuk-radios__item').length).toEqual(2)
    expectPhaseBanner.ok($)
  })

  test('returns 404 when there is no claim', async () => {
    getEndemicsClaim.mockReturnValue(undefined)
    const options = {
      auth,
      method: 'GET',
      url
    }

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(404)
    const $ = cheerio.load(res.payload)
    expect($('.govuk-heading-l').text()).toEqual('404 - Not Found')
    expect($('#_404 div p').text()).toEqual('Not Found')
    expectPhaseBanner.ok($)
  })
  test('Continue without selecting response should return error', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, speciesNumber: '' }
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'beef' })

    const res = await global.__SERVER__.inject(options)
    const $ = cheerio.load(res.payload)
    const errorMessage = 'Select a response'

    expect($('.govuk-error-summary .govuk-list').text().trim()).toEqual(errorMessage)
  })
  test('Continue to eligible page if user select yes', async () => {
    const options = {
      method: 'POST',
      payload: { crumb, speciesNumbers: 'yes' },
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` }
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'beef' })

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('eligible')
  })
  test('Continue to ineligible page if user select no', async () => {
    const options = {
      method: 'POST',
      payload: { crumb, speciesNumbers: 'no' },
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` }
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'beef' })

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('ineligible')
  })
})
