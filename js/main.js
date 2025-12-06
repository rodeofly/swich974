// main.js - Point d'entrée de l'application. Initialisation de Phaser.

// --- Configuration Globale de Phaser ---
const config = {
    type: Phaser.AUTO, 
    width: 800,
    height: 600,
    parent: 'game-container',
    
    // On garde Arcade par défaut pour tes autres jeux
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 300 }, 
            debug: false 
        },
        // On ajoute la config Matter pour la nouvelle scène
        matter: {
            debug: false,
            gravity: { y: 1 } // Gravité un peu plus réaliste pour Matter
        }
    },
    
    scene: [BootScene, MenuScene, FlappyScene, FlappyBasicScene, RunnerScene, RunnerBasicScene, ArkanoidScene, GameOfLifeScene, SuikaScene, SphereScene] // Ajoute SphereScene ici
};

// Démarrage du moteur Phaser avec la configuration
new Phaser.Game(config);