import { claimConstants } from '../constants/claim.js'

const { beef, dairy, pigs, sheep } = claimConstants.livestockTypes

export const getLivestockTypes = (typeOfLivestock) => {
  return {
    isBeef: typeOfLivestock === beef,
    isDairy: typeOfLivestock === dairy,
    isPigs: typeOfLivestock === pigs,
    isSheep: typeOfLivestock === sheep
  }
}

export const isCows = (typeOfLivestock) => typeOfLivestock === beef || typeOfLivestock === dairy
