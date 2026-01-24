import "./global.css";
import { Router } from "./lib/router.js";

import { RootLayout } from "./layouts/root/layout.js";
import { The404Page } from "./pages/404/page.js";
import { SvgDemo1Page } from "./pages/svg-final/page.js";
import { SvgDemo2Page } from "./pages/svg-demo2/page.js";
import { SvgDemo3Page } from "./pages/svg-demo3/page.js";
import { SvgDemo4Page } from "./pages/svg-demo4/page.js";
import { SvgDemo5Page } from "./pages/svg-demo5/page.js";

// On passe le 'base' défini dans vite.config.js au routeur
const router = new Router("app", { 
  base: import.meta.env.BASE_URL 
});

// Routes sans layout (plein écran)
router.addRoute("/", SvgDemo1Page);
router.addRoute("/svg-final", SvgDemo1Page);
router.addRoute("/svg-demo2", SvgDemo2Page);
router.addRoute("/svg-demo3", SvgDemo3Page);
router.addRoute("/svg-demo4", SvgDemo4Page);
router.addRoute("/svg-demo5", SvgDemo5Page);

router.addRoute("*", The404Page);

// Démarrer le routeur
router.start();
