import { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Check,
  ListChecks,
  Search,
  X,
  CalendarDays,
  LayoutGrid,
  Briefcase,
  User,
  ShoppingCart,
  HeartPulse,
} from "lucide-react";

/* ---------- constants ---------- */

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-400" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", bar: "bg-amber-400" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", bar: "bg-rose-400" },
};
const PRIORITY_ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", icon: Briefcase, tag: "bg-blue-50 text-blue-700", active: "bg-blue-50 text-blue-700", iconColor: "text-blue-500" },
  personal: { label: "ส่วนตัว", icon: User, tag: "bg-violet-50 text-violet-700", active: "bg-violet-50 text-violet-700", iconColor: "text-violet-500" },
  shopping: { label: "ช้อปปิ้ง", icon: ShoppingCart, tag: "bg-pink-50 text-pink-700", active: "bg-pink-50 text-pink-700", iconColor: "text-pink-500" },
  health: { label: "สุขภาพ", icon: HeartPulse, tag: "bg-teal-50 text-teal-700", active: "bg-teal-50 text-teal-700", iconColor: "text-teal-500" },
};
const CATEGORY_ORDER = ["work", "personal", "shopping", "health"];

const STATUS_FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

/* ---------- date helpers (local time) ---------- */

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => toKey(new Date());
const offsetKey = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toKey(d);
};
const formatDue = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

// "overdue" | "today" | "upcoming" | null
const dueState = (todo, today) => {
  if (!todo.due || todo.completed) return todo.due ? "upcoming" : null;
  if (todo.due < today) return "overdue";
  if (todo.due === today) return "today";
  return "upcoming";
};

/* ---------- donut chart ---------- */

function Donut({ segments, total, percent }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90" role="img" aria-label="สัดส่วนสถานะงาน">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
      {total > 0 &&
        segments.map((s) => {
          if (s.value === 0) return null;
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.key}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              style={{ transition: "stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease" }}
            />
          );
          offset += len;
          return el;
        })}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        transform="rotate(90 50 50)"
        className="fill-gray-800"
        style={{ fontSize: 18, fontWeight: 700 }}
      >
        {percent}%
      </text>
    </svg>
  );
}

/* ---------- todo item ---------- */

function TodoItem({ todo, today, removing, onToggle, onDelete, onEdit, onCyclePriority, onCycleCategory }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];
  const cat = CATEGORIES[todo.category];
  const CatIcon = cat.icon;
  const state = dueState(todo, today);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    const value = draft.trim();
    if (value && value !== todo.text) onEdit(todo.id, value);
    setEditing(false);
  };

  const dueBadge = {
    overdue: "bg-red-500 text-white border-red-500",
    today: "bg-yellow-300 text-yellow-900 border-yellow-300",
    upcoming: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <li
      style={{
        maxHeight: removing ? 0 : 200,
        opacity: removing ? 0 : 1,
        transform: removing ? "translateX(24px)" : "translateX(0)",
        paddingBottom: removing ? 0 : 10,
        transition: "max-height 300ms ease, opacity 250ms ease, transform 300ms ease, padding 300ms ease",
        overflow: "hidden",
      }}
    >
      <div className="relative flex items-start gap-3 bg-white rounded-xl shadow-sm border border-gray-100 pl-4 pr-3 py-3 overflow-hidden">
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${p.bar}`} />

        <button
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
            todo.completed ? "bg-indigo-500 border-indigo-500" : "border-gray-300 hover:border-indigo-400 bg-white"
          }`}
        >
          {todo.completed && <Check size={16} className="text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full px-2 py-1 -my-1 rounded-md border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-800"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setDraft(todo.text);
                setEditing(true);
              }}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block break-words cursor-text select-none transition-colors ${
                todo.completed ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>
          )}

          <div className={`flex flex-wrap items-center gap-1.5 mt-2 ${todo.completed ? "opacity-60" : ""}`}>
            <button
              onClick={() => onCyclePriority(todo.id)}
              title="คลิกเพื่อเปลี่ยนความสำคัญ"
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${p.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {p.label}
            </button>
            <button
              onClick={() => onCycleCategory(todo.id)}
              title="คลิกเพื่อเปลี่ยนหมวดหมู่"
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cat.tag}`}
            >
              <CatIcon size={12} />
              {cat.label}
            </button>
            {todo.due && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${dueBadge[state]}`}
              >
                <CalendarDays size={12} />
                {state === "today" ? "วันนี้" : state === "overdue" ? `เกินกำหนด ${formatDue(todo.due)}` : formatDue(todo.due)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          aria-label="ลบงาน"
          className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}

/* ---------- app ---------- */

let nextId = 8;

export default function TodoApp() {
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานวิชาอิเล็กทรอนิกส์ดิจิทัล", completed: false, priority: "high", category: "work", due: offsetKey(-2) },
    { id: 2, text: "อ่านหนังสือเตรียมสอบ", completed: false, priority: "medium", category: "personal", due: todayKey() },
    { id: 3, text: "ซื้อของใช้เข้าหอ", completed: true, priority: "low", category: "shopping", due: offsetKey(-1) },
    { id: 4, text: "ซื้อสายไฟและตัวต้านทาน", completed: false, priority: "low", category: "shopping", due: offsetKey(3) },
    { id: 5, text: "วิ่งเช้า 30 นาที", completed: false, priority: "medium", category: "health", due: todayKey() },
    { id: 6, text: "นัดตรวจสุขภาพประจำปี", completed: false, priority: "low", category: "health", due: offsetKey(10) },
    { id: 7, text: "อัปเดตพอร์ตโฟลิโอ", completed: true, priority: "medium", category: "work", due: "" },
  ]);

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState([]);

  const today = todayKey();

  /* actions */
  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [{ id: nextId++, text: value, completed: false, priority, category, due }, ...prev]);
    setText("");
    setDue("");
  };

  const patch = (id, changes) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  const toggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(t.priority) + 1) % PRIORITY_ORDER.length] } : t
      )
    );
  const cycleCategory = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, category: CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(t.category) + 1) % CATEGORY_ORDER.length] } : t
      )
    );

  const removeWithAnimation = (ids) => {
    if (ids.length === 0) return;
    setRemoving((prev) => [...prev, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemoving((prev) => prev.filter((id) => !ids.includes(id)));
    }, 300);
  };

  /* derived */
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const overdue = todos.filter((t) => !t.completed && t.due && t.due < today).length;
    const inProgress = total - completed - overdue;
    return {
      total,
      completed,
      overdue,
      inProgress,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, [todos, today]);

  const categoryCounts = useMemo(() => {
    const counts = { all: todos.length };
    CATEGORY_ORDER.forEach((k) => (counts[k] = todos.filter((t) => t.category === k).length));
    return counts;
  }, [todos]);

  const q = query.trim().toLowerCase();
  const visible = todos.filter((t) => {
    if (statusFilter === "active" && t.completed) return false;
    if (statusFilter === "completed" && !t.completed) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  const remaining = todos.filter((t) => !t.completed).length;
  const filtersActive = q || categoryFilter !== "all" || statusFilter !== "all";

  const donutSegments = [
    { key: "done", label: "เสร็จแล้ว", value: stats.completed, color: "#6366f1" },
    { key: "progress", label: "กำลังดำเนินการ", value: stats.inProgress, color: "#fbbf24" },
    { key: "overdue", label: "เกินกำหนด", value: stats.overdue, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
            <ListChecks size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">รายการสิ่งที่ต้องทำ</h1>
        </header>

        {/* Statistics */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-4">
            <Donut segments={donutSegments} total={stats.total} percent={stats.percent} />
            <ul className="space-y-1.5 text-sm">
              {donutSegments.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.label}</span>
                  <span className="font-semibold text-gray-800">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:ml-auto sm:min-w-[220px]">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-500">งานทั้งหมด</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="rounded-xl bg-indigo-50 px-4 py-3">
              <div className="text-xs text-indigo-600">เสร็จแล้ว</div>
              <div className="text-2xl font-bold text-indigo-700">{stats.percent}%</div>
            </div>
          </div>
        </section>

        {/* Add form */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-5">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="เพิ่มงานใหม่..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white"
            />
            <button
              onClick={addTodo}
              disabled={!text.trim()}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">เพิ่ม</span>
            </button>
          </div>

          <div className="flex items-center gap-x-4 gap-y-3 mt-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">ความสำคัญ:</span>
              {PRIORITY_ORDER.map((key) => {
                const p = PRIORITIES[key];
                const active = priority === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPriority(key)}
                    className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-all ${
                      active ? `${p.badge} font-medium shadow-sm` : "border-gray-200 text-gray-500 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-500">
              หมวดหมู่:
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {CATEGORY_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {CATEGORIES[k].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-500">
              กำหนดส่ง:
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </label>
          </div>
        </section>

        {/* Sidebar + list */}
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Category sidebar */}
          <aside className="w-full md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:p-2">
              {[{ key: "all", label: "ทั้งหมด", icon: LayoutGrid, active: "bg-gray-100 text-gray-900", iconColor: "text-gray-500" }, ...CATEGORY_ORDER.map((k) => ({ key: k, ...CATEGORIES[k] }))].map(
                (c) => {
                  const Icon = c.icon;
                  const selected = categoryFilter === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategoryFilter(c.key)}
                      className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors border md:border-0 ${
                        selected
                          ? `${c.active} font-medium border-transparent`
                          : "bg-white md:bg-transparent text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={16} className={c.iconColor} />
                      <span className="md:flex-1 text-left whitespace-nowrap">{c.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/70 md:bg-gray-100 text-gray-600 font-medium">
                        {categoryCounts[c.key]}
                      </span>
                    </button>
                  );
                }
              )}
            </nav>
          </aside>

          {/* Main column */}
          <main className="flex-1 min-w-0 w-full">
            {/* Search */}
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างการค้นหา"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 p-1 bg-gray-200/60 rounded-xl mb-4" role="tablist">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={statusFilter === f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                    statusFilter === f.key ? "bg-white text-gray-900 font-medium shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-10 px-6 text-center text-gray-400">
                {filtersActive ? "ไม่พบงานที่ตรงกับเงื่อนไข" : "ยังไม่มีงาน เพิ่มงานแรกของคุณได้ที่ช่องด้านบน"}
              </div>
            ) : (
              <ul>
                {visible.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    today={today}
                    removing={removing.includes(todo.id)}
                    onToggle={toggle}
                    onDelete={(id) => removeWithAnimation([id])}
                    onEdit={(id, newText) => patch(id, { text: newText })}
                    onCyclePriority={cyclePriority}
                    onCycleCategory={cycleCategory}
                  />
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between mt-3 px-1 text-sm">
              <span className="text-gray-500">
                เหลือ <span className="font-semibold text-gray-800">{remaining}</span> งานที่ต้องทำ
              </span>
              <button
                onClick={() => removeWithAnimation(todos.filter((t) => t.completed).map((t) => t.id))}
                disabled={stats.completed === 0}
                className="text-gray-500 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
              >
                ล้างงานที่เสร็จแล้ว ({stats.completed})
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญหรือหมวดหมู่เพื่อเปลี่ยน
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
