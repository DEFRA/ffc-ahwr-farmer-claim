const sheepTestTypes = {
  improvedEwePerformance: [
    { value: 'johnes', text: 'Johne’s' },
    { value: 'mv', text: 'Maedi Visna (MV)' },
    { value: 'cla', text: 'Caseous Lymphadenitis (CLA)' },
    { value: 'opa', text: 'Ovine Pulmonary Adenocarcinoma (OPA)' },
    { value: 'traceElements', text: 'Trace elements' },
    { value: 'haemonchosis', text: 'Haemonchosis' },
    { value: 'eweNutritionStatus', text: 'Ewe nutrition status' },
    { value: 'mastitis', text: 'Mastitis' },
    { value: 'tickBorneFever', text: 'Tick-borne fever' },
    { value: 'loupingIll', text: 'Louping ill' },
    { value: 'orf', text: 'Orf' },
    { value: 'pulpyKidney', text: 'Pulpy kidney' },
    { value: 'other', text: 'Other' }
  ],
  improvedReproductivePerformance: [
    { value: 'eae', text: 'Enzootic abortion of ewes (EAE)' },
    { value: 'bd', text: 'Border disease (BD)' },
    { value: 'toxoplasmosis', text: 'Toxoplasmosis' },
    { value: 'eweNutritionStatus', text: 'Ewe nutrition status' },
    { value: 'traceElements', text: 'Trace elements' },
    { value: 'liverFluke', text: 'Liver fluke' },
    { value: 'tickBorneFever', text: 'Tick-borne fever' },
    { value: 'other', text: 'Other' }
  ],
  improvedLambPerformance: [
    { value: 'lameness', text: 'Lameness' },
    { value: 'bd', text: 'Border disease (BD)' },
    { value: 'traceElements', text: 'Trace elements' },
    { value: 'liverFluke', text: 'Liver fluke' },
    { value: 'pge', text: 'Parasitic gastroenteritis (PGE)' },
    { value: 'coccidiosis', text: 'Coccidiosis' },
    { value: 'mastitis', text: 'Mastitis' },
    { value: 'tickBorneFever', text: 'Tick-borne fever' },
    { value: 'loupingIll', text: 'Louping ill' },
    { value: 'tickPyaemia', text: 'Tick pyaemia' },
    { value: 'lambNutritionStatus', text: 'Lamb nutrition status' },
    { value: 'orf', text: 'Orf' },
    { value: 'pulpyKidney', text: 'Pulpy kidney' },
    { value: 'lambDysentery', text: 'Lamb dysentery' },
    { value: 'pasteurellosis', text: 'Pasteurellosis' },
    { value: 'other', text: 'Other' }
  ],
  improvedNeonatalLambSurvival: [
    { value: 'bd', text: 'Border disease (BD)' },
    { value: 'toxoplasmosis', text: 'Toxoplasmosis' },
    { value: 'jointIll', text: 'Joint ill' },
    { value: 'eweNutritionStatus', text: 'Ewe nutrition status' },
    { value: 'traceElements', text: 'Trace elements' },
    { value: 'wateryMouth', text: 'Watery mouth' },
    { value: 'mastitis', text: 'Mastitis' },
    { value: 'tickPyaemia', text: 'Tick pyaemia' },
    { value: 'lambDysentery', text: 'Lamb dysentery' },
    { value: 'pasteurellosis', text: 'Pasteurellosis' },
    { value: 'other', text: 'Other' }
  ],
  reducedExternalParasites: [
    { value: 'flystrike', text: 'Flystrike' },
    { value: 'sheepScab', text: 'Sheep scab' },
    { value: 'other', text: 'Other' }
  ],
  reducedLameness: [
    { value: 'jointIll', text: 'Joint ill' },
    { value: 'lameness', text: 'Lameness' },
    { value: 'footRot', text: 'Foot rot' },
    { value: 'scald', text: 'Scald' },
    { value: 'codd', text: 'CODD' },
    { value: 'granuloma', text: 'Granuloma' },
    { value: 'heelOrToeAbscess', text: 'Heel or toe abscess' },
    { value: 'shellyHoof', text: 'Shelly hoof' },
    { value: 'tickPyaemia', text: 'Tick pyaemia' },
    { value: 'other', text: 'Other' }
  ]
}

const testResultOptions = {
  clinicalSymptoms: [{ value: 'clinicalSymptomsPresent', text: 'Clinical symptoms present' }, { value: 'clinicalSymptomsNotPresent', text: 'Clinical symptoms not present' }],
  positiveNegative: [{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }],
  problem: [{ value: 'problemIdentified', text: 'Problem identified' }, { value: 'noProblemIdentified', text: 'No problem identified' }]
}
const { positiveNegative, clinicalSymptoms, problem } = testResultOptions

const sheepTestResultsType = {
  bd: positiveNegative,
  cla: positiveNegative,
  coccidiosis: clinicalSymptoms,
  codd: clinicalSymptoms,
  eae: positiveNegative,
  eweNutritionStatus: problem,
  flystrike: clinicalSymptoms,
  footRot: clinicalSymptoms,
  granuloma: clinicalSymptoms,
  haemonchosis: clinicalSymptoms,
  heelOrToeAbscess: clinicalSymptoms,
  johnes: positiveNegative,
  jointIll: clinicalSymptoms,
  lambDysentery: positiveNegative,
  lambNutritionStatus: problem,
  lameness: clinicalSymptoms,
  liverFluke: clinicalSymptoms,
  loupingIll: clinicalSymptoms,
  mastitis: clinicalSymptoms,
  mv: positiveNegative,
  opa: clinicalSymptoms,
  orf: clinicalSymptoms,
  pasteurellosis: clinicalSymptoms,
  pge: clinicalSymptoms,
  pulpyKidney: positiveNegative,
  scald: clinicalSymptoms,
  sheepScab: positiveNegative,
  shellyHoof: clinicalSymptoms,
  tickBorneFever: positiveNegative,
  tickPyaemia: clinicalSymptoms,
  toxoplasmosis: positiveNegative,
  traceElements: problem,
  wateryMouth: clinicalSymptoms
}

module.exports = { sheepTestTypes, sheepTestResultsType, testResultOptions }
