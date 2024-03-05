const Joi = require('joi')
const boom = require('@hapi/boom')
const { urlPrefix } = require('../../config')
const { endemicsTestResults, endemicsBiosecurity } = require('../../config/routes')
const {getYesNoRadios } = require('../models/form-component/yes-no-radios')
const session = require('../../session')
const {biosecurity} = require('../../session/keys').endemicsClaim


const backLink = `${urlPrefix}/${endemicsTestResults}`
const pageUrl = `${urlPrefix}/${endemicsBiosecurity}`
const legendText = ''
const hintText = 'You can find this on the summary the vet gave you.'
const radioOptions = {legendClasses: 'govuk-fieldset_legend--l', inline: false, hintText}
const errorMessageText = 'Select yes or no'
const isEndemicsClaims = true 

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const claim = session.getEndemicsClaim(request);
        if(!claim){
          return boom.notFound()
        }
        return h.view(
          endemicsBiosecurity, 
          {
            backLink, 
            ...getYesNoRadios(legendText, biosecurity, session.getEndemicsClaim(request, biosecurity), undefined, radioOptions )
          }
        )
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options:{
      validate:{
        payload: Joi.object({
          [biosecurity]: Joi.string().valid('yes', 'no').required()
        }),
        failAction: (request, h, _err)=>{
          const claim = session.getEndemicsClaim(request)
          if(!claim){
            return boom.notFound()
          }
          return h.view(endemicsBiosecurity, {
            backLink, 
            errorMessage: { text: errorMessageText },
            ...getYesNoRadios()
          })
          .code(400)
          .takeover()
        }
      },

      handler: async(request, h) => {
        const biosecurityAnswer = request.payload[biosecurity]
        const claim = session.getEndemicsClaim(request)
        session.setEndemicsClaim(request, biosecurity, request.payload[biosecurity])
        if(biosecurityAnswer === 'yes'){
          if(claim.typeOfLivestock === 'dairy'){
            return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
          }
          return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
        }
        return h.view(endemicsBiosecurityException, {backLink: pageUrl}).code(400).takeover()
      }
    }
  }
]
