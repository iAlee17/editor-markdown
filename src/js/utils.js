dark_mode = false;
const body = document.body;

// Schimbarea temei
var change_theme = document.getElementById("change-theme");
change_theme.onclick = function () {
    if (dark_mode == true) {
        dark_mode = false;
        body.classList.remove('dark-mode');
        change_theme.src = "icons/dark_mode.svg";
    } else {
        dark_mode = true;
        body.classList.add('dark-mode');
        change_theme.src = "icons/light_mode.svg";
    }
};

// deschide fereastra file
document.getElementById("interact-file").addEventListener("click", function () {
    document.getElementById("file-dropdown").style.display = "block";
});
document.addEventListener("click", function (event) {
    var fileDropdown = document.getElementById("file-dropdown");
    var target = event.target;
    if (
        !fileDropdown.contains(target) &&
        target !== document.getElementById("interact-file")
    ) {
        fileDropdown.style.display = "none";
    }
});

// deschide fereastra CV
document
    .getElementById("interact-cv")
    .addEventListener("click", function () {
        document.getElementById("cv-dropdown").style.display = "flex";
    });
document.addEventListener("click", function (event) {
    var fileDropdown = document.getElementById("cv-dropdown");
    var target = event.target;
    if (
        !fileDropdown.contains(target) &&
        target !== document.getElementById("interact-cv")
    ) {
        fileDropdown.style.display = "none";
    }
});

// deschide fereastra scrisori
document
    .getElementById("interact-letter")
    .addEventListener("click", function () {
        document.getElementById("letter-dropdown").style.display = "flex";
    });
document.addEventListener("click", function (event) {
    var fileDropdown = document.getElementById("letter-dropdown");
    var target = event.target;
    if (
        !fileDropdown.contains(target) &&
        target !== document.getElementById("interact-letter")
    ) {
        fileDropdown.style.display = "none";
    }
});

// deschide fereastra about
document
    .getElementById("interact-about")
    .addEventListener("click", function () {
        document.getElementById("about").style.display = "block";
    });

// deschide youtube dialog
const youtubeButtons = document.getElementsByClassName("interact-video");

for (let i = 0; i < youtubeButtons.length; i++) {
    youtubeButtons[i].addEventListener("click", function (event) {
        // obține elementul interactiv-video pe care este făcut click și selecteaza cel mai apropiat buton
        const button = event.target.closest("button");
        const youtube = document.getElementById("youtube");
        const iframe = youtube.getElementsByTagName("iframe")[0];
        const formatDropdown = document.getElementById("cv-dropdown");

        // setam atributul src al iframe
        youtube.style.display = "flex";
        iframe.src = button.id;
        formatDropdown.style.display = "none";
    });
}

// deschide dialogul cu imagini
const imageButtons = document.getElementsByClassName("interact-image");

for (let i = 0; i < imageButtons.length; i++) {
    imageButtons[i].addEventListener("click", function (event) {
        // obține elementul interactiv-imagini pe care este făcut click și selecteaza cel mai apropiat buton
        const button = event.target.closest("button");
        const letters = document.getElementById("letters");
        const image = letters.getElementsByTagName("img")[0];
        const formatDropdown = document.getElementById("letter-dropdown");

        // setam atributul src al iframe
        letters.style.display = "flex";
        image.src = button.id;
        formatDropdown.style.display = "none";
    });
}

// obține toate elementele de închidere a butonului și adăuga event listener
const closeButtons = document.getElementsByClassName("close-button");
for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", function () {
        document.getElementById("about").style.display = "none";
        document.getElementById("youtube").style.display = "none";
        document.getElementById("letters").style.display = "none";
    });
}