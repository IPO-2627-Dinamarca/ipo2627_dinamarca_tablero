import { $, $$, aplicarAspecto } from "./dom.js";
import { NOMBRES_COLOR, NOMBRES_FORMA, capitalizar } from "./textos.js";

// Con las flechas, desplegables y radios cambian en cada pulsación: se espera a que paren.
const ESPERA_AJUSTE = 400;

/** Ajustes, acciones, marcador, mensajes de estado y diálogos. */
export class VistaControles {
  #ajustes = $('[data-vista="ajustes"]');
  #dimension = $('[data-control="dimension"]');
  #acciones = $('[data-vista="acciones"]');
  #deshacer = $('[data-accion="deshacer"]');
  #movimientos = $('[data-vista="movimientos"]');
  #filas = $('[data-vista="filas"]');
  #mensaje = $('[data-vista="mensaje"]');
  #ayuda = $('[data-vista="ayuda"]');
  #confirmacion = $('[data-vista="confirmacion"]');
  #pregunta = $('[data-vista="pregunta"]');
  #turnoMensaje = 0;

  constructor() {
    // El formulario solo agrupa controles; no se envía.
    this.#ajustes.addEventListener("submit", (e) => e.preventDefault());
  }

  /** Rellena los desplegables con las opciones del modelo. */
  prepararOpciones({ dimensiones, formas, colores }) {
    this.#dimension.replaceChildren(...dimensiones.map((n) => crearOpcion(n, `${n} × ${n}`)));
    $$('[data-control="forma"]').forEach((lista) =>
      lista.replaceChildren(...formas.map((forma) => crearOpcion(forma, capitalizar(NOMBRES_FORMA[forma])))),
    );
    $$('[data-control="color"]').forEach((lista) =>
      lista.replaceChildren(...colores.map((color) => crearOpcion(color, capitalizar(NOMBRES_COLOR[color])))),
    );
  }

  mostrarConfiguracion({ dimension, tamano, aspecto }) {
    this.#dimension.value = String(dimension);
    $$('[data-control="tamano"]').forEach((opcion) => {
      opcion.checked = opcion.value === tamano;
    });
    aspecto.forEach((ficha, tipo) => {
      $(`[data-control="forma"][data-tipo="${tipo}"]`).value = ficha.forma;
      $(`[data-control="color"][data-tipo="${tipo}"]`).value = ficha.color;
      aplicarAspecto($(`[data-vista="muestra"][data-tipo="${tipo}"]`), ficha, "ficha--muestra");
    });
  }

  mostrarMarcador({ movimientos, filasCompletas, filas, puedeDeshacer }) {
    // Sin aria-live: el cambio ya lo anuncia el mensaje de estado.
    this.#movimientos.textContent = movimientos;
    this.#filas.textContent = `${filasCompletas} / ${filas}`;
    // aria-disabled y no disabled, para no perder el foco al vaciar la pila
    this.#deshacer.setAttribute("aria-disabled", String(!puedeDeshacer));
  }

  /** Muestra el texto en la región de estado, que leen los lectores de pantalla. */
  anunciar(texto) {
    const turno = ++this.#turnoMensaje;
    if (this.#mensaje.textContent !== texto) {
      this.#mensaje.textContent = texto;
      return;
    }
    // Mismo texto: se vacía y se repone para que se vuelva a anunciar.
    this.#mensaje.textContent = "";
    requestAnimationFrame(() => {
      if (turno === this.#turnoMensaje) this.#mensaje.textContent = texto;
    });
  }

  abrirAyuda() {
    this.#ayuda.showModal();
  }

  /** Pregunta antes de una acción destructiva; resuelve a true si se acepta. */
  confirmar(pregunta) {
    this.#pregunta.textContent = pregunta;
    this.#confirmacion.returnValue = "";
    this.#confirmacion.showModal();
    return new Promise((resolver) => {
      this.#confirmacion.addEventListener("close", () => resolver(this.#confirmacion.returnValue === "aceptar"), {
        once: true,
      });
    });
  }

  /** Avisa del último valor de un ajuste cuando se deja de cambiar o se sale del control. */
  alCambiarAjuste(callback) {
    let pendiente = null;
    let espera;
    const aplicar = () => {
      clearTimeout(espera);
      const cambio = pendiente;
      // Se vacía antes del aviso: la confirmación quita el foco y volvería a llamar aquí.
      pendiente = null;
      if (cambio) callback(cambio);
    };

    this.#ajustes.addEventListener("change", (e) => {
      const { control, tipo } = e.target.dataset;
      if (!control) return;
      const cambio = { control, valor: e.target.value, tipo: tipo === undefined ? null : Number(tipo) };
      if (pendiente && (pendiente.control !== cambio.control || pendiente.tipo !== cambio.tipo)) aplicar();
      pendiente = cambio;
      clearTimeout(espera);
      espera = setTimeout(aplicar, ESPERA_AJUSTE);
    });
    // Salir del control aplica al momento, salvo al pasar a otro radio del mismo grupo.
    this.#ajustes.addEventListener("focusout", (e) => {
      const siguiente = e.relatedTarget;
      if (siguiente?.type === "radio" && siguiente.name === e.target.name) return;
      aplicar();
    });
  }

  /** Botones de la barra de acciones y Ctrl+Z (Cmd+Z) para deshacer. */
  alPulsarAccion(callback) {
    this.#acciones.addEventListener("click", (e) => {
      const boton = e.target.closest("[data-accion]");
      if (boton) callback(boton.dataset.accion);
    });
    document.addEventListener("keydown", (e) => {
      const atajo = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z";
      if (!atajo || e.target.closest?.("dialog")) return;
      e.preventDefault();
      callback("deshacer");
    });
  }
}

function crearOpcion(valor, texto) {
  const opcion = document.createElement("option");
  opcion.value = String(valor);
  opcion.textContent = texto;
  return opcion;
}
