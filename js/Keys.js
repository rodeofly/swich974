// js/Keys.js

const GAMES_MANIFEST = [
    // FLAPPY (Dossier dédié)
    { key: 'FLAPPY',       className: 'FlappyScene',       path: 'js/games/flappy/FlappyScene.js',       title: 'BIRDY 974' },
    { key: 'FLAPPY_BASIC', className: 'FlappyBasicScene',  path: 'js/games/flappy/FlappyBasicScene.js',  title: 'BIRDY (Dev)' },
    
    // RUNNER (Dossier dédié)
    { key: 'RUNNER',       className: 'RunnerScene',       path: 'js/games/runner/RunnerScene.js',       title: 'T-ZOURIT' },
    { key: 'RUNNER_BASIC', className: 'RunnerBasicScene',  path: 'js/games/runner/RunnerBasicScene.js',  title: 'RUNNER (Dev)' },
    
    // ARKANOID
    { key: 'ARKANOID',     className: 'ArkanoidScene',     path: 'js/games/arkanoid/ArkanoidScene.js',   title: 'BRIK BREAKER' },
    
    // LOGIC / PUZZLE (Regroupés pour l'exemple, ou tu peux faire un dossier par jeu)
    { key: 'LIFE',         className: 'GameOfLifeScene',   path: 'js/games/logic/GameOfLifeScene.js',    title: 'GENESIS' },
    { key: 'SUIKA',        className: 'SuikaScene',        path: 'js/games/logic/SuikaScene.js',         title: 'SUIKA FURY' },
    
    // LABS / PHYSIQUE
    { key: 'SPHERE',       className: 'SphereScene',       path: 'js/games/labs/SphereScene.js',         title: 'SPHERE BANG' },
    { key: 'PHOTON',       className: 'PhotonScene',       path: 'js/games/labs/PhotonScene.js',         title: 'PHOTON (Dev)' },
];

// 2. Génération automatique des clés (pour compatibilité avec ton code existant)
const SCENE_KEYS = {
    BOOT: 'BootScene',
    MENU: 'MenuScene',
};

// On injecte les clés des jeux automatiquement
GAMES_MANIFEST.forEach(game => {
    SCENE_KEYS[game.key] = game.className; // Ex: SCENE_KEYS.FLAPPY deviendra 'FlappyScene'
});

const ASSET_KEYS = {
    BIRD: 'bird',
    FLOOR: 'floor',
    CLICK_SFX: 'clickSfx',
    CONFIRM_SFX: 'confirmSfx'
};