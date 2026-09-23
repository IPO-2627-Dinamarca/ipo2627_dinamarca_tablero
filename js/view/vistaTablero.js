// VISTA del tablero: pinta la rejilla N×N y traduce lo que hace el usuario sobre ella
// (arrastrar y soltar, clic, teclado) en avisos al controlador.
// Los elementos se localizan por atributos data-* (data-vista, data-celda, data-ficha),
// no por clases de estilo, para que cambiar el CSS no rompa el JS.
// Los eventos se gestionan por delegación: un único gestor por tipo en el tablero.
import { aplicarAspecto } from "./ficha.js";

const $ = (selector) => document.querySelector(selector);

// Formato MIME con el que viaja en dataTransfer la celda de origen del arrastre.
const FORMATO = "application/json";

export class VistaTablero {
  #tablero = $('[data-vista="tablero"]');
  #victoria = $('[data-vista="victoria"]');
  #resumenVictoria = $('[data-vista="resumen-victoria"]');
  #n = 0;
  #foco = 0; // ficha que recibe el tabulador (tabindex "itinerante")
  #origen = null; // ficha que se está arrastrando
  #destino = null; // celda resaltada mientras se arrastra encima
  #alSoltar = () => {};

  constructor() {
    this.#tablero.addEventListener("dragstart", (e) => this.#comienzoArrastre(e));
    this.#tablero.addEventListener("dragover", (e) => this.#sobrevolando(e));
    this.#tablero.addEventListener("dragleave", (e) => this.#saliendo(e));
    this.#tablero.addEventListener("drop", (e) => this.#soltado(e));
    this.#tablero.addEventListener("dragend", () => this.#limpiarArrastre());
    this.#tablero.addEventListener("focusin", (e) => this.#recordarFoco(e));
  }

  // estado: { n, tamano, fichas: [{ aspecto, descripcion }], filasCompletas: [bool],
  //           seleccionada, pista: [a, b], movidas: [a, b], bloqueado }
  pintar({ n, tamano, fichas, filasCompletas, seleccionada = null, pista = [], movidas = [], bloqueado = false }) {
    const teniaFoco = this.#tablero.contains(document.activeElement);
    if (n !== this.#n) this.#foco = 0;
    this.#n = n;

    // Único estilo en línea: el número de columnas de la rejilla depende de N.
    this.#tablero.style.setProperty("--n", n);
    this.#tablero.className = `tablero tablero--${tamano}`;
    this.#tablero.setAttribute("aria-label", `Tablero de ${n} por ${n}`);

    const filas = filasCompletas.map((completa, fila) => {
      const elemento = document.createElement("div");
      elemento.className = "tablero__fila";
      elemento.setAttribute("role", "row");

      for (let columna = 0; columna < n; columna++) {
        const indice = fila * n + columna;
        elemento.append(
          this.#crearCelda(indice, fichas[indice], {
            seleccionada: indice === seleccionada,
            pista: pista.includes(indice),
            movida: movidas.includes(indice),
            completa,
            bloqueado,
          }),
        );
      }
      elemento.append(crearMarcaFila(fila, completa));
      return elemento;
    });

    this.#tablero.replaceChildren(...filas);
    if (teniaFoco) this.#fichaEn(this.#foco)?.focus();
  }

  mostrarVictoria(texto) {
    this.#resumenVictoria.textContent = texto;
    this.#victoria.hidden = false;
    this.#victoria.querySelector("[data-accion]").focus();
  }

  ocultarVictoria() {
    this.#victoria.hidden = true;
  }

  enfocar() {
    this.#fichaEn(this.#foco)?.focus();
  }

  alSeleccionar(callback) {
    this.#tablero.addEventListener("click", (e) => {
      const ficha = e.target.closest("[data-ficha]");
      if (ficha) callback(Number(ficha.dataset.ficha));
    });
    this.#tablero.addEventListener("keydown", (e) => {
      const ficha = e.target.closest("[data-ficha]");
      if (!ficha || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      callback(Number(ficha.dataset.ficha));
    });
  }

  alIntercambiar(callback) {
    this.#alSoltar = callback;
  }

  alCancelar(callback) {
    this.#tablero.addEventListener("keydown", (e) => {
      if (e.key === "Escape") callback();
    });
  }

  // Flechas: mueven el foco entre fichas sin salir del tablero.
  alNavegar() {
    const pasos = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    this.#tablero.addEventListener("keydown", (e) => {
      const ficha = e.target.closest("[data-ficha]");
      if (!ficha || !(e.key in pasos)) return;
      e.preventDefault();
      const [df, dc] = pasos[e.key];
      const indice = Number(ficha.dataset.ficha);
      const fila = Math.min(this.#n - 1, Math.max(0, Math.floor(indice / this.#n) + df));
      const columna = Math.min(this.#n - 1, Math.max(0, (indice % this.#n) + dc));
      this.#fichaEn(fila * this.#n + columna)?.focus();
    });
  }

  #crearCelda(indice, { aspecto, descripcion }, { seleccionada, pista, movida, completa, bloqueado }) {
    const celda = document.createElement("div");
    celda.className = "celda";
    celda.classList.toggle("celda--seleccionada", seleccionada);
    celda.classList.toggle("celda--pista", pista);
    celda.classList.toggle("celda--completa", completa);
    celda.setAttribute("role", "gridcell");
    celda.dataset.celda = indice;

    const ficha = document.createElement("div");
    aplicarAspecto(ficha, aspecto, movida && "ficha--movida");
    ficha.dataset.ficha = indice;
    ficha.draggable = !bloqueado;
    ficha.tabIndex = indice === this.#foco ? 0 : -1;
    ficha.setAttribute("role", "button");
    ficha.setAttribute("aria-pressed", String(seleccionada));
    const fila = Math.floor(indice / this.#n) + 1;
    const columna = (indice % this.#n) + 1;
    ficha.setAttribute("aria-label", `${descripcion}, fila ${fila}, columna ${columna}`);

    celda.append(ficha);
    return celda;
  }

  #fichaEn(indice) {
    return this.#tablero.querySelector(`[data-ficha="${indice}"]`);
  }

  #recordarFoco(e) {
    const ficha = e.target.closest("[data-ficha]");
    if (!ficha) return;
    this.#fichaEn(this.#foco)?.setAttribute("tabindex", "-1");
    this.#foco = Number(ficha.dataset.ficha);
    ficha.tabIndex = 0;
  }

  // --- Drag & Drop: dragstart → dragover (… dragleave) → drop | dragend ---

  #comienzoArrastre(e) {
    const ficha = e.target.closest?.("[data-ficha]");
    if (!ficha) return;
    this.#origen = ficha;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(FORMATO, JSON.stringify({ origen: Number(ficha.dataset.ficha) }));

    // El navegador captura la imagen de arrastre al acabar este gestor: las clases se
    // añaden en el siguiente fotograma para que la imagen muestre la ficha normal.
    requestAnimationFrame(() => {
      if (this.#origen !== ficha) return;
      ficha.classList.add("ficha--arrastrada");
      ficha.parentElement.classList.add("celda--origen");
    });
  }

  #sobrevolando(e) {
    // Solo se aceptan fichas del propio tablero (no textos, archivos, etc.).
    if (!e.dataTransfer.types.includes(FORMATO)) return;
    const celda = e.target.closest("[data-celda]");
    if (!celda) return this.#resaltarDestino(null);

    e.preventDefault(); // imprescindible para que se dispare "drop"
    e.dataTransfer.dropEffect = "move";
    this.#resaltarDestino(celda === this.#origen?.parentElement ? null : celda);
  }

  #saliendo(e) {
    if (!this.#tablero.contains(e.relatedTarget)) this.#resaltarDestino(null);
  }

  #soltado(e) {
    e.preventDefault(); // evita que el navegador intente abrir o navegar a lo soltado
    const celda = e.target.closest("[data-celda]");
    this.#limpiarArrastre();

    let datos;
    try {
      datos = JSON.parse(e.dataTransfer.getData(FORMATO));
    } catch {
      return;
    }
    if (celda && Number.isInteger(datos?.origen)) this.#alSoltar(datos.origen, Number(celda.dataset.celda));
  }

  #resaltarDestino(celda) {
    if (celda === this.#destino) return;
    this.#destino?.classList.remove("celda--destino");
    celda?.classList.add("celda--destino");
    this.#destino = celda;
  }

  #limpiarArrastre() {
    this.#resaltarDestino(null);
    this.#origen?.classList.remove("ficha--arrastrada");
    this.#origen?.parentElement?.classList.remove("celda--origen");
    this.#origen = null;
  }
}

// Última columna de cada fila: indica si la fila ya está completa.
function crearMarcaFila(fila, completa) {
  const marca = document.createElement("div");
  marca.className = "tablero__marca";
  marca.classList.toggle("tablero__marca--completa", completa);
  marca.setAttribute("role", "gridcell");
  marca.setAttribute("aria-label", `Fila ${fila + 1} ${completa ? "completa" : "incompleta"}`);
  marca.textContent = completa ? "✓" : "";
  return marca;
}
