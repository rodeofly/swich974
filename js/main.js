// main.js - Point d'entrée de l'application. Initialisation de Phaser.

// --- Configuration Globale de Phaser ---
const config = {
    type: Phaser.AUTO, 
    width: 800,
    height: 600,
    
    parent: 'game-container',
    
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 300 }, 
            debug: false 
        }
    },
    
    // MISE À JOUR : BootScene est la première lancée
    scene: [BootScene,
        MenuScene,
        FlappyScene, 
        FlappyBasicScene, 
        RunnerScene, 
        RunnerBasicScene, 
        ArkanoidScene,
        GameOfLifeScene,
        SuikaScene
    ]
};

// Démarrage du moteur Phaser avec la configuration
new Phaser.Game(config);