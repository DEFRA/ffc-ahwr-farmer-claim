const Joi = require('joi')
const config = require('../../config')
const auth = require('../../auth')
const session = require('../../session')
const sessionKeys = require('../../session/keys')
const latestApplicationForSbi = require('../models/latest-application')
const { farmerClaim } = require('../../constants/user-types')
const { getPersonSummary, getPersonName, organisationIsEligible, getOrganisationAddress } = require('../../api-requests/rpa-api')
const { NoApplicationFound, InvalidPermissionsError, ClaimHasAlreadyBeenMade, InvalidStateError, ClaimHasExpired, NoEligibleCphError } = require('../../exceptions')
const { sendExceptionEvent } = require('../../event')
const cphCheck = require('../../api-requests/rpa-api/cph-check')

let event

module.exports = [{
  method: 'GET',
  path: '/claim/signin-oidc',
  options: {
    auth: false,
    validate: {
      query: Joi.object({
        code: Joi.string().required(),
        state: Joi.string().uuid().required()
      }).options({
        stripUnknown: true
      }),
      failAction (request, h, err) {
        console.log(`Validation error caught during DEFRA ID redirect - ${err.message}.`)
        return h.view('verify-login-failed', {
          backLink: auth.requestAuthorizationCodeUrl(session, request)
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await auth.authenticate(request, session)

        const apimAccessToken = await auth.retrieveApimAccessToken()
        const personSummary = await getPersonSummary(request, apimAccessToken)
        const organisationSummary = await organisationIsEligible(request, personSummary.id, apimAccessToken)
        session.setClaim(
          request,
          sessionKeys.farmerApplyData.organisation,
          {
            sbi: organisationSummary.organisation.sbi?.toString(),
            farmerName: getPersonName(personSummary),
            name: organisationSummary.organisation.name,
            email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
            address: getOrganisationAddress(organisationSummary.organisation.address)
          }
        )

        if (!organisationSummary.organisationPermission) {
          throw new InvalidPermissionsError(`Person id ${personSummary.id} does not have the required permissions for organisation id ${organisationSummary.organisation.id}`)
        }

        await cphCheck.customerMustHaveAtLeastOneValidCph(request, apimAccessToken)

        event = {
          id: request.yar.id,
          sbi: organisationSummary.organisation.sbi,
          crn: organisationSummary.organisation.crn
        }

        const latestApplication = await latestApplicationForSbi(
          organisationSummary.organisation.sbi.toString(),
          organisationSummary.organisation.name
        )
        console.log(`${new Date().toISOString()} Claimable application found: ${JSON.stringify({
          sbi: latestApplication.data.organisation.sbi
        })}`)
        Object.entries(latestApplication).forEach(([k, v]) => session.setClaim(request, k, v))
        session.setCustomer(request, sessionKeys.customer.id, personSummary.id)
        auth.setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)
        return h.redirect('/claim/visit-review')
      } catch (error) {
        console.error(`Received error with name ${error.name} and message ${error.message}.`)
        const organisation = session.getClaim(request, sessionKeys.farmerApplyData.organisation)
        switch (true) {
          case error instanceof InvalidStateError:
            return h.redirect(auth.requestAuthorizationCodeUrl(session, request))
          case error instanceof InvalidPermissionsError:
            sendExceptionEvent(event.id, event.sbi, event.crn, 'InvalidPermissions')
            return h.view('defra-id/cannot-apply-for-livestock-review-exception', {
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              alreadyAppliedError: err instanceof AlreadyAppliedError,
              permissionError: err instanceof InvalidPermissionsError,
              cphError: err instanceof NoEligibleCphError,
              hasMultipleBusineses: attachedToMultipleBusinesses,
              backLink: auth.requestAuthorizationCodeUrl(session, request),
              sbiText: organisation?.sbi !== undefined ? ` - SBI ${organisation.sbi}` : null,
              organisationName: organisation?.name,
              guidanceLink: config.serviceUri
            }).code(400).takeover()
          case error instanceof NoApplicationFound:
            sendExceptionEvent(event.id, event.sbi, event.crn, 'NotAppliedYet')
            return h.view('defra-id/cannot-apply-for-livestock-review-exception', {
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              alreadyAppliedError: err instanceof AlreadyAppliedError,
              permissionError: err instanceof InvalidPermissionsError,
              cphError: err instanceof NoEligibleCphError,
              hasMultipleBusineses: attachedToMultipleBusinesses,
              backLink: auth.requestAuthorizationCodeUrl(session, request),
              sbiText: organisation?.sbi !== undefined ? ` - SBI ${organisation.sbi}` : null,
              organisationName: organisation?.name,
              guidanceLink: config.serviceUri
            }).code(400).takeover()
          case error instanceof ClaimHasAlreadyBeenMade:
            sendExceptionEvent(event.id, event.sbi, event.crn, 'AlreadyClaimed')
            return h.view('defra-id/cannot-apply-for-livestock-review-exception', {
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              alreadyAppliedError: err instanceof AlreadyAppliedError,
              permissionError: err instanceof InvalidPermissionsError,
              cphError: err instanceof NoEligibleCphError,
              hasMultipleBusineses: attachedToMultipleBusinesses,
              backLink: auth.requestAuthorizationCodeUrl(session, request),
              sbiText: organisation?.sbi !== undefined ? ` - SBI ${organisation.sbi}` : null,
              organisationName: organisation?.name,
              guidanceLink: config.serviceUri
            }).code(400).takeover()
          case error instanceof ClaimHasExpired:
            return h.view('defra-id/you-cannot-claim-for-a-livestock-review', {
              error,
              hasMultipleBusinesses: session.getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses),
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              backLink: auth.requestAuthorizationCodeUrl(session, request),
              sbiText: organisation?.sbi !== undefined ? ` - SBI ${organisation.sbi}` : null,
              organisationName: organisation?.name
            }).code(400).takeover()
          case err instanceof NoEligibleCphError:
            sendExceptionEvent(event.id, event.sbi, event.crn, 'InvalidCPH')
            return h.view('defra-id/cannot-apply-for-livestock-review-exception', {
              ruralPaymentsAgency: config.ruralPaymentsAgency,
              alreadyAppliedError: err instanceof AlreadyAppliedError,
              permissionError: err instanceof InvalidPermissionsError,
              cphError: err instanceof NoEligibleCphError,
              hasMultipleBusineses: attachedToMultipleBusinesses,
              backLink: auth.requestAuthorizationCodeUrl(session, request),
              sbiText: organisation?.sbi !== undefined ? ` - SBI ${organisation.sbi}` : null,
              organisationName: organisation?.name,
              guidanceLink: config.serviceUri
            }).code(400).takeover()
          default:
            return h.view('verify-login-failed', {
              backLink: auth.requestAuthorizationCodeUrl(session, request)
            }).code(400).takeover()
        }
      }
    }
  }
}]
