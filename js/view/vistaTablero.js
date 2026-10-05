// Vista del tablero. Usa data-* para localizar elementos (no clases) para que
// refactorizar CSS no rompa el JS.
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
    this.#tablero.addEventListener("keydown", (e) => this.#navegar(e));
  }

  // { n, tamano, fichas, filasCompletas, seleccionada?, pista?, bloqueado? }
  pintar({ n, tamano, fichas, filasCompletas, seleccionada = null, pista = [], bloqueado = false }) {
    const teniaFoco = this.#tablero.contains(document.activeElement);
    if (n !== this.#n) this.#foco = 0;
    this.#n = n;

    this.#tablero.style.setProperty("--n", n);
    this.#tablero.className = `tablero tablero--${tamano}`;
    this.#tablero.setAttribute("aria-label", `Tablero de ${n} por ${n}`);

    const filas = filasCompletas.map((completa, fila) => {
      const elemento = document.createElement("div");
      elemento.className = "tablero__fila";
      elemento.setAttribute("role", "row");
      elemento.setAttribute("aria-label", `Fila ${fila + 1}`);

      for (let columna = 0; columna < n; columna++) {
        const indice = fila * n + columna;
        elemento.append(
          this.#crearCelda(indice, fichas[indice], {
            seleccionada: indice === seleccionada,
            pista: pista.includes(indice),
            completa,
            bloqueado,
          }),
        );
      }
      elemento.append(crearMarcaFila(fila, completa));
      return elemento;
    });

    this.#tablero.replaceChildren(...filas);
    // cuando ganas, el tablero queda inert bajo la capa de victoria
    this.#tablero.inert = bloqueado;
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

  // Esc cancela la selección esté donde esté el foco (también en los botones del panel),
  // salvo dentro de la ventana de ayuda: ahí Esc solo la cierra.
  alCancelar(callback) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !e.target.closest?.("dialog")) callback();
    });
  }

  // flechas para mover el foco entre fichas, sin afectar al modelo
  #navegar(e) {
    const pasos = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    const ficha = e.target.closest("[data-ficha]");
    // Con Alt/Ctrl/Meta las flechas son atajos del navegador (p. ej. Alt+← = atrás).
    if (!ficha || !(e.key in pasos) || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const [df, dc] = pasos[e.key];
    const indice = Number(ficha.dataset.ficha);
    const fila = Math.min(this.#n - 1, Math.max(0, Math.floor(indice / this.#n) + df));
    const columna = Math.min(this.#n - 1, Math.max(0, (indice % this.#n) + dc));
    this.#fichaEn(fila * this.#n + columna)?.focus();
  }

  #crearCelda(indice, { aspecto, descripcion }, { seleccionada, pista, completa, bloqueado }) {
    const celda = document.createElement("div");
    celda.className = "celda";
    celda.classList.toggle("celda--seleccionada", seleccionada);
    celda.classList.toggle("celda--pista", pista);
    celda.classList.toggle("celda--completa", completa);
    celda.setAttribute("role", "gridcell");
    celda.dataset.celda = indice;

    const ficha = document.createElement("div");
    aplicarAspecto(ficha, aspecto);
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
    // el navegador toma la imagen de arrastre antes del siguiente fotograma:
    // esperamos un tick para que no capture la ficha ya atenuada
    setTimeout(() => {
      if (this.#origen !== ficha) return;
      ficha.classList.add("ficha--arrastrada");
      ficha.parentElement.classList.add("celda--origen");
    }, 0);
  }

  #sobrevolando(e) {
    // Solo se aceptan fichas de este tablero: el arrastre tiene que haber empezado aquí
    // (#origen) y traer nuestro formato (no textos, archivos ni datos de otras páginas).
    if (!this.#origen || !e.dataTransfer.types.includes(FORMATO)) return;
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
    const desdeEsteTablero = this.#origen !== null;
    this.#limpiarArrastre();
    if (!desdeEsteTablero) return;

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
  marca.setAttribute("role", "gridcell");
  marca.setAttribute("aria-label", `Fila ${fila + 1} ${completa ? "completa" : "incompleta"}`);
  marca.textContent = completa ? "✓" : "";
  return marca;
}
