async function exportMain() {
    document.getElementById("file-dropdown").style.display = "none";

    let editor_value = editor.getValue();

    // fixeaza o linie nouă pentru a fi mai intuitivă
    editor_value = editor_value.replace(/^\s*[\r\n]+/gm, "\n</br>");
    editor_value = editor_value.replace(/---\s*[\r\n]+/gm, "---");
    editor_value = editor_value.replace(
        /<\/br>\s*---\s*<\/br>/gm,
        "\n---\n",
    );

    let renderd = marked(editor_value);

    // fixeaza deschiderea link-urilor în program în locul browserului
    renderd = renderd.replace(/<a/g, '<a target="_blank"');

    document.getElementById("preview").innerHTML = renderd;

    // putem insera CSS scriind un fișier diferit în directorul temp și apoi făcând referire la acesta în fișierul HTML
    const css = await saveCSS("css_themes/default.css");

    // obtinem elementul de preview
    var preview = document.getElementById("preview");

    // definim HTML boilerplate
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

        // deschidem un dialog de fișier
        const selection = save({
            filters: [
                {
                    extensions: ["pdf"],
                    name: "*",
                },
            ],
        });

        // salvam fila HTML
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
        }; // o manipulare a erorilor plictisitoare
        createDataFile();

        // invoca comanda
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
                // arata erorile in consola
                console.error("Error:", err);
            });
    } catch (error) {
        // arata erorile in consola
        console.error("Error:", error);
    }
}

async function saveCSS(css_path, _callback) {
    try {
        const content = await invoke("read_resource", { name: css_path });
        return content; // presupunerea că conținutul este un string
    } catch (error) {
        // arata erorile in consola
        console.error("Error:", error);
        return "An error occurred"; // returneaza un string indicand o eroare
    }
}
