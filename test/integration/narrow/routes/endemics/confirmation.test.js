const cheerio = require('cheerio')
const { endemicsConfirmation } = require('../../../../../app/config/routes')

describe('Claim confirmation', () => {
  const reference = 'TBD-F021-723B'
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = `/claim/${endemicsConfirmation}?reference=${reference}`

  test('GET endemicsConfirmation route', async () => {
    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await global.__SERVER__.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('#reference').text().trim()).toEqual(reference)
  })
})
