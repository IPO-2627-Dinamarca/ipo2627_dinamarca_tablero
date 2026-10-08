import { $, aplicarAspecto } from "./dom.js";
import { nombreFicha } from "./textos.js";

// Tipo MIME de los datos del arrastre.
const FORMATO = "application/json";

const conMovimiento = matchMedia("(prefers-reduced-motion: no-preference)");

/** Rejilla de juego: la pinta y traduce arrastre, clics y teclado en avisos al controlador. */
export class VistaTablero {
  #tablero = $('[data-vista="tablero"]');
  #victoria = $('[data-vista="victoria"]');
  #resumen = $('[data-vista="resumen-victoria"]');
  #record = $('[data-vista="record-victoria"]');
  #revancha = $('[data-accion="revancha"]');
  #n = 0;
  #foco = 0; // tabindex itinerante
  #origen = null; // celda que se está arrastrando
  #destino = null; // celda resaltada como destino
  #alElegir = () => {};
  #alSoltar = () => {};

  constructor() {
    this.#tablero.addEventListener("click", (e) => {
      const celda = e.target.closest("[data-celda]");
      if (celda) this.#alElegir(Number(celda.dataset.celda));
    });
    this.#tablero.addEventListener("dragstart", (e) => this.#comienzoArrastre(e));
    this.#tablero.addEventListener("dragenter", (e) => this.#sobrevolando(e));
    this.#tablero.addEventListener("dragover", (e) => this.#sobrevolando(e));
    this.#tablero.addEventListener("dragleave", (e) => this.#saliendo(e));
    this.#tablero.addEventListener("drop", (e) => this.#soltado(e));
    this.#tablero.addEventListener("dragend", () => this.#limpiarArrastre());
    this.#tablero.addEventListener("focusin", (e) => this.#recordarFoco(e));
    this.#tablero.addEventListener("keydown", (e) => this.#navegar(e));
  }

  /** Redibuja el tablero; si viene un intercambio, las dos fichas se desplazan a su nuevo sitio. */
  pintar(estado) {
    const par = estado.intercambio;
    const animar = par && conMovimiento.matches;
    const antes = animar ? par.map((indice) => this.#fichaEn(indice).getBoundingClientRect()) : [];
    this.#dibujar(estado);
    if (animar) this.#deslizar(par, antes);
  }

  /** Nombre visible de una ficha, p. ej. "triángulo azul". */
  nombre(aspecto) {
    return nombreFicha(aspecto);
  }

  mostrarVictoria(resumen, record) {
    this.#resumen.textContent = resumen;
    this.#record.textContent = record;
    this.#victoria.hidden = false;
    this.#revancha.focus();
  }

  ocultarVictoria() {
    this.#victoria.hidden = true;
  }

  enfocar() {
    this.#celdaEn(this.#foco)?.focus();
  }

  alSeleccionar(callback) {
    this.#alElegir = callback;
  }

  alIntercambiar(callback) {
    this.#alSoltar = callback;
  }

  // Esc cancela la selección desde cualquier sitio salvo los diálogos, donde solo los cierra.
  alCancelar(callback) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !e.target.closest?.("dialog")) callback();
    });
  }

  alRevancha(callback) {
    this.#revancha.addEventListener("click", () => callback());
  }

  // FLIP: cada ficha empieza donde estaba la otra y se desliza hasta su celda.
  // Web Animations no bloquea la entrada mientras dura, a diferencia de View Transitions.
  #deslizar([a, b], [desdeA, desdeB]) {
    const duracion = parseFloat(getComputedStyle(this.#tablero).getPropertyValue("--duracion-breve"));
    for (const [indice, desde] of [[a, desdeB], [b, desdeA]]) {
      const ficha = this.#fichaEn(indice);
      const hasta = ficha.getBoundingClientRect();
      const celda = ficha.parentElement;
      celda.classList.add("celda--viaje");
      const animacion = ficha.animate(
        [{ translate: `${desde.x - hasta.x}px ${desde.y - hasta.y}px` }, { translate: "0 0" }],
        { duration: duracion, easing: "ease-out" },
      );
      animacion.onfinish = () => celda.classList.remove("celda--viaje");
    }
  }

  #dibujar(estado) {
    const { n, tamano, fichas, filasCompletas, filasNuevas = [], seleccionada = null, pista = [], bloqueado = false } = estado;
    const teniaFoco = this.#tablero.contains(document.activeElement);
    if (n !== this.#n) this.#foco = 0;
    this.#n = n;

    this.#tablero.style.setProperty("--n", n);
    this.#tablero.className = `tablero tablero--${tamano}`;
    this.#tablero.setAttribute("aria-label", `Tablero de ${n} por ${n}`);
    const tipoSeleccionado = seleccionada === null ? null : fichas[seleccionada].tipo;

    const filas = filasCompletas.map((completa, fila) => {
      const elemento = document.createElement("div");
      elemento.className = "tablero__fila";
      elemento.classList.toggle("tablero__fila--completa", completa);
      elemento.classList.toggle("tablero__fila--nueva", filasNuevas.includes(fila));
      elemento.setAttribute("role", "row");

      for (let columna = 0; columna < n; columna++) {
        const indice = fila * n + columna;
        elemento.append(
          this.#crearCelda(indice, fichas[indice], {
            seleccionada: indice === seleccionada,
            igual: indice !== seleccionada && fichas[indice].tipo === tipoSeleccionado,
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
    // terminada la partida, queda inerte bajo la capa de victoria
    this.#tablero.inert = bloqueado;
    if (teniaFoco) this.enfocar();
  }

  #crearCelda(indice, { tipo, aspecto }, estado) {
    const celda = document.createElement("div");
    celda.className = "celda";
    for (const clase of ["seleccionada", "igual", "pista", "completa"]) {
      celda.classList.toggle(`celda--${clase}`, estado[clase]);
    }
    celda.setAttribute("role", "gridcell");
    celda.setAttribute("aria-selected", String(estado.seleccionada));
    celda.dataset.celda = indice;
    celda.dataset.tipo = tipo;
    celda.draggable = !estado.bloqueado;
    celda.tabIndex = indice === this.#foco ? 0 : -1;
    const fila = Math.floor(indice / this.#n) + 1;
    const columna = (indice % this.#n) + 1;
    celda.setAttribute("aria-label", `${nombreFicha(aspecto)}, fila ${fila}, columna ${columna}${estado.pista ? ", pista" : ""}`);

    const ficha = document.createElement("span");
    aplicarAspecto(ficha, aspecto);
    celda.append(ficha);
    return celda;
  }

  #celdaEn(indice) {
    return this.#tablero.querySelector(`[data-celda="${indice}"]`);
  }

  #fichaEn(indice) {
    return this.#celdaEn(indice).firstElementChild;
  }

  // Intro o Espacio eligen; flechas, Inicio/Fin de fila y Ctrl+Inicio/Fin del tablero mueven el foco.
  #navegar(e) {
    const celda = e.target.closest("[data-celda]");
    if (!celda || e.altKey || e.metaKey) return;
    const indice = Number(celda.dataset.celda);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.#alElegir(indice);
      return;
    }
    const n = this.#n;
    const fila = Math.floor(indice / n);
    const columna = indice % n;
    const destinos = {
      ArrowLeft: [fila, columna - 1],
      ArrowRight: [fila, columna + 1],
      ArrowUp: [fila - 1, columna],
      ArrowDown: [fila + 1, columna],
      Home: e.ctrlKey ? [0, 0] : [fila, 0],
      End: e.ctrlKey ? [n - 1, n - 1] : [fila, n - 1],
    };
    if (!Object.hasOwn(destinos, e.key) || (e.ctrlKey && e.key.startsWith("Arrow"))) return;
    e.preventDefault();
    const [f, c] = destinos[e.key].map((valor) => Math.min(n - 1, Math.max(0, valor)));
    this.#celdaEn(f * n + c).focus();
  }

  #recordarFoco(e) {
    const celda = e.target.closest("[data-celda]");
    if (!celda) return;
    this.#celdaEn(this.#foco)?.setAttribute("tabindex", "-1");
    this.#foco = Number(celda.dataset.celda);
    celda.tabIndex = 0;
  }

  #comienzoArrastre(e) {
    const celda = e.target.closest?.("[data-celda]");
    if (!celda) return;
    this.#origen = celda;
    const ficha = celda.firstElementChild;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(FORMATO, JSON.stringify({ origen: Number(celda.dataset.celda) }));
    e.dataTransfer.setDragImage(ficha, ficha.offsetWidth / 2, ficha.offsetHeight / 2);

    // Se aplaza para que la imagen de arrastre no salga atenuada.
    setTimeout(() => {
      if (this.#origen === celda) celda.classList.add("celda--origen");
    }, 0);
  }

  // dragenter y dragover: solo se acepta soltar sobre una ficha de otro tipo de este tablero.
  #sobrevolando(e) {
    const celda = e.target.closest?.("[data-celda]");
    const valida =
      this.#origen &&
      e.dataTransfer.types.includes(FORMATO) &&
      celda &&
      celda !== this.#origen &&
      celda.dataset.tipo !== this.#origen.dataset.tipo;
    if (!valida) return this.#resaltarDestino(null);

    e.preventDefault(); // sin esto no se dispara drop
    e.dataTransfer.dropEffect = "move";
    this.#resaltarDestino(celda);
  }

  #saliendo(e) {
    if (!this.#tablero.contains(e.relatedTarget)) this.#resaltarDestino(null);
  }

  #soltado(e) {
    e.preventDefault(); // evita que el navegador abra lo soltado
    const celda = e.target.closest?.("[data-celda]");
    const origen = this.#origen;
    this.#limpiarArrastre();
    if (!origen || !celda) return;

    let datos;
    try {
      datos = JSON.parse(e.dataTransfer.getData(FORMATO));
    } catch {
      return;
    }
    if (datos?.origen === Number(origen.dataset.celda)) this.#alSoltar(datos.origen, Number(celda.dataset.celda));
  }

  #resaltarDestino(celda) {
    if (celda === this.#destino) return;
    this.#destino?.classList.remove("celda--destino");
    celda?.classList.add("celda--destino");
    this.#destino = celda;
  }

  #limpiarArrastre() {
    this.#resaltarDestino(null);
    this.#origen?.classList.remove("celda--origen");
    this.#origen = null;
  }
}

// Última columna de la fila: marca ✓ si está completa.
function crearMarcaFila(fila, completa) {
  const marca = document.createElement("div");
  marca.className = "tablero__marca";
  marca.setAttribute("role", "gridcell");
  marca.setAttribute("aria-label", `Fila ${fila + 1} ${completa ? "completa" : "incompleta"}`);
  marca.textContent = completa ? "✓" : "";
  return marca;
}
