const getOldWorldClaimFromApplication = (oldWorldApp, typeOfLivestock) =>
  oldWorldApp && typeOfLivestock === oldWorldApp.data.whichReview
    ? {
        statusId: oldWorldApp.statusId,
        data: {
          claimType: oldWorldApp.data.whichReview,
          dateOfVisit: oldWorldApp.data.visitDate
        }
      }
    : undefined

module.exports = { getOldWorldClaimFromApplication }
