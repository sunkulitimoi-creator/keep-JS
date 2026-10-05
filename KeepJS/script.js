const STORAGE_KEY = "keep-notes";
const THEME_KEY = "keep-theme";
const VIEW_KEY = "keep-view";
const LABELS = ["Inspiration", "Other", "Personal", "Work"];

/*--Get elements--*/
const compose = document.getElementById("compose");
const titleInput = document.getElementById("title");
const noteInput = document.getElementById("note");
const closeBtn = document.getElementById("close-btn");
const notesList = document.getElementById("notes");
const composeLabel = document.getElementById("compose-label");

const overlay = document.getElementById("overlay");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalNote = document.getElementById("modal-note");
const modalDate = document.getElementById("modal-date");
const modalClose = document.getElementById("modal-close");
const modalDelete = document.getElementById("modal-delete");
const modalLabel = document.getElementById("modal-label");

const themeToggle = document.getElementById("theme-toggle");
const viewToggle = document.getElementById("view-toggle");

let notes = loadNotes();
let openedNoteId = null;
let activeFilter = null; // null = all notes
let justDragged = false; // skip click after a drag

//store notes in local storage
function loadNotes() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
    catch {
        return [];
    }
}


function persist() {
    try {
        return localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
    catch (err) {
        return console.error("Failed to save notes to local storage.");
    }
}

function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function autoGrow(el) {
    el.style.height = "auto";
    el.style.height = (el.scrollHeight) + "px";
}

function expandCompose() {
    compose.classList.add("expanded");
}

function collapseCompose() {
    compose.classList.remove("expanded");
    titleInput.value = "";
    noteInput.value = "";
    noteInput.style.height = "auto";
    composeLabel.value = activeFilter || "";
}

function labelFromSelect(selectEl) {
    const value = selectEl.value;
    return LABELS.includes(value) ? value : null;
}

function saveNote() {
    const title = titleInput.value.trim();
    const note = noteInput.value.trim();

    //Reject empty notes
    if (!title && !note) {
        collapseCompose();
        return;
    }  

    notes.unshift({
        id: makeId(),
        title: title,
        note: note,
        label: labelFromSelect(composeLabel),
        createdAt: new Date().toISOString()
    });
    persist();
    renderNotes();
    collapseCompose();
}

noteInput.addEventListener("focus", expandCompose);
noteInput.addEventListener("input", () => autoGrow(noteInput));
closeBtn.addEventListener("click", saveNote);

function notesToShow() {
    if (!activeFilter) return notes;
    return notes.filter(n => n.label === activeFilter);
}

function renderNotes() {
    notesList.replaceChildren();
    const visible = notesToShow();

    if (visible.length === 0) {
        const msg = document.createElement("p");
        msg.className = "empty-notes";
        msg.textContent = "No notes here yet";
        notesList.appendChild(msg);
        return;
    }

    visible.forEach(note => notesList.appendChild(createCard(note)));
}

function createCard(note) {
    const card = document.createElement("div");
    card.classList.add("note-card");
    card.draggable = true;
    card.dataset.id = note.id;

    if (note.title) {
        const title = document.createElement("h3");
        title.textContent = note.title;
        card.appendChild(title);
    }

    if (note.note) {
        const noteText = document.createElement("p");
        noteText.textContent = note.note;
        card.appendChild(noteText);
    }

    // Small chip for the note's label, if it has one
    if (note.label) {
        const chip = document.createElement("span");
        chip.className = "label-chip";
        chip.textContent = note.label;
        card.appendChild(chip);
    }

    const label = dateLabel(note);
    if (label) {
        const date = document.createElement("div");
        date.className = "note-date";
        date.textContent = label;
        card.appendChild(date);
    }


    const actions = document.createElement("div");
    actions.className = "card-actions";

    const del = document.createElement("span");
    del.className = "material-symbols-outlined";
    del.textContent = "delete";
    del.title = "Delete note";
    del.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNote(note.id);
    });

    actions.appendChild(del);
    card.appendChild(actions);

    card.addEventListener("click", () => {
        if (justDragged) return;
        openModal(note.id);
    });

    // Native HTML5 drag-and-drop (desktop)
    card.addEventListener("dragstart", (e) => {
        justDragged = true;
        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", note.id);
        e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document.querySelectorAll(".note-card.drag-over").forEach(el => {
            el.classList.remove("drag-over");
        });
        setTimeout(() => { justDragged = false; }, 0);
    });

    card.addEventListener("dragover", (e) => {
        e.preventDefault();
        card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        const draggedId = e.dataTransfer.getData("text/plain");
        moveNote(draggedId, note.id);
    });

    return card;
}

// Move a card to another card's index in the full notes array
function moveNote(draggedId, targetId) {
    if (!draggedId || draggedId === targetId) return;

    const from = notes.findIndex(n => n.id === draggedId);
    if (from < 0) return;

    const [item] = notes.splice(from, 1);
    const to = notes.findIndex(n => n.id === targetId);
    if (to < 0) {
        notes.splice(from, 0, item);
        return;
    }

    notes.splice(to, 0, item);
    persist();
    renderNotes();
}

//delete note
function deleteNote(id) { 
    notes = notes.filter(n => n.id !== id);
    persist();
    renderNotes();
}

//date formatting

function formatDate(iso) {
    const date = new Date(iso);
    if (isNaN(date)) return "";

    const sameYear = date.getFullYear() === new Date().getFullYear();

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        ...(sameYear ? {} : { year: "numeric" })
    });
}

function dateLabel(note) {
    if (note.updatedAt) return "Edited " + formatDate(note.updatedAt);
    if (note.createdAt) return formatDate(note.createdAt);
    return "";                  
}
//expand modal
function openModal(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    openedNoteId = id;
    modalTitle.value = note.title;
    modalNote.value = note.note;
    modalLabel.value = LABELS.includes(note.label) ? note.label : "";
    modalDate.textContent = dateLabel(note);
    overlay.classList.add("show");
    modal.classList.add("show");
}

function hideModal() {
    overlay.classList.remove("show");
    modal.classList.remove("show");
    openedNoteId = null;
}

function closeModal() {
    if (openedNoteId === null) return;
    
    const note = notes.find(n => n.id === openedNoteId);
    if (note) {
        const newTitle = modalTitle.value.trim();
        const newText = modalNote.value.trim();
        const newLabel = labelFromSelect(modalLabel);
        const oldLabel = note.label || null;

        if (newTitle !== note.title || newText !== note.note || newLabel !== oldLabel) {
            note.title = newTitle;
            note.note = newText;
            note.label = newLabel;
            note.updatedAt = new Date().toISOString();
        }

        // a note edited down to nothing is removed
        if (!note.title && !note.note) {
            notes = notes.filter(n => n.id !== openedNoteId);
        }

    persist();
    renderNotes();
    }
    hideModal();
}

modalClose.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);
modalDelete.addEventListener("click", () => {deleteNote(openedNoteId); hideModal();});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ---------- Sidebar ---------- */
const sidebarItems = document.querySelectorAll("aside > .side-bar-item");
sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
        const filter = item.dataset.filter;
        if (filter === undefined) return; // Reminders, Archive, Trash, Edit Labels

        sidebarItems.forEach(el => el.classList.remove("active"));
        item.classList.add("active");
        activeFilter = filter === "all" ? null : filter;
        composeLabel.value = activeFilter || "";
        renderNotes();
    });
});

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.querySelector("aside");
if (menuBtn) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
}

/* ---------- Dark mode ---------- */
function currentTheme() {
    try {
        return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggle.textContent = "light_mode";
    } else {
        document.documentElement.removeAttribute("data-theme");
        themeToggle.textContent = "dark_mode";
    }
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
        console.error("Failed to save theme.");
    }
}

themeToggle.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
});
applyTheme(currentTheme());

/* ---------- Grid / list view ---------- */
function currentView() {
    try {
        return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
    } catch {
        return "grid";
    }
}

function applyView(view) {
    if (view === "list") {
        notesList.classList.add("list-view");
        viewToggle.textContent = "grid_view";
    } else {
        notesList.classList.remove("list-view");
        viewToggle.textContent = "view_agenda";
    }
    try {
        localStorage.setItem(VIEW_KEY, view);
    } catch (err) {
        console.error("Failed to save view.");
    }
}

viewToggle.addEventListener("click", () => {
    applyView(currentView() === "list" ? "grid" : "list");
});
applyView(currentView());

/* ---------- Start up ---------- */
renderNotes();
