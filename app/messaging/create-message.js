const createMessage = (body, type, options) => {
  return {
    body,
    type,
    source: 'ffc-ahwr-frontend',
    ...options
  }
}

module.exports = createMessage
