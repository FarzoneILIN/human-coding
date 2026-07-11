import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const DRIVER_CHOICES = [
  "",
  "saturation",
  "oracle_quality",
  "contamination",
  "capability_gap",
  "modality",
  "domain",
  "fragmented",
  "UNREACHABLE"
];

const OPERATOR_CHOICES = [
  "",
  "integrity_gate",
  "harden",
  "capability_expand",
  "freshness",
  "recombine",
  "UNREACHABLE"
];

const events = window.HUMAN_CODING_EVENTS || [];
const firebaseConfig = window.FIREBASE_CONFIG || null;

let app = null;
let auth = null;
let db = null;
let uid = null;
let coderId = "";
let currentIndex = 0;
let responses = {};
let firebaseReady = false;

const el = {
  syncStatus: document.getElementById("syncStatus"),
  loginPanel: document.getElementById("loginPanel"),
  workspace: document.getElementById("workspace"),
  coderId: document.getElementById("coderId"),
  startBtn: document.getElementById("startBtn"),
  eventFamily: document.getElementById("eventFamily"),
  eventTitle: document.getElementById("eventTitle"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  fromVersion: document.getElementById("fromVersion"),
  toVersion: document.getElementById("toVersion"),
  eventDate: document.getElementById("eventDate"),
  capabilityChange: document.getElementById("capabilityChange"),
  morphologyChange: document.getElementById("morphologyChange"),
  saturationDriver: document.getElementById("saturationDriver"),
  sourceLink: document.getElementById("sourceLink"),
  driverSelect: document.getElementById("driverSelect"),
  operatorSelect: document.getElementById("operatorSelect"),
  noteInput: document.getElementById("noteInput"),
  prevBtn: document.getElementById("prevBtn"),
  saveBtn: document.getElementById("saveBtn"),
  nextBtn: document.getElementById("nextBtn"),
  jumpInput: document.getElementById("jumpInput"),
  jumpBtn: document.getElementById("jumpBtn"),
  downloadBtn: document.getElementById("downloadBtn")
};

function setStatus(text, mode = "") {
  el.syncStatus.textContent = text;
  el.syncStatus.className = `status-pill ${mode}`;
}

function fillSelect(select, choices) {
  select.innerHTML = "";
  choices.forEach((choice) => {
    const option = document.createElement("option");
    option.value = choice;
    option.textContent = choice || "请选择";
    select.appendChild(option);
  });
}

function safeCoderId(value) {
  const cleaned = value.trim().replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^[._-]+|[._-]+$/g, "");
  if (!cleaned) {
    throw new Error("请填写标注者代号。");
  }
  return cleaned;
}

function localKey() {
  return `human-coding:${coderId}`;
}

function loadLocalResponses() {
  try {
    return JSON.parse(localStorage.getItem(localKey()) || "{}");
  } catch {
    return {};
  }
}

function saveLocalResponses() {
  localStorage.setItem(localKey(), JSON.stringify(responses));
}

function getResponse(eventId) {
  return responses[eventId] || { driver: "", operator: "", note: "" };
}

function currentEvent() {
  return events[currentIndex];
}

function collectCurrentForm() {
  const event = currentEvent();
  if (!event) return;
  responses[event.event_id] = {
    event_id: event.event_id,
    family: event.family,
    from_version: event.from_version,
    to_version: event.to_version,
    date: event.date,
    capability_axis_change: event.capability_axis_change,
    morphology_change: event.morphology_change,
    saturation_driver: event.saturation_driver,
    source_url: event.source_url,
    driver: el.driverSelect.value,
    operator: el.operatorSelect.value,
    note: el.noteInput.value.trim()
  };
  saveLocalResponses();
}

function completedCount() {
  return events.filter((event) => (getResponse(event.event_id).operator || "").trim()).length;
}

function render() {
  const event = currentEvent();
  if (!event) return;
  const response = getResponse(event.event_id);
  el.eventFamily.textContent = event.family;
  el.eventTitle.textContent = `${event.event_id}: ${event.from_version} → ${event.to_version}`;
  el.fromVersion.textContent = event.from_version;
  el.toVersion.textContent = event.to_version;
  el.eventDate.textContent = event.date;
  el.capabilityChange.textContent = event.capability_axis_change || "-";
  el.morphologyChange.textContent = event.morphology_change || "-";
  el.saturationDriver.textContent = event.saturation_driver || "-";
  el.sourceLink.href = event.source_url;
  el.sourceLink.textContent = "打开公开来源";
  el.driverSelect.value = response.driver || "";
  el.operatorSelect.value = response.operator || "";
  el.noteInput.value = response.note || "";
  el.jumpInput.max = String(events.length);
  el.jumpInput.value = String(currentIndex + 1);
  el.progressText.textContent = `${completedCount()}/${events.length} 已填写；当前 ${currentIndex + 1}/${events.length}`;
  el.progressBar.max = events.length;
  el.progressBar.value = completedCount();
}

async function initFirebase() {
  if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    setStatus("本地模式", "warn");
    return;
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, (user) => {
    uid = user ? user.uid : null;
  });
  await signInAnonymously(auth);
  firebaseReady = true;
  setStatus("Firebase 已连接", "ok");
}

async function loadRemoteResponses() {
  if (!firebaseReady || !db || !uid) return {};
  const ref = doc(db, "human_coding_sessions", coderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  const data = snap.data();
  return data.responses || {};
}

async function saveRemote() {
  if (!firebaseReady || !db || !uid || !coderId) {
    setStatus("已本地保存", "warn");
    return;
  }
  const ref = doc(db, "human_coding_sessions", coderId);
  await setDoc(ref, {
    uid,
    coderId,
    updatedAt: serverTimestamp(),
    totalEvents: events.length,
    completedOperators: completedCount(),
    responses
  }, { merge: true });
  setStatus("已同步", "ok");
}

async function saveCurrent() {
  collectCurrentForm();
  try {
    await saveRemote();
  } catch (error) {
    console.error(error);
    setStatus("仅本地保存", "warn");
  }
  render();
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv() {
  const header = [
    "event_id",
    "family",
    "from_version",
    "to_version",
    "date",
    "capability_axis_change",
    "morphology_change",
    "saturation_driver",
    "source_url",
    "driver",
    "operator",
    "note"
  ];
  const lines = [header.join(",")];
  events.forEach((event) => {
    const response = getResponse(event.event_id);
    const row = [
      event.event_id,
      event.family,
      event.from_version,
      event.to_version,
      event.date,
      event.capability_axis_change || "",
      event.morphology_change || "",
      event.saturation_driver || "",
      event.source_url,
      response.driver || "",
      response.operator || "",
      response.note || ""
    ];
    lines.push(row.map(csvEscape).join(","));
  });
  return lines.join("\r\n") + "\r\n";
}

function downloadCsv() {
  collectCurrentForm();
  const blob = new Blob(["\ufeff", buildCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${coderId || "coder"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function start() {
  try {
    coderId = safeCoderId(el.coderId.value);
  } catch (error) {
    alert(error.message);
    return;
  }
  responses = loadLocalResponses();
  try {
    const remote = await loadRemoteResponses();
    responses = { ...responses, ...remote };
    saveLocalResponses();
  } catch (error) {
    console.error(error);
    setStatus("远程读取失败", "warn");
  }
  currentIndex = 0;
  el.loginPanel.classList.add("hidden");
  el.workspace.classList.remove("hidden");
  render();
}

function clampIndex(index) {
  return Math.max(0, Math.min(index, events.length - 1));
}

async function move(delta) {
  await saveCurrent();
  currentIndex = clampIndex(currentIndex + delta);
  render();
}

async function jump() {
  await saveCurrent();
  const target = Number.parseInt(el.jumpInput.value, 10);
  if (!Number.isFinite(target)) return;
  currentIndex = clampIndex(target - 1);
  render();
}

fillSelect(el.driverSelect, DRIVER_CHOICES);
fillSelect(el.operatorSelect, OPERATOR_CHOICES);

el.startBtn.addEventListener("click", start);
el.saveBtn.addEventListener("click", saveCurrent);
el.nextBtn.addEventListener("click", () => move(1));
el.prevBtn.addEventListener("click", () => move(-1));
el.jumpBtn.addEventListener("click", jump);
el.downloadBtn.addEventListener("click", downloadCsv);

if (!events.length) {
  setStatus("缺少事件数据", "warn");
} else {
  initFirebase().catch((error) => {
    console.error(error);
    setStatus("Firebase 失败", "warn");
  });
}
