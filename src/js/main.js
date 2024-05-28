// Import necessary modules from tauri
const { open } = window.__TAURI__.dialog;
const { save } = window.__TAURI__.dialog;
const { readTextFile } = window.__TAURI__.fs;
const { writeFile, writeTextFile, BaseDirectory } = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
const { tempdir } = window.__TAURI__.os;

// Establsih global variables
var PREVIEW_MODE = false;
var landscape = false;

// Enable hard breaks for the markdown renderer
marked.setOptions({
    breaks: true,
});

// Toggle preview mode
document.getElementById("btn-preview").addEventListener("click", function () {
    if (PREVIEW_MODE) {
        PREVIEW_MODE = false;

        // get all elemetns with class "btn-edit" and remove the class inverted
        const btnIconElements = document.querySelectorAll(".btn-icon");
        for (const element of btnIconElements) {
            element.classList.remove("inverted");
        }

        document.getElementById("btn-preview").classList.remove("btn-edit");
        document.getElementById("preview").style.display = "none";
        editor.getWrapperElement().style.display = "block";
    } else {
        PREVIEW_MODE = true;

        // Change button style
        const btnIconElements = document.querySelectorAll(".btn-icon");
        for (const element of btnIconElements) {
            element.classList.add("inverted");
        }

        document.getElementById("btn-preview").classList.add("btn-edit");

        let editor_value = editor.getValue();

        // Fix new line to be more intuitive
        editor_value = editor_value.replace(/^\s*[\r\n]+/gm, "\n</br>");
        editor_value = editor_value.replace(/---\s*[\r\n]+/gm, "---");
        editor_value = editor_value.replace(
            /<\/br>\s*---\s*<\/br>/gm,
            "\n---\n",
        );

        let renderd = marked(editor_value);

        // Fix links opening in the program itself instead of the browser
        renderd = renderd.replace(/<a/g, '<a target="_blank"');

        document.getElementById("preview").innerHTML = renderd;
        document.getElementById("preview").style.display = "block";
        editor.getWrapperElement().style.display = "none";
    }
});

// Generate HTML to send to the PDF renderer.
document.getElementById("btn-export").addEventListener("click", function () {
    exportMain(landscape);
});

// Create codemirror editor
var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: false,
    lineWrapping: true,
    mode: "markdown",
});

editor.setSize("800", "100%");

// MARK: File operations

var data = localStorage.getItem("open");

// check if data is true and select file
if (data == "true") {
    selectFileDialog();
    localStorage.setItem("open", false);
}

// Select file
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

    // Read selected file
    selection
        .then((result) => {
            sessionStorage.setItem("opened_file_path", result);
            const promise = readTextFile(result);
            promise
                .then((response) => {
                    PREVIEW_MODE = false;

                    // File name to title
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

// Open Template
function openTemplate(template_path) {
    // Open file from resoruces with given name
    async function openTemplate() {
        try {
            const content = await invoke("read_resource", { name: "templates/" + template_path });
            return content; // Assuming content is a string
        } catch (error) {
            // Show error in console
            console.error("Error:", error);
            return "An error occurred"; // Return a string indicating an error occurred
        }
    }

    let template = openTemplate();

    // Replace the editor contents with the contents of the file
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
    // Check if the file has been saved before
    if (!sessionStorage.getItem("opened_file_path") ) {
        saveFileDialog();
        return;
    }
    // Check if session storage is empty string
    if (sessionStorage.getItem("opened_file_path") == "null") {
        saveFileDialog();
        return;
    }

    // Write file to location selected
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

    // Read selected file
    selection
        .then((result) => {
            // `result` is the path chosen by the user
            // Store the file path in the sessionStorage

            sessionStorage.setItem("opened_file_path", result);

            var filename = result.split("\\").pop().split("/").pop();
            document.getElementById("title").innerHTML = filename;

            const promise = writeTextFile({
                path: result,
                contents: editor.getValue(),
                directory: BaseDirectory.Current,
            });
            // Write file to location selected
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

// BUG: The button doesen't work if you are in preview mode
function newFile() {
    document.getElementById("title").innerHTML = "New Document";
    document.getElementById("file-dropdown").style.display = "none";
    // Delete everythin from the opened editor
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

// Generic formating algorithm for bold, italic, etc.
function genericFormat(editor, string, length) {
    // Initialize variables
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
            // Remove bold
            editor.replaceSelection(
                selection.slice(length, length - length * 2)
            );
            return;
        } else {
            // Add bold
            editor.replaceSelection(string + selection + string);
            return;
        }
    }

    // Check if the selection has some formating already applied to avoid adding it twice,
    // esspecially when the cursor is at the end of the word
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
    // Add or remove characters
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
    // Call generic formating algorithm for italic
    genericFormat(editor, "**", 2);
});

editor.addKeyMap({
    "Ctrl-B": function (editor) {
        // Call generic formating algorithm for italic
        genericFormat(editor, "**", 2);
    },
});

// Italic
document.getElementById("btn-italic").addEventListener("click", function () {
    // Call generic formating algorithm for italic
    genericFormat(editor, "*", 1);
});

editor.addKeyMap({
    "Ctrl-I": function (editor) {
        // Call generic formating algorithm for italic
        genericFormat(editor, "*", 1);
    },
});

// Code
document.getElementById("btn-code").addEventListener("click", function () {
    // Call generic formating algorithm for italic
    genericFormat(editor, "`", 1);
});

editor.addKeyMap({
    "Ctrl-`": function (editor) {
        // Call generic formating algorithm for italic
        genericFormat(editor, "`", 1);
    },
});

// Strikethrough
document.getElementById("btn-strike").addEventListener("click", function () {
    // Call generic formating algorithm for italic
    genericFormat(editor, "~~", 2);
});

editor.addKeyMap({
    "Ctrl-Alt-S": function (editor) {
        // Call generic formating algorithm for italic
        genericFormat(editor, "~~", 2);
    },
});

// Link
document.getElementById("btn-link").addEventListener("click", function () {
    linkText(editor);
});

function linkText(editor) {
    // Insert link text
    var selection = editor.getSelection();
    if (selection.length < 1) {
        return;
    }

    // Insert link URL
    var link = prompt("Enter link URL", "https://");
    if (link == null) {
        return;
    }

    // Insert link
    editor.replaceSelection("[" + selection + "](" + link + ")");
}

// Image
document.getElementById("btn-image").addEventListener("click", function () {
    insertImage(editor);
});

function insertImage(editor) {
    // Insert link text
    var cursor = editor.getCursor();

    // Insert link URL
    var link = prompt("Enter image URL", "https://");
    if (link == null) {
        return;
    }

    // Insert image
    editor.replaceSelection('<img src="' + link + '" width="400"></img>');
}

// Code block
document
    .getElementById("btn-code-block")
    .addEventListener("click", function () {
        codeBlock(editor);
    });

function codeBlock(editor) {
    // Insert link text
    var selection = editor.getSelection();
    if (selection.length < 1) {
        return;
    }

    // Insert link
    editor.replaceSelection("```\n" + selection + "\n```");
}

// Blockquote
document.getElementById("btn-quote").addEventListener("click", function () {
    blockquote(editor);
});

function blockquote(editor) {
    // Get current line
    var cursor = editor.getCursor();
    var line = editor.getLine(cursor.line);

    // Remove blockquote if it already exists
    if (line.startsWith("> ")) {
        // Remove the first two characters of the line
        editor.replaceRange(
            "",
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: 2 }
        );
        return;
    } else {
        // Insert blockquote
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
        justifyText(editor);
    });

function justifyText(editor) {
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
    // Check if the selection has <right> at the beginning and </right> at the end
    if (selection.startsWith("<right>") && selection.endsWith("</right>")) {
        // Remove <right> and </right>
        editor.replaceSelection(selection.slice(7, -8));
        return;
    }
    if (selection.startsWith("<center>") && selection.endsWith("</center>")) {
        // Remove <center> and </center>
        editor.replaceSelection(selection.slice(8, -9));
        return;
    }
    if (selection.startsWith("<justify>") && selection.endsWith("</justify>")) {
        // Remove <justify> and </justify>
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

    // Split selection into lines
    var selectionLines = selection.split("\n");

    // Keep track if we are removing or adding bullets
    var isRemoving = selectionLines[0].trim().startsWith(string);

    // Loop through lines
    for (var i = 0; i < selectionLines.length; i++) {
        // Get the line
        var line = selectionLines[i];

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

    // Keep track if we are removing or adding bullets
    var isRemoving = selectionLines[0].trim().startsWith(string);

    // Loop through lines
    for (var i = 0; i < selectionLines.length; i++) {
        var number = i + 1;
        var string = number + ". ";

        // Get the line
        var line = selectionLines[i];

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
    // Check if the line already starts with a heading
    if (line.startsWith(string)) {
        // Remove the first characters of the line up to the first space
        editor.replaceRange(
            "",
            { line: cursor.line, ch: 0 },
            { line: cursor.line, ch: line.indexOf(" ") + 1 }
        );
        return;
    }
    if (line.startsWith("#")) {
        // Remove the first characters of the line up to the first space
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

// Word counter update
editor.on("change", function (instance) {
    // Remove HTML tags using a regular expression
    const cleanText = instance.getValue().replace(/<\/?[^>]+(>|$)/g, '').replace("---", "");
    // Split the cleaned text into words
    const words = cleanText.trim().split(/\s+/);
    // Count the number of words
    const wordCount = words.filter(word => word.length > 0).length;
    // Set the value
    document.getElementById("word-count").innerHTML = wordCount;
});
