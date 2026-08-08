const STORAGE_KEY = "task-map-tasks";

const CATEGORIES = {
  research: { id: "research", label: "研究" },
  university: { id: "university", label: "大学" },
  private: { id: "private", label: "プライベート" },
  other: { id: "other", label: "その他" },
};

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getActiveTasks() {
  return loadTasks().filter((t) => !t.completed);
}

function getTaskById(id) {
  return loadTasks().find((t) => t.id === id) || null;
}

function addTask(data) {
  const tasks = loadTasks();
  const task = {
    id: generateId(),
    title: String(data.title).trim(),
    deadline: data.deadline,
    estimatedMinutes: Number(data.estimatedMinutes),
    importance: clamp(Number(data.importance), 0, 100),
    category: data.category in CATEGORIES ? data.category : "other",
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

function updateTask(id, data) {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const prev = tasks[index];
  tasks[index] = {
    ...prev,
    title: String(data.title).trim(),
    deadline: data.deadline,
    estimatedMinutes: Number(data.estimatedMinutes),
    importance: clamp(Number(data.importance), 0, 100),
    category: data.category in CATEGORIES ? data.category : "other",
  };
  saveTasks(tasks);
  return tasks[index];
}

function completeTask(id) {
  const tasks = loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], completed: true };
  saveTasks(tasks);
  return tasks[index];
}

function deleteTask(id) {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
