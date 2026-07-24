const MEDICAL_CONDITION_MAP = [
  { severity: 'Critical', condition: 'Heart Attack', synonyms: ['heart attack', 'heartattack', 'cardiac event', 'myocardial infarction', 'mi'] },
  { severity: 'Critical', condition: 'Cardiac Arrest', synonyms: ['cardiac arrest', 'cardiacarrest', 'heart stopped', 'no pulse'] },
  { severity: 'Critical', condition: 'Stroke', synonyms: ['stroke', 'brain stroke', 'cva', 'paralysis', 'facial droop'] },
  { severity: 'Critical', condition: 'Brain Hemorrhage', synonyms: ['brain hemorrhage', 'brain bleed', 'intracranial bleeding', 'subarachnoid bleed'] },
  { severity: 'Critical', condition: 'Severe Head Injury', synonyms: ['severe head injury', 'head trauma', 'head injury', 'traumatic brain injury'] },
  { severity: 'Critical', condition: 'Major Road Accident', synonyms: ['major road accident', 'serious road accident', 'car crash', 'hit by vehicle', 'collision'] },
  { severity: 'Critical', condition: 'Heavy Internal Bleeding', synonyms: ['heavy internal bleeding', 'internal bleed', 'internal hemorrhage', 'bleeding internally'] },
  { severity: 'Critical', condition: 'Heavy External Bleeding', synonyms: ['heavy external bleeding', 'profuse bleeding', 'bleeding heavily', 'blood loss'] },
  { severity: 'Critical', condition: 'Unconscious Patient', synonyms: ['unconscious patient', 'unconscious', 'unresponsive', 'passed out'] },
  { severity: 'Critical', condition: 'Breathing Failure', synonyms: ['breathing failure', 'cannot breathe', 'breathing difficulty severe', 'respiratory failure'] },
  { severity: 'Critical', condition: 'Respiratory Arrest', synonyms: ['respiratory arrest', 'stopped breathing', 'no breathing'] },
  { severity: 'Critical', condition: 'Severe Burn (3rd Degree)', synonyms: ['severe burn', 'third degree burn', '3rd degree burn', 'deep burn'] },
  { severity: 'Critical', condition: 'Electric Shock (Severe)', synonyms: ['electric shock', 'electrocution', 'severe electric shock'] },
  { severity: 'Critical', condition: 'Poisoning', synonyms: ['poisoning', 'poisoned', 'toxic exposure', 'ingested poison'] },
  { severity: 'Critical', condition: 'Anaphylactic Shock', synonyms: ['anaphylactic shock', 'allergic shock', 'anaphylaxis'] },
  { severity: 'Critical', condition: 'Seizure/Epileptic Attack', synonyms: ['seizure', 'epileptic attack', 'convulsion', 'fits'] },
  { severity: 'Critical', condition: 'Near Drowning', synonyms: ['near drowning', 'drowning', 'water inhalation'] },
  { severity: 'Critical', condition: 'Snake Bite (Poisonous)', synonyms: ['snake bite', 'poisonous snake bite', 'venomous snake bite'] },
  { severity: 'Critical', condition: 'Gunshot Injury', synonyms: ['gunshot injury', 'gunshot wound', 'bullet injury'] },
  { severity: 'Critical', condition: 'Multiple Organ Trauma', synonyms: ['multiple organ trauma', 'poly trauma', 'multiple injuries'] },
  { severity: 'High', condition: 'Chest Pain', synonyms: ['chest pain', 'chest discomfort', 'pain in chest'] },
  { severity: 'High', condition: 'Breathing Difficulty', synonyms: ['breathing difficulty', 'shortness of breath', 'difficulty breathing', 'wheezing'] },
  { severity: 'High', condition: 'Deep Wound', synonyms: ['deep wound', 'deep cut', 'gash', 'laceration'] },
  { severity: 'High', condition: 'Multiple Fractures', synonyms: ['multiple fractures', 'many fractures', 'broken bones'] },
  { severity: 'High', condition: 'Severe Dehydration', synonyms: ['severe dehydration', 'dehydration', 'dry mouth', 'very thirsty'] },
  { severity: 'High', condition: 'High Fever (>103°F)', synonyms: ['high fever', 'fever above 103', '103 fever', 'very high fever'] },
  { severity: 'High', condition: 'Severe Asthma Attack', synonyms: ['severe asthma attack', 'asthma attack', 'asthma flare'] },
  { severity: 'High', condition: 'Severe Allergic Reaction', synonyms: ['severe allergic reaction', 'allergic reaction', 'hives', 'swelling face'] },
  { severity: 'High', condition: 'Severe Abdominal Pain', synonyms: ['severe abdominal pain', 'stomach pain severe', 'abdominal pain'] },
  { severity: 'High', condition: 'Severe Infection', synonyms: ['severe infection', 'infection', 'infection severe', 'septic'] },
  { severity: 'High', condition: 'Major Bone Fracture', synonyms: ['major bone fracture', 'bone fracture', 'fracture', 'broken bone'] },
  { severity: 'High', condition: 'Blood Vomiting', synonyms: ['blood vomiting', 'vomiting blood', 'hematemesis'] },
  { severity: 'High', condition: 'Pregnancy Emergency', synonyms: ['pregnancy emergency', 'pregnancy complication', 'labor pain', 'delivery emergency'] },
  { severity: 'High', condition: 'Diabetic Emergency', synonyms: ['diabetic emergency', 'low sugar', 'high sugar', 'diabetic shock'] },
  { severity: 'High', condition: 'Hypertensive Crisis', synonyms: ['hypertensive crisis', 'high blood pressure emergency', 'severe hypertension'] },
  { severity: 'Moderate', condition: 'Leg Fracture', synonyms: ['leg fracture', 'broken leg', 'fractured leg'] },
  { severity: 'Moderate', condition: 'Arm Fracture', synonyms: ['arm fracture', 'broken arm', 'fractured arm'] },
  { severity: 'Moderate', condition: 'Ankle Fracture', synonyms: ['ankle fracture', 'broken ankle'] },
  { severity: 'Moderate', condition: 'Moderate Burn', synonyms: ['moderate burn', 'second degree burn', 'partial thickness burn'] },
  { severity: 'Moderate', condition: 'Food Poisoning', synonyms: ['food poisoning', 'stomach upset', 'foodborne illness'] },
  { severity: 'Moderate', condition: 'Moderate Fever', synonyms: ['moderate fever', 'fever', 'temperature high'] },
  { severity: 'Moderate', condition: 'Dislocated Joint', synonyms: ['dislocated joint', 'joint dislocation', 'dislocation'] },
  { severity: 'Moderate', condition: 'Moderate Asthma', synonyms: ['moderate asthma', 'asthma episode'] },
  { severity: 'Moderate', condition: 'Migraine Attack', synonyms: ['migraine attack', 'migraine', 'severe headache'] },
  { severity: 'Moderate', condition: 'Kidney Stone Pain', synonyms: ['kidney stone pain', 'kidney stone', 'renal colic'] },
  { severity: 'Moderate', condition: 'Back Injury', synonyms: ['back injury', 'back pain', 'lower back pain'] },
  { severity: 'Moderate', condition: 'Sports Injury', synonyms: ['sports injury', 'sport injury', 'twisted ankle'] },
  { severity: 'Moderate', condition: 'Dengue Symptoms', synonyms: ['dengue', 'dengue symptoms', 'high fever and rash'] },
  { severity: 'Moderate', condition: 'Typhoid Symptoms', synonyms: ['typhoid', 'typhoid symptoms', 'fever and weakness'] },
  { severity: 'Mild', condition: 'Hand Fracture', synonyms: ['hand fracture', 'broken hand', 'fractured hand'] },
  { severity: 'Mild', condition: 'Finger Fracture', synonyms: ['finger fracture', 'broken finger'] },
  { severity: 'Mild', condition: 'Wrist Sprain', synonyms: ['wrist sprain', 'sprained wrist', 'wrist pain'] },
  { severity: 'Mild', condition: 'Minor Cut', synonyms: ['minor cut', 'small cut', 'scratch', 'slight cut'] },
  { severity: 'Mild', condition: 'Small Wound', synonyms: ['small wound', 'minor wound'] },
  { severity: 'Mild', condition: 'Minor Burn', synonyms: ['minor burn', 'small burn', 'first degree burn'] },
  { severity: 'Mild', condition: 'Headache', synonyms: ['headache', 'mild headache'] },
  { severity: 'Mild', condition: 'Cold', synonyms: ['cold', 'common cold'] },
  { severity: 'Mild', condition: 'Cough', synonyms: ['cough', 'dry cough'] },
  { severity: 'Mild', condition: 'Mild Fever', synonyms: ['mild fever', 'low fever', 'fever 100'] },
  { severity: 'Mild', condition: 'Sore Throat', synonyms: ['sore throat', 'throat pain'] },
  { severity: 'Mild', condition: 'Body Pain', synonyms: ['body pain', 'muscle pain', 'body ache'] },
  { severity: 'Mild', condition: 'Toothache', synonyms: ['toothache', 'tooth pain'] },
  { severity: 'Mild', condition: 'Ear Pain', synonyms: ['ear pain', 'ear ache'] },
  { severity: 'Mild', condition: 'Eye Irritation', synonyms: ['eye irritation', 'red eye', 'eye pain'] },
  { severity: 'Mild', condition: 'Skin Allergy', synonyms: ['skin allergy', 'allergy rash', 'itching'] },
  { severity: 'Mild', condition: 'Muscle Strain', synonyms: ['muscle strain', 'strain', 'muscle pull'] },
  { severity: 'Mild', condition: 'Neck Pain', synonyms: ['neck pain', 'neck stiffness'] },
  { severity: 'Mild', condition: 'Knee Pain', synonyms: ['knee pain', 'knee ache'] },
  { severity: 'Mild', condition: 'Foot Pain', synonyms: ['foot pain', 'foot ache'] }
];
function normalizeConditionText(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function classifyMedicalCondition(text) {
  const normalized = normalizeConditionText(text);
  if (!normalized) return { condition: 'Unknown Condition', severity: 'Mild', confidence: 25, matchedTerms: [] };
  let exactMatch = null;
  MEDICAL_CONDITION_MAP.forEach(item => {
    const exact = item.synonyms.find(term => normalizeConditionText(term) === normalized);
    if (exact) exactMatch = { condition: item.condition, severity: item.severity, confidence: 98, matchedTerms: [exact] };
  });
  if (exactMatch) return exactMatch;
  let bestMatch = null;
  let bestScore = 0;
  MEDICAL_CONDITION_MAP.forEach(item => {
    const matchedTerms = item.synonyms.filter(term => normalized.includes(normalizeConditionText(term)));
    if (!matchedTerms.length) return;
    const score = matchedTerms.reduce((sum, term) => sum + (normalizeConditionText(term).split(' ').length > 2 ? 18 : 12), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { condition: item.condition, severity: item.severity, confidence: Math.min(97, 72 + matchedTerms.length * 4), matchedTerms };
    }
  });
  if (!bestMatch || bestScore < 12) {
    const genericKeywords = [['fracture', 'High'], ['bleeding', 'Critical'], ['burn', 'High'], ['fever', 'Moderate'], ['pain', 'Moderate'], ['injury', 'Moderate']];
    for (const [keyword, severity] of genericKeywords) {
      if (normalized.includes(keyword)) return { condition: 'Unknown Condition', severity, confidence: 45, matchedTerms: [keyword] };
    }
    return { condition: 'Unknown Condition', severity: 'Mild', confidence: 35, matchedTerms: [] };
  }
  return bestMatch;
}
for (const sample of ['hand fracture', 'finger fracture', 'arm fracture', 'major bone fracture', 'mystery symptom']) {
  const result = classifyMedicalCondition(sample);
  console.log(sample, '=>', result.condition, result.severity, result.confidence);
}
