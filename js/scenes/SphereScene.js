// SphereScene.js - VERSION "COMPACT UI & ADVANCED SPAWNER"

class SphereScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.SPHERE || 'SphereScene',
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            }
        });
    }

    create() {
        this.physics.resume();
        this.physics.world.timeScale = 1;

        // --- 0. TEXTURE ---
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0xFFFFFF);
        gfx.fillCircle(6, 6, 6);
        gfx.generateTexture('ballTexture', 12, 12);

        // --- 1. CONFIGURATION ---
        this.defaultParams = {
            gravity: 0,
            sphereSpeed: 0.01,
            showTeeth: true,
            
            spawnActive: false,
            spawnOnCollision: false,
            spawnRate: 250,
            
            // NOUVEAUX PARAMÈTRES SPAWNER
            spawnPosAngle: -90,   // Position sur le cercle (en degrés)
            spawnAimOffset: 0,    // Décalage de visée (0 = vers le centre)
            spawnOffset: 0.8,     // Distance du centre (0.8 = près du bord)
            spawnForce: 15,
            
            restitution: 1.0,     
            drag: 0.0,            
            ghostMode: false,
            propRed: 1, propGreen: 1, propBlue: 1
        };

        this.params = { ...this.defaultParams };
        
        this.balls = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: false });
        this.lastSpawnTime = 0;
        this.container = { x: 280, y: 300, radius: 200, angle: 0 };

        this.sphereGraphics = this.add.graphics();
        this.arrowGraphics = this.add.graphics();

        this.createLabUI(); 
        this.createBackButton();
    }

    update(time, delta) {
        // A. CONSTANTES
        this.physics.world.gravity.y = this.params.gravity * 300; 
        this.container.angle += this.params.sphereSpeed;

        // B. COLLISIONS DYNAMIQUES
        if (!this.params.ghostMode) {
            this.physics.collide(this.balls, this.balls, (ballA, ballB) => {
                if (this.params.spawnOnCollision && this.balls.getLength() < 300) {
                    this.spawnBall();
                }
            });
        }

        // C. RENDU VISUEL
        this.sphereGraphics.clear();
        this.sphereGraphics.lineStyle(2, 0x555555, 1.0);
        this.sphereGraphics.strokeCircle(this.container.x, this.container.y, this.container.radius);

        if (this.params.showTeeth) {
            const numTeeth = 12; const toothDepth = 30;
            this.sphereGraphics.fillStyle(0xAA0000, 1.0);
            for (let i = 0; i < numTeeth; i++) {
                const segmentAngle = (Math.PI * 2) / (numTeeth * 2); 
                const startAngle = this.container.angle + (i * 2 * segmentAngle);
                const endAngle = startAngle + segmentAngle;
                this.sphereGraphics.beginPath();
                this.sphereGraphics.arc(this.container.x, this.container.y, this.container.radius, startAngle, endAngle, false);
                this.sphereGraphics.arc(this.container.x, this.container.y, this.container.radius - toothDepth, endAngle, startAngle, true);
                this.sphereGraphics.closePath(); this.sphereGraphics.fillPath();
            }
        }

        // D. SPAWNER VISUEL (Mobile & Orientable)
        this.arrowGraphics.clear();
        
        // 1. Calcul Position du Canon
        const posRad = Phaser.Math.DegToRad(this.params.spawnPosAngle);
        const distFromCenter = this.params.spawnOffset * (this.container.radius - 15);
        const spawnX = this.container.x + Math.cos(posRad) * distFromCenter;
        const spawnY = this.container.y + Math.sin(posRad) * distFromCenter;

        // 2. Calcul Direction du Tir (Vers le centre + Offset manuel)
        // L'angle vers le centre est posRad + 180 degrés (PI radians)
        const angleToCenter = posRad + Math.PI;
        const aimRad = angleToCenter + Phaser.Math.DegToRad(this.params.spawnAimOffset);

        const arrowLen = 40;
        const endX = spawnX + Math.cos(aimRad) * arrowLen;
        const endY = spawnY + Math.sin(aimRad) * arrowLen;

        // Dessin
        this.arrowGraphics.lineStyle(2, 0x00FF00, 1);
        this.arrowGraphics.beginPath(); this.arrowGraphics.moveTo(spawnX, spawnY); this.arrowGraphics.lineTo(endX, endY); this.arrowGraphics.strokePath();
        this.arrowGraphics.fillStyle(0xFFFFFF, 1); this.arrowGraphics.fillCircle(spawnX, spawnY, 4); // Base
        this.arrowGraphics.fillStyle(0x00FF00, 1); this.arrowGraphics.fillCircle(endX, endY, 3); // Pointe

        // E. SPAWN AUTO
        if (this.params.spawnActive && !this.params.spawnOnCollision) {
            if (time > this.lastSpawnTime + this.params.spawnRate && this.balls.getLength() < 400) {
                this.spawnBall();
                this.lastSpawnTime = time;
            }
        }

        // F. PHYSIQUE
        this.balls.children.each(ball => {
            if (ball.y > 1000 || ball.y < -500 || ball.x < -500 || ball.x > 1000) { ball.destroy(); return; }
            if (ball.body) { ball.setBounce(this.params.restitution); ball.body.setDrag(this.params.drag || 0); }

            const dx = ball.x - this.container.x;
            const dy = ball.y - this.container.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const ballRadius = 6; 

            // Mur
            if (dist + ballRadius > this.container.radius) {
                this.resolveWallCollision(ball, dx, dy, dist, ballRadius);
            }
            // Dents
            if (this.params.showTeeth && dist + ballRadius > (this.container.radius - 30)) {
                 let angle = Math.atan2(dy, dx) - this.container.angle;
                 angle = Phaser.Math.Wrap(angle, 0, Math.PI * 2);
                 const segmentIndex = Math.floor(angle / ((Math.PI * 2) / 24));
                 if (segmentIndex % 2 === 0) {
                    const nx = -dx / dist; const ny = -dy / dist;
                    const tx = -ny; const ty = nx; // Tangente
                    const rotDir = (this.params.sphereSpeed > 0) ? 1 : -1;
                    const push = 300 * this.params.restitution;
                    const spin = Math.abs(this.params.sphereSpeed) * 5000;
                    ball.setVelocity((nx * push) + (tx * spin * rotDir), (ny * push) + (ty * spin * rotDir));
                 }
            }
        });
        
        this.infoText.setText(`BILLES: ${this.balls.getLength()}`);
    }

    resolveWallCollision(ball, dx, dy, dist, ballRadius) {
        const nx = dx / dist; const ny = dy / dist;
        const vx = ball.body.velocity.x; const vy = ball.body.velocity.y;
        const dot = vx * nx + vy * ny;
        if (dot > 0) { 
            let rx = vx - 2 * dot * nx; let ry = vy - 2 * dot * ny;
            if (this.params.sphereSpeed !== 0) {
                const tx = -ny; const ty = nx;
                const wallVel = this.params.sphereSpeed * 1000; 
                rx += tx * wallVel * 0.1; ry += ty * wallVel * 0.1;
            }
            ball.setVelocity(rx * this.params.restitution, ry * this.params.restitution);
            const overlap = (dist + ballRadius) - this.container.radius;
            ball.x -= nx * overlap; ball.y -= ny * overlap;
        }
    }

    spawnBall() {
        // 1. Calcul Position (Idem que le dessin)
        const posRad = Phaser.Math.DegToRad(this.params.spawnPosAngle);
        const distFromCenter = this.params.spawnOffset * (this.container.radius - 15);
        const spawnX = this.container.x + Math.cos(posRad) * distFromCenter;
        const spawnY = this.container.y + Math.sin(posRad) * distFromCenter;

        // 2. Calcul Vélocité (Idem que le dessin)
        const angleToCenter = posRad + Math.PI;
        const aimRad = angleToCenter + Phaser.Math.DegToRad(this.params.spawnAimOffset);
        
        const forceVal = (this.params.spawnForce > 0) ? this.params.spawnForce : 10;
        const speed = forceVal * 100;

        // 3. Création
        const rand = Math.random() * (this.params.propRed + this.params.propGreen + this.params.propBlue);
        let tint = 0xFFFFFF;
        if (rand < this.params.propRed) tint = 0xFF4444;
        else if (rand < this.params.propRed + this.params.propGreen) tint = 0x44FF44;
        else tint = 0x4444FF;

        const ball = this.balls.create(spawnX, spawnY, 'ballTexture');
        ball.setTint(tint);
        ball.setCircle(6);
        ball.setBounce(1);
        ball.setFriction(0);
        ball.body.checkWorldBounds = false; 
        
        ball.setVelocity(Math.cos(aimRad) * speed, Math.sin(aimRad) * speed);
    }

    resetSceneParams() {
        this.params = { ...this.defaultParams };
        for (const key in this.sliders) { if (this.sliders[key]) this.sliders[key].updateVisuals(this.params[key]); }
        if(this.chkGhost) this.chkGhost.updateState(this.params.ghostMode);
        if(this.chkSpawn) this.chkSpawn.updateState(this.params.spawnActive);
        if(this.chkColSpawn) this.chkColSpawn.updateState(this.params.spawnOnCollision);
        if(this.chkTeeth) this.chkTeeth.updateState(this.params.showTeeth);
        this.balls.clear(true, true); this.physics.resume();
    }

    // --- UI COMPACTE ---
    createLabUI() {
        const panelX = 580; // Décalé plus à droite
        const panelW = 210; // Plus étroit (était 240)
        const panelH = 500; // Moins haut
        const startY = 5;   

        this.add.rectangle(panelX + panelW/2, 300, panelW, panelH, 0x111111).setStrokeStyle(1, 0x00FF00);
        this.add.text(panelX + panelW/2, startY + 10, "ARCADE LAB", { fontSize: '16px', color: '#00FF00', fontStyle:'bold' }).setOrigin(0.5);
        this.infoText = this.add.text(panelX + panelW/2, startY + 28, "BILLES: 0", { fontSize: '12px', color: '#FFF' }).setOrigin(0.5);
        
        this.sliders = {}; 
        let y = startY + 45; 
        const gap = 24; // Espace réduit entre les lignes (était 30)
        const slWidth = 170; // Sliders plus courts

        // Helper pour titres de section compacts
        const addHeader = (txt) => { this.add.text(panelX + 10, y, txt, { fontSize: '10px', color: '#00FF00' }); y += 14; };

        addHeader("PHYSIQUE");
        this.sliders['gravity'] = this.createSlider(panelX + 20, y, slWidth, "GRAVITÉ", -2, 2, this.params.gravity, 0.1, v => this.params.gravity = v); y += gap;
        this.sliders['drag'] = this.createSlider(panelX + 20, y, slWidth, "FRICTION AIR", 0, 100, this.params.drag, 1, v => this.params.drag = v); y += gap;
        this.sliders['restitution'] = this.createSlider(panelX + 20, y, slWidth, "REBOND", 0.1, 1.2, this.params.restitution, 0.1, v => this.params.restitution = v); y += gap;
        this.chkGhost = this.createCheckbox(panelX + 20, y, "GHOST MODE (Traverser)", this.params.ghostMode, v => this.params.ghostMode = v); y += gap;

        addHeader("SPHÈRE");
        this.sliders['sphereSpeed'] = this.createSlider(panelX + 20, y, slWidth, "VITESSE ROUE", -0.1, 0.1, this.params.sphereSpeed, 0.001, v => this.params.sphereSpeed = v); y += gap;
        this.chkTeeth = this.createCheckbox(panelX + 20, y, "DENTS (BRASSAGE)", this.params.showTeeth, v => this.params.showTeeth = v); y += gap;

        addHeader("COULEURS (RGB)");
        // Sliders RGB compactés
        this.sliders['propRed'] = this.createSlider(panelX + 20, y, slWidth, "R", 0, 10, this.params.propRed, 1, v => this.params.propRed = v, 0xFF4444); y += 18; // Gap très réduit
        this.sliders['propGreen'] = this.createSlider(panelX + 20, y, slWidth, "G", 0, 10, this.params.propGreen, 1, v => this.params.propGreen = v, 0x44FF44); y += 18;
        this.sliders['propBlue'] = this.createSlider(panelX + 20, y, slWidth, "B", 0, 10, this.params.propBlue, 1, v => this.params.propBlue = v, 0x4444FF); y += gap + 5;

        addHeader("CANON & SPAWN");
        this.chkSpawn = this.createCheckbox(panelX + 20, y, "TIR AUTO", this.params.spawnActive, v => this.params.spawnActive = v); y += gap;
        this.chkColSpawn = this.createCheckbox(panelX + 20, y, "SPAWN SUR CHOC", this.params.spawnOnCollision, v => this.params.spawnOnCollision = v); y += gap;
        
        // Nouveaux contrôles Spawner
        this.sliders['spawnOffset'] = this.createSlider(panelX + 20, y, slWidth, "DIST. CENTRE", 0, 0.95, this.params.spawnOffset, 0.05, v => this.params.spawnOffset = v); y += gap;
        this.sliders['spawnPosAngle'] = this.createSlider(panelX + 20, y, slWidth, "POS. SUR CERCLE", -180, 180, this.params.spawnPosAngle, 5, v => this.params.spawnPosAngle = v); y += gap;
        this.sliders['spawnAimOffset'] = this.createSlider(panelX + 20, y, slWidth, "ORIENTATION TIR", -90, 90, this.params.spawnAimOffset, 5, v => this.params.spawnAimOffset = v); y += gap;
        
        this.sliders['spawnRate'] = this.createSlider(panelX + 20, y, slWidth, "CADENCE (ms)", 10, 500, this.params.spawnRate, 10, v => this.params.spawnRate = v); y += gap;
        this.sliders['spawnForce'] = this.createSlider(panelX + 20, y, slWidth, "FORCE", 0, 30, this.params.spawnForce, 1, v => this.params.spawnForce = v); y += gap + 10;
        
        // BOUTONS (Remontés pour être visibles)
        const btnY = y;
        const btnH = 20;
        const btnClear = this.add.rectangle(panelX + 40, btnY, 60, btnH, 0xAA0000).setInteractive({useHandCursor:true});
        this.add.text(panelX + 40, btnY, "VIDER", { fontSize: '10px', fontWeight:'bold' }).setOrigin(0.5);
        btnClear.on('pointerdown', () => { this.balls.clear(true, true); });

        const btnReset = this.add.rectangle(panelX + 110, btnY, 60, btnH, 0x444444).setInteractive({useHandCursor:true});
        this.add.text(panelX + 110, btnY, "RESET", { fontSize: '10px', fontWeight:'bold' }).setOrigin(0.5);
        btnReset.on('pointerdown', () => { this.balls.clear(true, true); this.resetSceneParams(); });

        const btnSpawn = this.add.rectangle(panelX + 180, btnY, 60, btnH, 0x008800).setInteractive({useHandCursor:true});
        this.add.text(panelX + 180, btnY, "TIR (+)", { fontSize: '10px', fontWeight:'bold' }).setOrigin(0.5);
        btnSpawn.on('pointerdown', () => { this.spawnBall(); });
    }

    createSlider(x, y, width, label, min, max, initialValue, step, callback, colorTint = 0xAAAAAA) {
        // Version compacte des sliders
        const txtLabel = this.add.text(x, y - 7, label, { fontSize: '9px', color: '#AAAAAA' });
        const txtValue = this.add.text(x + width, y - 7, initialValue.toFixed(step < 0.01 ? 3 : 0), { fontSize: '9px', color: '#FFFFFF', align:'right' }).setOrigin(1, 0);
        this.add.rectangle(x + width/2, y + 2, width, 2, 0x333333); // Ligne plus fine
        
        const getHandleX = (val) => x + ((val - min) / (max - min) * width);
        const handle = this.add.rectangle(getHandleX(initialValue), y + 2, 10, 10, 0xFFFFFF).setInteractive({ draggable: true }); // Poignée plus petite
        if(colorTint !== 0xAAAAAA) handle.setFillStyle(colorTint);
        
        const updateVisuals = (val) => {
            if(step >= 1) val = Math.round(val);
            val = Phaser.Math.Clamp(val, min, max);
            handle.x = getHandleX(val);
            txtValue.setText(val.toFixed(step < 0.01 ? 3 : (step < 1 ? 2 : 0)));
        };
        const setValue = (val) => updateVisuals(val);

        handle.on('drag', (pointer, dragX) => {
            const ratio = Phaser.Math.Clamp((dragX - x) / width, 0, 1);
            let newVal = min + (ratio * (max - min));
            if (step > 0) newVal = Math.round(newVal / step) * step;
            updateVisuals(newVal); callback(newVal);
        });
        return { updateVisuals, setValue };
    }

    createCheckbox(x, y, label, initialState, callback) {
        const box = this.add.rectangle(x + 6, y + 2, 10, 10, initialState ? 0x00FF00 : 0x333333).setInteractive({useHandCursor:true});
        this.add.text(x + 20, y - 4, label, { fontSize: '10px', color: '#FFF' }).setOrigin(0, 0);
        const updateState = (st) => { box.fillColor = st ? 0x00FF00 : 0x333333; }
        box.on('pointerdown', () => { 
            const newState = !(box.fillColor === 0x00FF00); 
            updateState(newState); callback(newState); 
        });
        return { updateState };
    }
    
    createBackButton() {
         const bg = this.add.rectangle(0, 0, 60, 20, 0x555555).setStrokeStyle(1, 0xFFFFFF);
         const text = this.add.text(0, 0, "RETOUR", { fontSize: '10px', fill: '#FFFFFF' }).setOrigin(0.5);
         const buttonContainer = this.add.container(40, 20, [bg, text]);
         bg.setInteractive({ useHandCursor: true });
         bg.on('pointerdown', () => this.scene.start(SCENE_KEYS.MENU));
    }
}