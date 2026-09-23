// Punto de entrada: crea el modelo, las vistas y el controlador (MVC) y arranca la aplicación.
import { Configuracion } from "./model/configuracion.js";
import { VistaTablero } from "./view/vistaTablero.js";
import { VistaControles } from "./view/vistaControles.js";
import { Controlador } from "./controller/controlador.js";

new Controlador(new Configuracion(), new VistaTablero(), new VistaControles()).iniciar();
