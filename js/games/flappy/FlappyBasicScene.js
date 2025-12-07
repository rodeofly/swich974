// FlappyBasicScene.js - VERSION ÉDUCATIVE (Ultra-Commentée)

class FlappyBasicScene extends BaseGameScene {
    constructor() { super('FlappyBasicScene'); }

    // --- 1. INITIALISATION (Lancement de la scène) ---
    create() {
        // [IMPORTANT] Réveil du moteur physique
        // Si on vient d'un "Game Over" sur une autre scène, le moteur est en pause.
        // On le force à redémarrer, sinon rien ne bouge !
        this.physics.resume();

        // [IMPORTANT] Nettoyage des touches
        // On supprime les anciens contrôles pour ne pas qu'ils s'empilent.
        this.input.keyboard.removeAllListeners();

        // Bouton pour quitter (Fonction incluse dans BaseGameScene)
        this.createBackButton();

        // --- A. LE JOUEUR (Un simple carré blanc) ---
        // 100, 300 = Position de départ (x, y)
        this.joueur = this.add.rectangle(100, 300, 40, 40, 0xFFFFFF);
        
        // On ajoute la physique au carré pour qu'il ait un "poids"
        this.physics.add.existing(this.joueur);
        this.joueur.body.gravity.y = 1000; // Force qui le tire vers le bas

        // --- B. LES OBSTACLES (Groupe vide pour l'instant) ---
        this.tuyaux = this.physics.add.group();

        // --- C. LE GÉNÉRATEUR (Timer) ---
        // Toutes les 1500ms (1.5s), on appelle la fonction 'ajouterRangee'
        this.time.addEvent({ 
            delay: 1500, 
            loop: true, 
            callback: () => this.ajouterRangee() 
        });

        // --- D. LES CONTRÔLES (Action -> Réaction) ---
        // Si on appuie sur ESPACE -> On saute
        this.input.keyboard.on('keydown-SPACE', () => this.sauter());
        // Si on clique avec la SOURIS -> On saute aussi
        this.input.on('pointerdown', () => this.sauter());
        // Si on appuie sur ESC -> On quitte
        this.input.keyboard.on('keydown-ESC', () => this.endGame());

        // --- E. LES COLLISIONS (La mort) ---
        // Si le joueur touche un tuyau -> On redémarre la scène
        this.physics.add.overlap(this.joueur, this.tuyaux, () => this.recommencer());
    }

    // --- 2. BOUCLE DE JEU (Tourne 60 fois par seconde) ---
    update() {
        // Règle 1 : Si le joueur sort de l'écran (Haut ou Bas) -> Perdu
        if (this.joueur.y < 0 || this.joueur.y > 600) {
            this.recommencer();
        }

        // Règle 2 : Nettoyage de la mémoire
        // On parcourt tous les tuyaux. S'ils sont sortis à gauche (< -50), on les supprime.
        this.tuyaux.children.each(tuyau => {
            if (tuyau.x < -50) tuyau.destroy();
        });
    }

    // --- 3. NOS FONCTIONS PERSO ---

    sauter() {
        // Velocity Y négative = On va vers le HAUT
        this.joueur.body.setVelocityY(-350);
    }

    recommencer() {
        this.scene.restart(); // Recharge la scène à zéro
    }

    ajouterRangee() {
        // On choisit une hauteur au hasard pour le trou (entre 150 et 450px)
        const centreDuTrou = Phaser.Math.Between(150, 450);
        
        // On crée le tuyau du HAUT (au-dessus du trou)
        this.creerTuyau(800, centreDuTrou - 400); 
        
        // On crée le tuyau du BAS (en-dessous du trou)
        this.creerTuyau(800, centreDuTrou + 400);
    }

    creerTuyau(x, y) {
        // Création visuelle du rectangle gris
        const tuyau = this.add.rectangle(x, y, 60, 600, 0x888888);
        
        // Ajout au moteur physique
        this.physics.add.existing(tuyau);
        
        // [ASTUCE] On l'ajoute au groupe AVANT de régler la vitesse
        this.tuyaux.add(tuyau);

        // Réglages physiques
        tuyau.body.setAllowGravity(false); // Il ne doit pas tomber
        tuyau.body.setImmovable(true);     // Il ne doit pas bouger si on le cogne
        tuyau.body.setVelocityX(-200);     // Il avance vers la GAUCHE
    }
}