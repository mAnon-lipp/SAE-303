import { GraphView } from "@/ui/Graph";
import { htmlToDOM } from "@/lib/utils.js";
import template from "./template.html?raw";

let C = {};


C.init = function() {
  return V.init();
}

let V = {
  rootPage: null,
  flowers: null
};

V.init = function() {
  V.rootPage = htmlToDOM(template);
  V.graph = new GraphView();
  V.rootPage.querySelector('slot[name="svg"]').replaceWith( V.graph.dom() );
  return V.rootPage;
};


export function SvgDemo1Page() {
  return C.init();
}