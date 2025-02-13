import { claimConstants } from '../constants/claim.js'

export const getLivestockTypes = (typeOfLivestock) => {
  const { beef, dairy, pigs, sheep } = claimConstants.livestockTypes
  return {
    isBeef: typeOfLivestock === beef,
    isDairy: typeOfLivestock === dairy,
    isPigs: typeOfLivestock === pigs,
    isSheep: typeOfLivestock === sheep
  }
}
