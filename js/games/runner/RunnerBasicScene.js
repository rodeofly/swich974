// RunnerBasicScene.js - VERSION ÉDUCATIVE (Ultra-Commentée)
// Un jeu de course minimaliste pour apprendre : Sol, Gravité, Sauts conditionnels.

class RunnerBasicScene extends BaseGameScene {
    // Note : Pense à ajouter 'RunnerBasicScene' dans main.js et Keys.js si ce n'est pas fait !
    constructor() { super('RunnerBasicScene'); }

    // --- 1. INITIALISATION ---
    create() {
        // [IMPORTANT] Réveil du moteur physique
        // Si on vient d'un "Game Over", le temps est peut-être arrêté. On relance !
        this.physics.resume();

        // [IMPORTANT] Nettoyage des touches
        // On efface les anciens clics pour éviter les bugs au redémarrage
        this.input.keyboard.removeAllListeners();

        // Bouton Retour (Fonction incluse dans BaseGameScene)
        this.createBackButton();

        // --- A. LE DÉCOR (LE SOL) ---
        // Un rectangle statique en bas de l'écran (x=400, y=580)
        // 400 est le centre horizontal, 580 est proche du bas (600)
        this.sol = this.add.rectangle(400, 580, 800, 40, 0x00FF00); // Vert
        this.physics.add.existing(this.sol, true); // 'true' = Statique (Mur immobile)

        // --- B. LE JOUEUR (Un rond) ---
        this.joueur = this.add.circle(100, 450, 20, 0xFFFFFF); // Blanc
        this.physics.add.existing(this.joueur);
        
        this.joueur.body.setGravityY(1200); // Gravité forte pour qu'il retombe vite
        this.joueur.body.setCollideWorldBounds(true); // Ne sort pas de l'écran

        // --- C. LES OBSTACLES (Groupe vide) ---
        this.obstacles = this.physics.add.group();

        // --- D. LA PHYSIQUE (Règles du monde) ---
        
        // 1. Le joueur ne traverse pas le sol, il marche dessus
        this.physics.add.collider(this.joueur, this.sol);
        
        // 2. Si le joueur touche un obstacle -> Perdu (Restart)
        this.physics.add.overlap(this.joueur, this.obstacles, () => this.recommencer());

        // --- E. LES COMMANDES ---
        this.input.keyboard.on('keydown-SPACE', () => this.sauter());
        this.input.on('pointerdown', () => this.sauter()); // Clic souris / Tactile
        this.input.keyboard.on('keydown-ESC', () => this.endGame());

        // --- F. LE GÉNÉRATEUR (Timer) ---
        // Toutes les 1.5 à 2.5 secondes, on lance un obstacle
        this.time.addEvent({ 
            delay: 2000, // 2000 ms = 2 secondes
            loop: true, 
            callback: () => this.ajouterObstacle() 
        });
    }

    // --- 2. BOUCLE DE JEU (60 images/seconde) ---
    update() {
        // Nettoyage de la mémoire :
        // On regarde chaque obstacle. S'il est sorti à gauche (< -50), on le supprime.
        this.obstacles.children.each(obstacle => {
            if (obstacle.x < -50) obstacle.destroy();
        });
    }

    // --- 3. NOS FONCTIONS PERSO ---

    sauter() {
        // [LOGIQUE IMPORTANTE]
        // Contrairement à Flappy Bird, on ne peut pas sauter en l'air !
        // On vérifie si le joueur touche quelque chose en bas ("down").
        if (this.joueur.body.touching.down) {
            this.joueur.body.setVelocityY(-600); // Hop ! Vers le haut
        }
    }

    ajouterObstacle() {
        // On crée un Carré Rouge qui apparaît à droite de l'écran (x=850)
        // On le pose juste au-dessus du sol (y=540)
        const obstacle = this.add.rectangle(850, 540, 40, 40, 0xFF0000);
        
        this.physics.add.existing(obstacle);
        
        // [ASTUCE] Toujours ajouter au groupe AVANT de régler la vitesse
        this.obstacles.add(obstacle);

        // Réglages de l'obstacle
        obstacle.body.setAllowGravity(false); // Il glisse, il ne tombe pas
        obstacle.body.setImmovable(true);     // Le joueur ne peut pas le pousser
        obstacle.body.setVelocityX(-350);     // Il fonce vers la GAUCHE
    }

    recommencer() {
        this.scene.restart();
    }
}