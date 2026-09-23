// CONTROLADOR: recibe lo que hace el usuario en las vistas, lo traduce en operaciones
// sobre el modelo (partida y configuración) y decide qué deben mostrar las vistas.
// También guarda el estado de la interacción: ficha seleccionada y pista visible.
import { Partida } from "../model/partida.js";
import { COLORES, DIMENSION_MAX, DIMENSION_MIN, FORMAS } from "../model/configuracion.js";

export class Controlador {
  #configuracion;
  #tablero;
  #controles;
  #partida = null;
  #seleccionada = null;
  #pista = [];

  constructor(configuracion, vistaTablero, vistaControles) {
    this.#configuracion = configuracion;
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
    this.#tablero.alNavegar();
    this.#controles.alCambiarAjuste((cambio) => this.#cambiarAjuste(cambio));
    this.#controles.alPulsarAccion((accion) => this.#ejecutar(accion));

    this.#nuevaPartida("Nueva partida.");
  }

  #ejecutar(accion) {
    switch (accion) {
      case "nueva":
        this.#nuevaPartida("Nueva partida.");
        break;
      case "revancha":
        this.#nuevaPartida("Nueva partida.");
        this.#tablero.enfocar();
        break;
      case "pista":
        this.#mostrarPista();
        break;
      case "ayuda":
        this.#controles.abrirAyuda();
        break;
    }
  }

  // Cualquier cambio en el tablero o en las fichas empieza una partida nueva.
  #cambiarAjuste({ control, valor, tipo }) {
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
    // Se vuelve a mostrar todo: al repetir forma o color, otra ficha pudo cambiar la suya.
    this.#mostrarConfiguracion();
    this.#nuevaPartida("Configuración cambiada: nueva partida.");
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

    if (this.#seleccionada === null) {
      this.#seleccionada = indice;
      this.#pintar();
      this.#controles.anunciar(`Seleccionada: ${this.#describir(indice)}. Elige otra ficha para intercambiarlas.`);
    } else if (this.#seleccionada === indice) {
      this.#cancelarSeleccion();
    } else {
      this.#intercambiar(this.#seleccionada, indice);
    }
  }

  #cancelarSeleccion() {
    if (this.#seleccionada === null) return;
    this.#seleccionada = null;
    this.#pintar();
    this.#controles.anunciar("Selección cancelada.");
  }

  #intercambiar(origen, destino) {
    const antes = this.#partida.filasCompletas();
    const descripcion = `${this.#describir(origen)} por ${this.#describir(destino)}`;
    if (!this.#partida.intercambiar(origen, destino)) return;

    this.#seleccionada = null;
    this.#pista = [];
    this.#pintar([origen, destino]);

    if (this.#partida.terminada) {
      const movimientos = this.#partida.movimientos;
      const texto = `¡Tablero completado en ${movimientos} ${movimientos === 1 ? "movimiento" : "movimientos"}!`;
      this.#tablero.mostrarVictoria(texto);
      this.#controles.anunciar(texto);
      return;
    }

    const nuevas = this.#partida
      .filasCompletas()
      .flatMap((completa, fila) => (completa && !antes[fila] ? [fila + 1] : []));
    const logro = nuevas.length === 0 ? "" : ` ¡Fila ${nuevas.join(" y ")} completa!`;
    this.#controles.anunciar(`Intercambio: ${descripcion}.${logro}`);
  }

  #mostrarPista() {
    const pista = this.#partida.pista();
    if (!pista) return;
    this.#pista = pista;
    this.#seleccionada = null;
    this.#pintar();
    const [a, b] = pista;
    this.#controles.anunciar(`Pista: intercambia ${this.#describir(a)} por ${this.#describir(b)}.`);
  }

  #pintar(movidas = []) {
    const aspecto = this.#configuracion.aspecto;
    const descripciones = aspecto.map((_, tipo) => this.#configuracion.describir(tipo));
    const filasCompletas = this.#partida.filasCompletas();

    this.#tablero.pintar({
      n: this.#partida.n,
      tamano: this.#configuracion.tamano,
      fichas: this.#partida.celdas.map((tipo) => ({ aspecto: aspecto[tipo], descripcion: descripciones[tipo] })),
      filasCompletas,
      seleccionada: this.#seleccionada,
      pista: this.#pista,
      movidas,
      bloqueado: this.#partida.terminada,
    });
    this.#controles.mostrarMarcador({
      movimientos: this.#partida.movimientos,
      filasCompletas: filasCompletas.filter(Boolean).length,
      filas: this.#partida.n,
    });
  }

  #mostrarConfiguracion() {
    const { dimension, tamano, aspecto } = this.#configuracion;
    this.#controles.mostrarConfiguracion({ dimension, tamano, aspecto });
  }

  // P. ej. "círculo rojo (fila 2, columna 3)".
  #describir(indice) {
    const { fila, columna } = this.#partida.posicion(indice);
    return `${this.#configuracion.describir(this.#partida.tipoEn(indice))} (fila ${fila + 1}, columna ${columna + 1})`;
  }
}
