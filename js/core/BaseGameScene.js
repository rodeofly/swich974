// BaseGameScene.js - Classe parente pour la réutilisation de code

class BaseGameScene extends Phaser.Scene {
    
    // Fonction commune pour revenir au menu
    endGame() {
        console.log(`[SWICH974] Retour Menu depuis: ${this.scene.key}`);
        this.scene.start(SCENE_KEYS.MENU);
    }

    // NOUVEAU : Fonction commune pour créer le bouton UI
    createBackButton() {
        // Fond du bouton (Couleur selon la scène ou Rouge par défaut)
        // On peut passer une couleur en paramètre si on veut peaufiner plus tard
        const color = (this.scene.key === SCENE_KEYS.RUNNER) ? 0xFF0055 : 0xFF0000;
        
        const bg = this.add.rectangle(0, 0, 100, 40, color)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const text = this.add.text(0, 0, "MENU", { 
            fontSize: '18px', 
            fill: '#FFFFFF', 
            fontWeight: 'bold' 
        }).setOrigin(0.5);

        // Positionné en haut à droite
        const buttonContainer = this.add.container(740, 30, [bg, text]);
        
        // Interaction
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
            // Petite animation de clic
            this.tweens.add({
                targets: buttonContainer,
                scale: 0.9,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    this.endGame();
                }
            });
        });

        buttonContainer.setDepth(100); // Toujours au-dessus
        return buttonContainer; // On le retourne au cas où la scène veut le manipuler
    }
}