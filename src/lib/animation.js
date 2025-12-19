import { gsap } from "gsap";
import DrawSVGPlugin from "gsap/DrawSVGPlugin";
gsap.registerPlugin(DrawSVGPlugin);

let Animation = {};

Animation.rotateElement = function (element, duration = 1) {
  gsap.to(element, {
    rotation: "+=360",
    transformOrigin: "50% 50%",
    repeat: -1,
    ease: "linear",
    duration: duration,
  });
};

Animation.colorTransition = function (
  element,
  fromColor,
  toColor,
  duration = 1,
) {
  gsap.fromTo(
    element,
    { fill: fromColor },
    {
      fill: toColor,
      duration: duration,
      repeat: -1,
      yoyo: true,
      ease: "linear",
    },
  );
};

Animation.stretchElement = function (
  element,
  direction = "x",
  scale = 2,
  duration = 1,
) {
  const props = direction === "x" ? { scaleX: scale } : { scaleY: scale };
  gsap.to(element, {
    ...props,
    duration: duration,
    yoyo: true,
    repeat: -1,
    ease: "power1.inOut",
    transformOrigin: "50% 50%",
  });
};

Animation.drawLine = function (paths, fills, duration = 1) {
  gsap
    .timeline()
    .from(paths, {
      drawSVG: 0,
      duration: duration,
      ease: "power1.inOut",
      stagger: 0.1,
    })
    .from(
      fills,
      {
        opacity: 0,
        scale: 1.5,
        transformOrigin: "center center",
        duration: 0.8,
        ease: "elastic.out(2, 0.3)",
      },
      "-=1",
    );
};

Animation.bounce = function (element, duration = 1, height = 100) {
  gsap.to(element, {
    y: -height,
    duration: duration / 2,
    ease: "power1.out",
    yoyo: true,
    repeat: 1,
    transformOrigin: "50% 100%",
  });
};

Animation.progressBar = function (
  fillElement,
  valueElement,
  targetProgress = 0,
  duration = 1.2,
  delay = 0.2,
) {
  // Créer un objet pour animer le compteur
  const counter = { value: 100 };
  
  // Animation de la barre de progrès (démarre à 100% puis revient au pourcentage réel)
  gsap.fromTo(
    fillElement,
    { width: "100%" },
    {
      width: `${targetProgress}%`,
      duration: duration,
      ease: "power2.out",
      delay: delay,
    },
  );
  
  // Animation du texte du pourcentage synchronisée avec la barre
  gsap.fromTo(
    counter,
    { value: 100 },
    {
      value: targetProgress,
      duration: duration,
      ease: "power2.out",
      delay: delay,
      onUpdate: function () {
        valueElement.textContent = `${Math.round(counter.value)}%`;
      },
    },
  );
};

Animation.revealGraph = function (svgElement) {
  // Sélectionner tous les headers de compétences et les AC
  const headers = svgElement.querySelectorAll('path[id="Concevoir"], path[id="Developper"], path[id="Comprendre"], path[id="Exprimer"], path[id="Entreprendre"]');
  const allACs = svgElement.querySelectorAll('path[id^="AC"]');
  const acLabels = svgElement.querySelectorAll('.ac-label');
  const lines = svgElement.querySelectorAll('line');
  
  // Timeline principale avec defaults
  const tl = gsap.timeline({
    defaults: {
      ease: "power2.out"
    }
  });
  
  // 1. Faire apparaître les headers avec un effet de scale et d'opacité
  tl.from(headers, {
    scale: 0,
    opacity: 0,
    duration: 0.8,
    ease: "elastic.out(1, 0.5)",
    stagger: {
      amount: 0.5,
      from: "start"
    },
    transformOrigin: "center center"
  });
  
  // 2. Faire apparaître les lignes avec DrawSVG
  tl.from(lines, {
    drawSVG: "0%",
    opacity: 0,
    duration: 0.6,
    stagger: {
      amount: 0.3,
      from: "start"
    }
  }, "-=0.4");
  
  // 3. Faire apparaître les AC et leurs labels en cascade
  tl.from(allACs, {
    scale: 0,
    opacity: 0,
    duration: 0.5,
    ease: "back.out(1.7)",
    stagger: {
      amount: 1.5,
      from: "center",
      grid: "auto"
    },
    transformOrigin: "center center",
    clearProps: "opacity,transform"
  }, "-=0.3")
  .from(acLabels, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.out(1.7)",
    stagger: {
      amount: 1.5,
      from: "center",
      grid: "auto"
    },
    transformOrigin: "center center",
    clearProps: "opacity,transform"
  }, "<");
  
  // Animation permanente de vague sur les lignes (mouvement vertical)
  lines.forEach((line, index) => {
    gsap.to(line, {
      attr: { 
        y1: `+=${3 * Math.sin(index * 0.5)}`,
        y2: `+=${3 * Math.sin(index * 0.5 + Math.PI)}` 
      },
      duration: 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: index * 0.05
    });
  });
  
  return tl;
};

/**
 * Animation d'ouverture/fermeture d'un panneau latéral
 * @param {HTMLElement} panel - L'élément du panneau
 * @param {HTMLElement} overlay - L'overlay de fond
 * @param {boolean} isOpen - true pour ouvrir, false pour fermer
 */
Animation.slidePanel = function(panel, overlay, isOpen) {
  if (isOpen) {
    // Ouvrir
    const tl = gsap.timeline();
    tl.to(overlay, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })
    .to(panel, {
      x: 0,
      duration: 0.4,
      ease: "power3.out"
    }, "<0.1");
    return tl;
  } else {
    // Fermer - calculer la largeur du panneau + 2rem
    const panelWidth = panel.offsetWidth;
    const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const offsetX = panelWidth + (2 * remInPx);
    
    const tl = gsap.timeline();
    tl.to(panel, {
      x: offsetX,
      duration: 0.3,
      ease: "power2.in"
    })
    .to(overlay, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.out"
    }, "<0.1");
    return tl;
  }
};

/**
 * Animation d'apparition en cascade d'éléments
 * @param {HTMLElement[]} elements - Tableau d'éléments à animer
 * @param {number} staggerDelay - Délai entre chaque élément (default: 0.05)
 */
Animation.staggerFadeIn = function(elements, staggerDelay = 0.05) {
  gsap.from(elements, {
    opacity: 0,
    x: 20,
    duration: 0.3,
    stagger: staggerDelay,
    ease: "power2.out",
    clearProps: "opacity,x" // Nettoie les propriétés après animation
  });
};

export { Animation };
