export class ClaimHasAlreadyBeenMadeError extends Error {
  constructor (message, organisation) {
    super(message)
    this.name = 'ClaimHasAlreadyBeenMadeError'
    this.organisation = organisation
  }
}
