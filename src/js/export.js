async function exportMain() {
    document.getElementById("file-dropdown").style.display = "none";

    let editor_value = editor.getValue();

    editor_value = editor_value.replace(/^\s*[\r\n]+/gm, "\n</br>");
    editor_value = editor_value.replace(/---\s*[\r\n]+/gm, "---");
    editor_value = editor_value.replace(
        /<\/br>\s*---\s*<\/br>/gm,
        "\n---\n",
    );

    let renderd = marked(editor_value);

    // Deschiderea link-urilor în browser
    renderd = renderd.replace(/<a/g, '<a target="_blank"');

    document.getElementById("preview").innerHTML = renderd;

    const css = await readCSS("css_themes/default.css");
    var preview = document.getElementById("preview");

    // Definirea de boilerplate HTML
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
    ${preview.outerHTML}
    </body>
    </html>
    `;

    html = html.replace("style=\"display: none;\"", "");

    // Stocam fișierul HTML în directorul temp
    saveTempDir(false, html);
}

async function saveTempDir(landscape, html) {
    try {
        const tempDirPath = await tempdir();
        let tempFilePath = `${tempDirPath}file.html`;

        // Deschidem un dialog de tip fișier
        const selection = save({
            filters: [
                {
                    extensions: ["pdf"],
                    name: "*",
                },
            ],
        });

        // Salvam fișierul HTML temporar
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
        };
        createDataFile();

        // Invoca funcția din main.rs
        await invoke("generate_pdf", {
            landscape: landscape,
            input: tempFilePath,
            output: await selection,
        })
            .then((_res) => {
                // afișeaza un pop-up timp de 3 secunde pentru a indica faptul că fișierul a fost exportat
                document.getElementById("popup").style.display = "block";
                document.getElementById("popup").style.opacity = "1";
                document.getElementById("popup").style.transition = "none";

                // asteapta o secunda
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
                console.error("Error:", err);
            });
    } catch (error) {
        console.error("Error:", error);
    }
}

async function readCSS(css_path, _callback) {
    try {
        const content = await invoke("read_resource", { name: css_path });
        return content; // Presupunând că conținutul este un string.
    } catch (error) {
        console.error("Error:", error);
        return "An error occurred";
    }
}
