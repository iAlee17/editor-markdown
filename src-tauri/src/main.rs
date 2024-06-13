// impiedică fereastra de consolă suplimentară pe Windows în versiune, NU ELIMINA!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_pdf, read_resource])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn generate_pdf(landscape: bool, input: &str, output: &str) -> Result<String, ()> {
    // importa modulele necesare
    use html2pdf::html_to_pdf;
    use headless_chrome::types::PrintToPdfOptions;
    use headless_chrome::LaunchOptions;
    use std::path::PathBuf;
    use std::time::Duration;

    // convertim căile de intrare și ieșire în PathBuf
    let input_path: PathBuf = input.into();
    let output_path: PathBuf = output.into();

    // setam dimensiunea hârtiei la A4
    let size : f64 = 8.3;
    let size2 : f64 = 11.7;

    // setam opțiunile PDF, opțiunile de lansare și durata de așteptare
    // let pdf_options: PrintToPdfOptions = Default::default();
    let pdf_options: PrintToPdfOptions = PrintToPdfOptions {
        landscape: Some(landscape),
        display_header_footer: None,
        print_background: None,
        scale: None,
        paper_width: Some(size),
        paper_height: Some(size2),
        margin_top: None,
        margin_bottom: None,
        margin_left: None,
        margin_right: None,
        page_ranges: None,
        ignore_invalid_page_ranges: None,
        header_template: None,
        footer_template: None,
        prefer_css_page_size: None,
        transfer_mode: None,
    };
    let launch_options = LaunchOptions::default();
    let wait_duration = Some(Duration::from_secs(2));

    // genereaza PDF
    let result = html_to_pdf(input_path, output_path, pdf_options, launch_options, wait_duration);

    match result {
        Ok(()) => Ok("PDF generated successfully!".to_string()),
        // Imprimam eroarea dacă generația PDF eșuează
        Err(err) => {
            println!("Error: {}", err);
            Err(())
        }
    }
}

#[tauri::command]
fn read_resource(handle: tauri::AppHandle, name: String) -> String{
    use std::io::BufRead;
    let resource_path = handle.path_resolver()
        .resolve_resource(name)
        .expect("failed to resolve resource");

    let file = std::fs::File::open(&resource_path).unwrap();
    let reader = std::io::BufReader::new(file);
    // citim fișierul într-un string
    let css = reader.lines().collect::<Result<Vec<String>, _>>().unwrap().join("\n");
    css
}