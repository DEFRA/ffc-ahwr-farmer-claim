const cheerio = require('cheerio')
const { getEndemicsClaim } = require('../../../../../app/session')
const { endemicsConfirmation } = require('../../../../../app/config/routes')
jest.mock('../../../../../app/session')

describe('Claim confirmation', () => {
  const reference = 'TBD-F021-723B'
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = `/claim/${endemicsConfirmation}`

  test('GET endemicsConfirmation route', async () => {
    const options = {
      method: 'GET',
      url,
      auth
    }

    getEndemicsClaim.mockImplementation(() => {
      return {
        reference
      }
    })
    const res = await global.__SERVER__.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('#reference').text().trim()).toEqual(reference)
  })
})
