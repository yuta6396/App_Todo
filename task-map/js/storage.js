const CATEGORIES = {
  research: { id: "research", label: "研究" },
  university: { id: "university", label: "大学" },
  private: { id: "private", label: "プライベート" },
  other: { id: "other", label: "その他" },
};

/** In-memory cache (source of truth is Supabase). */
let taskCache = [];

/** Supabase row (snake_case) → app Task (camelCase) */
function fromDbTask(row) {
  return {
    id: row.id,
    title: row.title,
    deadline: row.deadline,
    estimatedMinutes: row.estimated_minutes,
    importance: row.importance,
    category: row.category,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** App Task / input (camelCase) → Supabase columns (snake_case) */
function toDbTask(task) {
  const row = {};
  if (task.title !== undefined) row.title = task.title;
  if (task.deadline !== undefined) row.deadline = task.deadline;
  if (task.estimatedMinutes !== undefined) {
    row.estimated_minutes = task.estimatedMinutes;
  }
  if (task.importance !== undefined) row.importance = task.importance;
  if (task.category !== undefined) row.category = task.category;
  if (task.completed !== undefined) row.completed = task.completed;
  if (task.createdAt !== undefined) row.created_at = task.createdAt;
  if (task.updatedAt !== undefined) row.updated_at = task.updatedAt;
  return row;
}

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function normalizeTaskInput(data) {
  return {
    title: String(data.title).trim(),
    deadline: data.deadline,
    estimatedMinutes: Number(data.estimatedMinutes),
    importance: clamp(Number(data.importance), 0, 100),
    category: data.category in CATEGORIES ? data.category : "other",
  };
}

async function requireUserId() {
  const client = getSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("ログインが必要です");
  return data.user.id;
}

async function loadTasks() {
  const client = getSupabase();
  await requireUserId();

  const { data, error } = await client
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("タスクの読み込みに失敗しました");
  }

  taskCache = (data || []).map(fromDbTask);
  return taskCache;
}

function getActiveTasks() {
  return taskCache.filter((t) => !t.completed);
}

function getArchivedTasks() {
  return taskCache.filter((t) => t.completed);
}

function getTaskById(id) {
  return taskCache.find((t) => t.id === id) || null;
}

async function addTask(data) {
  const client = getSupabase();
  const userId = await requireUserId();
  const input = normalizeTaskInput(data);
  const now = new Date().toISOString();

  const { data: row, error } = await client
    .from("tasks")
    .insert({
      user_id: userId,
      ...toDbTask({
        ...input,
        completed: false,
        createdAt: now,
        updatedAt: now,
      }),
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    throw new Error("タスクの保存に失敗しました");
  }

  const task = fromDbTask(row);
  taskCache.push(task);
  return task;
}

async function updateTask(id, data) {
  const client = getSupabase();
  await requireUserId();
  const input = normalizeTaskInput(data);

  const { data: row, error } = await client
    .from("tasks")
    .update(
      toDbTask({
        ...input,
        updatedAt: new Date().toISOString(),
      })
    )
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    throw new Error("タスクの保存に失敗しました");
  }

  const task = fromDbTask(row);
  const index = taskCache.findIndex((t) => t.id === id);
  if (index !== -1) taskCache[index] = task;
  else taskCache.push(task);
  return task;
}

async function completeTask(id) {
  const client = getSupabase();
  await requireUserId();

  const { data: row, error } = await client
    .from("tasks")
    .update(
      toDbTask({
        completed: true,
        updatedAt: new Date().toISOString(),
      })
    )
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    throw new Error("タスクの保存に失敗しました");
  }

  const task = fromDbTask(row);
  const index = taskCache.findIndex((t) => t.id === id);
  if (index !== -1) taskCache[index] = task;
  return task;
}

async function deleteTask(id) {
  const client = getSupabase();
  await requireUserId();

  const { error } = await client.from("tasks").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("タスクの削除に失敗しました");
  }

  taskCache = taskCache.filter((t) => t.id !== id);
}

async function signIn(email, password) {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    throw new Error("ログインに失敗しました");
  }

  return data;
}

async function signOut() {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) {
    console.error(error);
    throw new Error("ログアウトに失敗しました");
  }
  taskCache = [];
}

async function getSessionUser() {
  const client = getSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error(error);
    return null;
  }
  return data.session?.user || null;
}
