// VISTA de los controles: panel de ajustes (dimensión, tamaño y aspecto de las fichas),
// botones de acción, marcador, mensajes de estado y ventana de ayuda.
// Los controles se localizan por atributos data-control / data-accion / data-vista.
import { aplicarAspecto } from "./ficha.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

export class VistaControles {
  #ajustes = $('[data-vista="ajustes"]');
  #dimension = $('[data-control="dimension"]');
  #movimientos = $('[data-vista="movimientos"]');
  #filas = $('[data-vista="filas"]');
  #mensaje = $('[data-vista="mensaje"]');
  #ayuda = $('[data-vista="ayuda"]');

  constructor() {
    // Los ajustes son un formulario solo para agrupar controles: nunca se envía.
    this.#ajustes.addEventListener("submit", (e) => e.preventDefault());
  }

  // Rellena las listas desplegables a partir de las opciones que define el modelo.
  prepararOpciones({ dimensiones, formas, colores }) {
    this.#dimension.replaceChildren(...dimensiones.map((n) => crearOpcion(n, `${n} × ${n}`)));
    $$('[data-control="forma"]').forEach((lista) =>
      lista.replaceChildren(...Object.entries(formas).map(([valor, texto]) => crearOpcion(valor, texto))),
    );
    $$('[data-control="color"]').forEach((lista) =>
      lista.replaceChildren(...Object.entries(colores).map(([valor, texto]) => crearOpcion(valor, texto))),
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

  mostrarMarcador({ movimientos, filasCompletas, filas }) {
    this.#movimientos.value = movimientos;
    this.#filas.value = `${filasCompletas} / ${filas}`;
  }

  // El mensaje está en una región aria-live: los lectores de pantalla lo anuncian.
  anunciar(texto) {
    this.#mensaje.textContent = texto;
  }

  abrirAyuda() {
    this.#ayuda.showModal();
  }

  alCambiarAjuste(callback) {
    this.#ajustes.addEventListener("change", (e) => {
      const { control, tipo } = e.target.dataset;
      if (control) callback({ control, valor: e.target.value, tipo: tipo === undefined ? null : Number(tipo) });
    });
  }

  alPulsarAccion(callback) {
    document.addEventListener("click", (e) => {
      const boton = e.target.closest("[data-accion]");
      if (boton) callback(boton.dataset.accion);
    });
  }
}

function crearOpcion(valor, texto) {
  const opcion = document.createElement("option");
  opcion.value = String(valor);
  opcion.textContent = texto;
  return opcion;
}
