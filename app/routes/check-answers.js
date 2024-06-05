const session = require('../session')
const { farmerApplyData, claim } = require('../session/keys')
const backLink = '/claim/urn-result'
const { getEligibleNumberRowForDisplay, getTypeOfReviewRowForDisplay } = require('../lib/display-helpers')
const dateOfTestingEnabled = require('../config').dateOfTesting.enabled

module.exports = {
  method: 'GET',
  path: '/claim/check-answers',
  options: {
    handler: async (request, h) => {
      const name = session.getClaim(request, farmerApplyData.vetName)
      const animalsTested = session.getClaim(request, claim.animalsTested)
      const visitDate = session.getClaim(request, farmerApplyData.visitDate)
      const dateOfTesting = session.getClaim(request, farmerApplyData.dateOfTesting)
      const rcvsNumber = session.getClaim(request, farmerApplyData.vetRcvs)
      const urn = session.getClaim(request, farmerApplyData.urnResult)
      const organisation = session.getClaim(request, farmerApplyData.organisation)
      const claimData = session.getClaim(request)

      let rows = [
        {
          key: { text: 'Business name' },
          value: { html: organisation.name }
        },
        {
          key: { text: 'SBI' },
          value: { html: organisation.sbi }
        },
        getEligibleNumberRowForDisplay(claimData.data),
        getTypeOfReviewRowForDisplay(claimData.data),
        {
          key: { text: 'Date of visit' },
          value: { html: (new Date(visitDate)).toLocaleDateString('en-GB') },
          actions: { items: [{ href: '/claim/vet-visit-date', text: 'Change', visuallyHiddenText: 'change date of visit' }] }
        },
        {
          key: { text: 'Date of testing' },
          value: { html: (new Date(dateOfTesting)).toLocaleDateString('en-GB') },
          actions: { items: [{ href: '/claim/vet-visit-date', text: 'Change', visuallyHiddenText: 'change date of testing' }] }
        },
        {
          key: { text: 'Number of Samples Taken' },
          value: { html: animalsTested + '' },
          actions: { items: [{ href: '/claim/animals-tested', text: 'Change', visuallyHiddenText: 'change Number of Samples Taken' }] }
        },
        {
          key: { text: 'Vet\'s name' },
          value: { html: name },
          actions: { items: [{ href: '/claim/vet-name', text: 'Change', visuallyHiddenText: 'change vet name' }] }
        },
        {
          key: { text: 'Vet\'s RCVS number' },
          value: { html: rcvsNumber },
          actions: { items: [{ href: '/claim/vet-rcvs', text: 'Change', visuallyHiddenText: 'change vet rcvs' }] }
        },
        {
          key: { text: 'Test results URN' },
          value: { html: urn },
          actions: { items: [{ href: backLink, text: 'Change', visuallyHiddenText: 'change URN' }] }
        }
      ]

      if (!dateOfTestingEnabled) {
        rows = rows.filter(row => row.key.text !== 'Date of testing')
      }

      if (!animalsTested) {
        rows = rows.filter(row => row.key.text !== 'Number of Samples Taken')
      }

      return h.view('check-answers', { listData: { rows }, backLink })
    }
  }
}
