// js/scenes/MenuScene.js

class MenuScene extends Phaser.Scene {
    constructor() {
        super(SCENE_KEYS.MENU); 
        this.menuItems = [];
        // --- CONFIGURATION DE LA ROUE ---
        this.selectedIndex = 0;
        this.scrollIndex = 0; 
        this.centerY = 350;   
        this.radiusY = 160;   
        this.angleStep = 0.4; 
        this.stars = []; // Initialisation importante
    }

    create() {
        // --- 1. FOND ÉTOILÉ ---
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            const star = this.add.rectangle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 2),
                Phaser.Math.Between(1, 2),
                0x888888 
            );
            star.speed = Phaser.Math.FloatBetween(0.2, 1);
            this.stars.push(star);
        }

        // --- 2. TITRE ---
        const title = this.add.text(400, 80, "SWICH 974", { 
            fontSize: '72px', fontFamily: 'Courier', fontStyle: 'bold',
            fill: '#00FF00', shadow: { blur: 20, color: '#00FF00', fill: true }
        }).setOrigin(0.5);

        this.add.text(400, 130, "- SELECTEUR DE JEUX -", {
            fontSize: '16px', fill: '#00AA00', fontFamily: 'Courier'
        }).setOrigin(0.5);

        // --- 3. CRÉATION DES ITEMS (DYNAMIQUE) ---
        this.menuItems = [];
        
        // Sécurité : on vérifie que le manifeste existe
        if (typeof GAMES_MANIFEST !== 'undefined') {
            GAMES_MANIFEST.forEach((game, index) => {
                const item = this.add.text(400, 800, game.title, { 
                    fontSize: '32px', fill: '#FFFFFF', fontFamily: 'Courier', align: 'center'
                }).setOrigin(0.5);
                
                item.sceneKey = game.className; // On stocke la clé pour le lancement
                this.menuItems.push(item);
            });
        } else {
            console.error("GAMES_MANIFEST est introuvable dans MenuScene !");
        }
        
        // --- 4. INPUTS ---
        this.input.keyboard.on('keydown-DOWN', this.navigateDown, this);
        this.input.keyboard.on('keydown-UP', this.navigateUp, this);
        this.input.keyboard.on('keydown-ENTER', this.launchGame, this);
    }

    update() {
        // Animation étoiles
        if (this.stars) {
            this.stars.forEach(star => {
                star.x -= star.speed;
                if (star.x < 0) star.x = 800;
            });
        }

        // Animation Roue
        this.scrollIndex += (this.selectedIndex - this.scrollIndex) * 0.1;

        if (this.menuItems) {
            this.menuItems.forEach((item, index) => {
                const distance = index - this.scrollIndex;
                const angle = distance * this.angleStep;

                item.y = this.centerY + Math.sin(angle) * this.radiusY;
                
                let scale = Math.cos(angle) * 0.7;
                
                if (Math.abs(angle) > 1.6) {
                    item.setVisible(false);
                } else {
                    item.setVisible(true);
                    const lensEffect = Math.max(0, 1 - Math.abs(distance)); 
                    scale += lensEffect * 0.5;
                    item.setScale(scale);
                    item.setAlpha(scale); 
                    
                    if (Math.abs(distance) < 0.3) {
                        item.setColor('#00FF00');
                        item.setShadow(0, 0, '#00FF00', 10 * scale, true, true);
                    } else {
                        item.setColor('#888888');
                        item.setShadow(0, 0, '#000000', 0);
                    }
                }
            });
        }
    }

    navigateDown() {
        if (this.selectedIndex < this.menuItems.length - 1) {
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
        const selectedItem = this.menuItems[this.selectedIndex];
        
        // Animation
        this.tweens.add({
            targets: selectedItem, scale: 3, alpha: 0, duration: 500
        });

        // Lancement via la propriété sceneKey stockée
        this.time.delayedCall(400, () => {
            this.scene.start(selectedItem.sceneKey);
        });
    }
}