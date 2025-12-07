// ArkanoidScene.js - VERSION ULTIMATE (Avec Power-Ups & Multi-balles)

class ArkanoidScene extends BaseGameScene {
    constructor() { super('ArkanoidScene'); }

    create() {
        this.physics.resume();
        // Gauche, Droite, Haut = VRAI. Bas = FAUX (pour que la balle tombe)
        this.physics.world.setBoundsCollision(true, true, true, false);
        this.input.keyboard.removeAllListeners();
        this.createBackButton();

        // --- ÉTATS DU JEU (FLAGS) ---
        this.paddleSticky = false; // Est-ce que la glue est active ?
        this.paddleLaser = false;  // Est-ce que le laser est actif ?
        this.balleCollee = null;   // Quelle balle est collée actuellement ?

        // --- 1. LES GROUPES (Pour gérer plusieurs objets) ---
        
        // Groupe des BALLES (car avec le multiball, on en aura plusieurs)
        this.groupeBalles = this.physics.add.group({
            bounceX: 1, bounceY: 1, collideWorldBounds: true
        });

        // Groupe des BONUS (qui tombent du ciel)
        // Il faut impérativement 'runChildUpdate: true' pour que la lettre suive le carré
        this.groupeBonus = this.physics.add.group({
            runChildUpdate: true 
        });

        // Groupe des LASERS (tirs de la raquette)
        this.groupeLasers = this.physics.add.group();

        // Groupe des BRIQUES (Statique = murs)
        this.groupeBriques = this.physics.add.staticGroup();

        // --- 2. CRÉATION DES ACTEURS ---

        // La Raquette
        this.raquette = this.add.rectangle(400, 550, 100, 20, 0x00FF00);
        this.physics.add.existing(this.raquette);
        this.raquette.body.setImmovable(true);
        this.raquette.body.setAllowGravity(false);

        // La Première Balle
        this.creerBalle(400, 520, true); // true = elle commence collée

        // Le Mur de Briques
        this.creerMurDeBriques();

        // --- 3. GESTION DES COLLISIONS ---

        // Raquette vs Balles
        this.physics.add.collider(this.raquette, this.groupeBalles, this.impactRaquette, null, this);
        
        // Balles vs Briques
        this.physics.add.collider(this.groupeBalles, this.groupeBriques, this.impactBrique, null, this);

        // Lasers vs Briques
        this.physics.add.collider(this.groupeLasers, this.groupeBriques, this.impactLaser, null, this);

        // Raquette vs Bonus (Le joueur attrape le cadeau)
        this.physics.add.overlap(this.raquette, this.groupeBonus, this.attraperBonus, null, this);


        // --- 4. CONTRÔLES ---

        // Mouvement Souris
        this.input.on('pointermove', (pointer) => {
            // La raquette suit la souris (limitée aux bords)
            this.raquette.x = Phaser.Math.Clamp(pointer.x, 60, 740);

            // Si une balle est collée (Glue ou début), elle suit la raquette
            if (this.balleCollee) {
                this.balleCollee.x = this.raquette.x + this.balleCollee.offsetX;
            }
        });

        // Clic (Lancer balle ou Tirer Laser)
        this.input.on('pointerdown', () => {
            // A. Si une balle est collée -> On la lance
            if (this.balleCollee) {
                // AJOUT DE .body ICI
                this.balleCollee.body.setVelocity(Phaser.Math.Between(-100, 100), -400);
                this.balleCollee = null; 
            }
            // B. Si on a le Laser -> On tire
            else if (this.paddleLaser) {
                this.tirerLaser();
            }
        });
    }

    update() {
        // 1. Game Over (Si plus aucune balle active)
        // On vérifie si le bas de l'écran a "mangé" toutes les balles
        let ballesEnJeu = 0;
        this.groupeBalles.children.each(balle => {
            if (balle.active) {
                if (balle.y > 600) {
                    balle.destroy(); // Balle perdue
                } else {
                    ballesEnJeu++;
                }
            }
        });

        if (ballesEnJeu === 0) {
            this.scene.restart(); // PERDU !
        }

        // 2. Nettoyage (Bonus et Lasers sortis de l'écran)
        this.groupeBonus.children.each(b => { if (b.y > 600) b.destroy(); });
        this.groupeLasers.children.each(l => { if (l.y < 0) l.destroy(); });
    }

    // --- FONCTIONS MÉCANIQUES ---

    creerBalle(x, y, estCollee = false) {
        const balle = this.add.circle(x, y, 8, 0xFFFFFF);
        this.physics.add.existing(balle);
        this.groupeBalles.add(balle);
        
        balle.body.setAllowGravity(false);
        balle.body.setBounce(1);
        
        if (estCollee) {
            this.balleCollee = balle;
            balle.offsetX = 0; // Décalage par rapport au centre de la raquette
        } else {
            // Si créée en plein jeu (Multiball), elle part direct !
            balle.body.setVelocity(Phaser.Math.Between(-200, 200), -300);
        }
    }

    creerMurDeBriques() {
        // Création colorée et aléatoire
        const couleurs = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF];
        
        for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 9; x++) {
                const brique = this.add.rectangle(100 + (x * 75), 80 + (y * 35), 70, 30, couleurs[y % 5]);
                this.physics.add.existing(brique, true); // True = Statique
                this.groupeBriques.add(brique);
            }
        }
    }

    // --- LOGIQUE COLLISIONS ---
    impactRaquette(raquette, balle) {
    // Effet de "visée" selon l'endroit où on tape
    const diff = balle.x - raquette.x;
    
    // CORRECTION 1 : Ajout de .body
    balle.body.setVelocityX(diff * 5);

    // Si on a le Bonus GLUE (Vert), la balle se recolle !
    if (this.paddleSticky && !this.balleCollee) {
        this.balleCollee = balle;
        
        // CORRECTION 2 : Ajout de .body ici aussi (sinon ça plantera quand tu auras le bonus)
        balle.body.setVelocity(0, 0);
        
        balle.offsetX = diff; // On garde la position relative
    }
    }

    impactBrique(balle, brique) {
        brique.destroy();
        this.verifierVictoire();
        this.spawnBonusChance(brique.x, brique.y); // Chance de faire tomber un cadeau
    }

    impactLaser(laser, brique) {
        laser.destroy();
        brique.destroy();
        this.verifierVictoire();
        this.spawnBonusChance(brique.x, brique.y);
    }

    // --- SYSTÈME DE BONUS (GOODIES) ---

    spawnBonusChance(x, y) {
        // 20% de chance d'avoir un bonus
        if (Phaser.Math.Between(0, 100) > 80) {
            const type = Phaser.Math.Between(1, 3);
            let couleur, etiquette;

            switch(type) {
                case 1: couleur = 0xFF0000; etiquette = 'L'; break; // Laser (Rouge)
                case 2: couleur = 0x0000FF; etiquette = 'M'; break; // Multi (Bleu)
                case 3: couleur = 0x00FF00; etiquette = 'G'; break; // Glue (Vert)
            }

            // On crée le bonus physique (carré)
            const bonus = this.add.rectangle(x, y, 30, 30, couleur);
            this.physics.add.existing(bonus);
            this.groupeBonus.add(bonus);
            
            // On écrit la lettre dessus (purement visuel)
            const texte = this.add.text(x-5, y-10, etiquette, { fontSize:'16px', fill:'#FFF', fontWeight:'bold' });
            // On attache le texte au bonus pour qu'il le suive (petite astuce update)
            bonus.update = function() { texte.x = this.x - 5; texte.y = this.y - 10; };
            bonus.monTexte = texte;
            bonus.type = type; // On stocke le type pour savoir quoi faire quand on le touche
            bonus.body.setVelocityY(150); // Il tombe doucement
        }
    }

    attraperBonus(raquette, bonus) {
        // Activation du pouvoir !
        switch(bonus.type) {
            case 1: // LASER
                this.paddleLaser = true;
                this.paddleSticky = false; // On ne peut pas avoir les deux
                this.raquette.fillColor = 0xFF0000; // La raquette devient rouge
                break;
            case 2: // MULTI-BALL
                // Crée 2 nouvelles balles à la position de la raquette
                this.creerBalle(this.raquette.x, this.raquette.y - 20);
                this.creerBalle(this.raquette.x, this.raquette.y - 20);
                break;
            case 3: // GLUE
                this.paddleSticky = true;
                this.paddleLaser = false;
                this.raquette.fillColor = 0x00FF00; // La raquette devient verte
                break;
        }
        
        // Texte flottant "WOW!"
        const txt = this.add.text(this.raquette.x, this.raquette.y - 50, "POWER UP!", { fontSize:'20px', color:'#FFFF00' });
        this.tweens.add({ targets:txt, y: txt.y-50, alpha:0, duration:1000, onComplete:()=>txt.destroy() });

        if (bonus.monTexte) {
            bonus.monTexte.destroy();
        }
        // Ensuite on détruit le carré
        bonus.destroy();
    }

    tirerLaser() {
        // Tire deux traits rouges depuis les bords de la raquette
        const l1 = this.add.rectangle(this.raquette.x - 40, this.raquette.y - 10, 4, 20, 0xFF0000);
        const l2 = this.add.rectangle(this.raquette.x + 40, this.raquette.y - 10, 4, 20, 0xFF0000);
        
        this.physics.add.existing(l1);
        this.physics.add.existing(l2);
        
        this.groupeLasers.add(l1);
        this.groupeLasers.add(l2);
        
        l1.body.setVelocityY(-600);
        l2.body.setVelocityY(-600);
    }

    verifierVictoire() {
        if (this.groupeBriques.countActive() === 0) {
            // Victoire ! (On reset pour l'instant)
            this.scene.restart();
        }
    }
}