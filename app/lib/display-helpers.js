import { claimConstants } from '../constants/claim.js'
import { getClaimType } from './get-claim-type.js'

export function getTypeOfReviewForDisplay (claimData) {
  return {
    beef: 'Beef cattle',
    dairy: 'Dairy cattle',
    pigs: 'Pigs',
    sheep: 'Sheep'
  }[getClaimType(claimData)]
}

export const isSpecies = (typeOfLivestock, species) => {
  return typeOfLivestock === species
}

export function getSpeciesEligibleNumberForDisplay (claimData, isEndemicsClaims = false) {
  return {
    beef: isEndemicsClaims ? '11 or more beef cattle ' : '11 or more cattle ',
    dairy: isEndemicsClaims ? '11 or more dairy cattle ' : '11 or more cattle ',
    pigs: '51 or more pigs',
    sheep: '21 or more sheep'
  }[getClaimType(claimData, isEndemicsClaims)]
}

export function getVaccinationStatusForDisplay (vaccinatedNotVaccinated) {
  if (vaccinatedNotVaccinated === claimConstants.vaccination.vaccinated) return 'Vaccinated'
  if (vaccinatedNotVaccinated === claimConstants.vaccination.notVaccinated) return 'Not vaccinated'
  return undefined
}

export function getTypeOfReviewRowForDisplay (claimData) {
  return { key: { text: 'Type of review' }, value: { text: getTypeOfReviewForDisplay(claimData) } }
}

export function getEligibleNumberRowForDisplay (claimData) {
  return { key: { text: getSpeciesEligibleNumberForDisplay(claimData) }, value: { text: `${claimData.eligibleSpecies}, I had ${getSpeciesEligibleNumberForDisplay(claimData)}` } }
}

export function upperFirstLetter (str) {
  if (str && typeof str === 'string' && str !== '') return str?.charAt(0)?.toUpperCase() + str?.slice(1)
}

export const formatDate = (date) => (new Date(date)).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
