// The default language is  'en' English
var currentlanguage = "ro";

// TODO: Persistent language change
// Get localstorage item
// Check if empty -> default to "en"

// Inititalise script by setting language to curent setting in localstorage
// When changing theme, take the current one and set it to be the oposite

// This function needs to be called once to work
changelang("ro");

// Get the value of selected language from <select> element
document
    .getElementById("language-select-option")
    .addEventListener("change", function () {
        console.log(this.value);
        currentlanguage = this.value;
        changelang();
    });

// BUG: Language is not respected between pages
function changelang(lang) {
    console.log(lang);

    var styleTag = document.getElementById("language-style");
    if (styleTag) {
        styleTag.textContent =
            ".bilanguage::after {content: " + getContent() + "!important;}";
    } else {
        var newStyle = document.createElement("style");
        newStyle.textContent =
            ".bilanguage::after {content: " + getContent() + "!important;}";
        newStyle.id = "language-style";
        document.head.appendChild(newStyle);
    }
    currentlanguage = currentlanguage === "en" ? "ro" : "en";
}

function getContent() {
    return currentlanguage === "en" ? "attr(data-ro)" : "attr(data-en)";
}
