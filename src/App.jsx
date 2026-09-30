import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, ListChecks } from "lucide-react";

const PRIORITIES = {
  low: { label: "ต่ำ", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-400" },
  medium: { label: "ปานกลาง", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", bar: "bg-amber-400" },
  high: { label: "สูง", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", bar: "bg-rose-400" },
};

const ORDER = ["low", "medium", "high"];

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณได้ที่ช่องด้านบน",
  active: "ไม่มีงานค้าง เยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

let nextId = 4;

function TodoItem({ todo, removing, onToggle, onDelete, onEdit, onCyclePriority }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef(null);
  const p = PRIORITIES[todo.priority];

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(todo.text);
    setEditing(true);
  };

  const save = () => {
    const value = draft.trim();
    if (value && value !== todo.text) onEdit(todo.id, value);
    setEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <li
      style={{
        maxHeight: removing ? 0 : 140,
        opacity: removing ? 0 : 1,
        transform: removing ? "translateX(24px)" : "translateX(0)",
        paddingBottom: removing ? 0 : 10,
        transition: "max-height 300ms ease, opacity 250ms ease, transform 300ms ease, padding 300ms ease",
        overflow: "hidden",
      }}
    >
      <div className="relative flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 pl-4 pr-3 py-3 overflow-hidden">
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${p.bar}`} />

        <button
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
          className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
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
              onKeyDown={onKeyDown}
              className="w-full px-2 py-1 -my-1 rounded-md border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-gray-800"
            />
          ) : (
            <span
              onDoubleClick={startEdit}
              title="ดับเบิลคลิกเพื่อแก้ไข"
              className={`block break-words cursor-text select-none transition-colors ${
                todo.completed ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>
          )}
        </div>

        <button
          onClick={() => onCyclePriority(todo.id)}
          title="คลิกเพื่อเปลี่ยนความสำคัญ"
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${p.badge} ${
            todo.completed ? "opacity-50" : ""
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          {p.label}
        </button>

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

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานวิชาอิเล็กทรอนิกส์ดิจิทัล", completed: false, priority: "high" },
    { id: 2, text: "อ่านหนังสือเตรียมสอบ", completed: false, priority: "medium" },
    { id: 3, text: "ซื้อของใช้เข้าหอ", completed: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [removing, setRemoving] = useState([]);

  const addTodo = () => {
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [{ id: nextId++, text: value, completed: false, priority }, ...prev]);
    setText("");
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const edit = (id, newText) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: newText } : t)));

  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % ORDER.length] } : t
      )
    );

  const removeWithAnimation = (ids) => {
    setRemoving((prev) => [...prev, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemoving((prev) => prev.filter((id) => !ids.includes(id)));
    }, 300);
  };

  const remaining = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - remaining;

  const visible = todos.filter((t) =>
    filter === "active" ? !t.completed : filter === "completed" ? t.completed : true
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12">
      <div className="max-w-xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
            <ListChecks size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">รายการสิ่งที่ต้องทำ</h1>
        </header>

        {/* Add form */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-5">
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

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-sm text-gray-500">ความสำคัญ:</span>
            {ORDER.map((key) => {
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
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-gray-200/60 rounded-xl mb-4" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                filter === f.key
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-10 px-6 text-center text-gray-400">
            {EMPTY_TEXT[filter]}
          </div>
        ) : (
          <ul>
            {visible.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                removing={removing.includes(todo.id)}
                onToggle={toggle}
                onDelete={(id) => removeWithAnimation([id])}
                onEdit={edit}
                onCyclePriority={cyclePriority}
              />
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 px-1 text-sm">
          <span className="text-gray-500">
            เหลือ <span className="font-semibold text-gray-800">{remaining}</span> งานที่ต้องทำ
          </span>
          <button
            onClick={() =>
              removeWithAnimation(todos.filter((t) => t.completed).map((t) => t.id))
            }
            disabled={completedCount === 0}
            className="text-gray-500 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
          >
            ล้างงานที่เสร็จแล้ว ({completedCount})
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อเปลี่ยนระดับ
        </p>
      </div>
    </div>
  );
}
