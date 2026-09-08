/* =====================================================
   🌙 NOCTURNE ENGINE — 2D RENDERER
   ===================================================== */

  

function isAuraEnabled() {
  return localStorage.getItem("orbAuraEnabled") === "true";
}

   const isMobile = window.innerWidth <= 768;


import { State } from "./states.js";

export const Renderer = {

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    },

    clear() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawImage(img, x, y, w, h) {
        this.ctx.drawImage(img, x, y, w, h);
    },

     
    renderFrame() {
        if (!State.isLoaded) return;

        this.clear();

       
    
        // Affiche fond
        if (State.assets.backgroundImg)
            this.drawImage(State.assets.backgroundImg, 0, 0, this.canvas.width, this.canvas.height);

       


      if (orb.isEquipped && auraImg) {
  this.ctx.save();
  this.ctx.globalAlpha = 1;
  this.ctx.fillStyle = "red";
  this.ctx.fillRect(0, 0, 200, 200);
  this.ctx.restore();
}




         // Affiche mascotte (gameplay)
if (State.assets.mascotteImg) {

    let mascotBaseSize = 200;

// 🌟 bonus taille si mascotte spéciale
if (window.equippedMascotte === "futuriste_defense") {
    mascotBaseSize = 240; // + gros, plus héroïque
}

if (window.equippedMascotte === "boss") {
    mascotBaseSize = 280;
}

const mascotSize = isMobile ? mascotBaseSize * 1.5 : mascotBaseSize;

    this.drawImage(
        State.assets.mascotteImg,
        20,
        this.canvas.height - mascotSize - 50,
        mascotSize,
        mascotSize
    );
}



        requestAnimationFrame(() => this.renderFrame());
    }

};
