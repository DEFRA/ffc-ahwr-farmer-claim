import { clearEndemicsClaim, getEndemicsClaim } from '../../session/index.js'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { getReviewType } from '../../lib/get-review-type.js'

const {
  urlPrefix,
  customerSurvey
} = config
const { endemicsConfirmation, claimDashboard } = links

const pageUrl = `${urlPrefix}/${endemicsConfirmation}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const cachedEndemicsClaim = getEndemicsClaim(request)
      // Create copies before clearing session
      const reference = cachedEndemicsClaim.reference
      const amount = cachedEndemicsClaim.amount
      const { isReview } = getReviewType(cachedEndemicsClaim.typeOfReview)

      clearEndemicsClaim(request)

      return h.view(endemicsConfirmation, {
        claimTypeText: isReview ? 'animal health and welfare review' : 'endemic disease follow-up',
        claimDashboard,
        reference,
        amount,
        claimSurveyUri: customerSurvey.uri
      })
    }
  }
}

export const confirmationHandlers = [getHandler]
