import { StarView } from "@/ui/star/index.js";
import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";

import { Animation } from "@/lib/animation.js";

// CORRECTION : On importe le JSON directement au lieu de faire un fetch
import starsData from "@/data/stars.json";

let M = {};
// On assigne directement les données importées
M.starsData = starsData;

let C = {};

C.handler_clickStar = function(ev) {
  // On utilise closest pour gérer le clic même si on clique sur un enfant du SVG
  const starElement = ev.target.closest('[data-name="star"]');
  if (starElement) {
    Animation.bounce(starElement, 1.5, 50);
  }
};


C.init = function() {
  return V.init();
}

let V = {
  rootPage: null,
  stars: []
};

V.init = function(starsData = M.starsData) {
  V.rootPage = htmlToDOM(template);
  let container = document.createElement('div');

  for (let s of starsData) {
    const star = new StarView();
    star.setFillColor(s.fill);
    star.setStrokeColor(s.stroke);
    star.setTransformScale(s.scale);
    V.stars.push(star);
    container.appendChild(star.dom());
  }

  V.rootPage.querySelector('slot[name="svg"]').replaceWith(container);
  V.attachEvents();
  return V.rootPage;
};

V.attachEvents = function() {
  V.rootPage.addEventListener('click', C.handler_clickStar);
};

export function SvgDemo5Page() {
  return C.init();
};
