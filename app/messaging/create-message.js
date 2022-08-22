const createMessage = (body, type, options) => {
  return {
    body,
    type,
    source: 'ffc-ahwr-farmer-claim',
    ...options
  }
}

module.exports = createMessage
