export const getIpFromRequest = (request) => {
  const xForwardedForHeader = request.headers['x-forwarded-for']
  const ip = xForwardedForHeader
    ? xForwardedForHeader.split(',')[0]
    : request.info.remoteAddress

  return ip
}
