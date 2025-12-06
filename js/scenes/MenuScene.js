// MenuScene.js - VERSION "WHEEL LENS" (Roue & Effet Loupe)

const GameList = {
    // Liste des jeux (L'ordre compte pour l'affichage)
    FLAPPY: { title: "BIRDY 974", path: SCENE_KEYS.FLAPPY },
    RUNNER: { title: "T-ZOURIT", path: SCENE_KEYS.RUNNER },
    ARKANOID: { title: "BRIK BREAKER", path: SCENE_KEYS.ARKANOID },
    LIFE: { title: "GENESIS (ALIFE)", path: SCENE_KEYS.LIFE },
    OCTOPUS: { title: "ZOURIT ATTACK", path: SCENE_KEYS.OCTOPUS },
    FLAPPY_BASIC:  { title: "BIRDY (Dev)", path: SCENE_KEYS.FLAPPY_BASIC },
    RUNNER_BASIC: { title: "T-ZOURIT (Dev)", path: SCENE_KEYS.RUNNER_BASIC }
};

class MenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.MENU); 
        this.gameKeys = Object.keys(GameList);
        this.menuItems = [];
        this.stars = []; 
        
        // --- CONFIGURATION DE LA ROUE ---
        this.selectedIndex = 0;
        this.scrollIndex = 0; // Position "flottante" pour l'animation fluide
        this.centerY = 350;   // Centre vertical de la roue
        this.radiusY = 160;   // Rayon vertical (Ecartement)
        this.radiusZ = 0.5;   // Profondeur (Scale)
        this.angleStep = 0.4; // Ecart entre deux items (en radians)
    }

    create() {
        // --- 1. FOND ÉTOILÉ (STARFIELD) ---
        for (let i = 0; i < 150; i++) {
            const star = this.add.rectangle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 2),
                Phaser.Math.Between(1, 2),
                0x888888 // Étoiles un peu plus ternes pour ne pas gêner
            );
            star.speed = Phaser.Math.FloatBetween(0.2, 1);
            this.stars.push(star);
        }

        // --- 2. TITRE (Position Fixe et Sécurisée) ---
        // On le met bien haut pour laisser la place à la roue
        const titleBg = this.add.text(400, 80, "SWICH 974", { 
            fontSize: '72px', fontFamily: 'Courier', fontStyle: 'bold',
            fill: '#003300', stroke: '#00FF00', strokeThickness: 8
        }).setOrigin(0.5).setAlpha(0.2); // Ombre portée "Ghost"

        const title = this.add.text(400, 80, "SWICH 974", { 
            fontSize: '72px', fontFamily: 'Courier', fontStyle: 'bold',
            fill: '#00FF00', shadow: { blur: 20, color: '#00FF00', fill: true }
        }).setOrigin(0.5);

        // Petite animation "Respiration"
        this.tweens.add({
            targets: [title, titleBg],
            scale: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Sous-titre
        this.add.text(400, 130, "- SELECTEUR DE JEUX -", {
            fontSize: '16px', fill: '#00AA00', fontFamily: 'Courier'
        }).setOrigin(0.5);

        // --- 3. CRÉATION DES ITEMS DE LA ROUE ---
        this.menuItems = [];
        this.gameKeys.forEach((key, index) => {
            const item = this.add.text(400, 800, GameList[key].title, { // On les crée hors écran au début
                fontSize: '32px', 
                fill: '#FFFFFF',
                fontFamily: 'Courier',
                align: 'center'
            }).setOrigin(0.5);
            
            // On stocke l'index cible dans l'objet pour s'y retrouver
            item.targetIndex = index;
            this.menuItems.push(item);
        });
        
        // --- 4. SCANLINES (Effet TV) ---
        const scanlines = this.add.graphics();
        scanlines.fillStyle(0x000000, 0.15);
        for (let y = 0; y < 600; y += 3) scanlines.fillRect(0, y, 800, 1);
        scanlines.setDepth(100);

        // --- 5. INPUTS ---
        this.input.keyboard.on('keydown-DOWN', this.navigateDown, this);
        this.input.keyboard.on('keydown-UP', this.navigateUp, this);
        this.input.keyboard.on('keydown-ENTER', this.launchGame, this);
        
        // Instructions
        this.add.text(400, 560, "▲▼ NAVIGUER   [ENTRÉE] JOUER", {
            fontSize: '14px', fill: '#666666'
        }).setOrigin(0.5);
    }

    update() {
        // A. Animation des étoiles
        this.stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < 0) star.x = 800;
        });

        // B. Animation Fluide de la Roue (Lerp)
        // On rapproche doucement 'scrollIndex' vers 'selectedIndex'
        // 0.1 = Vitesse de lissage (plus c'est bas, plus c'est "lourd")
        this.scrollIndex += (this.selectedIndex - this.scrollIndex) * 0.1;

        // C. Positionnement Mathématique (L'effet Roue)
        this.menuItems.forEach((item, index) => {
            // Distance par rapport au centre de la sélection
            const distance = index - this.scrollIndex;
            
            // Calcul de l'angle sur la roue virtuelle
            // distance * angleStep = angle en radians
            const angle = distance * this.angleStep;

            // 1. Position Y (Sinus) : Ça tourne !
            // On ajoute centerY pour centrer sur l'écran
            item.y = this.centerY + Math.sin(angle) * this.radiusY;

            // 2. Effet Loupe (Cosinus) : Ce qui est au centre (angle 0) est gros
            // Math.cos(0) = 1 (Max size). Math.cos(PI) = -1 (Derrière)
            // On empêche que ça devienne négatif ou trop petit avec Math.abs ou max
            let scale = Math.cos(angle) * 0.7; // 0.7 = facteur d'échelle global
            
            // Correction pour les items "derrière" la roue (visibilité)
            // Si l'angle est trop grand (> 90° ou < -90°), c'est derrière
            if (Math.abs(angle) > 1.6) {
                item.setVisible(false);
            } else {
                item.setVisible(true);
                // On booste la taille de l'item sélectionné (Lentille)
                // Plus on est proche de 0 (centre), plus on grossit
                const lensEffect = Math.max(0, 1 - Math.abs(distance)); 
                scale += lensEffect * 0.5; // +50% de taille si au centre
                
                item.setScale(scale);
                
                // 3. Opacité (Alpha) et Couleur
                // Plus c'est loin, plus c'est transparent
                item.setAlpha(scale); 
                
                // Si c'est l'item actif (proche de 0), on met en jaune/vert
                if (Math.abs(distance) < 0.3) {
                    item.setColor('#00FF00');
                    item.setShadow(0, 0, '#00FF00', 10 * scale, true, true);
                } else {
                    item.setColor('#888888');
                    item.setShadow(0, 0, '#000000', 0);
                }
            }
            
            // 4. Position X (Optionnel : léger arc de cercle)
            // item.x = 400 + Math.sin(angle) * 20; 
        });
    }

    navigateDown() {
        if (this.selectedIndex < this.gameKeys.length - 1) {
            this.selectedIndex++;
            this.sound.play(ASSET_KEYS.CLICK_SFX); 
        }
    }

    navigateUp() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.sound.play(ASSET_KEYS.CLICK_SFX); 
        }
    }

    launchGame() {
        this.sound.play(ASSET_KEYS.CONFIRM_SFX); 
        
        // Effet Flash
        this.cameras.main.flash(500, 0, 255, 0); // Flash vert Matrix

        // Animation de départ de l'item sélectionné
        const selectedItem = this.menuItems[this.selectedIndex];
        this.tweens.add({
            targets: selectedItem,
            scale: 3, // Zoom énorme vers le joueur
            alpha: 0,
            duration: 500
        });

        const selectedKey = this.gameKeys[this.selectedIndex];
        const gamePath = GameList[selectedKey].path;
        
        this.time.delayedCall(400, () => {
            this.scene.start(gamePath);
        });
    }
}