class GameOfLifeScene extends BaseGameScene {
    constructor() {
        super(SCENE_KEYS.LIFE);
    }

    create() {
        this.createBackButton();
        
        // --- 1. CONFIGURATION DE LA SIMULATION ---
        // Une grille immense de 200x150 cellules
        this.cellSize = 4; 
        this.cols = 800 / this.cellSize; // 200
        this.rows = 600 / this.cellSize; // 150
        
        // "Le Cerveau" : Deux tableaux simples (0 ou 1)
        this.grid = new Uint8Array(this.cols * this.rows);
        this.nextGrid = new Uint8Array(this.cols * this.rows);

        // --- 2. LE RENDU HAUTE PERFORMANCE ---
        this.canvasTexture = this.textures.createCanvas('lifeTexture', this.cols * this.cellSize, this.rows * this.cellSize);
        this.image = this.add.image(400, 300, 'lifeTexture');
        
        this.ctx = this.canvasTexture.getContext();

        // --- 3. INITIALISATION ET UI ---
        this.isRunning = false;
        this.generation = 0;

        // Création de l'interface utilisateur (HUD)
        this.createHUD();

        // --- 4. INPUTS (CONTRÔLES) ---
        
        // Souris : Dessiner la vie
        this.input.on('pointerdown', (pointer) => this.drawLife(pointer));
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) this.drawLife(pointer);
        });

        // Clavier - Commandes Générales
        this.input.keyboard.on('keydown-SPACE', () => this.togglePause());
        this.input.keyboard.on('keydown-R', () => this.resetGrid());
        
        // Clavier - Tampons Historiques
        this.input.keyboard.on('keydown-G', () => this.applyPattern('glider'));
        this.input.keyboard.on('keydown-C', () => this.applyPattern('gosper'));
        this.input.keyboard.on('keydown-S', () => this.applyPattern('spaceship'));
        this.input.keyboard.on('keydown-P', () => this.applyPattern('pulsar')); // Ajout d'un petit bonus

        // Timer pour la boucle de simulation (Vitesse : 50ms)
        this.time.addEvent({ delay: 50, loop: true, callback: () => this.tick() });
    }

    // --- CRÉATION DE L'INTERFACE (HUD) ---
    createHUD() {
        // 1. Panneau Latéral de Commandes (À Droite)
        const hudBg = this.add.rectangle(700, 300, 180, 500, 0x000000, 0.7)
            .setStrokeStyle(1, 0x00FF00);
        
        this.add.text(700, 80, "COMMANDES", { fontSize: '20px', fill: '#00FF00', fontWeight: 'bold' }).setOrigin(0.5);

        const commands = [
            "[ESPACE]  Play/Pause",
            "[SOURIS]  Dessiner",
            "[R]       Tout Effacer",
            "----------------",
            "MOTIFS (Presser):",
            "[G] Glider (Hacker)",
            "[S] Vaisseau",
            "[C] Canon Gosper",
            "[P] Pulsar"
        ];

        let yPos = 120;
        commands.forEach(cmd => {
            this.add.text(620, yPos, cmd, { fontSize: '14px', fill: '#FFFFFF', fontFamily: 'Courier' });
            yPos += 25;
        });

        // 2. Indicateur d'état (Haut Gauche)
        this.statusText = this.add.text(20, 20, "ÉTAT: PAUSE | GÉNÉRATION: 0", { 
            fontSize: '16px', fill: '#00FF00', backgroundColor: '#000000' 
        });

        // 3. Zone d'Information "Epistémologique" (Bas)
        this.infoContainer = this.add.container(400, 550);
        const infoBg = this.add.rectangle(0, 0, 700, 80, 0x002200, 0.9).setStrokeStyle(2, 0x00FF00);
        
        this.infoTitle = this.add.text(0, -25, "BIENVENUE DANS LE LABORATOIRE", { fontSize: '18px', fill: '#FFFF00', fontWeight:'bold' }).setOrigin(0.5);
        this.infoDesc = this.add.text(0, 5, "Utilisez les touches à droite pour insérer des formes légendaires.\nAppuyez sur ESPACE pour lancer l'évolution.", { 
            fontSize: '14px', fill: '#FFFFFF', align: 'center' 
        }).setOrigin(0.5);

        this.infoContainer.add([infoBg, this.infoTitle, this.infoDesc]);
    }

    // --- LE MOTEUR (Update Loop) ---
    tick() {
        if (!this.isRunning) return;

        this.computeNextGen();
        this.renderGrid();
        
        this.generation++;
        this.statusText.setText(`ÉTAT: EN COURS | GÉNÉRATION: ${this.generation}`);
    }

    togglePause() {
        this.isRunning = !this.isRunning;
        const state = this.isRunning ? "EN COURS" : "PAUSE";
        this.statusText.setText(`ÉTAT: ${state} | GÉNÉRATION: ${this.generation}`);
        
        // Petit effet visuel sur le texte
        this.statusText.setColor(this.isRunning ? '#00FF00' : '#FFFF00');
    }

    computeNextGen() {
        // Optimisation : boucle simple 1D
        for (let i = 0; i < this.grid.length; i++) {
            const x = i % this.cols;
            const y = Math.floor(i / this.cols);
            
            const neighbors = this.countNeighbors(x, y);
            const state = this.grid[i];

            // RÈGLES DE CONWAY
            if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                this.nextGrid[i] = 0; // Mort
            } else if (state === 0 && neighbors === 3) {
                this.nextGrid[i] = 1; // Naissance
            } else {
                this.nextGrid[i] = state; // Stabilité
            }
        }
        this.grid.set(this.nextGrid);
    }

    countNeighbors(x, y) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + this.cols) % this.cols;
                const row = (y + j + this.rows) % this.rows;
                sum += this.grid[row * this.cols + col];
            }
        }
        return sum;
    }

    renderGrid() {
        // Fond Noir
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);
        
        // Cellules Vivantes (Vert Néon)
        this.ctx.fillStyle = '#00FF00';
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === 1) {
                const x = (i % this.cols) * this.cellSize;
                const y = Math.floor(i / this.cols) * this.cellSize;
                this.ctx.fillRect(x, y, this.cellSize - 1, this.cellSize - 1);
            }
        }
        this.canvasTexture.refresh();
    }

    // --- INTERACTION ---

    drawLife(pointer) {
        // On convertit la position de la souris en coordonnées grille
        const x = Math.floor(pointer.x / this.cellSize);
        const y = Math.floor(pointer.y / this.cellSize);
        
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            const index = y * this.cols + x;
            this.grid[index] = 1;
            this.renderGrid();
        }
        // Si on dessine, on met à jour le texte pour dire ce qu'on fait
        if(!this.isRunning) {
            this.updateInfoPanel("MODE CRAYON", "Vous dessinez des cellules vivantes.\nAppuyez sur ESPACE pour voir si elles survivent.", "#FFFFFF");
        }
    }

    resetGrid() {
        this.grid.fill(0);
        this.renderGrid();
        this.isRunning = false;
        this.generation = 0;
        this.statusText.setText("ÉTAT: PAUSE | GÉNÉRATION: 0");
        this.updateInfoPanel("TABULA RASA", "La grille est vide. L'univers est à re-construire.\nUtilisez la souris ou les touches G, C, S, P.", "#00FFFF");
    }

    // --- GESTION DES PATTERNS & HISTOIRE ---
    
    updateInfoPanel(title, desc, color) {
        this.infoTitle.setText(title);
        this.infoTitle.setColor(color);
        this.infoDesc.setText(desc);
        
        // Petit effet "Pop" pour attirer l'attention
        this.tweens.add({
            targets: this.infoContainer,
            scale: { from: 0.9, to: 1 },
            alpha: { from: 0.5, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }

    applyPattern(type) {
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);
        
        let pattern = [];
        let title = "";
        let desc = "";
        let color = "#FFFF00";

        if (type === 'glider') {
            pattern = [[0, -1], [1, 0], [-1, 1], [0, 1], [1, 1]];
            title = "LE GLIDER (1970)";
            desc = "L'emblème des Hackers. C'est la plus petite structure mobile.\nElle se déplace en diagonale indéfiniment.";
            color = "#00FF00";
        } 
        else if (type === 'gosper') {
            // Gosper Glider Gun
            pattern = [
                [0,4], [0,5], [1,4], [1,5], [10,4], [10,5], [10,6], [11,3], [11,7], [12,2], [12,8],
                [13,2], [13,8], [14,5], [15,3], [15,7], [16,4], [16,5], [16,6], [17,5], [20,2], [20,3], [20,4],
                [21,2], [21,3], [21,4], [22,1], [22,5], [24,0], [24,1], [24,5], [24,6], [34,2], [34,3], [35,2], [35,3]
            ].map(p => [p[0]-15, p[1]-5]); 
            title = "CANON DE GOSPER";
            desc = "La première 'usine' découverte. Elle fabrique des Gliders à l'infini.\nProuve que la vie peut croître sans limite dans un espace fini.";
            color = "#00FFFF";
        }
        else if (type === 'spaceship') {
            // LWSS
            pattern = [[-1,-1], [2,-1], [3,0], [3,1], [3,2], [2,2], [1,2], [0,2], [-1,1]];
            title = "VAISSEAU LÉGER (LWSS)";
            desc = "Contrairement au Glider, ce vaisseau avance tout droit.\nIl 'nage' à travers la grille à une vitesse constante.";
            color = "#FF00FF";
        }
        else if (type === 'pulsar') {
            // Pulsar (Oscillateur période 3) - Un feu d'artifice statique
            title = "LE PULSAR";
            desc = "Un oscillateur magnifique et stable de période 3.\nIl ne se déplace pas, mais 'respire' comme une étoile.";
            color = "#FFAA00";
            // Construction simplifiée du Pulsar (c'est grand !)
            // On fait juste un quart et on symétrise pour faire simple, ou on hardcode quelques lignes
            const lines = [
                [-4, -6], [-3, -6], [-2, -6], [2, -6], [3, -6], [4, -6],
                [-6, -4], [-1, -4], [1, -4], [6, -4],
                [-6, -3], [-1, -3], [1, -3], [6, -3],
                [-6, -2], [-1, -2], [1, -2], [6, -2],
                // Symétrie bas
                [-4, 6], [-3, 6], [-2, 6], [2, 6], [3, 6], [4, 6],
                [-6, 4], [-1, 4], [1, 4], [6, 4],
                [-6, 3], [-1, 3], [1, 3], [6, 3],
                [-6, 2], [-1, 2], [1, 2], [6, 2],
                // Compléments verticaux manquants pour fermer les boucles
                [-4, -1], [-3, -1], [-2, -1], [2, -1], [3, -1], [4, -1],
                [-4, 1], [-3, 1], [-2, 1], [2, 1], [3, 1], [4, 1]
            ];
            pattern = lines;
        }

        // Application du pattern
        pattern.forEach(([dx, dy]) => {
            const index = (cy + dy) * this.cols + (cx + dx);
            if (index >= 0 && index < this.grid.length) this.grid[index] = 1;
        });

        this.renderGrid();
        this.updateInfoPanel(title, desc, color);
    }
}