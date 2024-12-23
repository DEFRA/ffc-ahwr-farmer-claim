const { randomInt } = require('node:crypto')

function generateRandomID () {
  const charset = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
  const id = Array.from({ length: 8 }, () => charset.charAt(randomInt(0, charset.length))).join('')
  const firstFour = id.slice(0, 4)
  const secondFour = id.slice(4)

  return `TEMP-CLAIM-${firstFour}-${secondFour}`
}

module.exports = generateRandomID
