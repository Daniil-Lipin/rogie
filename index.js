class Game {
    constructor() {
        this.mapWidth = 40;
        this.mapHeight = 24;
        this.tileSize = 50;
        this.turnDelay = 100; 

        this.fieldElement = document.querySelector('.field');
        this.map = [];
        this.hero = { x: 0, y: 0, health: 100, attackPower: 20 };
        this.enemies = [];
        this.healthPotions = [];
        this.swords = [];
        this.rooms = [];

        this.gameInterval = null;
        this.pendingInput = null; 

        this.initControls();
    }

    init() {
        this.fieldElement.style.width = `${this.mapWidth * this.tileSize}px`;
        this.fieldElement.style.height = `${this.mapHeight * this.tileSize}px`;
        this.generateMap();
        this.renderField();
        this.startGameLoop(); 
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
                this.pendingInput = 'left';
            } else if (e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц') {
                this.pendingInput = 'up';
            } else if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') {
                this.pendingInput = 'down';
            } else if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
                this.pendingInput = 'right';
            } else if (e.key === ' ' || e.key === 'Spacebar') {
                this.pendingInput = 'attack';
            }
        });
    }

    startGameLoop() {
        this.gameInterval = setInterval(() => {
            this.processTurn();
        }, this.turnDelay);
    }

    generateMap() {
        this.fillMapWithWalls();
        this.rooms = [];
        this.generateRooms();
        this.connectAllRooms();
        this.generatePassages();
        this.placeGameObjects();
    }

    generatePassages() {
        const horizontalPassages = this.getRandomInt(3, 5);
        const verticalPassages = this.getRandomInt(3, 5);

        for (let i = 0; i < horizontalPassages; i++) {
            const y = this.getRandomInt(1, this.mapHeight - 2);
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = { type: '.' };
            }
        }

        for (let i = 0; i < verticalPassages; i++) {
            const x = this.getRandomInt(1, this.mapWidth - 2);
            for (let y = 0; y < this.mapHeight; y++) {
                this.map[y][x] = { type: '.' };
            }
        }
    }

    fillMapWithWalls() {
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = { type: 'W' };
            }
        }
    }

    generateRooms() {
        const roomCount = this.getRandomInt(5, 10);
        for (let i = 0; i < roomCount; i++) {
            const room = this.createRoom();
            if (room) {
                this.rooms.push(room);
            }
        }
    }

    connectAllRooms() {
        if (this.rooms.length < 2) {
            return;
        }

        let connectedSet = [this.rooms[0]];
        let unconnectedSet = this.rooms.slice(1);

        while (unconnectedSet.length > 0) {
            let bestDistance = Infinity;
            let roomFromConnected = null;
            let roomFromUnconnected = null;
            let bestUnconnectedIndex = -1;

            for (let rA of connectedSet) {
                for (let i = 0; i < unconnectedSet.length; i++) {
                    let rB = unconnectedSet[i];
                    const dx = rA.centerX - rB.centerX;
                    const dy = rA.centerY - rB.centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < bestDistance) {
                        bestDistance = distance;
                        roomFromConnected = rA;
                        roomFromUnconnected = rB;
                        bestUnconnectedIndex = i;
                    }
                }
            }

            if (roomFromConnected && roomFromUnconnected) {
                this.carveCorridor(roomFromConnected, roomFromUnconnected);
                connectedSet.push(roomFromUnconnected);
                unconnectedSet.splice(bestUnconnectedIndex, 1);
            } else {
                break;
            }
        }

        const extraPassagesCount = this.getRandomInt(0, Math.floor(this.rooms.length / 3));
        for (let i = 0; i < extraPassagesCount && this.rooms.length > 1; i++) {
            const r1Index = this.getRandomInt(0, this.rooms.length - 1);
            let r2Index = this.getRandomInt(0, this.rooms.length - 1);

            let attempts = 0;
            while (r1Index === r2Index && this.rooms.length > 1 && attempts < 10) {
                r2Index = this.getRandomInt(0, this.rooms.length - 1);
                attempts++;
            }
            if (r1Index !== r2Index && this.rooms[r1Index] && this.rooms[r2Index]) {
                this.carveCorridor(this.rooms[r1Index], this.rooms[r2Index]);
            }
        }
    }

    carveCorridor(room1, room2) {
        const startX = room1.centerX;
        const startY = room1.centerY;
        const endX = room2.centerX;
        const endY = room2.centerY;

        let currentX = startX;
        let currentY = startY;

        this.map[startY][startX] = { type: '.' };
        this.map[endY][endX] = { type: '.' };

        if (Math.random() < 0.5) {
            while (currentX !== endX) {
                this.map[currentY][currentX] = { type: '.' };
                currentX += (currentX < endX) ? 1 : -1;
            }
            this.map[currentY][currentX] = { type: '.' };

            while (currentY !== endY) {
                this.map[currentY][currentX] = { type: '.' };
                currentY += (currentY < endY) ? 1 : -1;
            }
            this.map[currentY][currentX] = { type: '.' };
        } else {
            while (currentY !== endY) {
                this.map[currentY][currentX] = { type: '.' };
                currentY += (currentY < endY) ? 1 : -1;
            }
            this.map[currentY][currentX] = { type: '.' };

            while (currentX !== endX) {
                this.map[currentY][currentX] = { type: '.' };
                currentX += (currentX < endX) ? 1 : -1;
            }
            this.map[currentY][currentX] = { type: '.' };
        }
    }

    createRoom() {
        const maxAttempts = 10;
        let attempt = 0;
        while (attempt < maxAttempts) {
            attempt++;
            const width = this.getRandomInt(3, 8);
            const height = this.getRandomInt(3, 8);
            const x = this.getRandomInt(1, this.mapWidth - width - 1);
            const y = this.getRandomInt(1, this.mapHeight - height - 1);

            if (this.canPlaceRoom(x, y, width, height)) {
                for (let ry = y; ry < y + height; ry++) {
                    for (let rx = x; rx < x + width; rx++) {
                        this.map[ry][rx] = { type: '.' };
                    }
                }
                return { x, y, width, height, centerX: Math.floor(x + width / 2), centerY: Math.floor(y + height / 2) };
            }
        }
        return null;
    }

    canPlaceRoom(x, y, width, height) {
        for (let ry = y - 1; ry < y + height + 1; ry++) {
            for (let rx = x - 1; rx < x + width + 1; rx++) {
                if (rx < 0 || rx >= this.mapWidth || ry < 0 || ry >= this.mapHeight || this.map[ry][rx].type !== 'W') {
                    return false;
                }
            }
        }
        return true;
    }


    createRandomPassageFromPoint(x, y) {
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];

        const length = this.getRandomInt(1, 3);
        const dir = directions[Math.floor(Math.random() * directions.length)];

        for (let i = 0; i < length; i++) {
            const nx = x + dir.dx * i;
            const ny = y + dir.dy * i;

            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
                this.map[ny][nx] = { type: '.' };
            }
        }
    }

    createRandomPassages(count) {
        for (let i = 0; i < count; i++) {
            if (Math.random() > 0.5) {
                this.createHorizontalPassage();
            } else {
                this.createVerticalPassage();
            }
        }
    }

    createHorizontalPassage() {
        const y = this.getRandomInt(1, this.mapHeight - 2);
        const x1 = this.getRandomInt(1, this.mapWidth / 2);
        const x2 = this.getRandomInt(this.mapWidth / 2, this.mapWidth - 2);

        for (let x = x1; x <= x2; x++) {
            this.map[y][x] = { type: '.' };
        }
    }

    createVerticalPassage() {
        const x = this.getRandomInt(1, this.mapWidth - 2);
        const y1 = this.getRandomInt(1, this.mapHeight / 2);
        const y2 = this.getRandomInt(this.mapHeight / 2, this.mapHeight - 2);

        for (let y = y1; y <= y2; y++) {
            this.map[y][x] = { type: '.' };
        }
    }

    placeGameObjects() {
        this.placeSwords(2);
        this.placeHealthPotions(10);
        this.placeHero();
        this.placeEnemies(10);
    }

    placeSwords(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.getRandomEmptyPosition();
            if (pos) {
                this.map[pos.y][pos.x] = { type: 'SW' };
                this.swords.push(pos);
            }
        }
    }

    placeHealthPotions(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.getRandomEmptyPosition();
            if (pos) {
                this.map[pos.y][pos.x] = { type: 'HP' };
                this.healthPotions.push(pos);
            }
        }
    }

    placeHero() {
        const pos = this.getRandomEmptyPosition();
        if (pos) {
            this.hero.x = pos.x;
            this.hero.y = pos.y;
            this.map[pos.y][pos.x] = { type: 'P', health: this.hero.health };
        }
    }

    placeEnemies(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.getRandomEmptyPosition();
            if (pos) {
                this.map[pos.y][pos.x] = { type: 'E', health: 100, attackPower: 5 };
                this.enemies.push({ x: pos.x, y: pos.y });
            }
        }
    }

    getRandomEmptyPosition() {
        const emptyPositions = [];

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.map[y][x].type === '.') {
                    emptyPositions.push({ x, y });
                }
            }
        }

        return emptyPositions.length > 0
            ? emptyPositions[Math.floor(Math.random() * emptyPositions.length)]
            : null;
    }

    renderField() {
        this.fieldElement.innerHTML = '';

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const cell = this.map[y][x];
                const tile = document.createElement('div');
                tile.className = `tile tile${cell.type}`;
                tile.style.left = `${x * this.tileSize}px`;
                tile.style.top = `${y * this.tileSize}px`;

                if (cell.health !== undefined) {
                    const healthBar = document.createElement('div');
                    healthBar.className = 'health';
                    healthBar.style.width = `${cell.health}%`;
                    tile.appendChild(healthBar);
                }

                this.fieldElement.appendChild(tile);
            }
        }
    }

    processTurn() {
        if (this.pendingInput) { 
            this.handleInput(this.pendingInput);
            this.pendingInput = null; 
            this.moveEnemies(); 
            this.renderField();
            this.checkGameOver();
        }
    }

    handleInput(input) { 
        let newX = this.hero.x;
        let newY = this.hero.y;

        switch (input) {
            case 'left': newX--; break;
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'right': newX++; break;
            case 'attack':
                this.heroAttack();
                return; 
        }

        if (this.isValidPosition(newX, newY)) {
            this.moveHero(newX, newY);
        }
    }

    moveHero(newX, newY) {
        const targetCell = this.map[newY][newX];

        if (targetCell.type === 'E') {
            return;
        }

        if (targetCell.type === 'HP') {
            this.hero.health = Math.min(100, this.hero.health + 20);
            this.removeHealthPotion(newX, newY);
        } else if (targetCell.type === 'SW') {
            this.hero.attackPower += 10;
            this.removeSword(newX, newY);
        }

        this.map[this.hero.y][this.hero.x] = { type: '.' }; 
        this.hero.x = newX;
        this.hero.y = newY;
        this.map[newY][newX] = { type: 'P', health: this.hero.health }; 
    }

    heroAttack() {
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 1 }, { x: 1, y: 1 }
        ];

        let attacked = false;

        directions.forEach(dir => {
            const nx = this.hero.x + dir.x;
            const ny = this.hero.y + dir.y;

            if (this.isValidPosition(nx, ny) && this.map[ny][nx].type === 'E') {
                const enemyCell = this.map[ny][nx];
                enemyCell.health -= this.hero.attackPower;
                attacked = true;

                if (enemyCell.health <= 0) {
                    this.map[ny][nx] = { type: '.' };
                    this.enemies = this.enemies.filter(e => e.x !== nx || e.y !== ny);
                }
            }
        });

        if (attacked) {
            document.querySelector('.field').classList.add('attacking');
            setTimeout(() => {
                document.querySelector('.field').classList.remove('attacking');
            }, 200);
        }
    }

    moveEnemies() {
        this.enemies.forEach((enemy) => {
            let dx = 0, dy = 0;

            if (Math.abs(enemy.x - this.hero.x) > Math.abs(enemy.y - this.hero.y)) {
                dx = enemy.x > this.hero.x ? -1 : 1;
            } else {
                dy = enemy.y > this.hero.y ? -1 : 1;
            }

            const newX = enemy.x + dx;
            const newY = enemy.y + dy;

            if (this.isValidPosition(newX, newY)) {
                const targetCell = this.map[newY][newX];

                if (targetCell.type === '.') { 
                    const currentEnemyHealth = this.map[enemy.y][enemy.x].health;
                    this.map[enemy.y][enemy.x] = { type: '.' }; 
                    enemy.x = newX;
                    enemy.y = newY;
                    this.map[newY][newX] = {
                        type: 'E',
                        health: currentEnemyHealth,
                        attackPower: 5
                    };
                }
            }

            if (Math.max(Math.abs(enemy.x - this.hero.x), Math.abs(enemy.y - this.hero.y)) <= 1) {
                this.hero.health -= this.map[enemy.y][enemy.x].attackPower;
                this.map[this.hero.y][this.hero.x].health = this.hero.health; 
                document.querySelector('.field').classList.add('hero-hit');
                setTimeout(() => {
                    document.querySelector('.field').classList.remove('hero-hit');
                }, 200);
            }
        });
    }

    removeHealthPotion(x, y) {
        const index = this.healthPotions.findIndex(p => p.x === x && p.y === y);
        if (index !== -1) this.healthPotions.splice(index, 1);
    }

    removeSword(x, y) {
        const index = this.swords.findIndex(s => s.x === x && s.y === y);
        if (index !== -1) this.swords.splice(index, 1);
    }

    checkGameOver() {
        if (this.hero.health <= 0) {
            clearInterval(this.gameInterval);
            alert('Игра окончена! Ваш герой погиб.');
        } else if (this.enemies.length === 0) {
            clearInterval(this.gameInterval);
            alert('Поздравляем! Вы победили всех врагов!');
        }
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    isValidPosition(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return false;
        }

        return this.map[y][x].type !== 'W';
    }
}

const game = new Game();
game.init();