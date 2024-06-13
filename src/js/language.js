// limba implicită este 'en' English
var currentlanguage = "ro";

// TODO: Schimbarea limbii persistente
// Obținem elementul localstorage
// Verificam dacă este gol -> implicit la "en"

// Inițializam scriptul prin setarea limbajului pentru setarea curentă în localstorage
// Când schimbam tema, luam pe cea curentă și o setam să fie opusul

// Această funcție trebuie chemată o dată la lucru
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
