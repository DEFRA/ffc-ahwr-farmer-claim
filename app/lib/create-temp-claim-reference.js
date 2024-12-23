const { randomInt } = require('node:crypto')
const { profanity } = require('@2toad/profanity')

const containsSwearWord = (input) => {
  return profanity.exists(input)
}

function generateRandomID () {
  const charset = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
  const id = Array.from({ length: 8 }, () => charset.charAt(randomInt(0, charset.length))).join('')
  const firstFour = id.slice(0, 4)
  const secondFour = id.slice(4)

  if (containsSwearWord(firstFour) || containsSwearWord(secondFour) || containsSwearWord(`${firstFour}${secondFour}`)) {
    return generateRandomID()
  }

  return `TEMP-CLAIM-${firstFour}-${secondFour}`
}

module.exports = generateRandomID
