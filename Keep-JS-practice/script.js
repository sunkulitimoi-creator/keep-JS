//The main function

function saveNote() {
    //step 1
    const { title, note} = readInput();

    //Save the note to local storage

    //step 2
    const noteElement = createElements(title, note);

    //step 3
    displayNote(noteElement);
}

//helper function

function readInput() {

    //Read Title
    const titleElement = document.getElementById("title");
    const title = titleElement.value;

    //Read Note
    const noteElement = document.getElementById("note");
    const note = noteElement.value;


    return { title, note };
}

let listIconNames = ["palette", "add_alert", "person_add", "image", "archive", "more_vert", "undo", "redo"];
let closeBtn = document.getElementById("close-btn")

function createElements(title, note) {
    let className = "material-symbols-outlined";

    const titleElement = document.createElement("h3");
    titleElement.textContent = title;
    titleElement.id = "display-title";

    const noteElement = document.createElement("p");
    noteElement.textContent = note;
    noteElement.id = "display-note";

    //Add action icons as well
    let iconGroup = document.createElement("div");
    iconGroup.className = "icon-group";


    for (let iconName of listIconNames) {
        let span = document.createElement("span");
        span.className = className;
        span.textContent = iconName;
        iconGroup.appendChild(span);
    }

    const containerElement = document.createElement("div");
    containerElement.appendChild(titleElement);
    containerElement.appendChild(noteElement);
    containerElement.appendChild(iconGroup);
    containerElement.appendChild(closeBtn)
    

    return containerElement;
}

function displayNote(noteElement) {
    //Identify where it's going to be displayed
    const listElement = document.getElementById("notes");

    //Attach noteElement to list
    listElement.appendChild(noteElement);
}  

//Hold click state for the sidebar

document.querySelectorAll("aside span, material-symbols-outlined", "writing-area").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll("aside span, material-symbols-outlined", "writing-area").forEach(el => el.classList.remove("active"));
    
    item.classList.add("active");
  });
});

