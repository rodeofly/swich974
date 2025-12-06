class ZouritAttackScene extends BaseGameScene {
    constructor() {
        super(SCENE_KEYS.OCTOPUS);
    }

    create() {
        this.createBackButton();
        
        // --- 1. AMBIANCE "GAME & WATCH" ---
        // Fond verdâtre typique des écrans LCD
        this.add.rectangle(400, 300, 800, 600, 0x99B19C).setDepth(-10);
        // Décor de fond (imprimé sur l'écran en noir "éteint")
        this.add.text(400, 100, "ZOURIT ATTACK", { fontFamily: 'Courier', fontSize: '40px', color: '#889C8B', fontWeight: 'bold' }).setOrigin(0.5);
        this.add.text(650, 50, "GAME A", { fontFamily: 'Courier', fontSize: '20px', color: '#889C8B' });
        
        // --- 2. GAMEPLAY VARIABLES ---
        this.score = 0;
        this.treasureCount = 0; // Sac d'or actuel
        this.diverPos = 0;      // 0=Bateau, 1-5=Profondeur
        this.diverSide = 0;     // 0=Gauche, 1=Droite (pour esquiver)
        this.tentacles = [0, 0, 0, 0, 0]; // État des 5 tentacules (longueur)
        this.isGameOver = false;
        
        // --- 3. AFFICHAGE LCD (SEGMENTS) ---
        // On prépare les positions graphiques pour le plongeur et les tentacules
        this.lcdLayer = this.add.graphics();
        
        // Score (Vrai affichage digital)
        this.scoreText = this.add.text(650, 100, "000", { fontFamily: 'Courier', fontSize: '40px', color: '#000000' });

        // --- 4. INPUTS ---
        this.input.keyboard.on('keydown-DOWN', () => this.moveDiver(1));
        this.input.keyboard.on('keydown-UP', () => this.moveDiver(-1));
        // On peut changer de côté (Gauche/Droite) pour éviter certaines tentacules (si on complexifie)
        // Pour l'instant, simple descente.

        // --- 5. GAME LOOP (TICK PAR TICK) ---
        // Les Game & Watch ne sont pas fluides, ils ont un "Tic-Tac" (environ 500ms)
        this.gameTick = this.time.addEvent({ delay: 600, loop: true, callback: () => this.tick() });
        
        // Premier rendu
        this.drawLCD();
    }

    // --- LE CŒUR DU JEU (TIC-TAC) ---
    tick() {
        if (this.isGameOver) return;

        // 1. La Zourit bouge ses tentacules
        this.updateTentacles();

        // 2. Vérification Collision
        if (this.checkCollision()) {
            this.gameOver();
        }

        // 3. Son "Bip" rétro
        // (Tu pourras ajouter un son court ici plus tard)
        
        // 4. Mise à jour visuelle
        this.drawLCD();
    }

    moveDiver(direction) {
        if (this.isGameOver) return;

        // Descendre (1) ou Monter (-1)
        const nextPos = this.diverPos + direction;

        // Limites
        if (nextPos < 0) return; // Déjà dans le bateau
        if (nextPos > 5) {
            // TENTATIVE DE PRISE DE TRÉSOR (Au fond)
            this.grabTreasure();
            return;
        }

        this.diverPos = nextPos;

        // Si on revient au bateau (Pos 0) avec du trésor, on encaisse !
        if (this.diverPos === 0 && this.treasureCount > 0) {
            this.score += (this.treasureCount * 10); // 10 points par sac
            this.treasureCount = 0;
            this.scoreText.setText(this.pad(this.score, 3));
            // Petit son de victoire ici
        } else {
            // Chaque pas donne 1 point (pour encourager le risque)
            this.score += 1;
            this.scoreText.setText(this.pad(this.score, 3));
        }

        // Vérif immédiate après mouvement
        if (this.checkCollision()) this.gameOver();

        this.drawLCD();
    }

    updateTentacles() {
        // Logique aléatoire mais menaçante
        // Chaque tentacule peut s'allonger ou se rétracter
        for(let i=0; i<5; i++) {
            const change = Phaser.Math.Between(-1, 2); // Tendance à descendre
            this.tentacles[i] += change;
            
            // Bornes (0 = rétracté, 4 = max longueur)
            this.tentacles[i] = Phaser.Math.Clamp(this.tentacles[i], 0, 4);
        }
    }

    checkCollision() {
        // Si le plongeur est à la profondeur X, et que la tentacule X est sortie à fond...
        // Dans ce jeu simplifié : La tentacule i menace la profondeur i+1
        if (this.diverPos > 0) {
            // L'index de la tentacule qui menace cette profondeur
            const tentacleIndex = this.diverPos - 1; 
            
            // Si la tentacule est assez longue (>= 3), elle touche le chemin du plongeur
            if (this.tentacles[tentacleIndex] >= 3) {
                return true;
            }
        }
        return false;
    }

    grabTreasure() {
        // On prend un sac
        this.treasureCount++;
        // On reste au fond (Pos 5) mais on a le sac
        // Petit effet visuel
        this.cameras.main.shake(100, 0.01);
    }

    // --- LE MOTEUR GRAPHIQUE "LCD" ---
    drawLCD() {
        this.lcdLayer.clear();

        // 1. Dessiner LE BATEAU (Pos 0)
        this.drawLCDSprite(350, 150, 'BOAT', this.diverPos === 0);

        // 2. Dessiner le PLONGEUR (Pos 1 à 5)
        // Chemin en diagonale vers le bas-droite
        for(let i=1; i<=5; i++) {
            const x = 350 + (i * 40);
            const y = 150 + (i * 40);
            const isActive = (this.diverPos === i);
            
            // Si on a le trésor, on dessine un bonhomme avec un sac
            const type = (isActive && this.treasureCount > 0) ? 'DIVER_BAG' : 'DIVER';
            this.drawLCDSprite(x, y, type, isActive);
        }

        // 3. Dessiner le TRÉSOR (Au fond)
        // Il clignote si on est en train de le prendre
        this.drawLCDSprite(600, 400, 'TREASURE', true);

        // 4. Dessiner la ZOURIT (En haut à droite)
        this.drawLCDSprite(600, 150, 'ZOURIT_HEAD', true);

        // 5. Dessiner les TENTACULES
        // Elles descendent vers le chemin du plongeur
        for(let t=0; t<5; t++) {
            // Chaque tentacule a 4 segments
            for(let seg=0; seg<4; seg++) {
                const x = 580 - (t * 20); // Décalage X
                const y = 200 + (t * 40) + (seg * 20); // Décalage Y
                
                // Est-ce que ce segment est actif ?
                // Si la tentacule t a une longueur de 3, les segments 0, 1, 2 sont allumés
                const isActive = (seg < this.tentacles[t]);
                this.drawLCDSprite(x, y, 'TENTACLE_SEG', isActive);
            }
        }
    }

    // Fonction utilitaire pour dessiner des formes "LCD"
    drawLCDSprite(x, y, type, active) {
        // Couleur: Noir fort si actif, Gris très pâle (fantomatique) si inactif
        const color = active ? 0x000000 : 0x889C8B;
        const alpha = active ? 1 : 0.3;
        
        this.lcdLayer.fillStyle(color, alpha);

        switch(type) {
            case 'DIVER':
                this.lcdLayer.fillCircle(x, y, 10); // Tête
                this.lcdLayer.fillRect(x-5, y+10, 10, 15); // Corps
                break;
            case 'DIVER_BAG': // Plongeur avec gros sac
                this.lcdLayer.fillCircle(x, y, 10);
                this.lcdLayer.fillRect(x-10, y+5, 20, 20); // Le sac
                break;
            case 'BOAT':
                this.lcdLayer.fillRect(x, y, 60, 20);
                this.lcdLayer.fillRect(x+10, y-20, 10, 20); // Mât
                break;
            case 'ZOURIT_HEAD':
                this.lcdLayer.fillCircle(x, y, 40);
                // Yeux
                if(active) {
                    this.lcdLayer.fillStyle(0x99B19C, 1); // Couleur du fond pour faire un trou
                    this.lcdLayer.fillCircle(x-15, y, 5);
                    this.lcdLayer.fillCircle(x+15, y, 5);
                    this.lcdLayer.fillStyle(color, alpha); // Reset
                }
                break;
            case 'TENTACLE_SEG':
                this.lcdLayer.fillCircle(x, y, 6);
                break;
            case 'TREASURE':
                this.lcdLayer.fillRect(x, y, 40, 30);
                this.lcdLayer.fillStyle(0x99B19C, 1);
                this.lcdLayer.fillRect(x+5, y+5, 30, 5); // Détail coffre
                break;
        }
    }

    pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    gameOver() {
        this.isGameOver = true;
        this.gameTick.remove(); // Stop le temps
        
        // Animation clignotante de mort
        this.tweens.addCounter({
            from: 0, to: 5, duration: 1000,
            onUpdate: (tween) => {
                const val = Math.floor(tween.getValue());
                // Clignote le plongeur actuel
                this.drawLCDSprite(350 + (this.diverPos*40), 150 + (this.diverPos*40), 'DIVER', val % 2 === 0);
            },
            onComplete: () => {
                this.add.text(400, 300, "GAME OVER", { fontSize: '60px', color: '#000000', fontFamily: 'Courier', fontWeight:'bold' }).setOrigin(0.5);
                this.time.delayedCall(2000, () => this.endGame());
            }
        });
    }
}