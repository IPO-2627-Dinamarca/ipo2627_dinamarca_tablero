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

La aplicación usa solo HTML, CSS y JavaScript del navegador. Para probarla hay que servir la carpeta con un servidor local (Live Server, `python3 -m http.server`...), porque los módulos de JS no cargan si se abre el archivo directamente.

## Estructura

```
index.html                estructura de la página y los dos diálogos
img/favicon.svg           icono: tres filas, cada una de un tipo
css/
  tokens.css              orden de capas, propiedades registradas y variables (cromático, tipográfico, espacial)
  base.css                reinicio, foco visible, enlace de salto y utilidades (hidden, solo-lector)
  layout.css              reparto de la página con Grid
  components.css          panel, barra de acciones, tablero, celdas, fichas, victoria y diálogos
js/
  main.js                 punto de entrada: crea modelo, vistas y controlador
  model/
    constantes.js         tipos, límites de dimensión y claves de tamaños, formas y colores
    partida.js            Partida y repartoOptimo (la pista)
    configuracion.js      ajustes validados y guardados
    records.js            mejor marca por dimensión
    almacen.js            lectura y escritura en localStorage
  view/
    dom.js                $, $$ y aplicarAspecto, compartidos por las vistas
    textos.js             nombres visibles de formas y colores
    vistaTablero.js       rejilla, arrastre, clics, teclado y capa de victoria
    vistaControles.js     ajustes, barra de acciones, marcador, mensajes y diálogos
  controller/
    controlador.js        estado de la interacción y reglas de cada acción
```

## Arquitectura MVC

`Partida` guarda el tablero como un array de N×N tipos (0, 1 o 2). Genera el reparto inicial, intercambia fichas, deshace con una pila de pares `[a, b]` (el número de movimientos es el tamaño de la pila), detecta las filas completas y calcula la pista. `Configuracion` guarda la dimensión, el tamaño y el aspecto de cada tipo con claves neutras (`circulo`, `tono-3`...), y `Records` guarda el menor número de movimientos de cada dimensión. Ninguna de las tres toca el DOM. Las dos últimas leen de `localStorage` y comprueban los datos contra listas cerradas; si algo no encaja, se usan los valores por defecto.

Las vistas son las únicas que tocan el DOM y avisan al controlador mediante callbacks (`alSeleccionar`, `alIntercambiar`, `alRevancha`, `alCambiarAjuste`, `alPulsarAccion`...). También ponen los nombres visibles de las fichas («estrella roja»), que están en `view/textos.js`. El controlador guarda la ficha seleccionada y la pista, pide los cambios al modelo y dice a cada vista qué mostrar. Cuando necesita el nombre de una ficha para un mensaje, se lo pide a la vista.

## Mecánica del juego

- Comienzo: de cada tipo hay fichas justas para llenar filas enteras (un múltiplo de N), y las N filas se reparten entre los tres tipos lo más igualadas posible. Se barajan con Fisher-Yates hasta que ninguna fila empiece completa, así que el tablero siempre tiene solución.
- Movimiento: se intercambian dos fichas de distinto tipo, estén donde estén. Cambiar dos iguales no serviría de nada, así que la interfaz no lo permite: no se puede soltar una ficha sobre otra igual, y si se pulsa una del mismo tipo que la seleccionada, la selección pasa a esa.
- Fin: cuando todas las filas tienen un único tipo aparece una tarjeta con los movimientos y el récord de esa dimensión.
- Ajustes: dimensión de 3×3 a 9×9 (con más, las celdas serían demasiado pequeñas en un móvil), fichas pequeñas, medianas o grandes, y forma y color de cada tipo entre seis formas y seis colores. Si se elige una forma o un color que ya tiene otro tipo, los dos se lo intercambian para que los tipos sigan distinguiéndose. Cualquier cambio empieza una partida nueva.

### Pista

Primero se decide qué tipo debe acabar en cada fila. De todos los repartos que respetan cuántas filas le tocan a cada tipo, `repartoOptimo` elige el que deja más fichas ya en su sitio. Lo resuelve con programación dinámica: el estado es la fila por la que va y cuántas filas le quedan a cada tipo, así que hay muy pocos estados incluso en un 9×9. Con ese reparto se busca un intercambio entre dos fichas mal colocadas que deje bien las dos a la vez; si no lo hay, uno que coloque al menos una.

La pista nunca mueve una ficha que ya está en su sitio. Por eso cada pista aumenta el número de fichas bien colocadas, y seguir las pistas siempre termina la partida.

## Composición y posicionamiento

- Grid para lo bidimensional: la página, con áreas con nombre (juego y ajustes en dos columnas, o en una sola en pantallas estrechas, siempre en el orden del HTML, que es también el del tabulador), el tablero, las filas de aspecto del panel y la barra de acciones cuando hay poco ancho (2 × 2).
- El tablero tiene N columnas entre dos medias columnas: la de la derecha es para la marca ✓ y la de la izquierda la equilibra (es el `::before` de cada fila), así las fichas quedan centradas. Cada fila usa `grid-template-columns: subgrid`, de modo que comparte las columnas del tablero y se puede pintar como una franja continua cuando está completa.
- Flexbox para lo unidimensional: cabecera, marcador, barra de acciones en pantalla ancha, control segmentado, tarjeta de victoria y diálogos.
- `position` para la asistencia al usuario, que se superpone sin desplazar nada: la insignia ⇄ en la esquina de las celdas de la pista o de destino (`::after` sobre la celda `relative`), la capa de victoria sobre el tablero (absoluta dentro del marco `relative`) y el enlace «Saltar al tablero». También la usa la utilidad `.solo-lector`, que oculta textos que solo deben leer los lectores de pantalla.
- El área de juego y el panel son contenedores de consulta con nombre (`container: juego / inline-size`). La celda mide lo que marca el tamaño elegido salvo que no quepa, y entonces se ajusta al ancho con `cqi`. Por eso en un móvil «mediana» y «grande» se ven iguales en tableros grandes: las dos llegan al máximo que permite el ancho.

## Estilística

Cada estrategia tiene su bloque en `css/tokens.css`, y el resto de hojas solo usa esas variables: colores, fuentes, escala tipográfica, espacios, radios, tamaños de celda, capas y duraciones.

### Cromática

Las variables llevan el nombre del esquema al que pertenecen, como se recomienda en teoría:

- `--mono-*`: la interfaz es monocromática. Todo sale de un único matiz azul pizarra (`--mono-matiz`) variando la saturación y la luminosidad en HSL: fondo, superficie, texto, bordes, acento, tablero y ayudas. Así no compite con las fichas. El modo claro y el oscuro se resuelven con `light-dark()`. Los textos cumplen el nivel AA de contraste y los bordes de los controles, 3:1. El tablero es oscuro en los dos modos para que las fichas destaquen (figura y fondo), y las ayudas sobre él son de un azul muy claro.
- `--hexa-1` a `--hexa-6`: las fichas siguen un esquema hexádico, seis matices repartidos cada 60° del círculo cromático. Por defecto se usan el 1, el 3 y el 5, que forman una tríada (rojo, verde y azul).

Las fichas se definen en `oklch`. En HSL, dos colores con la misma luminosidad no parecen igual de claros (un azul se ve bastante más oscuro que un ámbar); en `oklch` todas tienen la misma luz percibida y contrastan bien con cualquier fondo de celda. Si el navegador no admite `oklch`, se aplican los valores HSL de respaldo (`@supports`). Como las seis tienen la misma luz, quien no distinga bien los colores se guía por la forma, que es la que identifica el tipo; el color la refuerza.

### Tipográfica

Una sola fuente, la del sistema, con niveles de realce: tamaño, grosor (400, 600 y 800) y mayúsculas espaciadas en las etiquetas del marcador. Los tamaños salen de una escala modular calculada con `--razon: 1.25` y `pow()`; el título es fluido con `clamp()` entre dos pasos de la escala. Hay cifras tabulares en el marcador, `text-wrap: balance` en los títulos, `pretty` en los párrafos y unos 60 caracteres como ancho máximo de lectura.

### Espacial

Unidades `rem` con una escala doble de espaciado (0,5 → 1 → 2 rem) y radios concéntricos: el radio de un contenedor es el de su contenido más el relleno. En el tablero los huecos son proporcionales a la celda, y las filas están tres veces más separadas que las columnas porque el juego va por filas (proximidad). También se aplican la semejanza (mismo tipo, misma forma y color), la región común (la franja de una fila completa, el marco, el panel) y la figura y el fondo (fichas claras sobre tablero oscuro). Botones y controles miden al menos 44 px de alto para poder pulsarlos con el dedo.

## Interacción y usabilidad

- Arrastrar y soltar con la API nativa. En `dragstart` el índice de la celda de origen viaja en `dataTransfer` (`application/json`), y la imagen que se arrastra es la propia forma, centrada en el puntero (`setDragImage`). `dragenter` y `dragover` solo aceptan el soltado sobre una ficha de otro tipo del mismo tablero, así que el cursor ya indica dónde no se puede soltar. En `drop` se comprueba que el origen recibido coincide con la celda que empezó el arrastre. Mientras se arrastra, el origen queda con borde discontinuo y la ficha atenuada, y el destino con fondo claro, anillo e insignia ⇄.
- Toda la celda se puede pulsar y arrastrar. La forma se dibuja en un elemento interior que no recibe eventos, de modo que una estrella o un triángulo responden igual que un cuadrado (ley de Fitts).
- Clic o toque en una ficha y después en otra. Al seleccionar, la celda se oscurece con un anillo interior y la ficha crece, y las del mismo tipo se atenúan para que se vea con cuáles se puede cambiar. El foco del teclado es un anillo exterior, así que nunca se confunde con la selección.
- Teclado: flechas para moverse por el tablero, Inicio y Fin para ir al principio o al final de la fila, Ctrl+Inicio y Ctrl+Fin para las esquinas, Intro o Espacio para elegir, Esc para cancelar y Ctrl+Z (Cmd+Z en Mac) para deshacer. Con el tabulador se entra y se sale del tablero de una vez.
- Control y libertad: Deshacer revierte el último intercambio y se puede repetir hasta el principio de la partida. «Nueva partida» y los cambios de ajustes piden confirmación en un `<dialog>` si hay movimientos, con el foco en «Seguir jugando»; si se cancela, el control vuelve a su valor. Los ajustes se aplican cuando se deja de cambiar el control o se sale de él, porque con las flechas un desplegable cambia de valor a cada pulsación y crearía partidas intermedias.
- Estado visible: marcador de movimientos y filas completas, ✓ y franja continua en las filas completas, un mensaje que explica cada acción y la barra de acciones justo debajo del tablero (en el móvil queda a la vista sin desplazarse y el panel solo tiene ajustes). Las instrucciones cambian con `@media (pointer: coarse)`: en pantallas táctiles solo explican cómo jugar tocando.
- Movimiento: si el sistema no pide reducir animaciones (`prefers-reduced-motion`), las dos fichas intercambiadas se deslizan hasta su nuevo sitio en 180 ms y una fila que se completa se ilumina un momento. El deslizamiento usa la técnica FLIP con la Web Animations API, que a diferencia de las View Transitions no bloquea los clics mientras dura.
- Victoria: una tarjeta sobre un velo ligero con los movimientos, el récord de la dimensión y el foco en «Jugar otra vez». En tableros medianos y grandes se sigue viendo el tablero resuelto alrededor; en un 3×3 pequeño la tarjeta lo tapa casi entero. El tablero queda inactivo (`inert`).
- Accesibilidad: el tablero tiene los roles `grid`, `row` y `gridcell`, y cada celda dice qué ficha tiene y dónde («triángulo azul, fila 2, columna 3») y si está seleccionada (`aria-selected`). Los mensajes se anuncian en una región `role="status"`. La ayuda es un `<dialog>` con botón de cerrar.

## Recursos de CSS

- Capas (`@layer tokens, base, layout, componentes, utilidades`), declaradas una sola vez: el orden de las capas decide qué regla gana, así que no hace falta ningún `!important`.
- Clases con nomenclatura BEM y sin ids; el anidamiento nativo solo se usa para los estados (`&:focus-visible`, `&.celda--seleccionada`), y todas las medidas usan propiedades lógicas (`inline-size`, `margin-inline`...).
- Los estados de la celda se combinan con dos variables, `--anillo-dentro` y `--anillo-fuera`, que una única regla `box-shadow` compone. Así una celda puede estar a la vez seleccionada y en la pista sin reglas especiales para cada combinación.
- `@property` registra `--n` como entero y `--celda` como longitud. El navegador descarta un valor de `--n` que no sea entero, y el tamaño de la celda se calcula en el tablero y se hereda ya resuelto.
- `forced-colors`: en el modo de alto contraste de Windows el tablero y las muestras conservan sus colores, porque el color de las fichas es información, y la opción marcada del control segmentado se pinta con el color de resaltado del sistema.
- `prefers-contrast: more`: si el usuario pide más contraste, los bordes toman el color del texto secundario y los anillos de foco y selección se engrosan.
- El *hover* solo existe en `(hover: hover)`, para que en pantallas táctiles no se quede marcado tras tocar.

## Buenas prácticas

- HTML semántico: `header`, `main` (con un `h2` solo para lectores de pantalla), `aside` para los ajustes y `footer`; un único `h1`; los ajustes en un `form` con `fieldset`, `legend` y `label`; el marcador como lista de definiciones; dos `dialog`; `theme-color` para modo claro y oscuro y un favicon SVG propio.
- JS y DOM: las vistas localizan los elementos por `data-vista`, `data-control`, `data-accion`, `data-celda` y `data-tipo` (las clases quedan para el estilo), y atienden los eventos por delegación en el tablero, el formulario y la barra de acciones.
- JS y estilos: el JS no escribe estilos sueltos. Solo fija `--n`, cambia clases modificadoras y lanza la animación del intercambio; colores y medidas vienen del CSS.
