import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { radios } from '../models/form-component/radios.js'

const { urlPrefix } = config
const { endemicsSheepEndemicsPackage, endemicsVetRCVS, endemicsSheepTests } = links
const { endemicsClaim: { sheepEndemicsPackage: sheepEndemicsPackageKey } } = sessionKeys
const pageUrl = `${urlPrefix}/${endemicsSheepEndemicsPackage}`
const options = {
  hintHtml: 'You can find this on the summary the vet gave you. The diseases the vet might take samples to test for are listed with each package.'
}
const pageHeading = 'Which sheep health package did you choose?'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const session = getEndemicsClaim(request)
      const sheepEndemicsPackageRadios = radios(pageHeading, 'sheepEndemicsPackage', undefined, options)(
        [{
          value: 'improvedEwePerformance',
          text: 'Ewe condition',
          hint: {
            text: 'Includes: Caseous lymphadenitis (CLA), ewe nutrition status, haemonchosis, Johne’s, liver fluke, louping ill, Maedi Visna (MV), mastitis, orf, ovine pulmonary adenocarcinoma (OPA), pulpy kidney, tick-borne fever, trace elements'
          },
          checked: session?.sheepEndemicsPackage === 'improvedEwePerformance'
        },
        {
          value: 'improvedReproductivePerformance',
          text: 'Reproductive performance',
          hint: {
            text: 'Includes: border disease (BD), enzootic abortion of ewes (EAE), ewe nutrition status, liver fluke, tick-borne fever, toxoplasmosis, trace elements'
          },
          checked: session?.sheepEndemicsPackage === 'improvedReproductivePerformance'
        },
        {
          value: 'improvedLambPerformance',
          text: 'Lamb performance',
          hint: {
            text: 'Includes: border disease (BD), coccidiosis, lamb dysentery. lamb nutrition status, liver fluke, louping ill, mastitis, orf, parasitic gastroenteritis (PGE), pasteurellosis, pulpy kidney, tick-borne fever, tick pyaemia, trace elements'
          },
          checked: session?.sheepEndemicsPackage === 'improvedLambPerformance'
        },
        {
          value: 'improvedNeonatalLambSurvival',
          text: 'Neonatal lamb survival',
          hint: {
            text: 'Includes: border disease (BD), ewe nutrition status, joint ill, lamb dysentery, mastitis, pasteurellosis, tick pyaemia, toxoplasmosis, trace elements, watery mouth'
          },
          checked: session?.sheepEndemicsPackage === 'improvedNeonatalLambSurvival'
        },
        {
          value: 'reducedExternalParasites',
          text: 'External parasites',
          hint: {
            text: 'Includes: flystrike, sheep scab'
          },
          checked: session?.sheepEndemicsPackage === 'reducedExternalParasites'
        },
        {
          value: 'reducedLameness',
          text: 'Lameness',
          hint: {
            text: 'Includes: contagious ovine digital dermatitis (CODD), foot rot, granuloma, heel or toe abscess, joint ill, lameness, scald, shelly hoof, tick pyaemia'
          },
          checked: session?.sheepEndemicsPackage === 'reducedLameness'
        }
        ])
      const backLink = `${urlPrefix}/${endemicsVetRCVS}`
      return h.view(endemicsSheepEndemicsPackage, { backLink, sheepEndemicsPackage: session?.sheepEndemicsPackage, ...sheepEndemicsPackageRadios })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        sheepEndemicsPackage: Joi.string().valid(
          'improvedEwePerformance',
          'improvedReproductivePerformance',
          'improvedLambPerformance',
          'improvedNeonatalLambSurvival',
          'reducedExternalParasites',
          'reducedLameness').required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const sheepEndemicsPackageRadios = radios(pageHeading, 'sheepEndemicsPackage', 'Select a package', options)([
          {
            value: 'improvedEwePerformance',
            text: 'Ewe condition',
            hint: {
              text: 'Includes: Johne’s, Maedi Visna (MV), Caseous lymphadenitis (CLA), Ovine pulmonary adenocarcinoma (OPA), trace elements, liver fluke, aemonchosis, ewe nutrition status, mastitis, tick-borne fever, louping ill, orf, pulpy kidney'
            }
          },
          {
            value: 'improvedReproductivePerformance',
            text: 'Reproductive performance',
            hint: {
              text: 'Includes: enzootic abortion of ewes (EAE), border disease (BD), toxoplasmosis, ewe nutrition status, trace elements, liver fluke, tick-borne fever'
            }
          },
          {
            value: 'improvedLambPerformance',
            text: 'Lamb performance',
            hint: {
              text: 'Includes: border disease (BD), trace elements, liver fluke, parasitic gastroenteritis (PGE), coccidiosis, mastitis, tick-borne fever, louping ill, tick pyaemia, lamb nutrition status, orf, pulpy kidney, lamb dysentery, pasteurellosis'
            }
          },
          {
            value: 'improvedNeonatalLambSurvival',
            text: 'Neonatal lamb survival',
            hint: {
              text: 'Includes: border disease (BD), toxoplasmosis, joint ill, ewe nutrition status, trace elements, watery mouth, mastitis, tick pyaemia, lamb dysentery, pasteurellosis'
            }
          },
          {
            value: 'reducedExternalParasites',
            text: 'External parasites',
            hint: {
              text: 'Includes: flystrike, sheep scab'
            }
          },
          {
            value: 'reducedLameness',
            text: 'Lameness',
            hint: {
              text: 'Includes: joint ill, lameness, foot rot, scald, contagious ovine digital dermatitis (CODD), granuloma, heel or toe abscess, shelly hoof, tick pyaemia'
            }
          }])
        const backLink = `${urlPrefix}/${endemicsVetRCVS}`
        return h.view(endemicsSheepEndemicsPackage, {
          ...request.payload,
          backLink,
          ...sheepEndemicsPackageRadios,
          errorMessage: {
            text: 'Select a package',
            href: '#sheepEndemicsPackage'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { sheepEndemicsPackage } = request.payload
      const session = getEndemicsClaim(request)
      if (session?.sheepEndemicsPackage !== sheepEndemicsPackage) {
        setEndemicsClaim(request, 'sheepTests', undefined)
        setEndemicsClaim(request, 'sheepTestResults', undefined)
      }

      setEndemicsClaim(request, sheepEndemicsPackageKey, sheepEndemicsPackage)

      return h.redirect(`${urlPrefix}/${endemicsSheepTests}`)
    }
  }
}

export const sheepEndemicsPackageHandlers = [getHandler, postHandler]
