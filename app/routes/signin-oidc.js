import Joi from 'joi'
import { config } from '../config/index.js'
import { sessionKeys } from '../session/keys.js'
import appInsights from 'applicationinsights'
import { requestAuthorizationCodeUrl } from '../auth/auth-code-grant/request-authorization-code-url.js'
import { authenticate } from '../auth/authenticate.js'
import { retrieveApimAccessToken } from '../auth/client-credential-grant/retrieve-apim-access-token.js'
import { getClaim, getCustomer, setCustomer, setEndemicsClaim } from '../session/index.js'
import { setAuthCookie } from '../auth/cookie-auth/cookie-auth.js'
import { getLatestApplicationForSbi } from './models/latest-application.js'
import { getPersonName, getPersonSummary } from '../api-requests/rpa-api/person.js'
import { getOrganisationAddress, organisationIsEligible } from '../api-requests/rpa-api/organisation.js'
import { changeContactHistory } from '../api-requests/contact-history-api.js'
import { InvalidPermissionsError } from '../exceptions/invalid-permissions-error.js'
import { farmerClaim } from '../constants/constants.js'
import { InvalidStateError } from '../exceptions/invalid-state-error.js'
import { NoApplicationFoundError } from '../exceptions/no-application-found.js'
import { ClaimHasAlreadyBeenMadeError } from '../exceptions/claim-has-already-been-made.js'
import { ClaimHasExpiredError } from '../exceptions/claim-has-expired.js'
import { raiseIneligibilityEvent } from '../event/raise-ineligibility-event.js'

export const signInHandler = {
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
        request.logger.setBindings({ err })
        appInsights.defaultClient.trackException({ exception: err })
        return h.view('verify-login-failed', {
          backLink: requestAuthorizationCodeUrl(request),
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await authenticate(request)

        const apimAccessToken = await retrieveApimAccessToken(request)
        const personSummary = await getPersonSummary(request, apimAccessToken)
        const organisationSummary = await organisationIsEligible(request, personSummary.id, apimAccessToken)
        request.logger.setBindings({ sbi: organisationSummary.organisation.sbi })
        await changeContactHistory(personSummary, organisationSummary, request.logger)

        setEndemicsClaim(
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
            frn: organisationSummary.organisation.businessReference
          }
        )

        if (!organisationSummary.organisationPermission) {
          throw new InvalidPermissionsError(`Person id ${personSummary.id} does not have the required permissions for organisation id ${organisationSummary.organisation.id}`)
        }

        const latestApplication = await getLatestApplicationForSbi(
          organisationSummary.organisation.sbi?.toString(),
          organisationSummary.organisation.name
        )

        setCustomer(request, sessionKeys.customer.id, personSummary.id)

        setAuthCookie(request, latestApplication.data.organisation.email, farmerClaim)

        appInsights.defaultClient.trackEvent({
          name: 'login',
          properties: {
            sbi: organisationSummary.organisation.sbi,
            crn: getCustomer(request, sessionKeys.customer.crn)
          }
        })

        // Even though this sign-in page was for Old World, no old world claimant can ever get to this
        // line now, as the 6 month threshold will have kicked them to the ineligible to claim route
        // therefore we can safely just redirect this on to new world entrypoint
        return h.redirect(`/claim/endemics?from=dashboard&sbi=${organisationSummary.organisation.sbi}`)
      } catch (error) {
        request.logger.setBindings({ err: error })

        const crn = getCustomer(request, sessionKeys.customer.crn)
        const attachedToMultipleBusinesses = getCustomer(request, sessionKeys.customer.attachedToMultipleBusinesses)
        const organisation = getClaim(request, sessionKeys.farmerApplyData.organisation)

        switch (true) {
          case error instanceof InvalidStateError:
            return h.redirect(requestAuthorizationCodeUrl(request))
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
              backLink: requestAuthorizationCodeUrl(request),
              ruralPaymentsAgency: config.ruralPaymentsAgency
            }).code(400).takeover()
        }
        await raiseIneligibilityEvent(
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
          backLink: requestAuthorizationCodeUrl(request),
          hasMultipleBusinesses: attachedToMultipleBusinesses,
          latestApplicationDate: error.latestApplicationDate,
          claimExpiredDate: error.claimExpiredDate
        }).code(400).takeover()
      }
    }
  }
}
