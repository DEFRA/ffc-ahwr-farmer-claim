import { config } from '../config/index.js'

// is this file/route needed? it doesnt get added to the router

export const singleBusinessClaimExpiredHandler = {
  method: 'GET',
  path: '/claim/single-business-claim-expired',
  options: {
    handler: async (_, h) => {
      return h.view('single-business-claim-expired', {
        ruralPaymentsAgency: config.ruralPaymentsAgency
      })
    }
  }
}
