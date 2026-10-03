# Proyecto Tablero

El proyecto consiste en una aplicación que implementa un juego de fichas dispuestas en un tablero.

# Objetivos

El proyecto será una aplicación web usando HTML, CSS y JS nativos, sin bibliotecas ni frameworks auxiliares.

Los objetivos del proyecto son: 
- Composición apoyándada en Flexbox & Grid
- Interacción mediante la API `Drag & Drop` (y `dataTransfer`) para el movimiento de fichas. 
- Selección desde JS de elementos HTML mediante atributos `data-*`
- Posicionamiento `position` para el diseño de la asistencia al usuario


# Descripción

El sistema interactúa con un único actor que es el usuario encargado de jugar al juego. 

El tablero donde se practica el juego es una estructura cuadrada NxN con N>=3. En cada celda del tablero se muestra una única ficha, teniendo en cuenta que existen 3 tipos de fichas distinguibles por su forma y color. 

El sistema permitirá al jugador realizar las siguientes acciones:
- Comenzar una nueva partida (tablero inicial)
- Cambiar la dimensión N (con N>=3) del tablero NxN 
- Cambiar el tamaño de las fichas, admitiendo tres magnitudes: pequeña, mediana y grande.
- Modificar el aspecto - forma y color - de las fichas. Por ejemplo: las fichas podrían ser círculos, cuadrados, triángulos, etc.
- Obtener información sobre la mecánica del juego. 


La modificación de las características del tablero o las fichas supondrá la creación de un nuevo tablero de partida. 

La mecánica del juego es la siguiente:
- Comienzo: el tablero de partida consiste en una distribución de fichas aleatorias teniendo en cuenta que las fichas seleccionadas permita que el juego pueda concluir.
- Movimiento: el jugador podrá intercambiar las fichas situadas en dos celdas. 
- Fin: el tablero se completa cuando cada una de las filas del tablero contiene fichas del mismo tipo.


# Diseño

- La aplicación deberá estar implementada siguiendo un patrón MVC (_Model-View-Controller_) con objeto de clarificar y diferenciar las distintas responsabilidades. 
- Tanto la distribución del código de los ficheros como la propia organización de los ficheros incluidos en la carpeta del proyecto deberán facilitar la comprensión y el mantenimiento de la solución aportada. 


## Interacción 

La implementación de la interacción estará guiada para favorecer la usabilidad de la aplicación.

# Buenas prácticas HTML/CSS/JS

- Vinculación moderna de los componentes HTML, CSS y JS
- Etiquetado HTML semántico y moderno. 
- Estrategia de selectores CSS mantenible.
- Selección de composiciones apropiadas (unidimensional, bidmiensional)
- Aplicación justificada del posicionamiento. 
- Separación clara y organizada de los distintos aspectos estilísticos considerados: diseño cromático, tipográfico y espacial. Y cada uno estará cimentado en una sólida estrategia:
  - diseño cromático: monocromático, triádico, complementario, etc.
  - diseño tipográfico: dos fuentes contrastadas, una única fuente con niveles distintos de realce, etc.
  - diseño espacial: selección de unidades de medida y contenedores, principios de diseño `Gestalt`, etc. 


# Solución

Hecha solo con HTML, CSS y JavaScript del navegador: sin bibliotecas, sin frameworks, sin fuentes externas y sin instalar nada. Para verla hay que servir la carpeta con cualquier servidor local (por ejemplo, Live Server), porque los módulos de JS no cargan abriendo el archivo con `file://`.

## Estructura

```
index.html                estructura semántica de la página
css/
  tokens.css              variables de diseño, en tres bloques: cromático, tipográfico y espacial
  base.css                reinicio mínimo y accesibilidad (foco visible, enlace de salto)
  layout.css              reparto de la página con Grid
  components.css          aspecto de cada componente (panel, tablero, celdas, fichas...)
js/
  main.js                 punto de entrada: une modelo, vistas y controlador
  model/                  MODELO: Partida y Configuracion
  view/                   VISTAS: VistaTablero, VistaControles y ficha.js (las únicas que tocan el DOM)
  controller/             CONTROLADOR: une eventos, modelo y vistas
```

## Arquitectura MVC

- **Modelo** (`js/model/`):
  - `Partida`: el tablero es un array de N×N tipos (0, 1 o 2), sin nada del DOM ni del aspecto. Genera el tablero inicial, intercambia fichas, cuenta movimientos, sabe qué filas están completas y calcula pistas.
  - `Configuracion`: dimensión N, tamaño de las fichas y aspecto (forma y color) de cada tipo. Se guarda en `localStorage` para recordarla entre visitas y se valida al leerla.
- **Vistas** (`js/view/`): `VistaTablero` pinta la rejilla y traduce el arrastre, los clics y el teclado en avisos al controlador; `VistaControles` gestiona el panel de ajustes, el marcador, los mensajes y la ventana de ayuda. No toman decisiones.
- **Controlador** (`js/controller/controlador.js`): guarda el estado de la interacción (ficha seleccionada y pista visible), aplica las reglas pidiéndoselo al modelo y dice a las vistas qué mostrar.
- HTML, CSS y JS se vinculan con `<link>` y `<script type="module">`; los módulos se cargan sin bloquear la página y cada archivo importa solo lo que necesita.

## Mecánica del juego

- **Comienzo**: el tablero siempre tiene solución. De cada tipo se ponen fichas justas para llenar filas enteras (un múltiplo de N) y las N filas se reparten entre los 3 tipos lo más equilibradamente posible. Después se barajan (Fisher-Yates) hasta que ninguna fila empiece ya completa.
- **Movimiento**: se intercambian dos fichas cualesquiera del tablero, estén donde estén. Si son del mismo tipo el intercambio no cambiaría nada, así que no se hace (ni cuenta como movimiento) y se avisa.
- **Fin**: cuando todas las filas tienen fichas de un único tipo aparece la capa de victoria con el número de movimientos.
- **Pista**: se calcula qué tipo debería acabar en cada fila (el reparto que deja más fichas ya en su sitio, por programación dinámica) y se propone un intercambio que coloque dos fichas a la vez o, si no lo hay, al menos una. Nunca mueve una ficha que ya está en su sitio, así que seguir las pistas siempre lleva a la solución.
- **Ajustes**: dimensión de 3×3 a 9×9 (el enunciado pide N ≥ 3; el tope de 9 mantiene las fichas a un tamaño que se puede pulsar), fichas pequeñas, medianas o grandes, y forma y color de cada tipo a elegir entre 6 formas y 6 colores. Si se elige una forma o un color que ya usa otro tipo, los dos se lo intercambian, así los tipos siempre se distinguen. Cualquier cambio empieza una partida nueva. La configuración se recuerda entre visitas (`localStorage`) y lo leído se valida contra listas cerradas, así que datos manipulados vuelven a los valores por defecto.

## Composición y posicionamiento

- **Grid** para lo bidimensional: la página (áreas con nombre: juego a la izquierda y panel a la derecha, y en pantallas estrechas una columna; en los dos casos en el orden del HTML, que es el del tabulador), el tablero (`repeat(var(--n), ...)` con N que llega desde JS) y las filas de aspecto del panel, cuyas columnas quedan alineadas entre filas.
- **Flexbox** para lo unidimensional: la cabecera, el panel y sus grupos de controles, las opciones de tamaño, el marcador, la capa de victoria y la ventana de ayuda.
- **`position`** solo para la asistencia al usuario, que se superpone sin mover nada: la marca `?`/`⇄` en la esquina de la celda (`::after` sobre la celda `relative`), la capa de victoria sobre el tablero (absoluta dentro del marco `relative`) y el enlace "Saltar al tablero".
- El área de juego es un contenedor de consulta (`container-type`): el lado de la celda es el del tamaño elegido, salvo que no quepa, y entonces se ajusta al ancho disponible (`cqi`). Así un 9×9 grande también cabe en el móvil. El panel también es contenedor de consulta: si es muy estrecho (320 px), la forma y el color de cada ficha se apilan para que no se recorten.

## Estilística

Las tres estrategias están separadas en tres bloques de `css/tokens.css`. Colores, fuentes, tamaños, pesos, interlineados y la escala de espacios salen de esas variables; solo quedan como valores propios algunas medidas de un único componente (por ejemplo, el tamaño mínimo del marco o de la marca de la celda).

- **Cromática**: interfaz **monocromática** en HSL (un único tono azul pizarra, `--matiz-interfaz`, del que salen fondos, textos, bordes y acento variando solo saturación y luminosidad), para que no compita con las fichas. Las fichas usan seis tonos repartidos cada 60° del círculo cromático a partir de `--matiz-fichas`; por defecto una **tríada** (rojo, verde y azul), todas con la misma saturación y luz (`--saturacion-fichas`, `--luz-fichas`) y con contraste de al menos 3:1 sobre su celda. El tablero es oscuro en ambos modos para que las fichas destaquen, y las ayudas sobre él son un azul muy claro. Modo claro/oscuro con `light-dark()`; textos con contraste AA y bordes de los controles a 3:1. Los radios usan `accent-color` para no salirse de la paleta.
- **Tipográfica · una única fuente con niveles de realce**: la fuente del sistema, con jerarquía por tamaño (cuatro valores de una escala de razón 1,25: 0,8 / 1 / 1,563 / 2,441 rem), grosor (400 / 600 / 800) y mayúsculas espaciadas en las etiquetas pequeñas. Cifras tabulares en el marcador.
- **Espacial**: unidades `rem` con una escala doble de espaciado (0,25 → 0,5 → 1 → 2), tres tamaños de celda en `rem` limitados por `cqi` y `ch` para el ancho de lectura de los mensajes. Gestalt: *proximidad* (las filas del tablero más separadas que las columnas, porque el juego va por filas; grupos de ajustes separados), *similitud* (mismo tipo = misma forma y color), *figura/fondo* (fichas claras sobre tablero oscuro) y *región común* (el marco del tablero y los paneles).

## Interacción y usabilidad

- **Drag & Drop**: se arrastra una ficha sobre otra. El origen viaja en `dataTransfer` (`application/json`); solo se aceptan fichas del propio tablero. Mientras se arrastra, la celda de origen queda con borde discontinuo y la ficha atenuada, y la de destino se resalta con ⇄.
- **Alternativa sin arrastrar**: clic en una ficha y después en otra (útil en móvil y con ratón de precisión baja).
- **Teclado**: flechas para moverse por el tablero (con Alt, Ctrl o Meta se dejan al navegador), Intro o Espacio para seleccionar y Esc para cancelar, esté donde esté el foco (menos en la ventana de ayuda, donde Esc solo la cierra). Solo una ficha está en el orden de tabulación (*roving tabindex*).
- **Ayudas**: ✓ al final de cada fila completa, fondo distinto en sus celdas, contador de movimientos y de filas completas, mensajes que explican cada acción, botón *Pista* (con una nota que explica qué hace) y ventana *Cómo se juega* (`<dialog>` nativo). Si se selecciona una de las dos fichas de la pista, la pista sigue marcada y el mensaje recuerda cuál es la otra. La ficha seleccionada lleva el anillo por dentro y el foco y la pista por fuera, para no confundirlos (si es de la pista, lleva los dos). La marca `?`/`⇄` se escala con la celda para no tapar fichas en tableros pequeños.
- **Accesibilidad**: `role="grid"`/`row`/`gridcell`, cada ficha con `aria-label` («triángulo azul, fila 2, columna 3») y `aria-pressed`, mensajes en una región `aria-live`, foco visible, enlace "Saltar al tablero" y los tipos se distinguen por forma además de por color. En modo de colores forzados (alto contraste) el tablero conserva los colores de las fichas. Al ganar, el tablero queda `inert` bajo la capa de victoria (fuera del tabulador). No hay animaciones. Las fichas son `div` con `role="button"` porque tienen que ser `draggable` y estar dentro de la rejilla (`gridcell`).

## Buenas prácticas

- **HTML semántico**: `header`, `main` (con un `h2` solo para lectores de pantalla), `aside` para el panel de partida y ajustes, que acompaña al juego, y `footer`; un único `h1`; ajustes en un `form` con `fieldset`/`legend` y `label`; marcador como lista de definiciones (`dl`); ayuda en `dialog`.
- **CSS mantenible**: un archivo por responsabilidad, cargados en orden (tokens → base → layout → componentes); los componentes se seleccionan por clase con nombres BEM (`bloque__elemento--modificador`), sin ids ni anidamientos, así la especificidad es baja y pareja. El único `!important` es el de `[hidden]`, comentado. Entre los recursos modernos destacan `:has()`, para dibujar el foco en la celda, y la consulta de contenedor del tablero.
- **JS ↔ DOM**: las vistas localizan los elementos por `data-vista`, `data-control`, `data-accion`, `data-celda` y `data-ficha`, no por clases de estilo, y los eventos se atienden por delegación en el tablero y en el documento (no hay un escuchador por ficha).
- **JS ↔ CSSOM**: el JS no escribe estilos sueltos. Solo fija la variable `--n` y elige clases modificadoras (tamaño, forma, color, estado); el CSS decide cómo se ve.
