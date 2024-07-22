const Joi = require('joi')
const session = require('../session')
const { farmerApplyData: { vetRcvs: rcvsKey }, endemicsClaim: { reviewTestResults } } = require('../session/keys')
const { rcvs: rcvsErrorMessages } = require('../../app/lib/error-messages')
const { getReviewTestResultWithinLast10Months } = require('../api-requests/claim-service-api')
const { livestockTypes } = require('../constants/claim')
const { getReviewType } = require('../../lib/get-review-type')
const { endemicsPIHunt, endemicsBiosecurity } = require('../config/routes')
const { urlPrefix } = require('../../config')

module.exports = [{
  method: 'GET',
  path: '/claim/vet-rcvs',
  options: {
    handler: async (request, h) => {
      const rcvs = session.getClaim(request, rcvsKey)
      return h.view('vet-rcvs', { rcvs })
    }
  }
}, {
  method: 'POST',
  path: '/claim/vet-rcvs',
  options: {
    validate: {
      payload: Joi.object({
        rcvs: Joi.string().trim().pattern(/^\d{6}[\dX]$/i).required()
          .messages({
            'any.required': rcvsErrorMessages.enterRCVS,
            'string.base': rcvsErrorMessages.enterRCVS,
            'string.empty': rcvsErrorMessages.enterRCVS,
            'string.pattern.base': rcvsErrorMessages.validRCVS
          })
      }),
      failAction: async (request, h, error) => {
        return h.view('vet-rcvs', { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { rcvs } = request.payload
      session.setClaim(request, rcvsKey, rcvs)
      /**
       * farmer wants to claim for follow-up for dairy cattle
       * If review result is 'Positive' the farmer must be taken to  'PI hunt screen'
       * If the review result is 'Negative' the farmer must be taken to 'Bio security assessment screen'
       */
      const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)

      const { isEndemicsFollowUp } = getReviewType(typeOfReview)
      if (livestockTypes.dairy === typeOfLivestock && isEndemicsFollowUp) {
        const reviewTestResultsValue = reviewTestResults ?? getReviewTestResultWithinLast10Months(request)

        if (reviewTestResultsValue === 'positive' && livestockTypes.dairy === typeOfLivestock) return h.redirect(`${urlPrefix}/${endemicsPIHunt}`)
        if (reviewTestResultsValue === 'negative' && livestockTypes.dairy === typeOfLivestock) return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
      }

      return h.redirect('/claim/urn-result')
    }
  }
}]
