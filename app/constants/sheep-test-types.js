const TRACE_ELEMENTS = 'Trace elements'
const LIVER_FLUKE = 'Liver fluke'
const EWE_NUTRITION_STATUS = 'Ewe nutrition status'
const TICK_BORNE_FEVER = 'Tick-borne fever'
const BORDER_DISEASE = 'Border disease (BD)'
const TICK_PYAEMIA = 'Tick pyaemia'

export const sheepPackages = {
  improvedEwePerformance: 'Ewe condition',
  improvedReproductivePerformance: 'Reproductive performance',
  improvedLambPerformance: 'Lamb performance',
  improvedNeonatalLambSurvival: 'Neonatal lamb survival',
  reducedExternalParasites: 'External parasites',
  reducedLameness: 'Lameness'
}

export const sheepTestTypes = {
  improvedEwePerformance: [
    { value: 'johnes', text: 'Johne’s' },
    { value: 'mv', text: 'Maedi Visna (MV)' },
    { value: 'cla', text: 'Caseous Lymphadenitis (CLA)' },
    { value: 'opa', text: 'Ovine Pulmonary Adenocarcinoma (OPA)' },
    { value: 'traceElements', text: TRACE_ELEMENTS },
    { value: 'liverFluke', text: LIVER_FLUKE },
    { value: 'haemonchosis', text: 'Haemonchosis' },
    { value: 'eweNutritionStatus', text: EWE_NUTRITION_STATUS },
    { value: 'mastitis', text: 'Mastitis' },
    { value: 'tickBorneFever', text: TICK_BORNE_FEVER },
    { value: 'loupingIll', text: 'Louping ill' },
    { value: 'orf', text: 'Orf' },
    { value: 'pulpyKidney', text: 'Pulpy kidney' },
    { value: 'other', text: 'Other' }
  ],
  improvedReproductivePerformance: [
    { value: 'eae', text: 'Enzootic abortion of ewes (EAE)' },
    { value: 'bd', text: BORDER_DISEASE },
    { value: 'toxoplasmosis', text: 'Toxoplasmosis' },
    { value: 'eweNutritionStatus', text: EWE_NUTRITION_STATUS },
    { value: 'traceElements', text: TRACE_ELEMENTS },
    { value: 'liverFluke', text: LIVER_FLUKE },
    { value: 'tickBorneFever', text: TICK_BORNE_FEVER },
    { value: 'other', text: 'Other' }
  ],
  improvedLambPerformance: [
    { value: 'bd', text: BORDER_DISEASE },
    { value: 'traceElements', text: TRACE_ELEMENTS },
    { value: 'liverFluke', text: LIVER_FLUKE },
    { value: 'pge', text: 'Parasitic gastroenteritis (PGE)' },
    { value: 'coccidiosis', text: 'Coccidiosis' },
    { value: 'mastitis', text: 'Mastitis' },
    { value: 'tickBorneFever', text: TICK_BORNE_FEVER },
    { value: 'loupingIll', text: 'Louping ill' },
    { value: 'tickPyaemia', text: TICK_PYAEMIA },
    { value: 'lambNutritionStatus', text: 'Lamb nutrition status' },
    { value: 'orf', text: 'Orf' },
    { value: 'pulpyKidney', text: 'Pulpy kidney' },
    { value: 'lambDysentery', text: 'Lamb dysentery' },
    { value: 'pasteurellosis', text: 'Pasteurellosis' },
    { value: 'other', text: 'Other' }
  ],
  improvedNeonatalLambSurvival: [
    { value: 'bd', text: BORDER_DISEASE },
    { value: 'toxoplasmosis', text: 'Toxoplasmosis' },
    { value: 'jointIll', text: 'Joint ill' },
    { value: 'eweNutritionStatus', text: EWE_NUTRITION_STATUS },
    { value: 'traceElements', text: TRACE_ELEMENTS },
    { value: 'wateryMouth', text: 'Watery mouth' },
    { value: 'mastitis', text: 'Mastitis' },
    { value: 'tickPyaemia', text: TICK_PYAEMIA },
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
    { value: 'tickBorneFever', text: TICK_BORNE_FEVER },
    { value: 'footRot', text: 'Foot rot' },
    { value: 'scald', text: 'Scald' },
    { value: 'codd', text: 'CODD' },
    { value: 'granuloma', text: 'Granuloma' },
    { value: 'heelOrToeAbscess', text: 'Heel or toe abscess' },
    { value: 'shellyHoof', text: 'Shelly hoof' },
    { value: 'tickPyaemia', text: TICK_PYAEMIA },
    { value: 'other', text: 'Other' }
  ]
}

export const testResultOptions = {
  clinicalSymptoms: [{ value: 'clinicalSymptomsPresent', text: 'Clinical symptoms present' }, { value: 'clinicalSymptomsNotPresent', text: 'Clinical symptoms not present' }],
  positiveNegative: [{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }],
  problem: [{ value: 'problemIdentified', text: 'Problem identified' }, { value: 'noProblemIdentified', text: 'No problem identified' }]
}

export const { positiveNegative, clinicalSymptoms, problem } = testResultOptions

export const sheepTestResultsType = {
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
