import { Configuracion } from "./model/configuracion.js";
import { Records } from "./model/records.js";
import { VistaTablero } from "./view/vistaTablero.js";
import { VistaControles } from "./view/vistaControles.js";
import { Controlador } from "./controller/controlador.js";

new Controlador(new Configuracion(), new Records(), new VistaTablero(), new VistaControles()).iniciar();
