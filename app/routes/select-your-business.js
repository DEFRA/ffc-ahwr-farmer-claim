const Joi = require('joi')
const Boom = require('@hapi/boom')
const session = require('../session')
const sessionKeys = require('../session/keys')
const radios = require('./models/form-component/radios')
const processEligibleBusinesses = require('./models/eligible-businesses')
const ERROR_TEXT = 'Select the business you want reviewed'
const LEGEND_TEXT = 'Choose the SBI you would like to apply for:'
const RADIO_OPTIONS = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: false, undefined }
const BUSINESS_EMAIL_SCHEMA = require('../schemas/business-email.schema')

module.exports = [{
  method: 'GET',
  path: '/claim/select-your-business',
  options: {
    validate: {
      query: Joi.object({
        businessEmail: BUSINESS_EMAIL_SCHEMA
      }).options({
        stripUnknown: true
      }),
      failAction (request, h, err) {
        throw Boom.badRequest('"businessEmail" param is missing or the value is empty')
      }
    },
    handler: async (request, h) => {
      const businesses = await processEligibleBusinesses(request.query.businessEmail)

      if (!Array.isArray(businesses) || businesses.length === 0) {
        console.log(`${new Date().toISOString()} No claimable businesses found.`)
        return h.redirect('no-claimable-businesses')
      }

      const checkedBusiness = session.getSelectYourBusiness(
        request,
        sessionKeys.selectYourBusiness.whichBusiness
      )
      session.setSelectYourBusiness(
        request,
        sessionKeys.selectYourBusiness.eligibleBusinesses,
        businesses
      )
      return h
        .view('select-your-business',
          radios(
            LEGEND_TEXT,
            sessionKeys.selectYourBusiness.whichBusiness,
            undefined,
            RADIO_OPTIONS
          )(businesses.map(business => ({
            value: business.data.organisation.sbi,
            text: `${business.data.organisation.sbi} - ${business.data.organisation.name}`,
            checked: checkedBusiness === business.data.organisation.sbi
          })))
        )
    }
  }
},
{
  method: 'POST',
  path: '/claim/select-your-business',
  options: {
    validate: {
      payload: Joi.object({
        [sessionKeys.selectYourBusiness.whichBusiness]: Joi.string().required()
      }),
      failAction: (request, h, _err) => {
        const businesses = session.getSelectYourBusiness(
          request,
          sessionKeys.selectYourBusiness.eligibleBusinesses
        )
        const checkedBusiness = session.getSelectYourBusiness(
          request,
          sessionKeys.selectYourBusiness.whichBusiness
        )
        return h
          .view('select-your-business',
            radios(
              LEGEND_TEXT,
              sessionKeys.selectYourBusiness.whichBusiness,
              ERROR_TEXT,
              RADIO_OPTIONS
            )(businesses.map(business => ({
              value: business.data.organisation.sbi,
              text: `${business.data.organisation.sbi} - ${business.data.organisation.name}`,
              checked: checkedBusiness === business.data.organisation.sbi
            })))
          )
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      session.setSelectYourBusiness(request, sessionKeys.selectYourBusiness.whichBusiness, request.payload[sessionKeys.selectYourBusiness.whichBusiness])
      const selectedBusiness = session
        .getSelectYourBusiness(
          request,
          sessionKeys.selectYourBusiness.eligibleBusinesses
        )
        .find(business => business.data.organisation.sbi === request.payload[sessionKeys.selectYourBusiness.whichBusiness])

      console.log(`${new Date().toISOString()} Selected business: ${JSON.stringify({
        sbi: selectedBusiness.data.organisation.sbi
      })}`)

      Object.entries(selectedBusiness).forEach(([k, v]) => session.setClaim(request, k, v))
      return h.redirect('visit-review')
    }
  }
}]
