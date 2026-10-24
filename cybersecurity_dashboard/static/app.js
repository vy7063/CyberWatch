const $ = (id) => document.getElementById(id);
let eventsCache = [];
let selectedEventId = null;
let trendChart, severityChart, categoryChart;
Chart.defaults.color = "#a9bbd2";
Chart.defaults.borderColor = "#263750";
const severityColors = {Critical:"#e45463",High:"#ed9a45",Medium:"#e9c85c",Low:"#4f9ce9"};
const fmtTime = (value) => {
  try { return new Date(value).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
  catch { return value || "—"; }
};
const shortTime = (value) => {
  try { return new Date(value).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); }
  catch { return "—"; }
};
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>el.classList.remove("show"), 2600);
}
async function api(url, options={}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}
function makeChart(ctx, type, data, options={}) {
  return new Chart(ctx, {type, data, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"#172238",padding:10,displayColors:true}},...options}});
}
function initCharts() {
  const commonAxis = {grid:{color:"#263750",drawBorder:false},ticks:{color:"#9db0c9",font:{family:"DM Mono",size:9},maxTicksLimit:6}};
  trendChart = makeChart($("trend-chart"),"line",{labels:[],datasets:[{label:"Events",data:[],borderColor:"#5b80f2",backgroundColor:"rgba(91,128,242,.10)",fill:true,tension:.36,pointRadius:2,pointHoverRadius:5,borderWidth:2}]},{scales:{x:{...commonAxis,grid:{display:false},ticks:{maxRotation:0}},y:{...commonAxis,beginAtZero:true,ticks:{precision:0}}}});
  severityChart = makeChart($("severity-chart"),"doughnut",{labels:[],datasets:[{data:[],backgroundColor:[],borderWidth:0,hoverOffset:5}]},{cutout:"75%",plugins:{legend:{display:false},tooltip:{backgroundColor:"#172238",padding:10}}});
  categoryChart = makeChart($("category-chart"),"bar",{labels:[],datasets:[{label:"Events",data:[],backgroundColor:"#7191f4",borderRadius:5,maxBarThickness:30}]},{indexAxis:"y",scales:{x:{...commonAxis,beginAtZero:true,ticks:{precision:0}},y:{grid:{display:false},ticks:{color:"#a9bbd2",font:{family:"Manrope",size:10}}}}});
}
function pill(value){return `<span class="pill ${value}">${value}</span>`;}
function renderSeverityLegend(items){
  const order=["Critical","High","Medium","Low"];
  const counts=Object.fromEntries(items.map(x=>[x.severity,x.n]));
  $("severity-legend").innerHTML=order.map(s=>`<div class="legend-item"><span class="legend-dot" style="background:${severityColors[s]}"></span>${s}<b>${counts[s]||0}</b></div>`).join("");
}
function renderTopIps(items){
  const max=Math.max(1,...items.map(x=>x.n));
  $("top-ips").innerHTML=items.length?items.map(x=>`<div class="ip-row"><span class="ip-address">${x.source_ip}</span><div class="ip-bar"><div style="width:${x.n/max*100}%"></div></div><span class="ip-count">${x.n}</span></div>`).join(""):`<p class="empty-state">No source data yet.</p>`;
}
function renderRecent(items){
  const recent=items.filter(x=>x.status==="Open").slice(0,4);
  $("recent-alerts").innerHTML=recent.length?recent.map(x=>`<div class="recent-row"><span class="severity-mark ${x.severity}"></span><div><div class="recent-title">${escapeHtml(x.title)}</div><div class="recent-sub">${escapeHtml(x.source_ip)} · ${escapeHtml(x.category)}</div></div><div class="recent-right"><time>${shortTime(x.timestamp)}</time>${pill(x.severity)}</div></div>`).join(""):`<p class="empty-state">No open alerts. Nice work!</p>`;
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function loadSummary(){
  const d=await api("/api/summary");
  $("total-events").textContent=d.total_events;
  $("open-alerts").textContent=d.open_alerts;
  $("critical-alerts").textContent=d.critical_alerts;
  $("risk-score").textContent=d.risk_score;
  $("risk-fill").style.width=d.risk_score+"%";
  $("risk-label").textContent=d.risk_score>=70?"Elevated demo risk indicator":d.risk_score>=35?"Moderate demo risk indicator":"Lower demo risk indicator";
  $("nav-alert-count").textContent=d.open_alerts;
  $("donut-total").textContent=d.total_events;
  const labels=["Critical","High","Medium","Low"], sev=Object.fromEntries(d.severity.map(x=>[x.severity,x.n]));
  severityChart.data.labels=labels;severityChart.data.datasets[0].data=labels.map(x=>sev[x]||0);severityChart.data.datasets[0].backgroundColor=labels.map(x=>severityColors[x]);severityChart.update();
  renderSeverityLegend(d.severity);
  trendChart.data.labels=d.hourly.map(x=>x.hour.slice(5).replace("T"," "));trendChart.data.datasets[0].data=d.hourly.map(x=>x.n);trendChart.update();
  categoryChart.data.labels=d.categories.map(x=>x.category);categoryChart.data.datasets[0].data=d.categories.map(x=>x.n);categoryChart.update();
  const total=Math.max(1,d.severity.reduce((a,b)=>a+b.n,0));
  $("severity-breakdown").innerHTML=labels.map(s=>`<div class="severity-line"><div class="severity-line-head"><span>${s}</span><strong>${sev[s]||0} <small style="color:#9ba5b4;font-weight:500">(${Math.round((sev[s]||0)/total*100)}%)</small></strong></div><div class="severity-track"><div style="width:${(sev[s]||0)/total*100}%;background:${severityColors[s]}"></div></div></div>`).join("");
  renderTopIps(d.top_ips);
}
async function loadEvents(){
  const params=new URLSearchParams({severity:$("severity-filter").value,status:$("status-filter").value,q:$("search-input").value});
  eventsCache=await api("/api/events?"+params.toString());
  $("result-count").textContent=`${eventsCache.length} result${eventsCache.length===1?"":"s"}`;
  $("events-body").innerHTML=eventsCache.length?eventsCache.map(e=>`<tr><td>${escapeHtml(e.title)}</td><td class="ip-cell">${escapeHtml(e.source_ip)}</td><td>${escapeHtml(e.category)}</td><td>${pill(e.severity)}</td><td>${pill(e.status)}</td><td>${fmtTime(e.timestamp)}</td><td><button class="action-link" data-details="${e.id}">Details ↗</button></td></tr>`).join(""):`<tr><td colspan="7" class="empty-state">No events match those filters.</td></tr>`;
  $("logs-body").innerHTML=eventsCache.map(e=>`<tr><td><strong>#${e.id}</strong><br><small>${fmtTime(e.timestamp)}</small></td><td class="ip-cell">${escapeHtml(e.source_ip)}</td><td><strong>${escapeHtml(e.title)}</strong><br><small>${escapeHtml(e.asset)}</small></td><td>${pill(e.severity)}</td><td>${pill(e.status)}</td></tr>`).join("")||`<tr><td colspan="5" class="empty-state">No matching events.</td></tr>`;
  renderRecent(eventsCache);
}
async function refreshAll(){try{await loadSummary();await loadEvents();}catch(err){toast("Could not load data. Is the Flask server running?");console.error(err);}}
function showSection(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  $(name+"-view").classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===name));
  const title={overview:"Threat overview",alerts:"Threat alerts",analytics:"Security analytics",logs:"Event log explorer"}[name];
  $("page-title").textContent=title;$("crumb").textContent=title;
  window.scrollTo({top:0,behavior:"smooth"});
}
function openDetails(id){
  const e=eventsCache.find(x=>x.id===Number(id)); if(!e){toast("Event not found in current filter.");return;}
  selectedEventId=e.id;
  $("modal-title").textContent=e.title;
  $("modal-content").innerHTML=`<div class="detail-grid"><div class="detail-field"><span>Source IP</span><strong>${escapeHtml(e.source_ip)}</strong></div><div class="detail-field"><span>Severity</span><strong>${pill(e.severity)}</strong></div><div class="detail-field"><span>Category</span><strong>${escapeHtml(e.category)}</strong></div><div class="detail-field"><span>Status</span><strong>${pill(e.status)}</strong></div><div class="detail-field"><span>Asset</span><strong>${escapeHtml(e.asset)}</strong></div><div class="detail-field"><span>Timestamp</span><strong>${fmtTime(e.timestamp)}</strong></div></div><p class="detail-description">${escapeHtml(e.description)}</p>`;
  $("modal-resolve").style.display=e.status==="Resolved"?"none":"inline-block";
  $("modal-backdrop").classList.add("show");
}
function closeModal(){$("modal-backdrop").classList.remove("show");}
async function resolveSelected(){
  if(!selectedEventId)return;
  try{await api(`/api/events/${selectedEventId}/resolve`,{method:"POST"});closeModal();toast("Event marked as resolved.");await refreshAll();}
  catch{toast("Could not update event.");}
}
async function generateEvent(){
  try{const e=await api("/api/events/generate",{method:"POST"});toast(`Test event created: ${e.title}`);await refreshAll();}
  catch{toast("Could not generate event.");}
}
function exportCsv(){window.location.href="/api/export.csv";}
document.addEventListener("DOMContentLoaded",async()=>{
  $("current-date").textContent=new Date().toLocaleDateString([], {weekday:"short",month:"short",day:"numeric",year:"numeric"});
  initCharts();await refreshAll();
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.goto)));
  $("refresh-btn").addEventListener("click",async()=>{await refreshAll();toast("Dashboard refreshed.");});
  $("generate-btn").addEventListener("click",generateEvent);
  $("export-btn").addEventListener("click",exportCsv);$("logs-export").addEventListener("click",exportCsv);
  $("dismiss-notice").addEventListener("click",()=>$("dismiss-notice").parentElement.remove());
  ["severity-filter","status-filter","search-input"].forEach(id=>$(id).addEventListener(id==="search-input"?"input":"change",loadEvents));
  $("logs-search").addEventListener("input",()=>{$("search-input").value=$("logs-search").value;loadEvents();});
  $("logs-severity").addEventListener("change",()=>{$("severity-filter").value=$("logs-severity").value;loadEvents();});
  $("events-body").addEventListener("click",e=>{const b=e.target.closest("[data-details]");if(b)openDetails(b.dataset.details);});
  $("modal-close").addEventListener("click",closeModal);$("modal-close-2").addEventListener("click",closeModal);
  $("modal-backdrop").addEventListener("click",e=>{if(e.target===$("modal-backdrop"))closeModal();});
  $("modal-resolve").addEventListener("click",resolveSelected);
});
