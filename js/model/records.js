import { DIMENSION_MAX, DIMENSION_MIN } from "./constantes.js";
import { guardar, leer } from "./almacen.js";

const CLAVE = "tablero:records";

/** Menor número de movimientos con que se ha completado cada dimensión. */
export class Records {
  #mejores = {};

  constructor() {
    const guardado = leer(CLAVE);
    for (let n = DIMENSION_MIN; n <= DIMENSION_MAX; n++) {
      if (Number.isInteger(guardado?.[n]) && guardado[n] > 0) this.#mejores[n] = guardado[n];
    }
  }

  /** Récord de la dimensión n, o null si aún no hay. */
  mejor(n) {
    return this.#mejores[n] ?? null;
  }

  /** Apunta una partida terminada; devuelve true si bate el récord. */
  registrar(n, movimientos) {
    const anterior = this.mejor(n);
    if (anterior !== null && movimientos >= anterior) return false;
    this.#mejores[n] = movimientos;
    guardar(CLAVE, this.#mejores);
    return true;
  }
}
