import { getIpFromRequest } from '../../../../app/event/get-ip-from-request'

describe('getIpFromRequest', () => {
  test('when x-forwarded-for exists', () => {
    const ip = '192:333:222'
    const request = {
      headers: {
        'x-forwarded-for': `${ip},something`
      },
      info: {
        remoteAddress: ip
      }
    }
    expect(getIpFromRequest(request)).toEqual(ip)
  })

  test('when x-forwarded-for does not exist', () => {
    const ip = '192:333:222'
    const request = {
      headers: {},
      info: {
        remoteAddress: ip
      }
    }
    expect(getIpFromRequest(request)).toEqual(ip)
  })
})
