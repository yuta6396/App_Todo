(() => {
  const els = {
    loginScreen: document.getElementById("login-screen"),
    loginForm: document.getElementById("login-form"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    loginError: document.getElementById("login-error"),
    btnLogin: document.getElementById("btn-login"),
    app: document.getElementById("app"),
    btnLogout: document.getElementById("btn-logout"),
    viewMap: document.getElementById("view-map"),
    viewList: document.getElementById("view-list"),
    viewArchive: document.getElementById("view-archive"),
    mapNotes: document.getElementById("map-notes"),
    taskList: document.getElementById("task-list"),
    listEmpty: document.getElementById("list-empty"),
    archiveList: document.getElementById("archive-list"),
    archiveEmpty: document.getElementById("archive-empty"),
    btnAdd: document.getElementById("btn-add"),
    overlay: document.getElementById("modal-overlay"),
    modalTitle: document.getElementById("modal-title"),
    form: document.getElementById("task-form"),
    taskId: document.getElementById("task-id"),
    title: document.getElementById("task-title"),
    deadline: document.getElementById("task-deadline"),
    minutes: document.getElementById("task-minutes"),
    importance: document.getElementById("task-importance"),
    importanceValue: document.getElementById("importance-value"),
    category: document.getElementById("task-category"),
    btnCancel: document.getElementById("btn-cancel"),
    btnSave: document.getElementById("btn-save"),
    modalActions: document.getElementById("modal-actions"),
    btnComplete: document.getElementById("btn-complete"),
    btnDelete: document.getElementById("btn-delete"),
    tabs: document.querySelectorAll(".tab"),
  };

  let currentTab = "map";
  let isLoggedIn = false;

  function showError(message) {
    alert(message);
  }

  function showLogin() {
    isLoggedIn = false;
    els.app.hidden = true;
    els.loginScreen.hidden = false;
    els.overlay.hidden = true;
    els.loginError.hidden = true;
    els.loginError.textContent = "";
  }

  function showApp() {
    isLoggedIn = true;
    els.loginScreen.hidden = true;
    els.app.hidden = false;
  }

  async function refreshTasks() {
    try {
      await loadTasks();
      render();
    } catch (err) {
      console.error(err);
      showError(err.message || "タスクの読み込みに失敗しました");
    }
  }

  function switchTab(tab) {
    currentTab = tab;
    els.tabs.forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    els.viewMap.classList.toggle("is-active", tab === "map");
    els.viewList.classList.toggle("is-active", tab === "list");
    els.viewArchive.classList.toggle("is-active", tab === "archive");
    render();
  }

  function formatDeadline(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${hh}:${mm}`;
  }

  function formatMinutes(min) {
    const n = Number(min);
    if (!Number.isFinite(n)) return "—";
    if (n < 60) return `${n}分`;
    const h = Math.floor(n / 60);
    const rem = n % 60;
    return rem === 0 ? `${h}時間` : `${h}時間${rem}分`;
  }

  function toLocalInputValue(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function defaultDeadlineValue() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return toLocalInputValue(d);
  }

  function openModal(task = null) {
    if (task) {
      els.modalTitle.textContent = task.completed ? "完了タスク" : "タスク編集";
      els.taskId.value = task.id;
      els.title.value = task.title;
      els.deadline.value = toLocalInputValue(task.deadline);
      els.minutes.value = task.estimatedMinutes;
      els.importance.value = task.importance;
      els.importanceValue.textContent = task.importance;
      els.category.value = task.category;
      els.modalActions.hidden = false;
      els.btnComplete.hidden = !!task.completed;
      els.btnDelete.hidden = false;
    } else {
      els.modalTitle.textContent = "新規タスク";
      els.taskId.value = "";
      els.form.reset();
      els.deadline.value = defaultDeadlineValue();
      els.minutes.value = 60;
      els.importance.value = 50;
      els.importanceValue.textContent = "50";
      els.category.value = "research";
      els.modalActions.hidden = true;
      els.btnComplete.hidden = true;
      els.btnDelete.hidden = true;
    }
    els.overlay.hidden = false;
    els.title.focus();
  }

  function closeModal() {
    els.overlay.hidden = true;
  }

  function readFormData() {
    const title = els.title.value.trim();
    const deadlineLocal = els.deadline.value;
    const estimatedMinutes = Number(els.minutes.value);
    const importance = Number(els.importance.value);
    const category = els.category.value;

    if (!title) {
      alert("タスク名を入力してください");
      return null;
    }
    if (!deadlineLocal) {
      alert("締切を入力してください");
      return null;
    }
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes < 1) {
      alert("予測時間は1分以上で入力してください");
      return null;
    }

    return {
      title,
      deadline: new Date(deadlineLocal).toISOString(),
      estimatedMinutes,
      importance,
      category,
    };
  }

  async function saveFromModal() {
    const data = readFormData();
    if (!data) return;

    const id = els.taskId.value;
    try {
      if (id) {
        await updateTask(id, data);
      } else {
        await addTask(data);
      }
      closeModal();
      render();
    } catch (err) {
      console.error(err);
      showError(err.message || "タスクの保存に失敗しました");
    }
  }

  async function completeFromModal() {
    const id = els.taskId.value;
    if (!id) return;
    if (!confirm("このタスクを完了してアーカイブしますか？")) return;
    try {
      await completeTask(id);
      closeModal();
      render();
    } catch (err) {
      console.error(err);
      showError(err.message || "タスクの保存に失敗しました");
    }
  }

  async function deleteFromModal() {
    const id = els.taskId.value;
    if (!id) return;
    if (!confirm("このタスクを削除しますか？\n（アーカイブには残りません）")) return;
    try {
      await deleteTask(id);
      closeModal();
      render();
    } catch (err) {
      console.error(err);
      showError(err.message || "タスクの削除に失敗しました");
    }
  }

  function renderMap() {
    const tasks = getActiveTasks();
    const now = new Date();
    els.mapNotes.innerHTML = "";

    tasks.forEach((task) => {
      const urgency = calculateUrgency(task.deadline, task.estimatedMinutes, now);
      const importance = Number(task.importance);

      const inset = 6;
      const x = inset + (urgency / 100) * (100 - inset * 2);
      const y = inset + ((100 - importance) / 100) * (100 - inset * 2);

      const note = document.createElement("button");
      note.type = "button";
      note.className = `sticky cat-${task.category}`;
      note.style.left = `${x}%`;
      note.style.top = `${y}%`;
      note.setAttribute("aria-label", task.title);
      note.innerHTML = `
        <div class="sticky-title">${escapeHtml(task.title)}</div>
        <div class="sticky-meta">${escapeHtml(formatDeadline(task.deadline))}</div>
        <div class="sticky-meta">${escapeHtml(formatMinutes(task.estimatedMinutes))}</div>
      `;
      note.addEventListener("click", () => openModal(task));
      els.mapNotes.appendChild(note);
    });
  }

  function renderList() {
    const tasks = getActiveTasks();
    els.taskList.innerHTML = "";
    els.listEmpty.hidden = tasks.length > 0;

    const sorted = [...tasks].sort(
      (a, b) => new Date(a.deadline) - new Date(b.deadline)
    );

    sorted.forEach((task) => {
      const cat = CATEGORIES[task.category] || CATEGORIES.other;
      const li = document.createElement("li");
      li.className = "task-item";

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "task-check";
      check.setAttribute("aria-label", "完了してアーカイブ");
      check.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      check.addEventListener("change", async () => {
        if (!check.checked) return;
        try {
          await completeTask(task.id);
          render();
        } catch (err) {
          console.error(err);
          check.checked = false;
          showError(err.message || "タスクの保存に失敗しました");
        }
      });

      const body = document.createElement("div");
      body.className = "task-body";
      body.innerHTML = `
        <div class="task-name">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span><span class="task-cat-dot cat-${task.category}"></span>${escapeHtml(cat.label)}</span>
          <span>${escapeHtml(formatDeadline(task.deadline))}</span>
          <span>${escapeHtml(formatMinutes(task.estimatedMinutes))}</span>
        </div>
      `;

      li.appendChild(check);
      li.appendChild(body);
      li.addEventListener("click", (e) => {
        if (e.target === check) return;
        openModal(task);
      });
      els.taskList.appendChild(li);
    });
  }

  function renderArchive() {
    const tasks = getArchivedTasks();
    els.archiveList.innerHTML = "";
    els.archiveEmpty.hidden = tasks.length > 0;

    const sorted = [...tasks].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    sorted.forEach((task) => {
      const cat = CATEGORIES[task.category] || CATEGORIES.other;
      const li = document.createElement("li");
      li.className = "task-item task-item-archived";

      const body = document.createElement("div");
      body.className = "task-body";
      body.innerHTML = `
        <div class="task-name">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span><span class="task-cat-dot cat-${task.category}"></span>${escapeHtml(cat.label)}</span>
          <span>${escapeHtml(formatDeadline(task.deadline))}</span>
          <span>${escapeHtml(formatMinutes(task.estimatedMinutes))}</span>
        </div>
      `;

      li.appendChild(body);
      li.addEventListener("click", () => openModal(task));
      els.archiveList.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    if (!isLoggedIn) return;
    if (currentTab === "map") {
      renderMap();
    } else if (currentTab === "list") {
      renderList();
    } else {
      renderArchive();
    }
  }

  async function enterApp() {
    showApp();
    await refreshTasks();
  }

  async function handleLogin(e) {
    e.preventDefault();
    els.loginError.hidden = true;
    els.loginError.textContent = "";
    els.btnLogin.disabled = true;
    try {
      await signIn(els.loginEmail.value.trim(), els.loginPassword.value);
      els.loginPassword.value = "";
      await enterApp();
    } catch (err) {
      console.error(err);
      els.loginError.textContent = err.message || "ログインに失敗しました";
      els.loginError.hidden = false;
    } finally {
      els.btnLogin.disabled = false;
    }
  }

  async function handleLogout() {
    try {
      await signOut();
      showLogin();
    } catch (err) {
      console.error(err);
      showError(err.message || "ログアウトに失敗しました");
    }
  }

  // Events
  els.tabs.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  els.loginForm.addEventListener("submit", handleLogin);
  els.btnLogout.addEventListener("click", handleLogout);
  els.btnAdd.addEventListener("click", () => openModal());
  els.btnCancel.addEventListener("click", closeModal);
  els.btnSave.addEventListener("click", () => {
    void saveFromModal();
  });
  els.btnComplete.addEventListener("click", () => {
    void completeFromModal();
  });
  els.btnDelete.addEventListener("click", () => {
    void deleteFromModal();
  });

  els.importance.addEventListener("input", () => {
    els.importanceValue.textContent = els.importance.value;
  });

  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay) closeModal();
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    void saveFromModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.overlay.hidden) {
      closeModal();
    }
  });

  // Recalculate urgency / pull latest when returning to the page
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isLoggedIn) {
      void refreshTasks();
    }
  });

  async function init() {
    try {
      const user = await getSessionUser();
      if (user) {
        await enterApp();
      } else {
        showLogin();
      }
    } catch (err) {
      console.error(err);
      showLogin();
    }
  }

  void init();
})();
