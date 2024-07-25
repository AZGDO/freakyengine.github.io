// engine.js
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.objects = [];
        this.scripts = {};
        this.isPlaying = false;
        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.render();
        });
    }

    loadGame(objects, scripts) {
        this.objects = objects;
        this.scripts = scripts;
        this.preloadImages().then(() => {
            this.render();
        });
    }

    preloadImages() {
        const imagePromises = this.objects
            .filter(obj => obj.type === 'image')
            .map(obj => new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    obj.image = img;
                    resolve();
                };
                img.src = obj.imageSrc;
            }));
        return Promise.all(imagePromises);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.objects.forEach(obj => {
            this.ctx.save();
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation * Math.PI / 180);
            this.ctx.scale(obj.size / 100, obj.size / 100);

            if (obj.type === 'image' && obj.image) {
                this.ctx.drawImage(obj.image, -obj.width/2, -obj.height/2, obj.width, obj.height);
            } else if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color;
                this.ctx.font = `${obj.fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(obj.textContent, 0, 0);
            } else {
                this.ctx.fillStyle = obj.color;
                switch (obj.type) {
                    case 'square':
                        this.ctx.fillRect(-25, -25, 50, 50);
                        break;
                    case 'circle':
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 25, 0, 2 * Math.PI);
                        this.ctx.fill();
                        break;
                    case 'triangle':
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, -25);
                        this.ctx.lineTo(25, 25);
                        this.ctx.lineTo(-25, 25);
                        this.ctx.closePath();
                        this.ctx.fill();
                        break;
                }
            }
            this.ctx.restore();
        });
    }

    start() {
        this.isPlaying = true;
        this.gameLoop();
    }

    stop() {
        this.isPlaying = false;
    }

    gameLoop() {
        if (!this.isPlaying) return;
        this.executeScripts();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    executeScripts() {
        this.objects.forEach(obj => {
            if (obj.scripts) {
                obj.scripts.forEach(scriptId => {
                    const script = this.scripts[scriptId];
                    if (script) {
                        try {
                            const scriptFunction = new Function('object', 'gameEngine', script.src);
                            scriptFunction(obj, this);
                        } catch (error) {
                            console.error(`Error in script "${script.name}" for object "${obj.name}":`, error);
                        }
                    }
                });
            }
        });
    }

    findObjectNamed(name) {
        return this.objects.find(obj => obj.name === name);
    }

}

function initGame(objects, scripts) {
    const game = new GameEngine('game-canvas');
    game.loadGame(objects, scripts);
    game.start();
}