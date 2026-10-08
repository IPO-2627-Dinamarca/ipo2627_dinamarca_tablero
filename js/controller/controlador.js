import { Partida } from "../model/partida.js";
import { COLORES, DIMENSION_MAX, DIMENSION_MIN, FORMAS } from "../model/constantes.js";

/** Coordina modelo y vistas, y guarda el estado de la interacción (selección y pista). */
export class Controlador {
  #configuracion;
  #records;
  #tablero;
  #controles;
  #partida = null;
  #seleccionada = null;
  #pista = [];

  constructor(configuracion, records, vistaTablero, vistaControles) {
    this.#configuracion = configuracion;
    this.#records = records;
    this.#tablero = vistaTablero;
    this.#controles = vistaControles;
  }

  iniciar() {
    const dimensiones = Array.from({ length: DIMENSION_MAX - DIMENSION_MIN + 1 }, (_, i) => DIMENSION_MIN + i);
    this.#controles.prepararOpciones({ dimensiones, formas: FORMAS, colores: COLORES });
    this.#mostrarConfiguracion();

    this.#tablero.alSeleccionar((indice) => this.#seleccionar(indice));
    this.#tablero.alIntercambiar((origen, destino) => this.#intercambiar(origen, destino));
    this.#tablero.alCancelar(() => this.#cancelarSeleccion());
    this.#tablero.alRevancha(() => {
      this.#nuevaPartida("Nueva partida.");
      this.#tablero.enfocar();
    });
    this.#controles.alCambiarAjuste((cambio) => this.#cambiarAjuste(cambio));
    this.#controles.alPulsarAccion((accion) => this.#ejecutar(accion));

    this.#nuevaPartida("Nueva partida.");
  }

  async #ejecutar(accion) {
    switch (accion) {
      case "nueva":
        if (await this.#confirmarAbandono()) this.#nuevaPartida("Nueva partida.");
        break;
      case "deshacer":
        this.#deshacer();
        break;
      case "pista":
        this.#mostrarPista();
        break;
      case "ayuda":
        this.#controles.abrirAyuda();
        break;
    }
  }

  async #cambiarAjuste({ control, valor, tipo }) {
    if (!this.#cambiaAlgo(control, valor, tipo)) return;
    if (!(await this.#confirmarAbandono())) {
      this.#mostrarConfiguracion(); // devuelve el control a su valor
      return;
    }
    switch (control) {
      case "dimension":
        this.#configuracion.dimension = valor;
        break;
      case "tamano":
        this.#configuracion.tamano = valor;
        break;
      case "forma":
        this.#configuracion.cambiarForma(tipo, valor);
        break;
      case "color":
        this.#configuracion.cambiarColor(tipo, valor);
        break;
      default:
        return;
    }
    // Al repetir forma o color, otra ficha también cambia la suya.
    this.#mostrarConfiguracion();
    this.#nuevaPartida("Configuración cambiada: nueva partida.");
  }

  // Un desplegable que vuelve a su valor (5 → 6 → 5) no es un cambio.
  #cambiaAlgo(control, valor, tipo) {
    const { dimension, tamano, aspecto } = this.#configuracion;
    switch (control) {
      case "dimension":
        return Number(valor) !== dimension;
      case "tamano":
        return valor !== tamano;
      case "forma":
      case "color":
        return aspecto[tipo]?.[control] !== valor;
      default:
        return false;
    }
  }

  // true si no hay nada que perder o el jugador acepta abandonar la partida.
  async #confirmarAbandono() {
    const { movimientos, terminada } = this.#partida;
    if (movimientos === 0 || terminada) return true;
    const acepta = await this.#controles.confirmar(
      `Llevas ${contarMovimientos(movimientos)} en esta partida y se perderán si empiezas otra.`,
    );
    if (!acepta) this.#controles.anunciar("Sigues con la partida actual.");
    return acepta;
  }

  #nuevaPartida(motivo) {
    this.#partida = new Partida(this.#configuracion.dimension);
    this.#seleccionada = null;
    this.#pista = [];
    this.#tablero.ocultarVictoria();
    this.#pintar();
    const n = this.#partida.n;
    this.#controles.anunciar(`${motivo} Tablero de ${n} × ${n}: deja cada fila con fichas de un solo tipo.`);
  }

  #seleccionar(indice) {
    if (this.#partida.terminada) return;
    const actual = this.#seleccionada;
    if (actual === indice) return this.#cancelarSeleccion();
    if (actual !== null && !this.#partida.mismoTipo(actual, indice)) return this.#intercambiar(actual, indice);

    // Primera selección, o la selección pasa a otra ficha del mismo tipo.
    this.#seleccionada = indice;
    const otra = this.#pista.includes(indice) ? this.#pista.find((i) => i !== indice) : null;
    if (otra === null) this.#pista = [];
    this.#pintar();
    const siguiente = otra === null ? "Elige otra de distinto tipo." : `La pista la cambia por ${this.#describir(otra)}.`;
    this.#controles.anunciar(`Seleccionada: ${this.#describir(indice)}. ${siguiente}`);
  }

  #cancelarSeleccion() {
    if (this.#seleccionada === null) return;
    this.#seleccionada = null;
    this.#pista = [];
    this.#pintar();
    this.#controles.anunciar("Selección cancelada.");
  }

  #intercambiar(origen, destino) {
    const antes = this.#partida.filasCompletas();
    const descripcion = `${this.#describir(origen)} por ${this.#describir(destino)}`;
    if (!this.#partida.intercambiar(origen, destino)) return;

    const filasNuevas = this.#partida
      .filasCompletas()
      .flatMap((completa, fila) => (completa && !antes[fila] ? [fila] : []));
    this.#seleccionada = null;
    this.#pista = [];
    this.#pintar({ intercambio: [origen, destino], filasNuevas });

    if (this.#partida.terminada) return this.#celebrar();
    const logro = filasNuevas.length === 0 ? "" : ` ¡Fila ${filasNuevas.map((f) => f + 1).join(" y ")} completa!`;
    this.#controles.anunciar(`Intercambio: ${descripcion}.${logro}`);
  }

  #deshacer() {
    const par = this.#partida.deshacer();
    if (!par) {
      this.#controles.anunciar(this.#partida.terminada ? "La partida ya está terminada." : "No hay movimientos que deshacer.");
      return;
    }
    this.#seleccionada = null;
    this.#pista = [];
    this.#pintar({ intercambio: par });
    const [a, b] = par;
    this.#controles.anunciar(`Deshecho: ${this.#describir(a)} y ${this.#describir(b)} vuelven a su sitio.`);
  }

  #celebrar() {
    const { n, movimientos } = this.#partida;
    const nuevo = this.#records.registrar(n, movimientos);
    const record = nuevo
      ? `Nuevo récord en ${n} × ${n}.`
      : `Tu récord en ${n} × ${n} es de ${contarMovimientos(this.#records.mejor(n))}.`;
    this.#tablero.mostrarVictoria(`En ${contarMovimientos(movimientos)}.`, record);
    this.#controles.anunciar(`¡Tablero completado en ${contarMovimientos(movimientos)}! ${record}`);
  }

  #mostrarPista() {
    const pista = this.#partida.pista();
    if (!pista) {
      this.#controles.anunciar("La partida ya está terminada: pulsa «Nueva partida» para jugar otra.");
      return;
    }
    this.#pista = pista;
    this.#seleccionada = null;
    this.#pintar();
    const [a, b] = pista;
    this.#controles.anunciar(`Pista: intercambia ${this.#describir(a)} por ${this.#describir(b)}.`);
  }

  #pintar({ intercambio = null, filasNuevas = [] } = {}) {
    const aspecto = this.#configuracion.aspecto;
    const filasCompletas = this.#partida.filasCompletas();

    this.#tablero.pintar({
      n: this.#partida.n,
      tamano: this.#configuracion.tamano,
      fichas: this.#partida.celdas.map((tipo) => ({ tipo, aspecto: aspecto[tipo] })),
      filasCompletas,
      filasNuevas,
      seleccionada: this.#seleccionada,
      pista: this.#pista,
      intercambio,
      bloqueado: this.#partida.terminada,
    });
    this.#controles.mostrarMarcador({
      movimientos: this.#partida.movimientos,
      filasCompletas: filasCompletas.filter(Boolean).length,
      filas: this.#partida.n,
      puedeDeshacer: this.#partida.puedeDeshacer,
    });
  }

  #mostrarConfiguracion() {
    const { dimension, tamano, aspecto } = this.#configuracion;
    this.#controles.mostrarConfiguracion({ dimension, tamano, aspecto });
  }

  // P. ej. "círculo rojo (fila 2, columna 3)".
  #describir(indice) {
    const { fila, columna } = this.#partida.posicion(indice);
    const tipo = this.#partida.tipoEn(indice);
    return `${this.#tablero.nombre(this.#configuracion.aspecto[tipo])} (fila ${fila + 1}, columna ${columna + 1})`;
  }
}

function contarMovimientos(n) {
  return `${n} ${n === 1 ? "movimiento" : "movimientos"}`;
}
