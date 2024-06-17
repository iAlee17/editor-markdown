// Importă modulele necesare din tauri
const { open } = window.__TAURI__.dialog;
const { save } = window.__TAURI__.dialog;
const { readTextFile } = window.__TAURI__.fs;
const { writeFile, writeTextFile, BaseDirectory } = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
const { tempdir } = window.__TAURI__.os;

// Stabilește variabile globale
var PREVIEW_MODE = false;

// Activeaza hard breaks pentru render-ul de markdown
marked.setOptions({
    breaks: true,
});

// Generați HTML pentru a trimite la PDF renderer.
document.getElementById("btn-export").addEventListener("click", function () {
    exportMain();
});

// Inițializează un editor codemirror
var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: false,
    lineWrapping: true,
    mode: "markdown",
});

editor.setSize("800", "100%");

// MARK: File operations

var data = localStorage.getItem("open");

// Verifica dacă datele sunt adevărate și selecteaza fișierul
if (data == "true") {
    selectFileDialog();
    localStorage.setItem("open", false);
}

// Intră în modul preview
document.getElementById("btn-preview").addEventListener("click", function () {
    togglePreview(editor);
});

function togglePreview(editor) {
    if (PREVIEW_MODE) {
        PREVIEW_MODE = false;

        // Obțineți toate elemetele cu clasa "btn-edit" și eliminați clasa inversată
        const btnIconElements = document.querySelectorAll(".btn-icon");
        for (const element of btnIconElements) {
            element.classList.remove("inverted");
        }

        document.getElementById("btn-preview").classList.remove("btn-edit");
        document.getElementById("preview").style.display = "none";
        editor.getWrapperElement().style.display = "block";
    } else {
        PREVIEW_MODE = true;

        // Schimba stilul butonului
        const btnIconElements = document.querySelectorAll(".btn-icon");
        for (const element of btnIconElements) {
            element.classList.add("inverted");
        }

        document.getElementById("btn-preview").classList.add("btn-edit");

        let editor_value = editor.getValue();

        let renderd = marked(editor_value);

        // Fix links opening în program în sine în locul browserului
        renderd = renderd.replace(/<a/g, '<a target="_blank"');

        document.getElementById("preview").innerHTML = renderd;
        document.getElementById("preview").style.display = "block";
        editor.getWrapperElement().style.display = "none";
    }
}

// Selectează fișier
function selectFileDialog() {
    document.getElementById("file-dropdown").style.display = "none";
    const selection = open({
        multiple: false,
        filters: [
            {
                extensions: ["md"],
                name: "*",
            },
        ],
    });

    // Citeste fișierul selectat
    selection
        .then((result) => {
            sessionStorage.setItem("opened_file_path", result);
            const promise = readTextFile(result);
            promise
                .then((response) => {
                    PREVIEW_MODE = false;

                    var filename = result.split("\\").pop().split("/").pop();
                    document.getElementById("title").innerHTML = filename;

                    document
                        .getElementById("btn-preview")
                        .classList.remove("btn-edit");
                    document.getElementById("preview").style.display = "none";
                    editor.getWrapperElement().style.display = "block";
                    editor.setValue(response);
                })
                .catch((error) => {
                    console.error(error);
                });
        })
        .catch((err) => {
            console.error(err);
        });
}

// Deschide Template
function openTemplate(template_path) {
    async function openTemplate() {
        try {
            const content = await invoke("read_resource", { name: "templates/" + template_path });
            return content; // Cu presupunerea că conținutul este un string
        } catch (error) {
            console.error("Error:", error);
            return "An error occurred";
        }
    }

    let template = openTemplate();

    // Înlocuiți conținutul editorului cu conținutul fișierului
    template
        .then((response) => {
            document.getElementById("btn-preview").classList.remove("btn-edit");
            document.getElementById("preview").style.display = "none";
            editor.getWrapperElement().style.display = "block";
            editor.setValue(response);
            document.getElementById("cv-dropdown").style.display = "none";
            document.getElementById("letter-dropdown").style.display = "none";
        })
        .catch((error) => {
            console.error(error);
        });
}

// Quciksave file
function quicksaveFile() {
    document.getElementById("file-dropdown").style.display = "none";
    // Verifică dacă fișierul a fost salvat înainte
    if (!sessionStorage.getItem("opened_file_path") ) {
        saveFileDialog();
        return;
    }
    // Verifică dacă stocarea sesiunii este un string
    if (sessionStorage.getItem("opened_file_path") == "null") {
        saveFileDialog();
        return;
    }

    // Scrie fișierul în locația selectată
    const promise = writeTextFile({
        path: sessionStorage.getItem("opened_file_path"),
        contents: editor.getValue(),
        directory: BaseDirectory.Temp,
    });
    promise
        .then(() => {
        })
        .catch((error) => {
            console.error(error);
        });
}

// Save file
function saveFileDialog() {
    document.getElementById("file-dropdown").style.display = "none";
    const selection = save({
        filters: [
            {
                extensions: ["md"],
                name: "*",
            },
        ],
    });

    // Citeste fișierul selectat
    selection
        .then((result) => {
            // `result` este calea aleasă de utilizator
            // Stocheaza calea fișierului în sessionStorage

            sessionStorage.setItem("opened_file_path", result);

            var filename = result.split("\\").pop().split("/").pop();
            document.getElementById("title").innerHTML = filename;

            const promise = writeTextFile({
                path: result,
                contents: editor.getValue(),
                directory: BaseDirectory.Current,
            });
            // Scrie fișierul în locația selectată
            promise
                .then(() => {
                })
                .catch((error) => {
                    console.error(error);
                });
        })
        .catch((err) => {
            console.error(err);
        });
}

// BUG: Butonul nu funcționează dacă sunteți în preview mode
function newFile() {
    document.getElementById("title").innerHTML = "New Document";
    document.getElementById("file-dropdown").style.display = "none";
    // Șterge tot din editor
    editor.setValue("");
    sessionStorage.setItem("opened_file_path", "null");
}

// MARK: Formatting

editor.addKeyMap({
    "Ctrl-S": function () {
        quicksaveFile();
    },
});

editor.addKeyMap({
    "Ctrl-O": function () {
        selectFileDialog();
    },
});

// Algoritm de formare generic pentru bold, italic, etc.
function genericFormat(editor, string, length) {
    // Inițializeaza variabilele
    var cursor = editor.getCursor();
    var word = editor.findWordAt(cursor);
    var word_content = editor.getRange(word.anchor, word.head);
    var extendedWord = {
        anchor: {
            line: word.anchor.line,
            ch: Math.max(0, word.anchor.ch - length),
        },
        head: { line: word.head.line, ch: word.head.ch + length },
    };
    var extendedWordText = editor.getRange(
        extendedWord.anchor,
        extendedWord.head
    );

    // Handle on selected
    var selection = editor.getSelection();
    if (selection.length > 1) {
        if (selection.startsWith(string) && selection.endsWith(string)) {
            // Remove
            editor.replaceSelection(
                selection.slice(length, length - length * 2)
            );
            return;
        } else {
            // Add
            editor.replaceSelection(string + selection + string);
            return;
        }
    }

    // Verifica dacă selecția are o anumită formatare deja aplicată pentru a evita adăugarea acesteia de două ori,
    // mai ales atunci când cursorul este la sfârșitul cuvântului
    if (
        extendedWordText.startsWith(string) == false &&
        extendedWordText.endsWith(string) == true
    ) {
        return;
    }
    if (
        extendedWordText.endsWith(string) == false &&
        extendedWordText.startsWith(string) == true
    ) {
        return;
    }

    // Handle on cursor
    // Adăuga sau elimina caractere
    if (
        extendedWordText.startsWith(string) &&
        extendedWordText.endsWith(string)
    ) {
        // Remove
        rmv = extendedWordText.slice(length, length - length * 2);
        editor.replaceRange(rmv, extendedWord.anchor, extendedWord.head);
        editor.setCursor(cursor.line, cursor.ch - length);
    } else {
        // Add
        editor.replaceRange(
            string + word_content + string,
            word.anchor,
            word.head
        );
        editor.setCursor(cursor.line, cursor.ch + length);
    }
}

// Bold
document.getElementById("btn-bold").addEventListener("click", function () {
    genericFormat(editor, "**", 2);
});

editor.addKeyMap({
    "Ctrl-B": function (editor) {
        genericFormat(editor, "**", 2);
    },
});

// Italic
document.getElementById("btn-italic").addEventListener("click", function () {
    genericFormat(editor, "*", 1);
});

editor.addKeyMap({
    "Ctrl-I": function (editor) {
        genericFormat(editor, "*", 1);
    },
});

// Code
document.getElementById("btn-code").addEventListener("click", function () {
    genericFormat(editor, "`", 1);
});

editor.addKeyMap({
    "Ctrl-`": function (editor) {
        genericFormat(editor, "`", 1);
    },
});

// Strikethrough
document.getElementById("btn-strike").addEventListener("click", function () {
    genericFormat(editor, "~~", 2);
});

editor.addKeyMap({
    "Ctrl-Alt-S": function (editor) {
        genericFormat(editor, "~~", 2);
    },
});

// Underline
document.getElementById("btn-underline").addEventListener("click", function () {
    underlineText(editor);
});

editor.addKeyMap({
    "Ctrl-Alt-U": function (editor) {
        underlineText(editor);
    },
});

function underlineText(editor) {
    var selection = editor.getSelection();
    editor.replaceSelection("<u>" + selection + "</u>");
}

// Link
document.getElementById("btn-link").addEventListener("click", function () {
    linkText(editor);
});

function linkText(editor) {
    // Adaugă link text
    var selection = editor.getSelection();
    if (selection.length < 1) {
        return;
    }

    // Adaugă link URL
    var link = prompt("Enter link URL", "https://");
    if (link == null) {
        return;
    }

    // Adaugă link
    editor.replaceSelection("[" + selection + "](" + link + ")");
}

// Image
document.getElementById("btn-image").addEventListener("click", function () {
    AdaugăImage(editor);
});

function AdaugăImage(editor) {
    // Adaugă link text
    var cursor = editor.getCursor();

    // Adaugă link URL
    var link = prompt("Enter image URL", "https://");
    if (link == null) {
        return;
    }

    // Adaugă image
    editor.replaceSelection('<img src="' + link + '" width="400"></img>');
}

// Code block
document
    .getElementById("btn-code-block")
    .addEventListener("click", function () {
        codeBlock(editor);
    });

function codeBlock(editor) {
    // Adaugă link text
    var selection = editor.getSelection();
    if (selection.length < 1) {
        return;
    }

    // Adaugă link
    editor.replaceSelection("```\n" + selection + "\n```");
}

// Blockquote
document.getElementById("btn-quote").addEventListener("click", function () {
    blockquote(editor);
});

function blockquote(editor) {
    var cursor = editor.getCursor();
    var line = editor.getLine(cursor.line);

    // Elimina  blockquote dacă există deja
    if (line.startsWith("> ")) {
        // Elimina primele două caractere ale liniei
        editor.replaceRange(
            "",
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: 2 }
        );
        return;
    } else {
        // Adaugă blockquote
        editor.replaceRange(
            "> " + line,
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: line.length }
        );
    }
}

editor.addKeyMap({
    "Ctrl-Q": function (editor) {
        blockquote(editor);
    },
});

// Align Center
document
    .getElementById("btn-align-center")
    .addEventListener("click", function () {
        centerText(editor);
    });

function centerText(editor) {
    var selection = editor.getSelection();
    editor.replaceSelection("<center>" + selection + "</center>");
}

// Align Right
document
    .getElementById("btn-align-right")
    .addEventListener("click", function () {
        rightText(editor);
    });

function rightText(editor) {
    var selection = editor.getSelection();
    editor.replaceSelection("<right>" + selection + "</right>");
}

// Align Justify
document
    .getElementById("btn-align-justify")
    .addEventListener("click", function () {
        justifyText(editor);
    });

function justifyText(editor) {
    var selection = editor.getSelection();
    editor.replaceSelection("<justify>" + selection + "</justify>");
}


// Align Left
document
    .getElementById("btn-align-left")
    .addEventListener("click", function () {
        leftText(editor);
    });

function leftText(editor) {
    var selection = editor.getSelection();
    if (selection.startsWith("<u>") && selection.endsWith("</u>")) {
        editor.replaceSelection(selection.slice(3, -4));
        return;
    }
    if (selection.startsWith("<right>") && selection.endsWith("</right>")) {
        editor.replaceSelection(selection.slice(7, -8));
        return;
    }
    if (selection.startsWith("<center>") && selection.endsWith("</center>")) {
        editor.replaceSelection(selection.slice(8, -9));
        return;
    }
    if (selection.startsWith("<justify>") && selection.endsWith("</justify>")) {
        editor.replaceSelection(selection.slice(9, -10));
        return;
    }
}

document
    .getElementById("btn-list-bullet")
    .addEventListener("click", function () {
        addBullet(editor, "- ");
    });

function addBullet(editor, string) {
    var selection = editor.getSelection();

    // Împărte selecția în linii
    var selectionLines = selection.split("\n");

    // Urmăreste dacă eliminăm sau adăugăm bullets
    var isRemoving = selectionLines[0].trim().startsWith(string);

    for (var i = 0; i < selectionLines.length; i++) {
        // obține linia
        var line = selectionLines[i];

        // Dacă scoatem bullets
        if (isRemoving) {
            line = line.replace(string, "");
        }
        // daca adaugam bullets
        else {
            line = string + line;
        }

        // Update the line in the array
        selectionLines[i] = line;
    }

    // Join with newline and update editor
    editor.replaceSelection(selectionLines.join("\n"));
}

editor.addKeyMap({
    "Shift-Ctrl-L": function (editor) {
        addBullet(editor, "- ");
    },
});

document
    .getElementById("btn-list-numbered")
    .addEventListener("click", function () {
        addNumbered(editor);
    });

function addNumbered(editor) {
    var selection = editor.getSelection();

    // Split selection into lines
    var selectionLines = selection.split("\n");

    // Loop through lines
    for (var i = 0; i < selectionLines.length; i++) {
        var number = i + 1;
        var string = number + ". ";

        // Get the line
        var line = selectionLines[i];

        // Keep track if we are removing or adding bullets
        var isRemoving = line.trim().startsWith(string);

        // If removing bullets
        if (isRemoving) {
            line = line.replace(string, "");
        }
        // If adding bullets
        else {
            line = string + line;
        }

        // Update the line in the array
        selectionLines[i] = line;
    }

    // Join with newline and update editor
    editor.replaceSelection(selectionLines.join("\n"));
}

editor.addKeyMap({
    "Ctrl-Alt-L": function (editor) {
        addNumbered(editor);
    },
});

// Heading 1
function genericHeading(editor, string) {
    var cursor = editor.getCursor();
    var line = editor.getLine(cursor.line);
    // Verifica dacă linia începe deja cu un heading
    if (line.startsWith(string)) {
        // Elimina primele caractere ale liniei până la primul spațiu
        editor.replaceRange(
            "",
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: line.indexOf(" ") + 1 }
        );
        return;
    }
    if (line.startsWith("#")) {
        // Elimina primele caractere ale liniei până la primul spațiu
        editor.replaceRange(
            "",
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: line.indexOf(" ") + 1 }
        );
        // Add level 1 heading to the line
        // Get the line again
        line = editor.getLine(cursor.line);
        editor.replaceRange(
            string + line,
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: line.length }
        );
        return;
    } else {
        var output = string + line;
        editor.replaceRange(
            output,
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: line.length }
        );
    }
}

editor.addKeyMap({
    "Ctrl-1": function (editor) {
        genericHeading(editor, "# ");
    },
});

editor.addKeyMap({
    "Ctrl-2": function (editor) {
        genericHeading(editor, "## ");
    },
});

editor.addKeyMap({
    "Ctrl-3": function (editor) {
        genericHeading(editor, "### ");
    },
});

editor.addKeyMap({
    "Ctrl-4": function (editor) {
        genericHeading(editor, "#### ");
    },
});

editor.addKeyMap({
    "Ctrl-5": function (editor) {
        genericHeading(editor, "##### ");
    },
});

editor.addKeyMap({
    "Ctrl-6": function (editor) {
        genericHeading(editor, "###### ");
    },
});

// Actualizare contor de cuvinte
editor.on("change", function (instance) {
    // Elimina etichetele HTML utilizând o expresie obișnuită
    const cleanText = instance.getValue().replace(/<\/?[^>]+(>|$)/g, '').replace("---", "").replace("# ", "");
    // Împarte textul în cuvinte
    const words = cleanText.trim().split(/\s+/);
    // Numără numărul de cuvinte
    const wordCount = words.filter(word => word.length > 0).length;
    // Setează valoarea
    document.getElementById("word-count").innerHTML = wordCount;
});
