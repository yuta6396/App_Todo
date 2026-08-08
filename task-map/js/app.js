(() => {
  const els = {
    viewMap: document.getElementById("view-map"),
    viewList: document.getElementById("view-list"),
    mapNotes: document.getElementById("map-notes"),
    taskList: document.getElementById("task-list"),
    listEmpty: document.getElementById("list-empty"),
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
    btnDelete: document.getElementById("btn-delete"),
    tabs: document.querySelectorAll(".tab"),
  };

  let currentTab = "map";

  function switchTab(tab) {
    currentTab = tab;
    els.tabs.forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    els.viewMap.classList.toggle("is-active", tab === "map");
    els.viewList.classList.toggle("is-active", tab === "list");
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

  /** datetime-local value from Date or ISO string */
  function toLocalInputValue(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Default deadline: tomorrow 18:00 local */
  function defaultDeadlineValue() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return toLocalInputValue(d);
  }

  function openModal(task = null) {
    if (task) {
      els.modalTitle.textContent = "タスク編集";
      els.taskId.value = task.id;
      els.title.value = task.title;
      els.deadline.value = toLocalInputValue(task.deadline);
      els.minutes.value = task.estimatedMinutes;
      els.importance.value = task.importance;
      els.importanceValue.textContent = task.importance;
      els.category.value = task.category;
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

  function saveFromModal() {
    const data = readFormData();
    if (!data) return;

    const id = els.taskId.value;
    if (id) {
      updateTask(id, data);
    } else {
      addTask(data);
    }
    closeModal();
    render();
  }

  function deleteFromModal() {
    const id = els.taskId.value;
    if (!id) return;
    if (!confirm("このタスクを削除しますか？")) return;
    deleteTask(id);
    closeModal();
    render();
  }

  function renderMap() {
    const tasks = getActiveTasks();
    const now = new Date();
    els.mapNotes.innerHTML = "";

    tasks.forEach((task) => {
      const urgency = calculateUrgency(task.deadline, task.estimatedMinutes, now);
      const importance = Number(task.importance);

      // X: urgency 0→left, 100→right; Y: importance 0→bottom, 100→top
      // Keep notes slightly inset so they don't clip edges
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

    // Sort by deadline ascending
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
      check.setAttribute("aria-label", "完了");
      check.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      check.addEventListener("change", () => {
        if (check.checked) {
          completeTask(task.id);
          render();
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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    if (currentTab === "map") {
      renderMap();
    } else {
      renderList();
    }
  }

  // Events
  els.tabs.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  els.btnAdd.addEventListener("click", () => openModal());
  els.btnCancel.addEventListener("click", closeModal);
  els.btnSave.addEventListener("click", saveFromModal);
  els.btnDelete.addEventListener("click", deleteFromModal);

  els.importance.addEventListener("input", () => {
    els.importanceValue.textContent = els.importance.value;
  });

  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay) closeModal();
  });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveFromModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.overlay.hidden) {
      closeModal();
    }
  });

  // Recalculate urgency when returning to Map / when page becomes visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentTab === "map") {
      renderMap();
    }
  });

  render();
})();
