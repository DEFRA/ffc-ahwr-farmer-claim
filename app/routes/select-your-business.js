const Joi = require('joi')
const { setClaim } = require('../session')
const { selectYourBusiness: { whichBusiness, eligibleBusinesses  } } = require('../session/keys')
const { selectYourBusinessRadioOptions } = require('./models/form-component/select-your-business-radio')
const { getSelectYourBusiness, setSelectYourBusiness } = require('../session')
const processEligibleBusinesses = require('./models/eligible-businesses')
const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: false, undefined }
const errorText = 'Select the business you want reviewed'
const legendText = 'Choose the SBI you would like to apply for:'

module.exports = [{
  method: 'GET',
  path: `/claim/select-your-business`,
  options: {
    handler: async (request, h) => {
      let businesses = processEligibleBusinesses()
      
      setSelectYourBusiness(request, eligibleBusinesses, businesses)

      if (businesses && businesses.length > 0) {
        return h.view('select-your-business',
          { ...selectYourBusinessRadioOptions(businesses, legendText, whichBusiness, getSelectYourBusiness(request, whichBusiness), undefined, radioOptions) }
        )
      } else {
        return h.redirect('no-eligible-businesses')
      }
    }
  }
},
{
  method: 'POST',
  path: '/claim/select-your-business',
  options: {
    validate: {
      payload: Joi.object({
        [whichBusiness]: Joi.string().required()
      }),
      failAction: (request, h, _err) => {
        return h
          .view(
            'select-your-business',
            {
              ...selectYourBusinessRadioOptions(
                getSelectYourBusiness(request, eligibleBusinesses),
                legendText,
                whichBusiness,
                getSelectYourBusiness(request, whichBusiness),
                errorText,
                radioOptions
              )
            }
          )
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      setSelectYourBusiness(request, whichBusiness, request.payload[whichBusiness])
      const businesses = getSelectYourBusiness(request, eligibleBusinesses)
      const selectedBusiness = businesses.find(business => {
        return business.sbi === request.payload[whichBusiness]
      })
      console.log(`${new Date().toISOString()} Selected business: ${JSON.stringify({
        ...selectedBusiness
      })}`)

      const applicationReference = selectedBusiness.reference;
      console.log(`${new Date().toISOString()} Selected application reference: ${JSON.stringify({
        applicationReference
      })}`)
      // get claim from /api/application/get/{ref} instead of hard coding
      const claim = {
        "id": "48d2f147-614e-40df-9ba8-9961e7974e83",
        "reference": "AHWR-48D2-F147",
        "data": {
            "reference": null,
            "declaration": true,
            "offerStatus": "accepted",
            "whichReview": "sheep",
            "organisation": {
                "crn": "112222",
                "sbi": "122333",
                "name": "My Amazing Farm",
                "email": "liam.wilson@kainos.com",
                "address": "1 Some Road",
                "farmerName": "Mr Farmer"
            },
            "eligibleSpecies": "yes",
            "confirmCheckDetails": "yes"
        },
        "claimed": false,
        "createdAt": "2023-02-01T13:52:14.176Z",
        "updatedAt": "2023-02-01T13:52:14.207Z",
        "createdBy": "admin",
        "updatedBy": null,
        "statusId": 1,
        "vetVisit": null,
        "organisation": {
            "farmerName": "Liam Wilson",
            "name": "Liams Farm",
            "sbi": "106335269",
            "crn": "1100000002",
            "address": "Towne Road, Royston, SG8 9ES",
            "email": "liam.wilson@kainos.com"
        }
      }
      // get claim from /api/application/get/{ref}
      Object.entries(claim).forEach(([k, v]) => setClaim(request, k, v))
      return h.redirect('visit-review')
    }
  }
}]


