// SuikaScene.js - MERGE FRUIT 974 (V4: Physics World Bounds & Juicy Feel)

class SuikaScene extends BaseGameScene {
    constructor() {
        super(SCENE_KEYS.SUIKA);
    }

    create() {
        this.physics.resume();
        this.createBackButton();

        // --- 1. CONFIGURATION PHYSIQUE ROBUSTE ---
        // [IMPORTANT] On définit les limites physiques EXACTES du bocal.
        // Les fruits ne pourront JAMAIS sortir de x=200 à x=600.
        // x=200, y=0, width=400, height=600
        this.physics.world.setBounds(200, 0, 400, 600);

        // --- 2. DONNÉES DES FRUITS ---
        // J'ai ajusté les tailles pour que ça rentre mieux
        this.FRUITS_INFO = [
            { radius: 14, size: 28, emoji: '🍒', score: 2 },
            { radius: 22, size: 44, emoji: '🍓', score: 4 },
            { radius: 30, size: 60, emoji: '🍇', score: 8 },
            { radius: 40, size: 80, emoji: '🍊', score: 16 },
            { radius: 50, size: 100, emoji: '🥭', score: 32 }, // Mangue
            { radius: 65, size: 130, emoji: '🥥', score: 64 },
            { radius: 80, size: 160, emoji: '🍈', score: 128 },
            { radius: 95, size: 190, emoji: '🍍', score: 256 },
            { radius: 115, size: 230, emoji: '🍉', score: 512 }
        ];

        this.score = 0;
        this.isGameOver = false;
        this.canDrop = true;
        
        // Initialisation du roulement
        this.currentFruitIndex = 0;
        this.nextFruitIndex = Phaser.Math.Between(0, 1);

        // --- 3. DÉCORS (Visuel uniquement) ---
        // Le fond du bocal
        this.add.rectangle(400, 300, 400, 600, 0x000000, 0.5);
        
        // Les parois (Graphique simple pour bien voir les limites)
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xFFFFFF, 1); // Ligne blanche épaisse
        // Dessine le U : Gauche, Bas, Droite
        graphics.beginPath();
        graphics.moveTo(200, 0);
        graphics.lineTo(200, 600);
        graphics.lineTo(600, 600);
        graphics.lineTo(600, 0);
        graphics.strokePath();

        // Ligne de Danger (Game Over)
        this.dangerY = 120;
        this.add.line(0, 0, 200, this.dangerY, 600, this.dangerY, 0xFF0000).setOrigin(0).setAlpha(0.5);
        this.add.text(210, this.dangerY - 15, "ZONE LIMITE", { fontSize: '12px', color: '#FF0000' });

        // --- UI (Hors du bocal) ---
        this.scoreText = this.add.text(20, 20, "SCORE: 0", { fontSize: '28px', fontFamily: 'Arial', fontWeight: 'bold' });
        
        this.add.text(650, 50, "SUIVANT", { fontSize: '16px', color: '#AAAAAA' }).setOrigin(0.5);
        this.nextFruitDisplay = this.add.text(650, 100, this.FRUITS_INFO[this.nextFruitIndex].emoji, { fontSize: '50px' }).setOrigin(0.5);

        // --- 4. GROUPE PHYSIQUE ---
        this.fruitsGroup = this.physics.add.group({
            // collideWorldBounds: true est CRUCIAL ici (utilise les bounds définis plus haut)
            collideWorldBounds: true,
            bounceX: 0.2, 
            bounceY: 0.2
        });

        // --- 5. VISÉE ---
        this.aimLine = this.add.rectangle(400, 100, 2, 600, 0xFFFFFF, 0.2).setOrigin(0.5, 0);
        
        const info = this.FRUITS_INFO[this.currentFruitIndex];
        this.previewFruit = this.add.text(400, 60, info.emoji, { fontSize: info.size + 'px' }).setOrigin(0.5);

        // --- 6. COLLISIONS ---
        // Plus besoin de murs statiques, le World Bounds fait le travail !
        // On gère juste la fusion entre fruits
        this.physics.add.collider(this.fruitsGroup, this.fruitsGroup, this.handleMerge, null, this);

        // --- 7. INPUTS ---
        this.input.on('pointermove', (pointer) => {
            if (this.isGameOver) return;
            // On contraint le curseur DANS le bocal (200 + marge à 600 - marge)
            const x = Phaser.Math.Clamp(pointer.x, 220, 580);
            this.aimLine.x = x;
            this.previewFruit.x = x;
        });

        this.input.on('pointerdown', () => {
            if (this.canDrop && !this.isGameOver) {
                this.dropFruit();
            }
        });
    }

    update() {
        if (this.isGameOver) return;

        // Vérification Game Over
        this.fruitsGroup.children.each(fruit => {
            // Si le fruit est stabilisé (vitesse faible) et dépasse la ligne rouge
            if (fruit.body.velocity.y > -20 && fruit.body.velocity.y < 20 && fruit.y < this.dangerY) {
                // Petit délai de grâce (il doit exister depuis 1s)
                if (fruit.age > 60) { // 60 frames ~ 1 seconde
                    this.gameOver();
                }
            }
            fruit.age++;
        });
    }

    dropFruit() {
        this.canDrop = false;

        const x = this.previewFruit.x;
        const y = 60;
        
        // Spawn du fruit physique
        this.spawnFruit(x, y, this.currentFruitIndex);

        // Feedback visuel immédiat (On cache juste le preview un instant)
        this.previewFruit.setVisible(false);

        // Délai très court (250ms) pour la fluidité
        this.time.delayedCall(250, () => {
            if (this.isGameOver) return;
            this.canDrop = true;

            // Roulement
            this.currentFruitIndex = this.nextFruitIndex;
            // Max index 3 (Orange) pour éviter les trop gros fruits au spawn
            this.nextFruitIndex = Phaser.Math.Between(0, 3);

            // Mise à jour visuelle Preview
            const nextInfo = this.FRUITS_INFO[this.currentFruitIndex];
            this.previewFruit.setText(nextInfo.emoji);
            this.previewFruit.setFontSize(nextInfo.size);
            this.previewFruit.setVisible(true);

            // Mise à jour visuelle Next
            this.nextFruitDisplay.setText(this.FRUITS_INFO[this.nextFruitIndex].emoji);
            // Petit pop animation
            this.tweens.add({
                targets: this.nextFruitDisplay,
                scale: { from: 0, to: 1 },
                duration: 200,
                ease: 'Back.out'
            });
        });
    }

    spawnFruit(x, y, index) {
        if (index >= this.FRUITS_INFO.length) return;
        const info = this.FRUITS_INFO[index];

        const fruit = this.add.text(x, y, info.emoji, { fontSize: info.size + 'px' });
        fruit.setOrigin(0.5);

        this.physics.add.existing(fruit);
        this.fruitsGroup.add(fruit);

        // --- RÉGLAGES PHYSIQUES "JUICY" ---
        
        // 1. Hitbox un peu plus petite que l'image pour éviter l'effet "bloc"
        // Le 0.85 crée un petit écart visuel, ils se "touchent" moins
        fruit.body.setCircle(info.radius * 0.85);
        
        // Correction de l'offset pour centrer la hitbox circulaire sur l'emoji carré
        const offset = (fruit.width / 2) - (info.radius * 0.85);
        fruit.body.setOffset(offset, offset);

        // 2. Glissade (Zéro friction)
        fruit.body.setDrag(0); 
        fruit.body.setFriction(0);
        
        // 3. Rebond satisfaisant
        fruit.body.setBounce(0.3);

        // 4. Poids (Les gros fruits poussent les petits)
        fruit.body.setMass(1 + (index * 0.5));

        fruit.level = index;
        fruit.age = 0; // Pour le compteur Game Over
    }

    handleMerge(fruitA, fruitB) {
        if (fruitA.level === fruitB.level && fruitA.active && fruitB.active) {
            // Anti-doublon
            if (fruitA.isMerging || fruitB.isMerging) return;
            fruitA.isMerging = true; 
            fruitB.isMerging = true;

            // Position centrale
            const midX = (fruitA.x + fruitB.x) / 2;
            const midY = (fruitA.y + fruitB.y) / 2;
            const newLevel = fruitA.level + 1;

            // Score
            this.score += this.FRUITS_INFO[fruitA.level].score;
            this.scoreText.setText("SCORE: " + this.score);

            // Destruction
            fruitA.destroy();
            fruitB.destroy();

            // Spawn du nouveau
            if (newLevel < this.FRUITS_INFO.length) {
                this.spawnFruit(midX, midY, newLevel);
                
                // Petit effet de "Choc" caméra pour le fun
                this.cameras.main.shake(100, 0.005);
            }
        }
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();
        
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(20);
        this.add.text(400, 250, "FIN DE PARTIE", { fontSize: '40px', color: '#FF0000', fontWeight: 'bold' }).setOrigin(0.5).setDepth(21);
        this.add.text(400, 320, `SCORE: ${this.score}`, { fontSize: '60px', color: '#FFFFFF' }).setOrigin(0.5).setDepth(21);
        this.add.text(400, 420, "Cliquer pour Rejouer", { fontSize: '20px', color: '#AAAAAA' }).setOrigin(0.5).setDepth(21);
        
        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}