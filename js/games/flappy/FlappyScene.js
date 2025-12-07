// FlappyScene.js (Cassette 'BIRDY 974') - MODE HARDCORE

class FlappyScene extends BaseGameScene {
    constructor() {
        super(SCENE_KEYS.FLAPPY); 
        
        // --- VARIABLES ---
        this.player = null;
        this.pipes = null;
        
        // GAMEPLAY DYNAMIQUE
        this.gameSpeed = 0;         // Vitesse actuelle
        this.baseSpeed = 200;       // Vitesse de départ
        this.spawnTimer = null;     // Timer récursif pour les tuyaux
        
        this.score = 0;
        this.bestScore = 0;
        this.scoreText = null;
        this.bestScoreText = null;
        this.isGameOver = false;
        
        // UI
        this.isUIEvent = false; 
    }

    preload() {
        // --- TEXTURES ---
        // Sol
        if (!this.textures.exists(ASSET_KEYS.FLOOR)) {
            const groundGraphics = this.add.graphics();
            groundGraphics.fillStyle(0x00A000, 1); 
            groundGraphics.fillRect(0, 0, 800, 50);
            groundGraphics.generateTexture(ASSET_KEYS.FLOOR, 800, 50); 
            groundGraphics.destroy();
        }
        
        // Tuyau (Version Hardcore : un peu plus menaçant ?)
        // On garde le style classique pour la lisibilité
        if (!this.textures.exists('pipe')) {
            const pipeGraphics = this.add.graphics();
            pipeGraphics.fillStyle(0x00A000, 1); 
            pipeGraphics.fillRect(0, 0, 70, 600); 
            pipeGraphics.fillStyle(0x00E000, 1); 
            pipeGraphics.fillRect(0, 0, 10, 600); 
            pipeGraphics.generateTexture('pipe', 70, 600);
            pipeGraphics.destroy();
        }
    }
    
    create() {
        this.isGameOver = false;
        this.score = 0;
        this.isUIEvent = false;
        this.gameSpeed = this.baseSpeed; // Reset vitesse

        // Record
        const storedScore = localStorage.getItem('swich974_flappy_best');
        this.bestScore = storedScore ? parseInt(storedScore) : 0;

        // --- UI ---
        this.add.text(20, 20, "BIRDY 974: HARDCORE", { fontSize: '16px', fill: '#FF0000', fontWeight:'bold' }).setDepth(10);
        
        this.bestScoreText = this.add.text(20, 50, `Record: ${this.bestScore}`, { 
            fontSize: '18px', fill: '#FFFF00' 
        }).setDepth(10);

        this.scoreText = this.add.text(400, 50, '0', { 
            fontSize: '64px', fill: '#FFFFFF', shadow: { blur: 10, color: '#000000', fill: true }
        }).setOrigin(0.5).setDepth(10);

        // Bouton Retour (Utilise celui de BaseGameScene maintenant !)
        this.createBackButton();

        // --- PHYSIQUE ---
        const floor = this.physics.add.staticSprite(400, 575, ASSET_KEYS.FLOOR);
        floor.setDepth(5); 

        this.pipes = this.physics.add.group();

        this.player = this.physics.add.sprite(100, 200, ASSET_KEYS.BIRD);
        this.player.setCollideWorldBounds(true);
        this.player.body.gravity.y = 1200; // Gravité un peu plus lourde pour être vif
        this.player.setDepth(6);                 
        
        // --- LANCEMENT SPAWNER ---
        // On remplace le Timer fixe par une boucle récursive qui s'adapte à la vitesse
        this.spawnPipeEvent();

        // Collisions
        this.physics.add.collider(this.player, floor, this.hitObject, null, this);
        this.physics.add.collider(this.player, this.pipes, this.hitObject, null, this);
        
        // --- INPUTS ---
        this.input.keyboard.on('keydown-SPACE', this.jump, this);
        this.input.keyboard.on('keydown-ESC', () => this.endGame());

        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (gameObjects.length > 0) return;
            this.jump();
        }, this);
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // 1. ACCÉLÉRATION
        // Augmente doucement la vitesse du jeu
        this.gameSpeed += 0.05; 

        // 2. ROTATION OISEAU
        if (this.player.body.velocity.y < 0) {
            this.player.angle = -25;
        } else if (this.player.angle < 90) {
            this.player.angle += 3; // Pique plus vite du nez
        }
        
        // 3. NETTOYAGE
        this.pipes.getChildren().forEach(pipe => {
            if (pipe.x < -100) pipe.destroy();
        });
    }

    jump() {
        if (this.isGameOver) {
            this.scene.restart();
            return;
        }
        this.player.setVelocityY(-450); 
    }

    // --- LOGIQUE DE SPAWN INTELLIGENTE ---
    spawnPipeEvent() {
        if (this.isGameOver) return;

        // Distance entre les tuyaux (en pixels)
        // On veut garder une distance jouable même si ça va vite
        // Distance de base 350px, se réduit légèrement avec le temps
        const distance = 350 - (Math.min(this.score, 50) * 2); 
        
        // Calcul du délai en ms : Distance / Vitesse * 1000
        const delay = (distance / this.gameSpeed) * 1000;
        
        this.spawnTimer = this.time.delayedCall(delay, () => {
            this.addRowOfPipes();
            this.spawnPipeEvent(); // Relance
        }, [], this);
    }

    addRowOfPipes() {
        if (this.isGameOver) return;
        this.score += 1;
        this.scoreText.setText(this.score);

        // DIFFICULTÉ PROGRESSIVE
        // L'ouverture (gap) se réduit avec le score
        // Au début 170px (facile), minimum 110px (très dur)
        let gapSize = Math.max(110, 170 - (this.score * 2));
        
        const gapY = Phaser.Math.Between(200, 400); 
        const pipeX = 850; 
        
        const topPipeY = (gapY - (gapSize/2)) - 300;  
        const bottomPipeY = (gapY + (gapSize/2)) + 300; 

        // CRÉATION DES TUYAUX
        // Chance de tuyau mobile : 0% au début, augmente jusqu'à 50%
        const isMoving = (this.score > 5 && Phaser.Math.Between(0, 100) < Math.min(this.score * 2, 50));
        
        this.createOnePipe(pipeX, topPipeY, isMoving, -1); // -1 = vers le haut (inverse)
        this.createOnePipe(pipeX, bottomPipeY, isMoving, 1); // 1 = vers le bas
    }

    createOnePipe(x, y, isMoving, direction) {
        const pipe = this.pipes.create(x, y, 'pipe');
        pipe.setImmovable(true);       
        pipe.body.allowGravity = false; 
        pipe.setVelocityX(-this.gameSpeed); // Vitesse dynamique !      
        
        // TUYAU MOBILE (PIÈGE)
        if (isMoving) {
            // Le tuyau oscille verticalement
            this.tweens.add({
                targets: pipe,
                y: y + (50 * direction), // Bouge de 50px
                duration: 800 - (this.gameSpeed * 0.5), // Plus rapide si le jeu est rapide
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // On le teinte en rouge pour avertir le joueur
            pipe.setTint(0xFFaaaa);
        }
    }
    
    hitObject(player, object) {
        if (this.isGameOver) return; 
        
        this.isGameOver = true;
        this.physics.pause();           
        this.player.setTint(0xff0000);  
        if (this.spawnTimer) this.spawnTimer.remove(); 

        // Arrêt des tweens (tuyaux mobiles)
        this.tweens.killAll();
        
        // Arrêt visuel des tuyaux
        this.pipes.getChildren().forEach(p => p.setVelocityX(0));

        // Record
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('swich974_flappy_best', this.bestScore);
            this.bestScoreText.setText(`NOUVEAU RECORD: ${this.bestScore}`);
            this.bestScoreText.setColor('#00FF00'); 
        }

        // TEXTE DE FIN
        this.add.text(400, 300, "GAME OVER", { 
            fontSize: '40px', fill: '#FF0000', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);

        this.add.text(400, 360, "Tap / Espace : Rejouer", { 
            fontSize: '24px', fill: '#FFFFFF', backgroundColor: '#000000'
        }).setOrigin(0.5).setDepth(20);
    }
}