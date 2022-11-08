import mockResponseMessage from './mockResponseMessage'
import { subscriptionConfig } from './mqConfig'

async function mockMockApplicationResponse () {
  const receiverConfig = {
    ...subscriptionConfig,
    address: process.env.PARCELSPATIAL_SUBSCRIPTION_ADDRESS,
    topic: process.env.PARCELSPATIAL_TOPIC_ADDRESS
  }
  const baseResponseMessage = {
    body: {
      expectedProperty: 'a mocked value'
    },
    source: 'ffc-ahwr-application',
    type: 'uk.gov.ffc.ahwr.agreement.app.response'
  }
  await mockResponseMessage(baseResponseMessage, process.env.PARCELSPATIALRESPONSE_QUEUE_ADDRESS, receiverConfig)
}

/**
 * Mock async request/response.
 *
 * @param {string} responseType to mock
 */
export default async responseType => {
  // NOTE: PR_BUILD is set within the build pipeline for PR builds
  if (process.env.PR_BUILD) {
    console.log('PR environment found. Mocking is active. Mocking responseType:', responseType)
    switch (responseType) {
      case 'mock-application':
        await mockMockApplicationResponse()
        break
      default:
        console.error('Trying to mock an unmocked action', responseType)
        break
    }
  } else {
    console.log('PR environment not found. Mocking is NOT active.')
  }
}
