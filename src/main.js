import "./style.css";
const CATS=["Work","Personal","Shopping","Health"];
const COLOR={Work:"var(--work)",Personal:"var(--personal)",Shopping:"var(--shopping)",Health:"var(--health)"};
const KEY="todos-v1";
const iso=d=>{const z=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())};
const today=()=>iso(new Date());
const off=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
let todos=[],filter="All",query="";
try{todos=JSON.parse(localStorage.getItem(KEY)||"null")||[]}catch(e){}
if(!todos.length)todos=[
{id:1,text:"Send project update",due:off(-1),cat:"Work",done:false},
{id:2,text:"Book dentist appointment",due:today(),cat:"Health",done:false},
{id:3,text:"Buy groceries",due:today(),cat:"Shopping",done:false},
{id:4,text:"Call family",due:off(3),cat:"Personal",done:false},
{id:5,text:"Review pull requests",due:off(-3),cat:"Work",done:true}];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(todos))}catch(e){}};
const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=s=>new Date(s+"T00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
const status=t=>t.done?"done":(t.due&&t.due<today()?"over":"open");

document.querySelector("select").innerHTML=CATS.map(c=>`<option>${c}</option>`).join("");

function render(){
  const t0=today();
  // sidebar
  const rows=[["All",todos.length,"var(--mute)"],...CATS.map(c=>[c,todos.filter(t=>t.cat===c).length,COLOR[c]])];
  document.getElementById("cats").innerHTML=rows.map(([n,k,col])=>
    `<button class="cat" data-c="${n}" aria-pressed="${filter===n}"><span class="dot" style="background:${col}"></span>${n}<span class="n">${k}</span></button>`).join("");
  // list
  const q=query.trim().toLowerCase();
  const vis=todos.filter(t=>(filter==="All"||t.cat===filter)&&(!q||t.text.toLowerCase().includes(q)))
    .sort((a,b)=>a.done-b.done||(a.due||"9").localeCompare(b.due||"9"));
  document.getElementById("list").innerHTML=vis.length?vis.map(t=>{
    let b="";
    if(t.due){const s=status(t);
      b=!t.done&&t.due<t0?`<span class="badge over">Overdue · ${fmt(t.due)}</span>`
       :!t.done&&t.due===t0?`<span class="badge today">Today</span>`
       :`<span class="badge">${fmt(t.due)}</span>`}
    return `<li class="${t.done?"done":""}" style="--c:${COLOR[t.cat]}"><input type="checkbox" data-id="${t.id}" ${t.done?"checked":""} aria-label="Mark complete">
      <span class="t">${esc(t.text)}<br><span class="tag">${t.cat}</span></span>${b}
      <button class="del" data-del="${t.id}" aria-label="Delete todo">×</button></li>`}).join("")
    :`<li class="empty" style="display:block;border:0;background:none">${todos.length?"No todos match. Clear the search or pick another category.":"No todos yet. Add one above."}</li>`;
  // stats
  const total=todos.length,done=todos.filter(t=>t.done).length,over=todos.filter(t=>status(t)==="over").length,open=total-done-over;
  document.getElementById("s-total").textContent=total;
  document.getElementById("s-pct").textContent=(total?Math.round(done/total*100):0)+"%";
  const segs=[["Completed",done,"var(--shopping)"],["Open",open,"var(--open)"],["Overdue",over,"var(--health)"]];
  let acc=0;const C=2*Math.PI*15.9155;
  document.getElementById("donut").innerHTML=`<circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--line)" stroke-width="6"/>`+
    (total?segs.filter(s=>s[1]).map(([n,v,c])=>{const len=v/total*C;
      const el=`<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-acc}" transform="rotate(-90 21 21)"/>`;acc+=len;return el}).join(""):"");
  document.getElementById("legend").innerHTML=segs.map(([n,v,c])=>`<span><i style="background:${c}"></i>${n} ${v}</span>`).join("");
}
document.getElementById("cats").onclick=e=>{const b=e.target.closest("[data-c]");if(b){filter=b.dataset.c;render()}};
document.getElementById("q").oninput=e=>{query=e.target.value;render()};
document.getElementById("list").onclick=e=>{
  const d=e.target.closest("[data-del]");if(d){todos=todos.filter(t=>t.id!=d.dataset.del);save();render();return}
  const c=e.target.closest("[data-id]");if(c){const t=todos.find(t=>t.id==c.dataset.id);t.done=c.checked;save();render()}};
document.getElementById("add").onsubmit=e=>{e.preventDefault();const f=e.target;
  const text=f.text.value.trim();if(!text)return;
  todos.push({id:Date.now(),text,due:f.due.value,cat:f.cat.value,done:false});
  f.text.value="";f.due.value="";save();render()};
render();
