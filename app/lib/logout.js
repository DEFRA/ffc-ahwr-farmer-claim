import { clear } from '../session/index.js'

export const logout = (request) => {
  if (request) {
    request.cookieAuth.clear()
    clear(request)
  }
}
