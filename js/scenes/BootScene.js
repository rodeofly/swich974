// BootScene.js - Première scène lancée. Gère le préchargement global des assets.

class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.BOOT);
    }

    preload() {
        // --- 1. Chargement des Assets Globaux ---
        
        // Image du joueur Flappy
        this.load.image(ASSET_KEYS.BIRD, 'assets/flappy_sprite.png'); 
        
        // Chargement des sons
        // NOTE: Howler.js n'est pas utilisé ici, nous utilisons l'API native de Phaser comme dans votre code.
        this.load.audio(ASSET_KEYS.CLICK_SFX, ['assets/audio/click.mp3']); 
        this.load.audio(ASSET_KEYS.CONFIRM_SFX, ['assets/audio/confirm.mp3']);

        // --- 2. Affichage d'une barre de progression (Le "WOW" visuel) ---

        // Textes de chargement
        const loadingText = this.add.text(400, 300, 'CHARGEMENT SWICH974...', { fontSize: '32px', fill: '#00FF00' }).setOrigin(0.5);
        const percentText = this.add.text(400, 350, '0%', { fontSize: '24px', fill: '#FFFFFF' }).setOrigin(0.5);

        // Conteneur de la barre
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        // Écouteur de l'événement de progression
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00FF00, 1);
            // La barre grandit de gauche à droite
            progressBar.fillRect(250, 280, 300 * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });
        
        // Écouteur de l'événement de fin de chargement (pour nettoyer l'écran)
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
    }

    create() {
        // CORRECTION: Ajouter cette vérification pour débloquer l'audio
        if (this.sys.game.sound.locked) {
            // Si l'audio est bloqué, nous affichons un message et attendons un clic
            const unlockText = this.add.text(400, 450, 'Cliquez pour Démarrer l\'Audio', { fontSize: '18px', fill: '#FF0000' }).setOrigin(0.5);
            
            this.input.once('pointerdown', () => {
                this.scene.start(SCENE_KEYS.MENU);
                unlockText.destroy();
            });
        } else {
            // Si l'audio n'est pas bloqué (par exemple, après un redémarrage)
            this.scene.start(SCENE_KEYS.MENU);
        }
    }
}