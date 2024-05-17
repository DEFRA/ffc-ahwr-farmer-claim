const Joi = require('joi')
const config = require('../config')
const auth = require('../auth')
const session = require('../session')
const sessionKeys = require('../session/keys')
const latestApplicationForSbi = require('./models/latest-application')
const { farmerClaim } = require('../constants/user-types')
const { getPersonSummary, getPersonName, organisationIsEligible, getOrganisationAddress } = require('../api-requests/rpa-api')
const { NoApplicationFoundError, InvalidPermissionsError, ClaimHasAlreadyBeenMadeError, InvalidStateError, ClaimHasExpiredError } = require('../exceptions')
const { raiseIneligibilityEvent } = require('../event')
const { changeContactHistory } = require('../api-requests/contact-history-api')
const appInsights = require('applicationinsights')
const createClaimReference = require('../lib/create-temp-claim-reference')

const endemicsEnabled = config.endemicsEnabled

module.exports = [{
  method: 'GET',
  path: '/claim/signin-oidc',
  options: {
    auth: false,
    validate: {
      query: Joi.object({
        code: Joi.string().required(),
        state: Joi.string().required()
      }).options({
        stripUnknown: true
      }),
      failAction (request, h, err) {
        console.log(`Validation error caught during DEFRA ID redirect - ${err.message}.`)
        appInsights.defaultClient.trackException({ exception: err })
        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request),
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await auth.authenticate(request, session)

        const apimAccessToken = await auth.retrieveApimAccessToken()
        const personSummary = await getPersonSummary(request, apimAccessToken)
        const organisationSummary = await organisationIsEligible(request, personSummary.id, apimAccessToken)
        changeContactHistory(personSummary, organisationSummary)
        const entryValue = request.yar?.get('claim') || {}
        entryValue.organisation = {}
        entryValue.reference = undefined
        request.yar.set('claim', entryValue)
        session.setClaim(
          request,
          sessionKeys.farmerApplyData.organisation,
          {
            sbi: organisationSummary.organisation.sbi?.toString(),
            farmerName: getPersonName(personSummary),
            name: organisationSummary.organisation.name,
            email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
            orgEmail: organisationSummary.organisation.email,
            address: getOrganisationAddress(organisationSummary.organisation.address),
            crn: personSummary.customerReferenceNumber,
            frn: organisationSummary.businessReference
          }
        )

        if (endemicsEnabled) {
          const tempClaimId = createClaimReference()
          session.setEndemicsClaim(
            request,
            sessionKeys.endemicsClaim.organisation,
            {
              sbi: organisationSummary.organisation.sbi?.toString(),
              farmerName: getPersonName(personSummary),
              name: organisationSummary.organisation.name,
              email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
              orgEmail: organisationSummary.organisation.email,
              address: getOrganisationAddress(organisationSummary.organisation.address),
              crn: personSummary.customerReferenceNumber,
              frn: organisationSummary.businessReference
            }
          )
          session.setEndemicsClaim(request, sessionKeys.endemicsClaim.reference, tempClaimId)
        }

        if (!organisationSummary.organisationPermission) {
          throw new InvalidPermissionsError(`Person id ${personSummary.id} does not have the required permissions for organisation id ${organisationSummary.organisation.id}`)
        }

        const latestApplication = await latestApplicationForSbi(
          organisationSummary.organisation.sbi?.toString(),
          organisationSummary.organisation.name
        )
        console.log(`${new Date().toISOString()} Claimable application found: ${JSON.stringify({
          sbi: latestApplication.data.organisation.sbi
        })}`)
        Object.entries(latestApplication).forEach(([k, v]) => session.setClaim(request, k, v))
        session.setCustomer(request, sessionKeys.customer.id, personSummary.id)
        auth.setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)

        appInsights.defaultClient.trackEvent({
          name: 'login',
          properties: {
            sbi: organisationSummary.organisation.sbi,
            crn: session.getCustomer(request, sessionKeys.customer.crn),
            email: personSummary.email
          }
        })
        return h.redirect('/claim/visit-review')
      } catch (error) {
        console.error(`Received error with name ${error.name} and message ${error.message}.`)
        const crn = session.getCustomer(request, sessionKeys.customer.crn)
        const attachedToMultipleBusinesses = session.getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses)
        const organisation = session.getClaim(request, sessionKeys.farmerApplyData.organisation)

        switch (true) {
          case error instanceof InvalidStateError:
            return h.redirect(auth.requestAuthorizationCodeUrl(session, request))
          case error instanceof InvalidPermissionsError:
            break
          case error instanceof NoApplicationFoundError:
            break
          case error instanceof ClaimHasAlreadyBeenMadeError:
            break
          case error instanceof ClaimHasExpiredError:
            break
          default:
            return h.view('verify-login-failed', {
              backLink: auth.requestAuthorizationCodeUrl(session, request),
              ruralPaymentsAgency: config.ruralPaymentsAgency
            }).code(400).takeover()
        }
        raiseIneligibilityEvent(
          request.yar.id,
          organisation?.sbi,
          crn,
          organisation?.email,
          error.name,
          error.organisation?.reference
        )
        return h.view('you-cannot-claim-for-a-livestock-review', {
          permissionError: error instanceof InvalidPermissionsError,
          noApplicationFoundError: error instanceof NoApplicationFoundError,
          claimHasAlreadyBeenMadeError: error instanceof ClaimHasAlreadyBeenMadeError,
          claimHasExpiredError: error instanceof ClaimHasExpiredError,
          organisationName: organisation?.name,
          sbiText: organisation?.sbi !== undefined ? ` - SBI ${organisation.sbi}` : null,
          ruralPaymentsAgency: config.ruralPaymentsAgency,
          backLink: auth.requestAuthorizationCodeUrl(session, request),
          hasMultipleBusinesses: attachedToMultipleBusinesses,
          latestApplicationDate: error.latestApplicationDate,
          claimExpiredDate: error.claimExpiredDate
        }).code(400).takeover()
      }
    }
  }
}
]
