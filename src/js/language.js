// Limba implicită este 'en' English
var currentlanguage = "ro";

// Această funcție trebuie chemată o dată ca să funcționeze
changelang("ro");

// Obținem valoarea limbii din elementul <select>
document
    .getElementById("language-select-option")
    .addEventListener("change", function () {
        console.log(this.value);
        currentlanguage = this.value;
        changelang();
    });

// BUG: Limbajul nu este respectat între pagini
function changelang() {

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
