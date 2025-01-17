const { canMakeReviewClaim } = require("../../../../app/api-requests/claim-service-ms")

describe('claim-service-ms', () => {
    describe('canMakeReviewClaim', () => {
        describe('should be able to make review claim', () => {
            test('when there are no previous review claims', () => {
                const result = canMakeReviewClaim(new Date(),)

                expect(result).toEqual({ isValid: true, reason: '' })
            })

            test('when the previous review claim is older than 10 months', () => {
                const result = canMakeReviewClaim(new Date(),)

                expect(result).toEqual({ isValid: true, reason: '' })
            })
        })

        describe('should not be able to make review claim', () => {
            test('when the previous review claim is within 10 months ', () => {
                const result = canMakeReviewClaim(new Date(),)

                expect(result).toEqual({ isValid: true, reason: 'another review within 10 months' })
            })
        })
    })

    describe('canMakeEndemicsClaim', () => {
        describe('should be able to make endemics claim when the previous review claim is within 10 months', () => {
            test('and the previous review claim has a status of paid', () => {

                
            })

            test('and the previous review claim has a status of ready to pay', () => {
            })

            test('and does not have a previous endemics claim', () => {
            })

            test('and the previous endemics claim is older than 10 months', () => {
            })
        })

        describe('should not be able to make endemics claim', () => {
            test('when there are no previous review claims', () => {

            })

            test('when the most recent claim is endemic', () => {

            })

            test('when the previous review claim is not ready to pay or paid', () => {

            })

            test('when the previous review claim is older than 10 months', () => {

            })

            test('when the previous endemics claim is within 10 months', () => {

            })
        })

    })

})