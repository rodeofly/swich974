// js/main.js

// 1. On prépare la liste des scènes de base
const sceneList = [BootScene, MenuScene];

// 2. On ajoute dynamiquement les classes des jeux
GAMES_MANIFEST.forEach(game => {
    let sceneClass = null;

    // TENTATIVE DE RECUPERATION DE LA CLASSE
    try {
        // En JS moderne, les classes ne sont pas sur 'window', on doit évaluer le nom
        sceneClass = eval(game.className);
    } catch (e) {
        console.error(`[Main.js] Erreur : Impossible de trouver la classe "${game.className}". Vérifiez qu'elle est bien chargée.`);
    }

    if (sceneClass) {
        console.log(`[Main.js] Jeu chargé : ${game.title}`);
        sceneList.push(sceneClass);
    }
});

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: false },
        matter: { debug: false, gravity: { y: 1 } }
    },
    scene: sceneList 
};

new Phaser.Game(config);