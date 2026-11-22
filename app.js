// To-Do List with localStorage
// State lives in ONE place: the `tasks` array. The page is always rebuilt from it.

const STORAGE_KEY = "todo.tasks";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const errorMsg = document.getElementById("error");
const list = document.getElementById("task-list");
const emptyMsg = document.getElementById("empty");
const countEl = document.getElementById("count");
const filterBar = document.querySelector(".filters");
const clearBtn = document.getElementById("clear-done");

let tasks = loadTasks();   // [{ id, text, done }]
let filter = "all";        // "all" | "active" | "done"

/* ---------- storage ---------- */

function loadTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    // keep only well-formed tasks so bad data can never break the page
    return data.filter(t => t && typeof t.text === "string" && t.text.trim() !== "")
               .map(t => ({ id: Number(t.id) || Date.now() + Math.random(), text: t.text, done: Boolean(t.done) }));
  } catch (err) {
    return []; // corrupted JSON or storage blocked
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn("Could not save tasks:", err);
  }
}

/* ---------- rendering ---------- */

function visibleTasks() {
  if (filter === "active") return tasks.filter(t => !t.done);
  if (filter === "done") return tasks.filter(t => t.done);
  return tasks;
}

function render() {
  list.innerHTML = ""; // safe: only clears; user text is added with textContent below

  for (const task of visibleTasks()) {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    if (task.done) li.classList.add("done");

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = task.done;
    box.setAttribute("aria-label", "Mark done: " + task.text);

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text; // never innerHTML for user text

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "Delete";
    del.setAttribute("aria-label", "Delete task: " + task.text);

    li.append(box, text, del);
    list.append(li);
  }

  const left = tasks.filter(t => !t.done).length;
  countEl.textContent = left + (left === 1 ? " task left" : " tasks left");

  clearBtn.disabled = !tasks.some(t => t.done);

  const messages = {
    all: "No tasks yet. Add your first one above.",
    active: "Nothing left to do.",
    done: "No completed tasks yet."
  };
  const isEmpty = visibleTasks().length === 0;
  emptyMsg.hidden = !isEmpty;
  emptyMsg.textContent = isEmpty ? messages[filter] : "";

  for (const btn of filterBar.querySelectorAll("button")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
  }
}

function update() {
  saveTasks();
  render();
}

/* ---------- events ---------- */

// Add a task (fires on button click AND on the Enter key inside the input)
form.addEventListener("submit", event => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    errorMsg.hidden = false;
    input.focus();
    return;
  }

  errorMsg.hidden = true;
  tasks.push({ id: Date.now(), text, done: false });
  input.value = "";
  update();
});

// Hide the error as soon as the user types; Escape clears the box
input.addEventListener("input", () => { errorMsg.hidden = true; });
input.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    input.value = "";
    errorMsg.hidden = true;
  }
});

// Event delegation: one listener on the list handles every checkbox and Delete button
list.addEventListener("click", event => {
  const li = event.target.closest("li");
  if (!li) return;
  const id = Number(li.dataset.id);

  if (event.target.matches("input[type='checkbox']")) {
    const task = tasks.find(t => t.id === id);
    if (task) task.done = event.target.checked;
    update();
  } else if (event.target.matches(".delete")) {
    tasks = tasks.filter(t => t.id !== id);
    update();
  }
});

filterBar.addEventListener("click", event => {
  const btn = event.target.closest("button[data-filter]");
  if (!btn) return;
  filter = btn.dataset.filter;
  render(); // filter is a view setting, nothing new to save
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  update();
});

render(); // show saved tasks on page load
