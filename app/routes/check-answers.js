const session = require('../session')
const { farmerApplyData } = require('../session/keys')
const backLink = '/urn-result'
const { getEligibleNumberRowForDisplay, getTypeOfReviewRowForDisplay } = require('../lib/display-helpers')

module.exports = {
  method: 'GET',
  path: '/check-answers',
  options: {
    handler: async (request, h) => {
      const name = session.getClaim(request, farmerApplyData.vetName)
      const visitDate = session.getClaim(request, farmerApplyData.visitDate)
      const rcvsNumber = session.getClaim(request, farmerApplyData.vetRcvs)
      const urn = session.getClaim(request, farmerApplyData.urnResult)
      const organisation = session.getClaim(request, farmerApplyData.organisation)
      const claim = session.getClaim(request)

      const rows = [
        {
          key: { text: 'Business name' },
          value: { html: organisation.name }
        },
        {
          key: { text: 'SBI' },
          value: { html: organisation.sbi }
        },
        getEligibleNumberRowForDisplay(claim.data),
        getTypeOfReviewRowForDisplay(claim.data),
        {
          key: { text: 'Date of visit' },
          value: { html: (new Date(visitDate)).toLocaleDateString('en-GB') },
          actions: { items: [{ href: '/vet-visit-date', text: 'Change', visuallyHiddenText: 'change date of visit' }] }
        },
        {
          key: { text: 'Vet name' },
          value: { html: name },
          actions: { items: [{ href: '/vet-name', text: 'Change', visuallyHiddenText: 'change vet name' }] }
        },
        {
          key: { text: 'Vet RCVS' },
          value: { html: rcvsNumber },
          actions: { items: [{ href: './vet-rcvs', text: 'Change', visuallyHiddenText: 'change vet rcvs' }] }
        },
        {
          key: { text: 'Test results URN' },
          value: { html: urn },
          actions: { items: [{ href: backLink, text: 'Change', visuallyHiddenText: 'change URN' }] }
        }
      ]

      return h.view('check-answers', { listData: { rows }, backLink })
    }
  }
}
