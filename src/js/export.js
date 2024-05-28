async function exportMain(landscape) {
    document.getElementById("file-dropdown").style.display = "none";
    // This workaround seems to work for now.
    document.getElementById("preview").innerHTML = marked(editor.getValue());

    // We can insert CSS by writing a diferent file to the temp directory and then referencing it in the HTML file.
    const css = await saveCSS("css_themes/default.css");

    // Get the preview element
    var element = document.getElementById("preview");
    // Combine to form a valid HTML file

    // Define HTML boilerplate
    html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
    ${css}
    </style>
    </head>
    <body>
    ${element.outerHTML}
    </body>
    </html>
    `;

    // Store the HTML file in the temp directory
    saveTempDir(landscape, html);
}

async function saveTempDir(landscape, html) {
    try {
        const tempDirPath = await tempdir();
        let tempFilePath = `${tempDirPath}file.html`;

        // Open a file dialog
        const selection = save({
            filters: [
                {
                    extensions: ["pdf"],
                    name: "*",
                },
            ],
        });

        // Save HTML file
        const createDataFile = async () => {
            try {
                await writeFile(
                    {
                        contents: html,
                        path: tempFilePath,
                    },
                    {
                        dir: BaseDirectory.Temp,
                    }
                );
            } catch (err) {
                console.error(err);
            }
        }; // Some boring error handling.
        createDataFile();

        // Invoke the command
        invoke("generate_pdf", {
            landscape: landscape,
            input: tempFilePath,
            output: await selection,
        })
            .then((_res) => {
                // Show a popup for 3 seconds to indicate that the file has been exported.
                document.getElementById("popup").style.display = "block";
                document.getElementById("popup").style.opacity = "1";
                document.getElementById("popup").style.transition = "none";

                // Wait 1 second
                setTimeout(function () {
                    document.getElementById("popup").style.transition =
                        "opacity 1s ease-out";
                    document.getElementById("popup").style.opacity = "0";
                }, 2000);
                setTimeout(function () {
                    document.getElementById("popup").style.display = "none";
                }, 3000);
            })
            .catch((err) => {
                // Show error in console
                console.error("Error:", err);
            });
    } catch (error) {
        // Show error in console
        console.error("Error:", error);
    }
}

async function saveCSS(css_path, _callback) {
    try {
        const content = await invoke("read_resource", { name: css_path });
        return content; // Assuming content is a string
    } catch (error) {
        // Show error in console
        console.error("Error:", error);
        return "An error occurred"; // Return a string indicating an error occurred
    }
}
