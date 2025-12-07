// RunnerScene.js (Cassette 'T-ZOURIT') - VERSION INFERNALE

class RunnerScene extends BaseGameScene {
    constructor() {
        super(SCENE_KEYS.RUNNER); 
        
        // --- VARIABLES ---
        this.player = null;
        this.ground = null;
        this.obstacles = null;
        
        // --- GAMEPLAY ---
        this.gameSpeed = 0;        
        this.baseSpeed = 350;      // Départ plus rapide
        this.jumpCount = 0;        
        this.score = 0;
        
        // --- UI & ÉTATS ---
        this.isGameOver = false;
        this.scoreText = null;
        this.bestScoreText = null;
        this.spawnTimer = null;    
    }

    preload() {
        // --- TEXTURES PROCÉDURALES (STYLE NÉON) ---

        // 1. Texture Joueur "T-Zourit"
        if (!this.textures.exists('tzourit')) {
            const g = this.add.graphics();
            g.fillStyle(0x00FFFF, 1); // Cyan Néon
            g.fillCircle(20, 20, 20); 
            g.fillRect(5, 30, 8, 15);
            g.fillRect(17, 35, 8, 15);
            g.fillRect(29, 30, 8, 15);
            g.generateTexture('tzourit', 40, 50);
            g.destroy();
        }

        // 2. Texture Sol
        if (!this.textures.exists('grid_floor')) {
            const g = this.add.graphics();
            g.fillStyle(0x220033, 1); 
            g.fillRect(0, 0, 800, 40);
            g.lineStyle(2, 0xFF00FF, 1); 
            g.beginPath();
            g.moveTo(0, 0);
            g.lineTo(800, 0); 
            g.strokePath();
            g.generateTexture('grid_floor', 800, 40);
            g.destroy();
        }
        // --- Si on prefère un sprite (Chargement d'image) --- Il faut supprimer le bloc précédent !
        // 'mon_sol' est la clé (le nom de code) que tu utiliseras ensuite. Note : on peut faire cet appel dans boot scene
        // this.load.image('mon_sol', 'assets/sol.png');

        // 3. Texture Pique (Classique)
        if (!this.textures.exists('spike')) {
            const g = this.add.graphics();
            g.fillStyle(0xFF0055, 1); // Rouge
            g.beginPath();
            g.moveTo(0, 40);
            g.lineTo(20, 0);
            g.lineTo(40, 40);
            g.fillPath();
            g.generateTexture('spike', 40, 40);
            g.destroy();
        }

        // 4. Texture MUR (Force le Double Saut)
        if (!this.textures.exists('wall')) {
            const g = this.add.graphics();
            g.fillStyle(0xFFAA00, 1); // Orange
            g.fillRect(0, 0, 40, 90); // Très haut !
            g.lineStyle(2, 0xFFFFFF);
            g.strokeRect(0, 0, 40, 90);
            g.generateTexture('wall', 40, 90);
            g.destroy();
        }

        // 5. Texture DRONE (Volant)
        if (!this.textures.exists('drone')) {
            const g = this.add.graphics();
            g.fillStyle(0x00FF00, 1); // Vert Alien
            g.fillCircle(20, 20, 20); 
            g.lineStyle(2, 0xFFFFFF);
            g.beginPath(); g.moveTo(0, 20); g.lineTo(40, 20); g.strokePath(); // Ailes
            g.generateTexture('drone', 40, 40);
            g.destroy();
        }
    }

    create() {
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = this.baseSpeed;
        this.jumpCount = 0;

        const storedScore = localStorage.getItem('swich974_runner_best');
        const bestScore = storedScore ? parseInt(storedScore) : 0;

        // Background
        this.add.rectangle(400, 300, 800, 600, 0x110022).setDepth(0); 

        // Sol
        this.ground = this.add.tileSprite(400, 580, 800, 40, 'grid_floor');
        // Si on utilises un sprite, on efface la ligne précédente et on met celle-la : On utilise la clé 'mon_sol' qu'on a définie dans le preload
        //this.ground = this.add.tileSprite(400, 580, 800, 40, 'mon_sol');
        
        this.physics.add.existing(this.ground, true); 
        this.ground.setDepth(5);

        // Joueur
        this.player = this.physics.add.sprite(100, 450, 'tzourit');
        this.player.setGravityY(1600); // Gravité LOURDE pour retombée rapide (nerveux)
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(30, 40); 
        this.player.body.setOffset(5, 5);

        // Groupe Obstacles
        this.obstacles = this.physics.add.group();

        // UI
        this.add.text(20, 20, "T-ZOURIT RUN: INFERNO", { fontSize: '16px', fill: '#00FFFF', fontFamily: 'Courier' }).setDepth(20);
        this.scoreText = this.add.text(400, 50, "0m", { fontSize: '48px', fill: '#00FFFF', fontFamily: 'Courier' }).setOrigin(0.5).setDepth(20);
        this.bestScoreText = this.add.text(20, 50, `Best: ${bestScore}m`, { fontSize: '18px', fill: '#FF00FF' }).setDepth(20);

        this.createBackButton();

        // Collisions
        this.physics.add.collider(this.player, this.ground, this.landed, null, this);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // Lancement Spawner
        this.spawnObstacleEvent();

        // Inputs
        this.input.keyboard.on('keydown-SPACE', this.jump, this);
        this.input.keyboard.on('keydown-UP', this.jump, this);
        this.input.keyboard.on('keydown-ESC', () => this.endGame());

        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (gameObjects.length > 0) return; 
            this.jump();
        }, this);
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // 1. SCROLLING (Rapide)
        this.ground.tilePositionX += this.gameSpeed * (delta / 1000);

        // 2. ACCÉLÉRATION INFERNALE
        // Augmente de 0.15 par frame (3x plus vite qu'avant)
        this.gameSpeed += 0.15; 

        // 3. SCORE
        this.score += this.gameSpeed * (delta / 10000); 
        this.scoreText.setText(Math.floor(this.score) + "m");

        // 4. NETTOYAGE
        this.obstacles.getChildren().forEach(obs => {
            if (obs.x < -100) obs.destroy();
        });
    }

    // --- LOGIQUE DE SPAWN INTELLIGENTE ---
    spawnObstacleEvent() {
        if (this.isGameOver) return;

        // Le délai réduit drastiquement avec la vitesse
        // À 350 speed -> ~1.5s
        // À 800 speed -> ~0.6s
        const speedFactor = this.baseSpeed / this.gameSpeed; 
        const delay = Phaser.Math.Between(1000, 2000) * speedFactor;
        const safeDelay = Math.max(500, delay); // Jamais moins de 0.5s (sinon impossible)

        this.spawnTimer = this.time.delayedCall(safeDelay, () => {
            this.addObstacle();
            this.spawnObstacleEvent(); 
        }, [], this);
    }

    addObstacle() {
        if (this.isGameOver) return;
        
        // CHOIX DU TYPE D'OBSTACLE
        const type = Phaser.Math.Between(1, 100);
        const startX = 850;

        if (type < 60) {
            // 60% : PIQUE CLASSIQUE (Sol)
            // Parfois 2 ou 3 d'affilée pour forcer un saut long
            const count = Phaser.Math.Between(1, 2);
            for(let i=0; i<count; i++) {
                this.createObstacle(startX + (i*40), 540, 'spike');
            }

        } else if (type < 85) {
            // 25% : DRONE (Volant)
            // Hauteur variable (force saut ou passage dessous si on ajoutait le slide)
            // Ici : il vole à mi-hauteur (460), saut précis requis.
            const droneY = Phaser.Math.Between(400, 480);
            const drone = this.createObstacle(startX, droneY, 'drone');
            
            // Animation : Le drone oscille de haut en bas
            this.tweens.add({
                targets: drone,
                y: droneY + 30,
                duration: 500,
                yoyo: true,
                repeat: -1
            });

        } else {
            // 15% : MUR GÉANT (Double Saut Obligatoire)
            // Posé au sol (515 car hauteur 90, centre à 45)
            // 580 (sol) - 45 (demi-hauteur) = 535
            this.createObstacle(startX, 515, 'wall');
        }
    }

    createObstacle(x, y, key) {
        const obs = this.obstacles.create(x, y, key);
        obs.setImmovable(true);
        obs.body.allowGravity = false;
        obs.setVelocityX(-this.gameSpeed); 
        
        // Hitbox ajustée pour être juste
        if (key === 'spike') obs.body.setSize(20, 30).setOffset(10, 10);
        if (key === 'drone') obs.body.setCircle(15, 5, 5);
        
        return obs;
    }

    // --- DOUBLE SAUT ---
    jump() {
        if (this.isGameOver) {
            this.scene.restart();
            return;
        }

        if (this.player.body.touching.down || this.jumpCount < 2) {
            // 1er saut : Normal (-600)
            // 2ème saut : Correction (-500)
            const force = (this.jumpCount === 0) ? -600 : -500;
            
            this.player.setVelocityY(force); 
            this.jumpCount++;
            
            // Effet visuel
            this.tweens.add({
                targets: this.player,
                angle: this.player.angle + 360, 
                duration: 500,
                ease: 'Cubic.out'
            });
        }
    }

    landed() {
        this.jumpCount = 0;
        // Remet le joueur droit quand il touche le sol
        this.player.angle = 0; 
    }

    hitObstacle(player, obstacle) {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.physics.pause();
        this.player.setTint(0xFF0000);

        if (this.spawnTimer) this.spawnTimer.remove();
        
        this.gameSpeed = 0;
        this.obstacles.getChildren().forEach(obs => {
            obs.setVelocityX(0);
            if(obs.scene) obs.scene.tweens.killTweensOf(obs); // Stop animations drones
        });

        // Record
        const currentScore = Math.floor(this.score);
        const storedScore = localStorage.getItem('swich974_runner_best');
        const best = storedScore ? parseInt(storedScore) : 0;
        
        if (currentScore > best) {
            localStorage.setItem('swich974_runner_best', currentScore);
            this.bestScoreText.setText(`NOUVEAU RECORD: ${currentScore}m`).setColor('#00FF00');
        }

        this.add.text(400, 300, "CRASH!", { fontSize: '64px', fill: '#FF0055', fontStyle:'bold' }).setOrigin(0.5).setDepth(30);
        this.add.text(400, 380, "Tap / Espace : Rejouer", { fontSize: '24px', fill: '#FFFFFF', backgroundColor:'#000000' }).setOrigin(0.5).setDepth(30);
    }

}