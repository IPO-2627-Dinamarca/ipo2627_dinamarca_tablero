/** Lee un objeto JSON de localStorage; si no hay o no se puede, devuelve {}. */
export function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? {};
  } catch {
    return {};
  }
}

/** Guarda un objeto en localStorage; sin almacenamiento, los datos duran solo la sesión. */
export function guardar(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch {
    // modo privado o cuota llena
  }
}
