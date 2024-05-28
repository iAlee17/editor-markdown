dark_mode = false;
const body = document.body;

// Change Theme
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

// Open file dialog
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

// Open CV dialog
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

// Open Letter interface
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

// Open about dialog
document
    .getElementById("interact-about")
    .addEventListener("click", function () {
        document.getElementById("about").style.display = "block";
    });

// Open youtube dialog
const youtubeButtons = document.getElementsByClassName("interact-video");

for (let i = 0; i < youtubeButtons.length; i++) {
    youtubeButtons[i].addEventListener("click", function (event) {
        // Get interact-video element that it is clicked on and select the closest button
        const button = event.target.closest("button");
        const youtube = document.getElementById("youtube");
        const iframe = youtube.getElementsByTagName("iframe")[0];
        const formatDropdown = document.getElementById("cv-dropdown");

        // Set src attribute of iframe
        youtube.style.display = "flex";
        iframe.src = button.id;
        formatDropdown.style.display = "none";
    });
}

// Open image dialog
const imageButtons = document.getElementsByClassName("interact-image");

for (let i = 0; i < imageButtons.length; i++) {
    imageButtons[i].addEventListener("click", function (event) {
        // Get interact-video element that it is clicked on and select the closest button
        const button = event.target.closest("button");
        const letters = document.getElementById("letters");
        const image = letters.getElementsByTagName("img")[0];
        const formatDropdown = document.getElementById("letter-dropdown");

        // Set src attribute of iframe
        letters.style.display = "flex";
        image.src = button.id;
        formatDropdown.style.display = "none";
    });
}

// Get all close button elements and add event listener
const closeButtons = document.getElementsByClassName("close-button");
for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", function () {
        document.getElementById("about").style.display = "none";
        document.getElementById("youtube").style.display = "none";
        document.getElementById("letters").style.display = "none";
    });
}