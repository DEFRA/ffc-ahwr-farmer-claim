import * as cheerio from 'cheerio'
import links from '../../../../../app/config/routes.js'
import { createServer } from '../../../../../app/server.js'
import { getReviewType } from '../../../../../app/lib/get-review-type.js'
import { getEndemicsClaim } from '../../../../../app/session/index.js'

const { endemicsConfirmation } = links
jest.mock('../../../../../app/session')

describe('Claim confirmation', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  const reference = 'TBD-F021-723B'
  const auth = { credentials: {}, strategy: 'cookie' }
  const url = `/claim/${endemicsConfirmation}`

  test.each([
    { typeOfLivestock: 'beef', typeOfReview: 'E' },
    { typeOfLivestock: 'pigs', typeOfReview: 'E' },
    { typeOfLivestock: 'dairy', typeOfReview: 'E' },
    { typeOfLivestock: 'sheep', typeOfReview: 'E' },
    { typeOfLivestock: 'beef', typeOfReview: 'R' },
    { typeOfLivestock: 'pigs', typeOfReview: 'R' },
    { typeOfLivestock: 'dairy', typeOfReview: 'R' },
    { typeOfLivestock: 'sheep', typeOfReview: 'R' }
  ])('GET endemicsConfirmation route', async ({ typeOfReview }) => {
    const { isReview } = getReviewType(typeOfReview)
    const options = {
      method: 'GET',
      url,
      auth
    }

    getEndemicsClaim.mockImplementation(() => {
      return {
        reference,
        amount: 55,
        typeOfReview
      }
    })
    const res = await server.inject(options)

    const $ = cheerio.load(res.payload)

    expect(res.statusCode).toBe(200)
    expect($('#amount').text()).toContain('55')
    expect($('#reference').text().trim()).toEqual(reference)
    expect($('#message').text().trim()).toContain(isReview ? 'animal health and welfare review' : 'endemic disease follow-up')
  })
})
