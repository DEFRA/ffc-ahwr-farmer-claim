/**
 * Generate unique reference number
 * ex. VV22-B471-F25C
 * @returns string
 */
const { v4: uuidv4 } = require('uuid')
module.exports = () => {
  const id = uuidv4()
  const claimRef = id.split('-').shift().toLocaleUpperCase('en-GB').match(/.{1,4}/g).join('-')
  return `TEMP-CLAIM-${claimRef}`
}
