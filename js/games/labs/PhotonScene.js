// PhotonScene.js - VERSION "PRECISION STUDIO"
// - Sliders avec Steps et Valeurs
// - Snap Centre & Bord
// - Contrôle Polaire (Angle/Distance)
// - Syncro Drag <-> UI

class PhotonScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'PhotonScene',
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            }
        });
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const uiWidth = 280; // Un peu plus large pour les valeurs

        // --- CONFIGURATION ---
        this.params = {
            friction: 0.000,
            gravity: 0,
            force: 20,
            fireRate: 50,
            autoFire: false,
            autoRotateSpeed: 0,
            
            // Paramètres Polaires du Spawner
            spawnerDist: 0, // Distance du centre
            spawnerAngle: 0, // Angle sur le cercle
            
            cx: (width - uiWidth) / 2,
            cy: height / 2,
            universeRadius: Math.min((width - uiWidth) / 2, height / 2) - 40,
            hue: 0
        };

        this.balls = this.physics.add.group();
        this.lastFire = 0;
        
        // Stockage des références UI pour mise à jour live
        this.uiRefs = {}; 

        // Texture bille
        const gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFFFFF); gfx.fillCircle(4, 4, 4);
        gfx.generateTexture('ball', 8, 8);

        // --- VISUELS MONDE ---
        this.universe = this.add.graphics();

        // --- SPAWNER ---
        this.spawner = this.add.container(this.params.cx, this.params.cy);
        
        // 1. Canon
        this.barrel = this.add.rectangle(20, 0, 40, 4, 0x666666);
        // 2. Base (Drag Position)
        this.baseParams = this.add.circle(0, 0, 15, 0xFFFFFF).setInteractive({ draggable: true });
        // 3. Viseur (Drag Rotation)
        this.aimer = this.add.circle(45, 0, 6, 0x00FF00).setInteractive({ draggable: true });

        this.spawner.add([this.barrel, this.baseParams, this.aimer]);

        // LOGIQUE DRAG & DROP AVANCÉE
        this.input.setDraggable([this.baseParams, this.aimer]);

        this.input.on('drag', (pointer, obj, dragX, dragY) => {
            if (obj === this.baseParams) {
                // Déplacement manuel
                let angle = Phaser.Math.Angle.Between(this.params.cx, this.params.cy, pointer.x, pointer.y);
                let dist = Phaser.Math.Distance.Between(this.params.cx, this.params.cy, pointer.x, pointer.y);

                // --- SYSTEME DE SNAP (AIMANT) ---
                // 1. Snap Centre
                if (dist < 20) dist = 0;
                // 2. Snap Bordure
                else if (dist > this.params.universeRadius - 20) dist = this.params.universeRadius;

                // Mise à jour params
                this.params.spawnerDist = dist;
                this.params.spawnerAngle = Phaser.Math.RadToDeg(angle);

                // Mise à jour position visuelle
                this.updateSpawnerPosFromParams();
                
                // Mise à jour des Sliders (Feedback visuel)
                if (this.uiRefs.distSlider) this.uiRefs.distSlider.update(dist);
                if (this.uiRefs.angleSlider) this.uiRefs.angleSlider.update(this.params.spawnerAngle);
            } 
            else if (obj === this.aimer) {
                // Orientation
                const angle = Phaser.Math.Angle.Between(this.spawner.x, this.spawner.y, pointer.x, pointer.y);
                this.spawner.rotation = angle;
            }
        });

        // --- INTERFACE ---
        this.createUI(width, uiWidth);
        this.createBackButton();
    }

    // Fonction centrale pour placer le spawner selon les params (Distance/Angle)
    updateSpawnerPosFromParams() {
        const rad = Phaser.Math.DegToRad(this.params.spawnerAngle);
        this.spawner.x = this.params.cx + Math.cos(rad) * this.params.spawnerDist;
        this.spawner.y = this.params.cy + Math.sin(rad) * this.params.spawnerDist;
    }

    update(time, delta) {
        this.physics.world.gravity.y = this.params.gravity * 300;
        
        if (this.params.autoRotateSpeed !== 0) {
            this.spawner.angle += this.params.autoRotateSpeed;
        }

        // Dessin Univers
        this.universe.clear();
        this.universe.lineStyle(2, 0x444444);
        this.universe.strokeCircle(this.params.cx, this.params.cy, this.params.universeRadius);
        // Petit point au centre pour viser le snap
        this.universe.fillStyle(0x333333);
        this.universe.fillCircle(this.params.cx, this.params.cy, 5);

        // Tir Auto
        if (this.params.autoFire && time > this.lastFire + this.params.fireRate) {
            this.fireBall();
            this.lastFire = time;
        }

        // Physique Custom
        this.balls.children.each(b => {
            if (b.active) {
                b.setDrag(this.params.friction * 100); 

                const dx = b.x - this.params.cx;
                const dy = b.y - this.params.cy;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const limit = this.params.universeRadius;

                if (dist + 4 > limit) {
                    const nx = dx / dist; const ny = dy / dist;
                    const v = b.body.velocity;
                    const dot = v.x * nx + v.y * ny;

                    if (dot > 0) {
                        const rx = v.x - 2 * dot * nx;
                        const ry = v.y - 2 * dot * ny;
                        b.setVelocity(rx, ry);
                        const overlap = (dist + 4) - limit;
                        b.x -= nx * overlap; b.y -= ny * overlap;
                    }
                }
                if (b.y > 3000 || b.x > 3000 || b.x < -1000) b.destroy();
            }
        });
    }

    fireBall() {
        const tipX = this.spawner.x + Math.cos(this.spawner.rotation) * 40;
        const tipY = this.spawner.y + Math.sin(this.spawner.rotation) * 40;

        const b = this.balls.create(tipX, tipY, 'ball');
        
        this.params.hue = (this.params.hue + 0.005) % 1;
        const color = Phaser.Display.Color.HSLToColor(this.params.hue, 1, 0.5);
        b.setTint(color.color);

        b.setCircle(4); b.setBounce(1); b.setFriction(0);
        
        const speed = this.params.force * 50;
        b.setVelocity(Math.cos(this.spawner.rotation) * speed, Math.sin(this.spawner.rotation) * speed);
    }

    createUI(width, uiWidth) {
        const panelX = width - uiWidth;
        const height = this.scale.height;
        
        this.add.rectangle(panelX + uiWidth/2, height/2, uiWidth, height, 0x111111);
        this.add.line(0, 0, panelX, 0, panelX, height, 0x00FF00).setOrigin(0);

        let y = 20;
        const x = panelX + 20;
        const w = uiWidth - 50; // Place pour le texte à droite

        const addLabel = (txt) => {
            this.add.text(x, y, txt, { fontSize: '11px', color: '#0f0', fontStyle:'bold' });
            y += 18;
        };
        
        // --- 1. PARAMETRES MOTEUR ---
        addLabel("FRICTION (0.00 = Parfait)");
        this.addSlider(x, y, w, 0, 0.05, 0, 0.001, val => this.params.friction = val);
        y += 35;

        addLabel("GRAVITÉ");
        this.addSlider(x, y, w, -2, 2, 0, 0.1, val => this.params.gravity = val);
        y += 35;

        // --- 2. POSITION CANON (POLAIRE) ---
        addLabel("POSITION : DISTANCE (Snap Centre/Bord)");
        // Slider Distance
        this.uiRefs.distSlider = this.addSlider(x, y, w, 0, this.params.universeRadius, 0, 1, val => {
            // Logique de Snap interne au slider
            if (val < 20) val = 0;
            if (val > this.params.universeRadius - 20) val = this.params.universeRadius;
            
            this.params.spawnerDist = val;
            this.updateSpawnerPosFromParams();
            return val; // Retourne la valeur snappée pour l'affichage
        });
        y += 35;

        addLabel("POSITION : ANGLE SUR CERCLE");
        // Slider Angle
        this.uiRefs.angleSlider = this.addSlider(x, y, w, -180, 180, 0, 5, val => {
            this.params.spawnerAngle = val;
            this.updateSpawnerPosFromParams();
        });
        y += 35;

        // --- 3. PARAMETRES TIR ---
        addLabel("PUISSANCE TIR");
        this.addSlider(x, y, w, 1, 50, 20, 1, val => this.params.force = val);
        y += 35;

        addLabel("CADENCE (ms)");
        this.addSlider(x, y, w, 10, 500, 50, 10, val => this.params.fireRate = 510 - val);
        y += 35;

        addLabel("ROTATION AUTO");
        this.addSlider(x, y, w, -5, 5, 0, 0.1, val => this.params.autoRotateSpeed = val);
        y += 45;

        // --- BOUTONS ---
        const btnOneShot = this.createBtn(x, y, w + 30, "TIR UNIQUE", () => this.fireBall());
        y += 40;

        const btnAuto = this.createBtn(x, y, w + 30, "TIR AUTO : OFF", () => {
            this.params.autoFire = !this.params.autoFire;
            btnAuto.textObj.setText(this.params.autoFire ? "TIR AUTO : ON" : "TIR AUTO : OFF");
            btnAuto.rect.fillColor = this.params.autoFire ? 0x008800 : 0x333333;
        });
        y += 40;
        
        const btnClear = this.createBtn(x, y, w + 30, "VIDER TOUT", () => this.balls.clear(true, true), 0x880000);
    }

    // --- NOUVEAU SYSTEME DE SLIDER ---
    addSlider(x, y, w, min, max, initial, step, callback) {
        // Ligne de fond
        this.add.rectangle(x + w/2, y, w, 2, 0x333333);
        
        // Texte Valeur (à droite du slider)
        const valText = this.add.text(x + w + 10, y, initial.toFixed(step < 1 ? (step < 0.01 ? 3 : 1) : 0), { 
            fontSize: '11px', color: '#fff' 
        }).setOrigin(0, 0.5);

        // Calcul position initiale
        let ratio = (initial - min) / (max - min);
        const handle = this.add.rectangle(x + (ratio * w), y, 14, 14, 0xcccccc).setInteractive({ draggable: true });

        // Fonction de mise à jour (accessible de l'extérieur)
        const updateVisuals = (val) => {
            // Appliquer le Step
            if (step > 0) {
                val = Math.round(val / step) * step;
            }
            // Clamp
            val = Phaser.Math.Clamp(val, min, max);

            // Mise à jour visuelle
            ratio = (val - min) / (max - min);
            handle.x = x + (ratio * w);
            
            // Formatage texte intelligent
            let decimals = 0;
            if (step < 1) decimals = 1;
            if (step < 0.01) decimals = 3;
            valText.setText(val.toFixed(decimals));

            return val;
        };

        handle.on('drag', (p, dragX) => {
            const clampX = Phaser.Math.Clamp(dragX, x, x + w);
            const r = (clampX - x) / w;
            let val = min + r * (max - min);
            
            // On appelle le callback avec la valeur brute, 
            // le callback peut retourner une valeur modifiée (ex: snap)
            let finalVal = val;
            
            // Appliquer le step avant le callback pour cohérence
            if (step > 0) finalVal = Math.round(val / step) * step;
            
            // Callback utilisateur
            const returnedVal = callback(finalVal);
            
            // Si le callback retourne une valeur spécifique (ex: snap), on l'utilise
            if (returnedVal !== undefined) finalVal = returnedVal;

            updateVisuals(finalVal);
        });

        // Initialisation
        updateVisuals(initial);

        // Retourne la fonction d'update pour pilotage externe (drag de la souris sur le spawner)
        return { update: updateVisuals };
    }

    createBtn(x, y, w, text, callback, color = 0x333333) {
        const rect = this.add.rectangle(x + w/2, y, w, 30, color).setInteractive({useHandCursor:true});
        const textObj = this.add.text(x + w/2, y, text, { fontSize: '12px', fontStyle:'bold' }).setOrigin(0.5);
        rect.on('pointerdown', callback);
        return { rect, textObj };
    }

    createBackButton() {
         const bg = this.add.rectangle(40, 30, 70, 30, 0x333333).setStrokeStyle(1, 0xFFFFFF);
         const text = this.add.text(40, 30, "RETOUR", { fontSize: '12px', fill: '#FFFFFF' }).setOrigin(0.5);
         bg.setInteractive({ useHandCursor: true });
         bg.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}