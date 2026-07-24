// --- GRAPH MODEL DEFINITIONS ---
const nodes = {
  'H1': { x: 80, y: 120, type: 'hospital', label: 'City General (H1)', shortLabel: 'City General' },
  'H2': { x: 400, y: 460, type: 'hospital', label: 'Metro Health (H2)', shortLabel: 'Metro Health' },
  'H3': { x: 720, y: 260, type: 'hospital', label: 'Apex Trauma (H3)', shortLabel: 'Apex Trauma' },
  'I1': { x: 180, y: 120, type: 'intersection', label: 'Ring Rd & MG Rd (I1)', shortLabel: 'I1', signalState: 'NS_GREEN' },
  'I2': { x: 400, y: 120, type: 'intersection', label: 'Grand Avenue (I2)', shortLabel: 'I2', signalState: 'NS_GREEN' },
  'I3': { x: 620, y: 120, type: 'intersection', label: 'North Highway (I3)', shortLabel: 'I3', signalState: 'NS_GREEN' },
  'I4': { x: 180, y: 260, type: 'intersection', label: 'Market Square (I4)', shortLabel: 'I4', signalState: 'EW_GREEN' },
  'I5': { x: 400, y: 260, type: 'intersection', label: 'MG Road Center (I5)', shortLabel: 'I5', signalState: 'EW_GREEN' },
  'I6': { x: 620, y: 260, type: 'intersection', label: 'East Gate Jn (I6)', shortLabel: 'I6', signalState: 'EW_GREEN' },
  'I7': { x: 180, y: 400, type: 'intersection', label: 'South Terminal (I7)', shortLabel: 'I7', signalState: 'NS_GREEN' },
  'I8': { x: 400, y: 400, type: 'intersection', label: 'Metro Blvd (I8)', shortLabel: 'I8', signalState: 'NS_GREEN' },
  'I9': { x: 620, y: 400, type: 'intersection', label: 'Tech Park Way (I9)', shortLabel: 'I9', signalState: 'NS_GREEN' }
};
const edges = [
  { from: 'H1', to: 'I1' },
  { from: 'I1', to: 'I2' },
  { from: 'I2', to: 'I3' },
  { from: 'I4', to: 'I5' },
  { from: 'I5', to: 'I6' },
  { from: 'I6', to: 'H3' },
  { from: 'I7', to: 'I8' },
  { from: 'I8', to: 'I9' },
  { from: 'I1', to: 'I4' },
  { from: 'I4', to: 'I7' },
  { from: 'I2', to: 'I5' },
  { from: 'I5', to: 'I8' },
  { from: 'I8', to: 'H2' },
  { from: 'I3', to: 'I6' },
  { from: 'I6', to: 'I9' }
];
function getNeighbors(nodeKey) {
  const neighbors = [];
  edges.forEach(edge => {
    if (edge.from === nodeKey) neighbors.push(edge.to);
    if (edge.to === nodeKey) neighbors.push(edge.from);
  });
  return neighbors;
}
function solveDijkstra(startNodeKey, targetNodeKey) {
  const dist = {};
  const prev = {};
  const queue = [];
  const visitedOrder = [];
  Object.keys(nodes).forEach(key => {
    dist[key] = Infinity;
    prev[key] = null;
    queue.push(key);
  });
  dist[startNodeKey] = 0;
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const u = queue.shift();
    visitedOrder.push(u);
    if (u === targetNodeKey) break;
    if (dist[u] === Infinity) break;
    const neighbors = getNeighbors(u);
    neighbors.forEach(v => {
      if (!queue.includes(v)) return;
      const dx = nodes[u].x - nodes[v].x;
      const dy = nodes[u].y - nodes[v].y;
      const weight = Math.sqrt(dx * dx + dy * dy);
      const alt = dist[u] + weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    });
  }
  const path = [];
  let curr = targetNodeKey;
  if (prev[curr] !== null || curr === startNodeKey) {
    while (curr !== null) {
      path.unshift(curr);
      curr = prev[curr];
    }
  }
  return { path, visitedOrder, dist };
}
const STATE_IDLE = 'IDLE';
const STATE_RECORDING = 'RECORDING';
const STATE_PROCESSING = 'PROCESSING';
const STATE_DISPATCHED = 'DISPATCHED';
const STATE_EN_ROUTE = 'EN_ROUTE';
const STATE_PATIENT_PICKUP = 'PICKUP';
const STATE_RETURNING = 'RETURNING';
const STATE_COMPLETED = 'COMPLETED';
const STATE_READY_FOR_NEXT_REQUEST = 'READY_FOR_NEXT_REQUEST';
let systemState = STATE_IDLE;
let simulationSpeed = 1.5;
let simulationTimer = null;
let pathNodes = [];
let returnPathNodes = [];
let visitedNodesOrder = [];
let dijkstraExplorationDistances = {};
let assignedHospitalKey = 'H1';
let activePathIdx = 0;
let activeCorridorNodes = [];
let ambulance1 = {
  x: nodes['H1'].x,
  y: nodes['H1'].y,
  currentSegmentStart: 'H1',
  currentSegmentEnd: 'I1',
  segmentProgress: 0,
  isActive: false,
  flashing: false
};
let ambulance2 = {
  x: nodes['H2'].x,
  y: nodes['H2'].y,
  path: ['H2', 'I8', 'I9', 'I8', 'H2'],
  currentIdx: 0,
  progress: 0,
  speed: 0.5
};
let patientDetails = {
  name: 'Amit Kumar',
  location: 'MG Road Center (I5)',
  nodeKey: 'I5',
  severity: 'Critical'
};
let preemptedSignalsList = new Set();
let originalSignalStates = {};
let dispatchMode = 'SOS';
const PRIORITY_SCORE = { Critical: 4, High: 3, Moderate: 2, Mild: 1 };
let dispatchQueue = [];
let activeDispatches = [];
let completedDispatches = [];
let requestCounter = 1;
let etaTotalSeconds = 0;
let etaTimer = null;
let audioCtx = null;
let audioMuted = true;
let sirenOscillatorL = null;
let sirenOscillatorR = null;
let sirenGain = null;
let sirenInterval = null;
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const sosBtn = document.getElementById('sosBtn');
const callAmbulanceBtn = document.getElementById('callAmbulanceBtn');
const micBtn = document.getElementById('micBtn');
const voiceStatus = document.getElementById('voiceStatus');
const voiceSubtext = document.getElementById('voiceSubtext');
const soundWaves = document.getElementById('soundWaves');
const patientNameInput = document.getElementById('patientName');
const patientConditionTextInput = document.getElementById('patientConditionText');
const patientSeverityTextInput = document.getElementById('patientSeverityText');
const patientConfidenceTextInput = document.getElementById('patientConfidenceText');
const patientLocationInput = document.getElementById('patientLocation');
const patientConditionInput = document.getElementById('patientCondition');
const alertBanner = document.getElementById('alertBanner');
const dijkstraOverlay = document.getElementById('dijkstraOverlay');
const dijkstraProgress = document.getElementById('dijkstraProgress');
const dijkstraLog = document.getElementById('dijkstraLog');
const infoETA = document.getElementById('infoETA');
const infoDistance = document.getElementById('infoDistance');
const infoSignals = document.getElementById('infoSignals');
const mapIndicator = document.getElementById('mapIndicator');
const resetBtn = document.getElementById('resetBtn');
const audioToggle = document.getElementById('audioToggle');
const statEmergencies = document.getElementById('statEmergencies');
const statResponse = document.getElementById('statResponse');
const statHospitals = document.getElementById('statHospitals');
const statSignals = document.getElementById('statSignals');
const statusH1 = document.getElementById('status-H1');
const statusH3 = document.getElementById('status-H3');
const rowH1 = document.getElementById('hospital-H1');
const rowH3 = document.getElementById('hospital-H3');
const btnSpeed1x = document.getElementById('btnSpeed1x');
const btnSpeed2x = document.getElementById('btnSpeed2x');
const btnSpeed4x = document.getElementById('btnSpeed4x');
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, type, duration, volume = 0.1) {
  if (audioMuted) return;
  initAudio();
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}
function startSiren() {
  if (audioMuted) return;
  initAudio();
  if (sirenInterval) return;
  try {
    sirenGain = audioCtx.createGain();
    sirenGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    sirenGain.connect(audioCtx.destination);
    sirenOscillatorL = audioCtx.createOscillator();
    sirenOscillatorL.type = 'sawtooth';
    sirenOscillatorL.frequency.setValueAtTime(660, audioCtx.currentTime);
    sirenOscillatorL.connect(sirenGain);
    sirenOscillatorR = audioCtx.createOscillator();
    sirenOscillatorR.type = 'triangle';
    sirenOscillatorR.frequency.setValueAtTime(440, audioCtx.currentTime);
    sirenOscillatorR.connect(sirenGain);
    sirenOscillatorL.start();
    sirenOscillatorR.start();
    let toggle = false;
    sirenInterval = setInterval(() => {
      if (audioMuted) { stopSiren(); return; }
      const time = audioCtx.currentTime;
      if (toggle) {
        sirenOscillatorL.frequency.setValueAtTime(750, time);
        sirenOscillatorR.frequency.setValueAtTime(550, time);
      } else {
        sirenOscillatorL.frequency.setValueAtTime(600, time);
        sirenOscillatorR.frequency.setValueAtTime(400, time);
      }
      toggle = !toggle;
    }, 400);
  } catch (e) {
    console.error("Siren start error:", e);
  }
}
function stopSiren() {
  if (sirenInterval) { clearInterval(sirenInterval); sirenInterval = null; }
  try {
    if (sirenOscillatorL) { sirenOscillatorL.stop(); sirenOscillatorL.disconnect(); sirenOscillatorL = null; }
    if (sirenOscillatorR) { sirenOscillatorR.stop(); sirenOscillatorR.disconnect(); sirenOscillatorR = null; }
    if (sirenGain) { sirenGain.disconnect(); sirenGain = null; }
  } catch (e) {
    console.error("Siren stop error:", e);
  }
}
audioToggle.addEventListener('click', () => {
  audioMuted = !audioMuted;
  if (audioMuted) {
    audioToggle.classList.add('muted');
    audioToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    stopSiren();
  } else {
    audioToggle.classList.remove('muted');
    audioToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    initAudio();
    playTone(523.25, 'sine', 0.15, 0.15);
    setTimeout(() => playTone(659.25, 'sine', 0.25, 0.15), 100);
    if (systemState === STATE_EN_ROUTE || systemState === STATE_RETURNING) startSiren();
  }
});
function clampETA(value, min = 2, max = 30) {
  return Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
}
function clampSecondsETA(value, min = 120, max = 1800) {
  return Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
}
function estimateETA(nodeKey) {
  const route = solveDijkstra('H1', nodeKey);
  let totalPixels = 0;
  for (let i = 0; i < route.path.length - 1; i++) {
    const a = nodes[route.path[i]];
    const b = nodes[route.path[i + 1]];
    totalPixels += Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  }
  return clampETA(Math.round((totalPixels / 100) * 60));
}
function selectHospitalForSeverity(severity) {
  if (severity === 'Critical' || severity === 'High') return 'H3';
  if (severity === 'Moderate') return 'H2';
  return 'H1';
}
function sortDispatchQueue(items) {
  return [...items].sort((a, b) => {
    const sevDiff = (PRIORITY_SCORE[b.severity] || 0) - (PRIORITY_SCORE[a.severity] || 0);
    if (sevDiff !== 0) return sevDiff;
    if (a.etaMinutes !== b.etaMinutes) return a.etaMinutes - b.etaMinutes;
    return a.createdAt - b.createdAt;
  });
}
function ambulanceIsAvailable() {
  return !ambulance1.isActive
    && !activeDispatches.length
    && [STATE_IDLE, STATE_COMPLETED, STATE_READY_FOR_NEXT_REQUEST, STATE_RECORDING].includes(systemState);
}
// FIX 1: releaseAmbulanceForQueue — clears activeDispatches, sets STATE_IDLE
function releaseAmbulanceForQueue() {
  ambulance1.isActive = false;
  ambulance1.midRouteNotified = false;
  if (etaTimer) clearInterval(etaTimer);
  etaTimer = null;
  activeDispatches = [];
  systemState = STATE_IDLE;
  alertBanner.style.display = 'none';
  mapIndicator.classList.remove('dispatching');
  stopSiren();
}
function enqueueDispatchRequest(mode = 'SOS') {
  const severity = patientConditionInput.value || patientDetails.severity || 'Mild';
  const condition = patientConditionTextInput.value || patientDetails.condition || 'Unknown Condition';
  const request = {
    id: `REQ-${String(requestCounter++).padStart(3, '0')}`,
    patientName: patientNameInput.value.trim() || 'Unknown Patient',
    condition,
    severity,
    priorityScore: PRIORITY_SCORE[severity] || 1,
    etaMinutes: estimateETA(patientLocationInput.value || patientDetails.nodeKey || 'I5'),
    hospitalKey: selectHospitalForSeverity(severity),
    assignedAmbulance: `Ambulance ${activeDispatches.length + 1}`,
    status: 'waiting',
    createdAt: Date.now(),
    mode
  };
  dispatchQueue.push(request);
  renderDispatchQueue();
  if (ambulanceIsAvailable()) setTimeout(() => dispatchNextQueuedRequest(), 120);
  return request;
}
function renderDispatchQueue() {
  const waitingBox = document.getElementById('queueWaiting');
  const dispatchedBox = document.getElementById('queueDispatched');
  const completedBox = document.getElementById('queueCompleted');
  const sortedQueue = sortDispatchQueue(dispatchQueue);
  waitingBox.innerHTML = sortedQueue.map((item, index) => `
    <div class="queue-item">
      <div class="queue-topline"><strong>${item.id}</strong> <span class="badge badge-critical">${item.severity}</span></div>
      <div>${item.patientName} • ${item.condition}</div>
      <div class="queue-meta">Rank ${index + 1} • Priority ${item.priorityScore} • ETA ${item.etaMinutes} min • ${item.assignedAmbulance}</div>
    </div>
  `).join('');
  dispatchedBox.innerHTML = activeDispatches.map(item => `
    <div class="queue-item active-queue-item">
      <div class="queue-topline"><strong>${item.id}</strong> <span class="badge badge-resolved">Dispatched</span></div>
      <div>${item.patientName} • ${item.condition}</div>
      <div class="queue-meta">${item.assignedAmbulance} • ETA ${item.etaMinutes} min</div>
    </div>
  `).join('');
  completedBox.innerHTML = completedDispatches.map(item => `
    <div class="queue-item completed-queue-item">
      <div class="queue-topline"><strong>${item.id}</strong> <span class="badge badge-mild">Completed</span></div>
      <div>${item.patientName} • ${item.condition}</div>
      <div class="queue-meta">Resolved • ${item.assignedAmbulance}</div>
    </div>
  `).join('');
}
function applyQueuedRequest(request) {
  patientDetails = {
    name: request.patientName,
    condition: request.condition,
    severity: request.severity,
    nodeKey: patientLocationInput.value || 'I5',
    location: nodes[patientLocationInput.value || 'I5'].label,
    confidence: 75 + request.priorityScore * 6,
    etaMinutes: request.etaMinutes
  };
  patientConditionTextInput.value = request.condition;
  patientSeverityTextInput.value = request.severity;
  patientConfidenceTextInput.value = `${Math.min(99, 75 + request.priorityScore * 6)}%`;
  patientNameInput.value = request.patientName;
  patientConditionInput.value = request.severity;
  dispatchMode = request.mode || 'SOS';
}
function dispatchNextQueuedRequest() {
  if (!dispatchQueue.length || !ambulanceIsAvailable()) return false;
  const ready = sortDispatchQueue(dispatchQueue)[0];
  dispatchQueue = dispatchQueue.filter(item => item.id !== ready.id);
  ready.status = 'dispatched';
  ready.etaMinutes = clampETA(ready.etaMinutes, 2, 30);
  ready.assignedAmbulance = 'Ambulance 1';
  activeDispatches.unshift(ready);
  releaseAmbulanceForQueue();
  applyQueuedRequest(ready);
  renderDispatchQueue();
  showToast(`🤖 AI Dispatch Queue selected ${ready.id} for ${ready.assignedAmbulance}.`, 'info');
  runDijkstraSimulation();
  return true;
}
function autoDispatchNextWaitingRequest() {
  if (!dispatchQueue.length || activeDispatches.length || ambulance1.isActive) return false;
  releaseAmbulanceForQueue();
  return dispatchNextQueuedRequest();
}
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'critical' ? 'toast-critical' : type === 'success' ? 'toast-success' : ''}`;
  let icon = '<i class="fa-solid fa-info-circle" style="color: var(--ambulance-blue)"></i>';
  if (type === 'critical') icon = '<i class="fa-solid fa-circle-exclamation" style="color: var(--emergency-red)"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check" style="color: var(--safe-green)"></i>';
  toast.innerHTML = `${icon}<div>${message}</div><span class="toast-close">&times;</span>`;
  document.getElementById('toastContainer').appendChild(toast);
  const timeout = setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4500);
  toast.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(timeout); toast.remove(); });
  if (type === 'critical') playTone(440, 'triangle', 0.3, 0.15);
  else if (type === 'success') { playTone(880, 'sine', 0.15, 0.1); setTimeout(() => playTone(1100, 'sine', 0.15, 0.1), 100); }
  else playTone(660, 'sine', 0.15, 0.08);
}
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
  { severity: 'High', condition: 'High Fever (>103F)', synonyms: ['high fever', 'fever above 103', '103 fever', 'very high fever'] },
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
  { severity: 'Moderate', condition: 'Migraine Attack', synonyms: ['medium headache', 'migraine', 'severe headache'] },
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
    const genericKeywords = [['fracture','High'],['bleeding','Critical'],['burn','High'],['fever','Moderate'],['pain','Moderate'],['injury','Moderate']];
    for (const [keyword, severity] of genericKeywords) {
      if (normalized.includes(keyword)) return { condition: 'Unknown Condition', severity, confidence: 45, matchedTerms: [keyword] };
    }
    return { condition: 'Unknown Condition', severity: 'Mild', confidence: 35, matchedTerms: [] };
  }
  return bestMatch;
}
// AUTO-DISPATCH on voice — FIXED to start instantly
function parseEmergencySpeech(transcript) {
  const diagnosis = classifyMedicalCondition(transcript);
  const severity = diagnosis.severity;
  const condition = diagnosis.condition;
  const confidence = diagnosis.confidence;
  const lower = normalizeConditionText(transcript);
  let matchedNodeKey = 'I5';
  const locationKeywords = {
    'I1': ["ring road","ring rd","i1","i-1","first intersection"],
    'I2': ["grand avenue","avenue","i2","i-2"],
    'I3': ["north highway","highway","i3","i-3"],
    'I4': ["market square","market","i4","i-4"],
    'I5': ["mg road center","mg road","center","i5","i-5"],
    'I6': ["east gate","east gate jn","i6","i-6"],
    'I7': ["south terminal","south","i7","i-7"],
    'I8': ["metro blvd","metro boulevard","metro","i8","i-8"],
    'I9': ["tech park","it park","i9","i-9"]
  };
  for (const [key, keywords] of Object.entries(locationKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) { matchedNodeKey = key; break; }
  }
  if (!patientNameInput.value.trim()) patientNameInput.value = 'Unknown Patient';
  patientConditionTextInput.value = condition;
  patientSeverityTextInput.value = severity;
  patientConfidenceTextInput.value = `${Math.round(confidence)}%`;
  patientLocationInput.value = matchedNodeKey;
  patientConditionInput.value = severity;
  patientDetails = {
    name: patientNameInput.value.trim() || 'Unknown Patient',
    condition, severity, confidence,
    location: nodes[matchedNodeKey].label,
    nodeKey: matchedNodeKey,
    detectedCondition: condition
  };
  [patientNameInput, patientLocationInput, patientConditionInput].forEach(field => {
    field.style.borderColor = 'var(--safe-green)';
    setTimeout(() => field.style.borderColor = 'var(--border-color)', 1500);
  });
  playTone(523.25, 'sine', 0.15, 0.12);
  setTimeout(() => playTone(659.25, 'sine', 0.25, 0.12), 100);
  if (diagnosis.condition === 'Unknown Condition') {
    showToast('Warning: Unknown condition detected. Please manually confirm severity before dispatch.', 'info');
  } else {
    showToast(`Detected: ${condition} | Severity: ${severity} | Confidence: ${Math.round(confidence)}%`, 'success');
  }
  
  // Reset any active runs so we start dispatching immediately for the voice command
  softResetDispatchRuntime();
  systemState = STATE_IDLE;
  setTimeout(() => startDispatch('SOS'), 350);
}
function fallbackVoiceSimulation() {
  const simulationPhrases = [
    { text: "Severe cardiac arrest patient is unconscious at Metro Boulevard node I8" },
    { text: "Patient has a broken bone and minor bleeding at Market Square node I4" },
    { text: "Stable patient with a mild headache at Ring Road node I1" },
    { text: "Life threatening chest pain at Tech Park node I9, send assistance" },
    { text: "Moderate leg fracture at Grand Avenue node I2" }
  ];
  const phrase = simulationPhrases[Math.floor(Math.random() * simulationPhrases.length)];
  micBtn.classList.add('listening');
  soundWaves.classList.add('active');
  voiceStatus.innerText = "Synthesizing voice stream...";
  voiceSubtext.innerText = "";
  playTone(350, 'sine', 0.2, 0.1);
  let charIdx = 0;
  const interval = setInterval(() => {
    voiceSubtext.innerText += phrase.text[charIdx];
    charIdx++;
    if (charIdx >= phrase.text.length) {
      clearInterval(interval);
      micBtn.classList.remove('listening');
      soundWaves.classList.remove('active');
      voiceStatus.innerText = "AI Speech Transcript Parsed";
      parseEmergencySpeech(phrase.text);
    }
  }, 30);
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => {
    systemState = STATE_RECORDING;
    micBtn.classList.add('listening');
    soundWaves.classList.add('active');
    voiceStatus.innerText = "Speech Recognition Active";
    voiceSubtext.innerText = "Speak now: name, location, symptoms...";
    playTone(400, 'sine', 0.1, 0.08);
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    voiceStatus.innerText = "Speech Transcript Processed";
    voiceSubtext.innerText = `"${transcript}"`;
    parseEmergencySpeech(transcript);
  };
  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === 'not-allowed') showToast("Microphone access denied. Using AI voice typewriter simulation.", 'info');
    fallbackVoiceSimulation();
  };
  recognition.onend = () => {
    micBtn.classList.remove('listening');
    soundWaves.classList.remove('active');
    if (systemState === STATE_RECORDING) {
      systemState = STATE_IDLE;
    }
    if (
      systemState === STATE_COMPLETED ||
      systemState === STATE_READY_FOR_NEXT_REQUEST
    ) {
      systemState = STATE_IDLE;
    }
  };
}
micBtn.addEventListener('click', () => {
  if (systemState !== STATE_IDLE && systemState !== STATE_COMPLETED && systemState !== STATE_READY_FOR_NEXT_REQUEST && systemState !== STATE_RECORDING) {
    showToast('System is currently active. Voice input will queue the request.', 'info');
  }
  if (systemState === STATE_COMPLETED || systemState === STATE_READY_FOR_NEXT_REQUEST) {
    stopSiren();
    clearInterval(simulationTimer);
    clearInterval(etaTimer);
    simulationTimer = null;
    etaTimer = null;
    systemState = STATE_IDLE;
  }
  if (recognition) {
    try { recognition.start(); } catch (e) { fallbackVoiceSimulation(); }
  } else {
    fallbackVoiceSimulation();
  }
});
patientNameInput.addEventListener('input', () => { patientDetails.name = patientNameInput.value; });
patientLocationInput.addEventListener('change', () => {
  patientDetails.nodeKey = patientLocationInput.value;
  patientDetails.location = nodes[patientDetails.nodeKey].label;
  playTone(550, 'sine', 0.08, 0.05);
});
patientConditionInput.addEventListener('change', () => {
  patientDetails.severity = patientConditionInput.value;
  patientSeverityTextInput.value = patientConditionInput.value;
  playTone(550, 'sine', 0.08, 0.05);
});
canvas.addEventListener('click', (e) => {
  if (systemState !== STATE_IDLE) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
  let closestNodeKey = null;
  let minDistance = 25;
  Object.keys(nodes).forEach(key => {
    const node = nodes[key];
    const dx = node.x - clickX;
    const dy = node.y - clickY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDistance) { minDistance = dist; closestNodeKey = key; }
  });
  if (closestNodeKey) {
    if (nodes[closestNodeKey].type === 'intersection') {
      patientLocationInput.value = closestNodeKey;
      patientDetails.nodeKey = closestNodeKey;
      patientDetails.location = nodes[closestNodeKey].label;
      playTone(660, 'sine', 0.1, 0.1);
      showToast(`Selected emergency coordinate at Node ${closestNodeKey} (${nodes[closestNodeKey].shortLabel}).`, 'info');
    } else {
      showToast(`Node ${closestNodeKey} is a Hospital Terminal. Select a street intersection for the patient.`, 'info');
    }
  }
});
function drawRoads() {
  ctx.strokeStyle = '#1a1f28'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  edges.forEach(edge => { const from = nodes[edge.from]; const to = nodes[edge.to]; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); });
  ctx.strokeStyle = '#0b0f19'; ctx.lineWidth = 22;
  edges.forEach(edge => { const from = nodes[edge.from]; const to = nodes[edge.to]; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); });
  ctx.strokeStyle = '#30363d'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 8]);
  edges.forEach(edge => { const from = nodes[edge.from]; const to = nodes[edge.to]; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); });
  ctx.setLineDash([]);
}
function drawTrafficSignals() {
  const time = Date.now();
  Object.keys(nodes).forEach(key => {
    const node = nodes[key];
    if (node.type !== 'intersection') return;
    let signalHorizontal = 'RED'; let signalVertical = 'RED';
    if (systemState === STATE_IDLE) {
      const cycles = Math.floor(time / 4000) % 2;
      signalHorizontal = cycles === 0 ? 'GREEN' : 'RED';
      signalVertical = cycles === 0 ? 'RED' : 'GREEN';
    } else {
      if (dispatchMode === 'SOS' && activeCorridorNodes.includes(key)) {
        const nodeIndex = pathNodes.indexOf(key);
        if (nodeIndex !== -1 && nodeIndex < pathNodes.length - 1) {
          const nextNode = nodes[pathNodes[nodeIndex + 1]];
          const isHorizontal = Math.abs(node.x - nextNode.x) > Math.abs(node.y - nextNode.y);
          signalHorizontal = isHorizontal ? 'GREEN' : 'RED';
          signalVertical = isHorizontal ? 'RED' : 'GREEN';
        } else { signalHorizontal = 'GREEN'; signalVertical = 'GREEN'; }
      }
    }
    ctx.beginPath(); ctx.arc(node.x - 14, node.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = signalHorizontal === 'GREEN' ? varColor('--safe-green') : varColor('--emergency-red');
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4; ctx.fill();
    ctx.beginPath(); ctx.arc(node.x, node.y - 14, 4, 0, Math.PI * 2);
    ctx.fillStyle = signalVertical === 'GREEN' ? varColor('--safe-green') : varColor('--emergency-red');
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4; ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#8b949e'; ctx.font = 'bold 9px Inter'; ctx.fillText(node.shortLabel, node.x - 5, node.y + 16);
  });
}
function varColor(cssVarName) {
  if (cssVarName.includes('safe-green')) return '#00ff88';
  if (cssVarName.includes('emergency-red')) return '#ff4444';
  if (cssVarName.includes('ambulance-blue')) return '#4fc3f7';
  if (cssVarName.includes('warning-yellow')) return '#ffd700';
  return '#ffffff';
}
function drawGreenCorridor() {
  if (dispatchMode !== 'SOS' || (systemState !== STATE_EN_ROUTE && systemState !== STATE_RETURNING) || pathNodes.length < 2) return;
  ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 6; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const startNode = nodes[pathNodes[0]]; ctx.moveTo(startNode.x, startNode.y);
  for (let i = 1; i < pathNodes.length; i++) { const nextNode = nodes[pathNodes[i]]; ctx.lineTo(nextNode.x, nextNode.y); }
  ctx.stroke(); ctx.shadowBlur = 0;
}
function drawHospitals() {
  Object.keys(nodes).forEach(key => {
    const node = nodes[key];
    if (node.type !== 'hospital') return;
    ctx.beginPath(); ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(79, 195, 247, 0.1)'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    if ((systemState === STATE_EN_ROUTE || systemState === STATE_RETURNING) && key === assignedHospitalKey) {
      ctx.beginPath(); ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = '#4fc3f7'; ctx.font = '800 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', node.x, node.y);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px Inter'; ctx.fillText(node.shortLabel, node.x, node.y - 24);
  });
}
function drawPatient() {
  if (systemState === STATE_IDLE || systemState === STATE_RECORDING || systemState === STATE_PROCESSING || systemState === STATE_COMPLETED) return;
  const node = nodes[patientDetails.nodeKey];
  const pulseTime = Date.now() / 300;
  ctx.shadowBlur = 0;
  for (let i = 1; i <= 3; i++) {
    const radius = 10 + ((pulseTime + i * 5) % 20);
    const opacity = 1 - (radius - 10) / 20;
    ctx.beginPath(); ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 68, 68, ${opacity * 0.4})`; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'var(--emergency-red)'; ctx.shadowColor = 'var(--emergency-red)'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px Inter'; ctx.textAlign = 'center'; ctx.fillText('PATIENT', node.x, node.y - 14);
}
function drawAmbulances() {
  ctx.font = '14px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.beginPath(); ctx.arc(ambulance2.x, ambulance2.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(79, 195, 247, 0.2)'; ctx.fill(); ctx.fillText('🚑', ambulance2.x, ambulance2.y);
  if (systemState === STATE_IDLE || systemState === STATE_PROCESSING || systemState === STATE_RECORDING) {
    ctx.beginPath(); ctx.arc(ambulance1.x, ambulance1.y + 10, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fill(); ctx.fillText('🚑', ambulance1.x, ambulance1.y);
  } else {
    const pulse = Date.now() % 400 > 200;
    ctx.beginPath(); ctx.arc(ambulance1.x, ambulance1.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = pulse ? 'rgba(255, 68, 68, 0.25)' : 'rgba(79, 195, 247, 0.25)';
    ctx.strokeStyle = pulse ? '#ff4444' : '#4fc3f7'; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
    ctx.fillText('🚑', ambulance1.x, ambulance1.y);
  }
}
let searchStage = 0; let searchTimer = 0;
function drawDijkstraSearch() {
  if (systemState !== STATE_PROCESSING || visitedNodesOrder.length === 0) return;
  const totalSteps = visitedNodesOrder.length;
  const percent = Math.min(100, Math.floor((searchStage * 100 + searchTimer) / 3));
  const currentExploredCount = Math.ceil((percent / 100) * totalSteps);
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)'; ctx.shadowColor = 'var(--warning-yellow)'; ctx.shadowBlur = 6;
  for (let i = 0; i < currentExploredCount; i++) {
    const nodeKey = visitedNodesOrder[i]; const node = nodes[nodeKey]; if (!node) continue;
    ctx.beginPath(); ctx.arc(node.x, node.y, 12 + (Date.now() / 180 % 12), 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(node.x, node.y, 7, 0, Math.PI * 2); ctx.fillStyle = 'var(--warning-yellow)'; ctx.fill();
  }
  ctx.shadowBlur = 0;
}
function renderMap() {
  ctx.fillStyle = '#0b0f19'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRoads(); drawGreenCorridor(); drawTrafficSignals(); drawHospitals(); drawPatient();
  if (systemState === STATE_PROCESSING) drawDijkstraSearch();
  drawAmbulances();
  requestAnimationFrame(renderMap);
}
renderMap();
function runDijkstraSimulation() {
  systemState = STATE_PROCESSING;
  dijkstraOverlay.classList.add('active');
  searchStage = 0; searchTimer = 0;
  const severity = patientDetails.severity;
  if (severity === 'Critical' || severity === 'High') assignedHospitalKey = 'H3';
  else if (severity === 'Moderate') assignedHospitalKey = 'H2';
  else assignedHospitalKey = 'H1';
  const route1 = solveDijkstra('H1', patientDetails.nodeKey);
  pathNodes = route1.path; visitedNodesOrder = route1.visitedOrder; dijkstraExplorationDistances = route1.dist;
  const route2 = solveDijkstra(patientDetails.nodeKey, assignedHospitalKey);
  returnPathNodes = route2.path;
  const progressInterval = setInterval(() => {
    searchTimer += 4;
    if (searchTimer >= 100) { searchTimer = 0; searchStage++; }
    const totalExplored = visitedNodesOrder.length;
    const currentExploredIdx = Math.min(totalExplored - 1, Math.floor((searchStage + searchTimer / 100) * (totalExplored / 3)));
    const currentNodeKey = visitedNodesOrder[currentExploredIdx];
    const percent = Math.min(100, Math.floor((searchStage * 100 + searchTimer) / 3));
    dijkstraProgress.style.width = `${percent}%`;
    if (currentNodeKey && percent > 0 && percent % 8 === 0) {
      const distanceVal = dijkstraExplorationDistances[currentNodeKey];
      dijkstraLog.innerText = `Relaxing node ${nodes[currentNodeKey].shortLabel}: cost ${Math.round(distanceVal)}m`;
      playTone(480 + (percent * 3), 'sine', 0.05, 0.08);
    }
    if (searchStage >= 3 || percent >= 100) {
      clearInterval(progressInterval);
      dijkstraOverlay.classList.remove('active');
      playTone(880, 'sine', 0.15, 0.1);
      setTimeout(() => playTone(1100, 'sine', 0.25, 0.1), 100);
      dispatchAmbulance();
    }
  }, 30);
}
// FIX 2: softResetDispatchRuntime — clears activeDispatches
function softResetDispatchRuntime() {
  if (simulationTimer) clearInterval(simulationTimer);
  if (etaTimer) clearInterval(etaTimer);
  simulationTimer = null; etaTimer = null;
  stopSiren();
  alertBanner.style.display = 'none';
  mapIndicator.classList.remove('dispatching');
  dijkstraOverlay.classList.remove('active');
  sosBtn.classList.remove('pulsing');
  callAmbulanceBtn.classList.remove('pulsing');
  ambulance1.isActive = false;
  ambulance1.midRouteNotified = false;
  activeDispatches = [];
  systemState = STATE_IDLE;
  infoETA.innerText = '00:00';
  infoDistance.innerText = '0.0 km';
  statResponse.innerText = '4.2 min';
}
function saveDispatchRecord(requestType = dispatchMode, status = 'Dispatched') {
  const history = JSON.parse(localStorage.getItem('ambulanceDispatchHistory') || '[]');
  history.unshift({
    requestType,
    patient: patientDetails.name || 'Unknown',
    condition: patientConditionTextInput?.value || patientDetails.severity || 'Unspecified',
    severity: patientConditionInput?.value || patientDetails.severity || 'Unspecified',
    status,
    timestamp: new Date().toLocaleString('en-IN')
  });
  localStorage.setItem('ambulanceDispatchHistory', JSON.stringify(history.slice(0, 8)));
}
function dispatchAmbulance(mode = dispatchMode) {
  const activeRequest = activeDispatches[0];
  if (activeRequest) { activeRequest.status = 'dispatched'; activeRequest.etaMinutes = Math.max(1, Math.min(30, activeRequest.etaMinutes)); }
  dispatchMode = mode;
  systemState = STATE_EN_ROUTE;
  alertBanner.style.display = 'block';
  mapIndicator.classList.add('dispatching');
  startSiren();
  activePathIdx = 0;
  activeCorridorNodes = [...pathNodes];
  ambulance1.x = nodes['H1'].x; ambulance1.y = nodes['H1'].y;
  ambulance1.currentSegmentStart = pathNodes[0]; ambulance1.currentSegmentEnd = pathNodes[1];
  ambulance1.segmentProgress = 0; ambulance1.isActive = true; ambulance1.midRouteNotified = false;
  statEmergencies.innerText = "1"; statResponse.innerText = "Calculated...";
  let totalPixels = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) { const n1 = nodes[pathNodes[i]]; const n2 = nodes[pathNodes[i+1]]; totalPixels += Math.sqrt((n2.x-n1.x)**2+(n2.y-n1.y)**2); }
  for (let i = 0; i < returnPathNodes.length - 1; i++) { const n1 = nodes[returnPathNodes[i]]; const n2 = nodes[returnPathNodes[i+1]]; totalPixels += Math.sqrt((n2.x-n1.x)**2+(n2.y-n1.y)**2); }
  etaTotalSeconds = clampSecondsETA(Math.round((totalPixels / 100) * 60), 120, 1800);
  startETATimer();
  rowH1.classList.remove('assigned-row'); rowH3.classList.remove('assigned-row');
  document.getElementById('hospital-H2').classList.remove('assigned-row');
  statusH1.innerText = "STANDBY"; statusH1.className = "badge badge-resolved";
  document.getElementById('status-H2').innerText = "BUSY"; document.getElementById('status-H2').className = "badge badge-critical";
  statusH3.innerText = "READY"; statusH3.className = "badge badge-mild";
  const targetHospName = nodes[assignedHospitalKey].shortLabel;
  showToast(dispatchMode === 'SOS' ? `Dispatch Preemption active: ${targetHospName} selected & notified.` : `Standard ambulance request accepted for ${targetHospName}.`, dispatchMode === 'SOS' ? 'critical' : 'info');
  saveDispatchRecord(dispatchMode, 'Dispatched');
  const statusEl = document.getElementById(`status-${assignedHospitalKey}`);
  statusEl.innerText = "NOTIFIED"; statusEl.className = "badge badge-critical";
  document.getElementById(`hospital-${assignedHospitalKey}`).classList.add('assigned-row');
  preemptedSignalsList.clear(); updateSignalCounter();
  if (simulationTimer) clearInterval(simulationTimer);
  simulationTimer = setInterval(updateSimulationTick, 16);
}
function getRemainingRoutePixels(pathArray = pathNodes) {
  if (!pathArray || pathArray.length < 2) return 0;
  let pixels = 0;
  const currentIndex = Math.max(0, activePathIdx);
  const currentSegmentEnd = pathArray[currentIndex + 1];
  if (pathArray[currentIndex] && currentSegmentEnd) {
    const endNode = nodes[currentSegmentEnd];
    pixels += Math.sqrt((ambulance1.x - endNode.x) ** 2 + (ambulance1.y - endNode.y) ** 2);
    for (let i = currentIndex + 1; i < pathArray.length - 1; i++) {
      const n1 = nodes[pathArray[i]]; const n2 = nodes[pathArray[i + 1]];
      pixels += Math.sqrt((n2.x - n1.x) ** 2 + (n2.y - n1.y) ** 2);
    }
  }
  return pixels;
}
function updateETAFromDistance() {
  if (systemState === STATE_IDLE || systemState === STATE_RECORDING || systemState === STATE_PROCESSING || systemState === STATE_COMPLETED) { infoETA.innerText = '00:00'; return 0; }
  const remainingPixels = getRemainingRoutePixels(pathNodes);
  const etaSeconds = clampSecondsETA(Math.max(0, Math.round((remainingPixels / 100) * 60)), 120, 1800);
  const m = Math.floor(etaSeconds / 60); const s = etaSeconds % 60;
  infoETA.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  etaTotalSeconds = etaSeconds; return etaSeconds;
}
function startETATimer() {
  if (etaTimer) clearInterval(etaTimer);
  updateETAFromDistance();
  etaTimer = setInterval(() => updateETAFromDistance(), 1000);
}
function updateSignalCounter() {
  infoSignals.innerText = `${preemptedSignalsList.size} / ${activeCorridorNodes.filter(k => nodes[k].type === 'intersection').length}`;
}
function updateSimulationTick() {
  if (ambulance1.isActive) {
    const endNode = nodes[ambulance1.currentSegmentEnd];
    const dx = endNode.x - ambulance1.x; const dy = endNode.y - ambulance1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= simulationSpeed) {
      ambulance1.x = endNode.x; ambulance1.y = endNode.y;
      if (endNode.type === 'intersection') { preemptedSignalsList.add(ambulance1.currentSegmentEnd); updateSignalCounter(); playTone(900, 'sine', 0.05, 0.03); }
      activePathIdx++;
      if (activePathIdx < pathNodes.length - 1) {
        ambulance1.currentSegmentStart = pathNodes[activePathIdx];
        ambulance1.currentSegmentEnd = pathNodes[activePathIdx + 1];
      } else {
        handlePhaseCompletion();
      }
    } else {
      ambulance1.x += (dx / distance) * simulationSpeed;
      ambulance1.y += (dy / distance) * simulationSpeed;
    }
    calculateDistanceRemaining();
  }
  moveAmbulance2();
}
function calculateDistanceRemaining() {
  let pxDist = 0;
  const endNode = nodes[ambulance1.currentSegmentEnd];
  const dx = endNode.x - ambulance1.x; const dy = endNode.y - ambulance1.y;
  pxDist += Math.sqrt(dx * dx + dy * dy);
  for (let i = activePathIdx + 1; i < pathNodes.length - 1; i++) {
    const n1 = nodes[pathNodes[i]]; const n2 = nodes[pathNodes[i+1]];
    pxDist += Math.sqrt((n2.x-n1.x)**2+(n2.y-n1.y)**2);
  }
  if (systemState === STATE_EN_ROUTE) {
    for (let i = 0; i < returnPathNodes.length - 1; i++) {
      const n1 = nodes[returnPathNodes[i]]; const n2 = nodes[returnPathNodes[i+1]];
      pxDist += Math.sqrt((n2.x-n1.x)**2+(n2.y-n1.y)**2);
    }
  }
  infoDistance.innerText = `${(pxDist / 100).toFixed(1)} km`;
  updateETAFromDistance();
  const triggerSegmentIdx = Math.max(0, Math.floor(pathNodes.length / 2) - 1);
  if (systemState === STATE_EN_ROUTE && activePathIdx === triggerSegmentIdx && !ambulance1.midRouteNotified) {
    ambulance1.midRouteNotified = true;
    const targetHospName = nodes[assignedHospitalKey].shortLabel;
    showToast(`Alert sent to ${targetHospName} – ETA 2 min – ICU standby activated`, 'info');
    const statusEl = document.getElementById(`status-${assignedHospitalKey}`);
    statusEl.innerText = "READY"; statusEl.className = "badge badge-resolved";
  }
}
function handlePhaseCompletion() {
  if (systemState === STATE_EN_ROUTE) {
    systemState = STATE_PATIENT_PICKUP; ambulance1.isActive = false;
    showToast(`Ambulance reached patient ${patientDetails.name}. Stabilizing...`, 'success');
    setTimeout(() => {
      systemState = STATE_RETURNING;
      pathNodes = [...returnPathNodes]; activePathIdx = 0; activeCorridorNodes = [...pathNodes];
      ambulance1.currentSegmentStart = pathNodes[0]; ambulance1.currentSegmentEnd = pathNodes[1]; ambulance1.isActive = true;
      preemptedSignalsList.clear(); updateSignalCounter();
      const targetHospName = nodes[assignedHospitalKey].shortLabel;
      showToast(dispatchMode === 'SOS' ? `Patient secured. Transporting to ${targetHospName} via preempted green corridor.` : `Patient secured. Transporting to ${targetHospName} via standard route.`, dispatchMode === 'SOS' ? 'critical' : 'info');
    }, 1500);
  } else if (systemState === STATE_RETURNING) {
    systemState = STATE_COMPLETED; ambulance1.isActive = false; patientDetails.resolved = true;
    setTimeout(() => {
      systemState = STATE_READY_FOR_NEXT_REQUEST;
      showToast('Simulation completed successfully. System ready for next request.', 'success');
      infoETA.innerText = '00:00'; infoDistance.innerText = '0.0 km'; statEmergencies.innerText = '0';
      alertBanner.style.display = 'none'; mapIndicator.classList.remove('dispatching'); stopSiren();
    }, 400);
    clearInterval(simulationTimer);
    if (etaTimer) clearInterval(etaTimer);
    stopSiren(); alertBanner.style.display = 'none'; mapIndicator.classList.remove('dispatching');
    infoETA.innerText = "00:00"; etaTotalSeconds = 0; infoDistance.innerText = "0.0 km"; statResponse.innerText = "4.2 min";
    const caseNumber = Math.floor(1000 + Math.random() * 9000);
    const newLog = document.createElement('div');
    newLog.className = 'emergency-item';
    newLog.innerHTML = `
      <div class="emergency-header"><span>Case #${caseNumber}</span><span class="badge badge-resolved">Resolved</span></div>
      <div>Node ${patientDetails.nodeKey} (${nodes[patientDetails.nodeKey].shortLabel})</div>
      <div class="emergency-details"><span>Severity: ${patientDetails.severity}</span><span>Just Now</span></div>
    `;
    document.getElementById('emergenciesList').prepend(newLog);
    const targetHospName = nodes[assignedHospitalKey].shortLabel;
    showToast(dispatchMode === 'SOS' ? `Patient safely admitted to ${targetHospName}. All green corridors cleared.` : `Patient safely admitted to ${targetHospName}. Standard request completed.`, 'success');
    saveDispatchRecord(dispatchMode, 'Completed');
    const completedRequest = activeDispatches.shift();
    if (completedRequest) { completedRequest.status = 'completed'; completedDispatches.unshift(completedRequest); renderDispatchQueue(); }
    setTimeout(() => { releaseAmbulanceForQueue(); if (dispatchQueue.length) autoDispatchNextWaitingRequest(); }, 500);
    statEmergencies.innerText = "0";
  }
}
function moveAmbulance2() {
  const currentEnd = nodes[ambulance2.path[ambulance2.currentIdx + 1]];
  const dx = currentEnd.x - ambulance2.x; const dy = currentEnd.y - ambulance2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= ambulance2.speed) {
    ambulance2.x = currentEnd.x; ambulance2.y = currentEnd.y; ambulance2.currentIdx++;
    if (ambulance2.currentIdx >= ambulance2.path.length - 1) ambulance2.currentIdx = 0;
  } else {
    ambulance2.x += (dx / dist) * ambulance2.speed; ambulance2.y += (dy / dist) * ambulance2.speed;
  }
}
function setSimSpeed(speedMultiplier, btnElement) {
  simulationSpeed = 1.5 * speedMultiplier;
  [btnSpeed1x, btnSpeed2x, btnSpeed4x].forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
  playTone(600, 'sine', 0.05, 0.05);
}
btnSpeed1x.addEventListener('click', () => setSimSpeed(1, btnSpeed1x));
btnSpeed2x.addEventListener('click', () => setSimSpeed(2, btnSpeed2x));
btnSpeed4x.addEventListener('click', () => setSimSpeed(4, btnSpeed4x));
// FIX 3: startDispatch — resets first, then checks STATE_IDLE
function startDispatch(requestType = 'SOS') {
  if (systemState === STATE_COMPLETED || systemState === STATE_READY_FOR_NEXT_REQUEST || systemState === STATE_RECORDING) {
    softResetDispatchRuntime();
  }
  const canStartFresh = systemState === STATE_IDLE;
  if (!canStartFresh) {
    const queued = enqueueDispatchRequest(requestType);
    showToast(`${queued.id} added to AI Dispatch Queue.`, 'info');
    return;
  }
  dispatchMode = requestType;
  const queuedRequest = enqueueDispatchRequest(requestType);
  dispatchQueue = dispatchQueue.filter(item => item.id !== queuedRequest.id);
  activeDispatches.unshift(queuedRequest);
  queuedRequest.status = 'dispatched';
  applyQueuedRequest(queuedRequest);
  patientDetails.resolved = false;
  patientDetails = {
    name: queuedRequest.patientName || patientNameInput.value || 'Amit Kumar',
    nodeKey: patientLocationInput.value || 'I5',
    location: nodes[patientLocationInput.value || 'I5'].label,
    severity: queuedRequest.severity || patientConditionInput.value,
    condition: queuedRequest.condition,
    confidence: Math.min(99, 75 + queuedRequest.priorityScore * 6),
    etaMinutes: queuedRequest.etaMinutes
  };
  showToast(`${queuedRequest.id} selected by AI Priority Engine.`, 'info');
  systemState = STATE_PROCESSING;
  playTone(440, 'sawtooth', 0.25, 0.15);
  setTimeout(() => playTone(440, 'sawtooth', 0.25, 0.15), 150);
  if (requestType === 'SOS') sosBtn.classList.add('pulsing');
  callAmbulanceBtn.classList.remove('pulsing');
  renderDispatchQueue();
  runDijkstraSimulation();
}
sosBtn.addEventListener('click', () => startDispatch('SOS'));
callAmbulanceBtn.addEventListener('click', () => startDispatch('CALL'));
function resetSimulation() {
  if (simulationTimer) clearInterval(simulationTimer);
  if (etaTimer) clearInterval(etaTimer);
  stopSiren();
  systemState = STATE_IDLE; simulationSpeed = 1.5;
  pathNodes = []; returnPathNodes = []; visitedNodesOrder = []; dijkstraExplorationDistances = {};
  assignedHospitalKey = 'H1'; dispatchMode = 'SOS'; activePathIdx = 0; activeCorridorNodes = [];
  preemptedSignalsList.clear(); dispatchQueue = []; activeDispatches = []; completedDispatches = []; requestCounter = 1;
  ambulance1 = { x: nodes['H1'].x, y: nodes['H1'].y, currentSegmentStart: 'H1', currentSegmentEnd: 'I1', segmentProgress: 0, isActive: false, flashing: false, midRouteNotified: false };
  patientDetails = { name: 'Amit Kumar', location: 'MG Road Center (I5)', nodeKey: 'I5', severity: 'Critical', resolved: false };
  sosBtn.classList.remove('pulsing'); callAmbulanceBtn.classList.remove('pulsing');
  alertBanner.style.display = 'none'; mapIndicator.classList.remove('dispatching'); dijkstraOverlay.classList.remove('active');
  patientNameInput.value = "Amit Kumar"; patientLocationInput.value = "I5"; patientConditionInput.value = "Critical";
  infoETA.innerText = "00:00"; infoDistance.innerText = "0.0 km"; infoSignals.innerText = "0/0";
  statEmergencies.innerText = "0"; statResponse.innerText = "4.2 min";
  rowH1.classList.remove('assigned-row'); rowH3.classList.remove('assigned-row');
  document.getElementById('hospital-H2').classList.remove('assigned-row');
  statusH1.innerText = "STANDBY"; statusH1.className = "badge badge-resolved";
  document.getElementById('status-H2').innerText = "BUSY"; document.getElementById('status-H2').className = "badge badge-critical";
  statusH3.innerText = "READY"; statusH3.className = "badge badge-mild";
  [btnSpeed1x, btnSpeed2x, btnSpeed4x].forEach(btn => btn.classList.remove('active'));
  btnSpeed1x.classList.add('active');
  renderDispatchQueue();
  showToast("Dispatch system dashboard has been fully reset to idle status.", 'success');
}
resetBtn.addEventListener('click', () => { playTone(220, 'sine', 0.25, 0.15); resetSimulation(); });
function animateValue(element, start, end, duration, suffix = '') {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = start + progress * (end - start);
    element.innerText = (Number.isInteger(end) ? Math.floor(val) : val.toFixed(1)) + suffix;
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
function triggerStatsAnimation() {
  animateValue(statEmergencies, 0, 0, 800);
  animateValue(statResponse, 0, 4.2, 1500, ' min');
  animateValue(statHospitals, 0, 3, 1000);
  animateValue(statSignals, 0, 6, 1200);
}
function updateHeaderStatus() {
  const liveClock = document.getElementById('liveClock');
  const headerCounter = document.getElementById('headerEmergencyCounter');
  if (liveClock) liveClock.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (headerCounter) headerCounter.textContent = statEmergencies?.textContent || '0';
}
setInterval(updateHeaderStatus, 1000);
window.addEventListener('DOMContentLoaded', () => {
  renderDispatchQueue();
  triggerStatsAnimation();
  updateHeaderStatus();
  showToast("Smart Ambulance Dispatch System initialized. Ready for SOS telemetry.", 'success');
});
