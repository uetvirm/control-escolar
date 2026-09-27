const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
const KEY = "controlEscolarV1";
const defaults = {
  students: [
    {name:"Estudiante 1", account:"", schedule:{}},
    {name:"Estudiante 2", account:"", schedule:{}}
  ]
};
let data = JSON.parse(localStorage.getItem(KEY) || "null") || defaults;
let active = 0;
let deferredPrompt = null;

for (const s of data.students) for (const d of DAYS) {
  if (!s.schedule[d]) s.schedule[d] = {in:"", out:"", morning:"", afternoon:""};
}
const save = () => localStorage.setItem(KEY, JSON.stringify(data));

const tabs = document.getElementById("studentTabs");
const schedule = document.getElementById("schedule");
const modal = document.getElementById("modal");
const form = document.getElementById("modalForm");

function renderTabs() {
  tabs.innerHTML = data.students.map((s,i)=>`<button class="student-tab ${i===active?'active':''}" data-i="${i}">
    ${escapeHtml(s.name || `Estudiante ${i+1}`)}</button>`).join("");
  tabs.querySelectorAll("button").forEach(b=>b.onclick=()=>{active=+b.dataset.i; render();});
}
function render() {
  const s=data.students[active];
  renderTabs();
  document.getElementById("studentName").textContent=s.name||`Estudiante ${active+1}`;
  document.getElementById("accountNumber").textContent=s.account||"—";
  schedule.innerHTML = DAYS.map(d=>{
    const x=s.schedule[d] || {};
    return `<div class="day">
      <div class="day-name">${d}</div>
      <div class="times">
        <div class="time-box"><span class="label">Entrada</span><strong>${x.in||"—"}</strong></div>
        <div class="time-box"><span class="label">Salida</span><strong>${x.out||"—"}</strong></div>
      </div>
      ${x.morning?`<div class="activity"><small>Actividad / clase en la mañana</small>${escapeHtml(x.morning)}</div>`:""}
      ${x.afternoon?`<div class="activity"><small>Actividad / cambio en la tarde</small>${escapeHtml(x.afternoon)}</div>`:""}
    </div>`;
  }).join("");
}
function openModal(type, day=null) {
  modal.classList.remove("hidden");
  if(type==="student") {
    const s=data.students[active];
    document.getElementById("modalTitle").textContent="Editar estudiante";
    form.innerHTML=`<label>Nombre del estudiante</label><input id="name" value="${attr(s.name)}" required>
      <label>Número de cuenta</label><input id="account" value="${attr(s.account)}" inputmode="numeric">
      <div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Cancelar</button>
      <button class="primary">Guardar</button></div>`;
    form.onsubmit=e=>{e.preventDefault();s.name=document.getElementById("name").value.trim();s.account=document.getElementById("account").value.trim();save();closeModal();render();};
  } else {
    const x=data.students[active].schedule[day];
    document.getElementById("modalTitle").textContent=`Cambios — ${day}`;
    form.innerHTML=`<label>Hora de entrada</label><input id="in" type="time" value="${attr(x.in)}">
      <label>Hora de salida</label><input id="out" type="time" value="${attr(x.out)}">
      <label>Clase o actividad en la mañana (opcional)</label><textarea id="morning" placeholder="Ej. Tutoría, club, práctica...">${escapeHtml(x.morning||"")}</textarea>
      <label>Clase o actividad en la tarde (opcional)</label><textarea id="afternoon" placeholder="Ej. Deportes, reunión, quedarse después...">${escapeHtml(x.afternoon||"")}</textarea>
      <div class="form-actions"><button type="button" class="danger" onclick="clearDay('${day}')">Borrar día</button>
      <button type="button" class="secondary" onclick="closeModal()">Cancelar</button><button class="primary">Guardar</button></div>`;
    form.onsubmit=e=>{e.preventDefault();x.in=document.getElementById("in").value;x.out=document.getElementById("out").value;x.morning=document.getElementById("morning").value.trim();x.afternoon=document.getElementById("afternoon").value.trim();save();closeModal();render();};
  }
}
window.clearDay=(day)=>{data.students[active].schedule[day]={in:"",out:"",morning:"",afternoon:""};save();closeModal();render();};
window.closeModal=()=>modal.classList.add("hidden");
document.getElementById("closeModal").onclick=closeModal;
modal.onclick=e=>{if(e.target===modal)closeModal();};
document.getElementById("editStudent").onclick=()=>openModal("student");
document.getElementById("addChange").onclick=()=>{
  const s=data.students[active];
  const d=DAYS[new Date().getDay()-1] || "Lunes";
  openModal("day", d);
};
schedule.addEventListener("click", e=>{
  const day=e.target.closest(".day")?.querySelector(".day-name")?.textContent;
  if(day) openModal("day",day);
});
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function attr(v){return escapeHtml(v);}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden");});
document.getElementById("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
