const Joi = require('joi')
const session = require('../session')
const sessionKeys = require('../session/keys')
const radios = require('./models/form-component/radios')
const processEligibleBusinesses = require('./models/eligible-businesses')
const ERROR_TEXT = 'Select the business you want reviewed'
const LEGEND_TEXT = 'Choose the SBI you would like to apply for:'
const RADIO_OPTIONS = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: false, undefined }

module.exports = [{
  method: 'GET',
  path: '/claim/select-your-business',
  options: {
    handler: async (request, h) => {
      const businesses = processEligibleBusinesses()

      if (!Array.isArray(businesses) || businesses.length === 0) {
        return h.redirect('no-eligible-businesses')
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
            value: business.sbi,
            text: `${business.sbi} - ${business.businessName}`,
            checked: checkedBusiness === business.sbi
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
              value: business.sbi,
              text: `${business.sbi} - ${business.name}`,
              checked: checkedBusiness === business.sbi
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
        .find(business => business.sbi === request.payload[sessionKeys.selectYourBusiness.whichBusiness])

      console.log(`${new Date().toISOString()} Selected business: ${JSON.stringify({
        ...selectedBusiness
      })}`)

      const applicationReference = selectedBusiness.reference
      console.log(`${new Date().toISOString()} Selected application reference: ${JSON.stringify({
        applicationReference
      })}`)
      // get application from /api/application/get/{ref} instead of hard coding
      const application = {
        id: '48d2f147-614e-40df-9ba8-9961e7974e83',
        reference: 'AHWR-48D2-F147',
        data: {
          reference: null,
          declaration: true,
          offerStatus: 'accepted',
          whichReview: 'sheep',
          organisation: {
            crn: '112222',
            sbi: '122333',
            name: 'My Amazing Farm',
            email: 'liam.wilson@kainos.com',
            address: '1 Some Road',
            farmerName: 'Mr Farmer'
          },
          eligibleSpecies: 'yes',
          confirmCheckDetails: 'yes'
        },
        claimed: false,
        createdAt: '2023-02-01T13:52:14.176Z',
        updatedAt: '2023-02-01T13:52:14.207Z',
        createdBy: 'admin',
        updatedBy: null,
        statusId: 1,
        vetVisit: null,
        organisation: {
          farmerName: 'Liam Wilson',
          name: 'Liams Farm',
          sbi: '106335269',
          crn: '1100000002',
          address: 'Towne Road, Royston, SG8 9ES',
          email: 'liam.wilson@kainos.com'
        }
      }
      // get claim from /api/application/get/{ref}
      Object.entries(application).forEach(([k, v]) => session.setClaim(request, k, v))
      return h.redirect('visit-review')
    }
  }
}]
