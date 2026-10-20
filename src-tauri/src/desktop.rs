use crate::{computer, AppState};
use serde_json::{json, Value};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

pub fn stop(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let _ = computer::reset(&state);
    // Revocation is checked again between every native input operation.
    let _ = app.emit("workspace-updated", json!({"computerAccess":false}));
}
pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Open Benchhand", true, None::<&str>)?;
    let stop_item = MenuItem::with_id(app, "stop", "Stop computer control", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Benchhand", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &stop_item, &quit])?;
    let mut tray = TrayIconBuilder::with_id("teammate")
        .tooltip("Benchhand")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "stop" => stop(app),
            "quit" => {
                stop(app);
                app.exit(0);
            }
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    // A missing Linux status tray must not hide the only way to reopen the app.
    let tray_available = tray.build(app).is_ok();
    let shortcut = app
        .global_shortcut()
        .on_shortcut("Control+Alt+Escape", |app, _, event| {
            if event.state == ShortcutState::Pressed {
                stop(app);
            }
        })
        .is_ok();
    app.state::<AppState>().lock()?.execute(
        "INSERT OR REPLACE INTO preferences(key,value) VALUES('desktop_status',?1)",
        [json!({"tray":tray_available,"emergencyShortcut":shortcut}).to_string()],
    )?;
    if let Some(w) = app.get_webview_window("main") {
        let handle = app.handle().clone();
        w.on_window_event(move |event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if tray_available
                    && handle
                        .state::<AppState>()
                        .settings()
                        .is_ok_and(|s| s["runInBackground"] == true)
                {
                    api.prevent_close();
                    if let Some(w) = handle.get_webview_window("main") {
                        let _ = w.hide();
                    }
                } else {
                    stop(&handle);
                }
            }
        });
        if tray_available
            && std::env::args().any(|a| a == "--background")
            && app.state::<AppState>().settings()?["runInBackground"] == true
        {
            w.hide()?;
        }
    }
    Ok(())
}
#[tauri::command]
pub fn autostart_status(app: tauri::AppHandle) -> Result<Value, String> {
    Ok(
        json!({"enabled":app.autolaunch().is_enabled().map_err(crate::db_error)?,"desktop":app.state::<AppState>().lock()?.query_row("SELECT value FROM preferences WHERE key='desktop_status'",[],|r|r.get::<_,String>(0)).ok().and_then(|v|serde_json::from_str::<Value>(&v).ok()).unwrap_or(json!({}))}),
    )
}
#[tauri::command]
pub fn set_autostart(enabled: bool, app: tauri::AppHandle) -> Result<Value, String> {
    if enabled {
        app.autolaunch().enable()
    } else {
        app.autolaunch().disable()
    }
    .map_err(crate::db_error)?;
    autostart_status(app)
}
