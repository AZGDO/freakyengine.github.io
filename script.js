// script.js
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    let objects = [];
    let selectedObjectIndex = null;
    let isDarkTheme = false;
    let uploadedFiles = [];
    let isPlaying = false;
    let globalScripts = [];
function setupResponsiveCanvas() {
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-container');

    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        render(); // Re-render the game after resizing
    }

    // Initial resize
    resizeCanvas();

    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);
}

function render() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 600;
    const scale = Math.min(scaleX, scaleY);

    ctx.save();
    ctx.scale(scale, scale);

    objects.forEach(obj => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation * Math.PI / 180);
        ctx.scale(obj.size / 100, obj.size / 100);

        if (obj.customProperties) {
            for (const [propName, propConfig] of Object.entries(obj.customProperties)) {
                switch (propName) {
                    case 'opacity':
                        ctx.globalAlpha = propConfig.value;
                        break;
                    case 'scale':
                        ctx.scale(propConfig.value, propConfig.value);
                        break;
                }
            }
        }

        if (obj.type === 'image' && obj.image) {
            ctx.drawImage(obj.image, -obj.width/2, -obj.height/2, obj.width, obj.height);
        } else if (obj.type === 'text') {
            ctx.fillStyle = obj.color;
            ctx.font = `${obj.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.textContent, 0, 0);
        } else {
            ctx.fillStyle = obj.color;
            switch (obj.type) {
                case 'square':
                    ctx.fillRect(-25, -25, 50, 50);
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, 25, 0, 2 * Math.PI);
                    ctx.fill();
                    break;
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -25);
                    ctx.lineTo(25, 25);
                    ctx.lineTo(-25, 25);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        }
        ctx.restore();
    });
    ctx.restore();
}

    // Update the list of objects in the sidebar
function updateObjectList() {
    const ul = document.getElementById('objects');
    ul.innerHTML = '';

    objects.forEach((obj, index) => {
        const li = document.createElement('li');
        li.textContent = obj.name;
        li.onclick = () => selectObject(index);
        ul.appendChild(li);
    });

    console.log("Object list updated. Total objects:", objects.length);
}

    // Finish editing an object's name
    function finishEditing(index, newName) {
        objects[index].name = newName;
        updateObjectList();
        if (selectedObjectIndex === index) {
            document.getElementById('object-name').value = newName;
        }
    }

 function highlightSelectedObject(index) {
    const objectsList = document.getElementById('objects');
    const listItems = objectsList.getElementsByTagName('li');
    for (let i = 0; i < listItems.length; i++) {
        listItems[i].classList.remove('selected');
    }
    if (index >= 0 && index < listItems.length) {
        listItems[index].classList.add('selected');
    }
}
function clearPropertiesPanel() {
    document.getElementById('object-name').value = '';
    document.getElementById('position-x').value = '';
    document.getElementById('position-y').value = '';
    document.getElementById('rotation').value = '';
    document.getElementById('size').value = '';
    document.getElementById('color').value = '#000000';
    document.getElementById('text-properties').style.display = 'none';
    document.getElementById("delete-object").disabled = true;
    // Clear scripts list
    document.getElementById('object-scripts').innerHTML = '';
}
function selectObject(index) {
    console.log("Selecting object at index:", index);
    console.log("Total objects:", objects.length);

    if (index >= 0 && index < objects.length) {
        selectedObjectIndex = index;
        const selectedObject = objects[index];

        console.log("Selected object:", selectedObject);

        document.getElementById('object-name').value = selectedObject.name;
        document.getElementById('position-x').value = selectedObject.x;
        document.getElementById('position-y').value = selectedObject.y;
        document.getElementById('rotation').value = selectedObject.rotation;
        document.getElementById('size').value = selectedObject.size;
        document.getElementById('color').value = selectedObject.color;

        const textProperties = document.getElementById('text-properties');
        if (selectedObject.type === 'text') {
            textProperties.style.display = 'block';
            document.getElementById('text-content').value = selectedObject.textContent;
            document.getElementById('font-size').value = selectedObject.fontSize;
        } else {
            textProperties.style.display = 'none';
        }

        document.getElementById('color').style.display = selectedObject.type !== 'image' ? 'inline-block' : 'none';

        updateScriptsList(index);
        document.getElementById("delete-object").disabled = false;
        highlightSelectedObject(index);
    } else {
        console.warn('Attempted to select an object with an invalid index:', index);
        // Optionally, clear the properties panel or show a message
        clearPropertiesPanel();
    }
}
    // Add deleteSelectedObject function
    function deleteSelectedObject() {
        if (selectedObjectIndex !== null) {
            objects.splice(selectedObjectIndex, 1);
            updateObjectList();
            render();

            // Clear the properties panel and disable the delete button
            document.getElementById('object-name').value = '';
            document.getElementById('position-x').value = '';
            document.getElementById('position-y').value = '';
            document.getElementById('rotation').value = '';
            document.getElementById('size').value = '';
            document.getElementById('color').value = '#000000';
            document.getElementById("delete-object").disabled = true;

            selectedObjectIndex = null;
        }
    }

document.getElementById('new-project').addEventListener('click', () => {
    if (confirm("Are you sure you want to start a new project? All unsaved changes will be lost.")) {
        objects = [];
        globalScripts = {};
        uploadedFiles = [];
        updateObjectList();
        updateFileExplorer();
        render();
    }
});

document.getElementById('import-project').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fpl';
    input.onchange = e => {
        const file = e.target.files[0];
        importProject(file);
    };
    input.click();
});

document.getElementById('export-project').addEventListener('click', exportProject);

document.getElementById('compile-project').addEventListener('click', compileProject);
    // Listen for changes in the properties input fields
    function setupPropertyListeners() {
        document.getElementById('object-name').addEventListener('input', e => {
            if (selectedObjectIndex !== null) {
                objects[selectedObjectIndex].name = e.target.value;
                updateObjectList();
            }
        });

        document.getElementById('position-x').addEventListener('input', e => {
            if (selectedObjectIndex !== null) {
                objects[selectedObjectIndex].x = parseInt(e.target.value, 10) || 0;
                render();
            }
        });

        document.getElementById('position-y').addEventListener('input', e => {
            if (selectedObjectIndex !== null) {
                objects[selectedObjectIndex].y = parseInt(e.target.value, 10) || 0;
                render();
            }
        });
        document.getElementById('text-content').addEventListener('input', e => {
        if (selectedObjectIndex !== null && objects[selectedObjectIndex].type === 'text') {
            objects[selectedObjectIndex].text = e.target.value;
            render();
        }
    });

    document.getElementById('font-size').addEventListener('input', e => {
        if (selectedObjectIndex !== null && objects[selectedObjectIndex].type === 'text') {
            const fontSize = parseInt(e.target.value, 10) || 20;
            objects[selectedObjectIndex].font = `${fontSize}px Arial`;
            render();
        }
    });
        document.getElementById('rotation').addEventListener('input', e => {
            if (selectedObjectIndex !== null) {
                objects[selectedObjectIndex].rotation = parseInt(e.target.value, 10) || 0;
                render();
            }
        });

        document.getElementById('size').addEventListener('input', e => {
            if (selectedObjectIndex !== null) {
                objects[selectedObjectIndex].size = parseInt(e.target.value, 10) || 100;
                render();
            }
        });

        document.getElementById('color').addEventListener('input', e => {
            if (selectedObjectIndex !== null && objects[selectedObjectIndex].type !== 'image') {
                objects[selectedObjectIndex].color = e.target.value;
                render();
            }
        });
    }
    function exportProject() {
    const projectData = {
        objects: objects,
        scripts: globalScripts,
        uploadedFiles: uploadedFiles
    };

    const jsonData = JSON.stringify(projectData);
    const blob = new Blob([jsonData], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.fpl";
    a.click();
    URL.revokeObjectURL(url);
}
function compileProject() {
    const zip = new JSZip();

    // Add media files
    uploadedFiles.forEach(file => {
        zip.file(file.name, file.src.split(',')[1], {base64: true});
    });

    // Add index.html
    const indexHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>game</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        #game-canvas {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <canvas id="game-canvas"></canvas>
    <script src="game.js"></script>
</body>
</html>
    `;
    zip.file("index.html", indexHtml);

    // Function to escape script content
    function escapeScript(script) {
        return script.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    }

    // Function to decode base64 script content
    function decodeScript(src) {
        if (src.startsWith('data:text/javascript;base64,')) {
            return atob(src.split(',')[1]);
        }
        return src;
    }

    // Add game.js with object and script data
    const gameJs = `
// Game engine code
${gameEngineCode}

// Game data
const objects = ${JSON.stringify(objects, (key, value) => {
    if (key === 'image') return undefined; // Exclude image object
    return value;
})};
const scripts = {
    ${Object.entries(globalScripts).map(([scriptId, script]) => `
    "${scriptId}": {
        name: "${script.name}",
        src: \`${escapeScript(decodeScript(script.src))}\`
    }`).join(',\n')}
};

// Initialize and start the game
initGame(objects, scripts);
    `;
    zip.file("game.js", gameJs);

    // Generate and download the zip file
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "compiled_game.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Game engine code to be included in the compiled game
const gameEngineCode = `
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
        const scaleX = this.canvas.width / 800;
        const scaleY = this.canvas.height / 600;
        const scale = Math.min(scaleX, scaleY);

        this.ctx.save();
        this.ctx.scale(scale, scale);

        // Sort objects by layer
        const sortedObjects = [...this.objects].sort((a, b) => (a.layer || 0) - (b.layer || 0));

        sortedObjects.forEach(obj => {
            this.ctx.save();
            this.ctx.translate(obj.x, obj.y);
            this.ctx.rotate(obj.rotation * Math.PI / 180);
            this.ctx.scale(obj.size / 100, obj.size / 100);

            if (obj.customProperties) {
                for (const [propName, propConfig] of Object.entries(obj.customProperties)) {
                    switch (propName) {
                        case 'opacity':
                            this.ctx.globalAlpha = propConfig.value;
                            break;
                        case 'scale':
                            this.ctx.scale(propConfig.value, propConfig.value);
                            break;
                    }
                }
            }

            if (obj.type === 'image' && obj.image) {
                this.ctx.drawImage(obj.image, -obj.width/2, -obj.height/2, obj.width, obj.height);
            } else if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color;
                this.ctx.font = \`\${obj.fontSize}px Arial\`;
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
        this.ctx.restore();
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
                            console.log(\`Executing script: \${script.name}\`);
                            console.log(\`Script content:\\n\${script.src}\`);

                            const sandbox = {
                                object: obj,
                                gameEngine: this,
                                getProperty: (propName) => obj.customProperties && obj.customProperties[propName] ? obj.customProperties[propName].value : undefined,
                                setProperty: (propName, value) => {
                                    if (obj.customProperties && obj.customProperties[propName]) {
                                        obj.customProperties[propName].value = value;
                                    }
                                },
                                console: console,
                                Math: Math,
                                Date: Date,
                                findObjectNamed: this.findObjectNamed.bind(this)
                            };

                            const sandboxProxy = new Proxy(sandbox, {
                                has: () => true,
                                get: (target, key) => {
                                    if (key === Symbol.unscopables) return undefined;
                                    return target[key];
                                }
                            });

                            const wrappedScript = \`
                                try {
                                    \${script.src}
                                } catch (e) {
                                    console.error('Error in script execution:', e);
                                    console.error('Error stack:', e.stack);
                                    throw e;  // Re-throw to be caught by outer try-catch
                                }
                            \`;

                            const scriptFunction = new Function('sandbox', \`with (sandbox) { \${wrappedScript} }\`);
                            scriptFunction(sandboxProxy);
                        } catch (error) {
                            console.error(\`Error in script "\${script.name}" for object "\${obj.name}": \${error.message}\`);
                            console.error('Error Stack:', error.stack);
                            console.error('Script content:', script.src);
                            console.error('Object:', obj);
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
`;
function importProject(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const projectData = JSON.parse(e.target.result);
        objects = projectData.objects;
        globalScripts = projectData.scripts;
        uploadedFiles = projectData.uploadedFiles;

        // Reload images
        const imagePromises = objects
            .filter(obj => obj.type === 'image')
            .map(obj => new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    obj.image = img;
                    resolve();
                };
                // Find the corresponding uploaded file and use its src
                const uploadedFile = uploadedFiles.find(file => file.name === obj.imageSrc);
                if (uploadedFile) {
                    img.src = uploadedFile.src;
                } else {
                    console.error(`Image not found: ${obj.imageSrc}`);
                    resolve(); // Resolve even if image is not found to prevent hanging
                }
            }));

        Promise.all(imagePromises).then(() => {
            updateObjectList();
            updateFileExplorer();
            render();
        });
    };
    reader.readAsText(file);
}

function findObjectNamed(name) {
    return objects.find(obj => obj.name === name);
}
function createObject(type) {
    const newObj = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        rotation: 0,
        type: type,
        color: '#f5be76',
        size: 100,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
        scripts: []
    };

    if (type === 'text') {
        newObj.textContent = 'New Text';
        newObj.fontSize = 20;
    }

    objects.push(newObj);
    updateObjectList();
    selectObject(objects.length - 1);
    render();

    console.log("New object created:", newObj);
    console.log("Total objects:", objects.length);
}
function setupFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const gameContainer = document.getElementById('game-container');

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
}

function toggleFullscreen() {
    const gameContainer = document.getElementById('game-container');

    if (!document.fullscreenElement &&
        !document.mozFullScreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {
        if (gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        } else if (gameContainer.mozRequestFullScreen) {
            gameContainer.mozRequestFullScreen();
        } else if (gameContainer.webkitRequestFullscreen) {
            gameContainer.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (gameContainer.msRequestFullscreen) {
            gameContainer.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const svg = fullscreenBtn.querySelector('svg');

    if (document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement) {
        // We are in fullscreen mode, update the button to show "exit fullscreen" icon
        svg.innerHTML = '<path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"></path>';
    } else {
        // We are not in fullscreen mode, update the button to show "enter fullscreen" icon
        svg.innerHTML = '<path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>';
    }
}

    // Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const newObj = {
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    rotation: 0,
                    type: 'image',
                    image: img,
                    imageSrc: file.name, // Store the file name
                    width: img.width,
                    height: img.height,
                    size: 100,
                    name: `Image ${objects.length + 1}`
                };
                objects.push(newObj);
                updateObjectList();
                selectObject(objects.length - 1);
                render();
            };
            img.src = e.target.result;
            
            // Add to uploadedFiles
            uploadedFiles.push({
                name: file.name,
                src: e.target.result,
                type: file.type
            });
            updateFileExplorer();
        };
        reader.readAsDataURL(file);
    }
}

    // Setup the context menu for creating different shapes
    function setupContextMenu() {
        document.getElementById('create-object').addEventListener('click', event => {
            const menu = document.getElementById('context-menu');
            menu.style.display = 'block';
            menu.style.left = `${event.clientX}px`;
            menu.style.top = `${event.clientY}px`;

            setTimeout(() => {
                document.addEventListener('click', () => menu.style.display = 'none', { once: true });
            }, 10);
        });

 document.getElementById('create-square').addEventListener('click', () => createObject('square'));
        document.getElementById('create-circle').addEventListener('click', () => createObject('circle'));
        document.getElementById('create-triangle').addEventListener('click', () => createObject('triangle'));
        document.getElementById('create-text').addEventListener('click', () => createObject('text'));
        document.getElementById('create-image').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        document.getElementById('image-upload').addEventListener('change', handleImageUpload);
    }

 // Update game controls
    function setupGameControls() {
        document.getElementById('play').addEventListener('click', () => {
            isPlaying = true;
            gameLoop();
        });
        document.getElementById('pause').addEventListener('click', () => {
            isPlaying = false;
        });
        document.getElementById('stop').addEventListener('click', () => {
            isPlaying = false;
            // Reset object positions or states if needed
        });
    }
    function gameLoop() {
        if (!isPlaying) return;

        executeScripts();
        render();
        requestAnimationFrame(gameLoop);
    }


    // Theme switching functionality
    function setupThemeSwitcher() {
        document.getElementById('switch-theme').addEventListener('click', () => {
            isDarkTheme = !isDarkTheme;
            switchTheme(isDarkTheme);
        });
    }

    // Apply theme based on isDarkTheme flag
    function switchTheme(isDark) {
        document.body.classList.toggle('dark', isDark);
        const theme = isDark ? 'dark' : 'light';
        document.body.style.backgroundColor = `var(--${theme}-bg)`;
        document.body.style.color = `var(--${theme}-text)`;

        document.querySelectorAll('.panel').forEach(panel => {
            panel.style.backgroundColor = `var(--${theme}-panel-bg)`;
            panel.style.color = `var(--${theme}-text)`;
        });

        // Update canvas background color
        canvas.style.backgroundColor = isDark ? '#1e2429' : '#dae0e6';
        render(); // Re-render the scene with the new background
    }

    // Initialize drag and drop functionality
    function setupDragAndDrop() {
        const dropZone = document.getElementById('left-panel');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImageUpload({ target: { files: [file] } });
            }
        });
    }
function handleFileUpload(files) {
    for (let file of files) {
        if (file.type.startsWith('image/') || file.type === 'application/javascript' || file.type === 'text/javascript' || file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedFiles.push({
                    name: file.name,
                    src: e.target.result,
                    type: file.type
                });
                updateFileExplorer();
            };
            reader.readAsDataURL(file);
        }
    }
}

function updateFileExplorer() {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        if (file.type === 'application/javascript' || file.type === 'text/javascript') {
            fileItem.classList.add('script');
        } else if (file.type.startsWith('audio/')) {
            fileItem.classList.add('sound');
        }
        fileItem.innerHTML = `
            <img src="${file.type.startsWith('image/') ? file.src : getFileIcon(file.type)}" alt="${file.name}">
            <span>${file.name}</span>
        `;
        fileItem.draggable = true;
        fileItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
        });
        fileItem.addEventListener('dblclick', () => {
            if (file.type.startsWith('audio/')) {
                playSound(file.src);
            }
        });
        fileList.appendChild(fileItem);
    });
}
const gameScene = {
    pause: function() {
        isPlaying = false;
    },
    stop: function() {
        isPlaying = false;
        // Reset object positions or states if needed
        objects.forEach(obj => {
            // Reset logic here
        });
        render();
    }
};
function getFileIcon(fileType) {
    if (fileType === 'application/javascript' || fileType === 'text/javascript') {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAYAAAA+s9J6AAAAAXNSR0IArs4c6QAAIABJREFUeF7tXQlYU1f2fwkhEEIWkrBvyi4ioFg3xA2srVXrhjhqZ9qx44x2nU77VTudaT9nprVOl5kujq1VZ5zWsVrrviuIihuCbILs+5qwJAQCJOT9/ye8RyMG8l7yEgI8vo+vVu97795zzu+e5Z57DgOhf2gK0BQYVgowhvXr9MdpCtAUQGgQjiAhAGahI2i+9FSJUYAGITE60aNGLQWGf2szE4TDv4BRKxv0wkY8BYiiw0wQjng62dgCiLCNyBgbW5bO66HIkKbwVbZCJRqEtsIJeh5jlgI0CMcs6+mF2woFaBDaCifoeYxZCtAgHLOspxduKxSwAghHoSdtK9yj5zFiKDAUCqwAwhFDpyEnOvRWYssbjS3PbXTIhrmroEFoLgVH0fM0XIeHmTQIh4fug3yVhoFNscNKk6FBaCVC05+hKTAYBWgQ0rJBU8AgBaxnlYwpEFqPrLRcW5cCI5uzNgjCkU1Q6wof/TVSFLBR0bJBEJIi6xgZbKPSM0aob+ll0iC0NIXp99MUMEIBGoS0iIxuCowAI8IoCClZAyUvGd2yQq9u7FLAKAjHLmnolZtEAXrDJU0280FIluhkx5NeEkUPjJR5UrRc+jXDRwHzQTh8c6e/TFNgVFDAZkFIK6JRIV/0IghQwGZBSGDu9BCaAqOCAhSCkNZdo0Ii6EVYnQIUgtDqcx/BH6Q3rBHMPMqnToOQcpKOtRfSG4q5HKcWhIPxw2Q+mfyguXShn6cpYDUKUAtCq02b/hBNgdFDgSFAOPq1EIqidgiCwC/8aLFfa3EXCAy/WgaDAd8edT8oiuLyha/VHkEQh/b2dnuVSmXX1tbG6u7u5nV1dbl1dXW59Pb2Ora3tzNbWlqQrq4upKenR/er/8NmsxE7OzuEy+UiHA4H4fP5iJOTUy+TyVQ5Ojq2sNlsmaOjo1IoFGo4HE4vj8dTIwjSjSAI/Bdq8evq8TMYDIrq8pvPtjGrCQGALS0t3JqaGj6CICAc6u7ubo1ardZyOByLMUilUjHs7OwYLBaLaW9v3+vp6dnp6uqqYjAYvcTYaf7maP4bBp/pAOCxMNCxW1pa2G1tbTy5XC6RSqXC2tpah+rqagepVOpSUFDgXVZW5q5Wq52AL1qtVkd/FDXMBgajT2yZTKZuKUwms5fD4ShDQ0Mb/PzG17u7S9r8/f17PDw8ul1dXdsEAoFMKBS2i0SiHrVarRaJRABKDb7pDjcgxyQIQVDq6+s5jY2N3gcPHgzu6uqSaDQaLYqisO0SBAMxyBgapdVqmUwmU8vn81s2bNhQOWnSpHoEQbqGWxhMX5EOMLi2A+CxlUol0Fcgk8kkpaWlovLycl5BQYEkPz/fp7Ky0r27u5uj1WrZKIryent7xRqNRoiiqCNmHZCdSi+DwehisVhtdnb2zQwm2mHHtOths9kqf3//xvDw8JrQ0NDm8ePHt/v5+bX6+PhI3dzc5M7Ozl36WnK46D9WQchsa2vjp6SkRG3ZsmVem1w+gYEgIACwO+pvv/ifDdHJLG2JomiHQCAo/Oabb64vW7YsD0EQBRVCYEktZwgZeuBjIwjCaWhoEJSVlbmWl5e7FxQUeKWlpfnl5OR4dnV18bVarVCj0Uh6e3sBcA6YK6ADLfbLJIs+bDzwAkx6MDlhIwU+AjC77ezs2lgslozJZModHR0VwcHBDTNnzqyOioqqDwgIaIJfgUDQyuPxOrBnUSr4QGYdtgNCK0oPiqLM9vZ2UXJy8syNGzeuaGlpmYmiqAu2C5sFLoLEBz+wRSwW3/7mm2+Or1ix4haCIK0jyTfUB197eztXKpWKSktLvXJzc/3PnTs3PjMz07e7u9tLrVaDmemCoqgTZvYD+MD8x31xnYtmogbUJzfON33+gVWDA7OHwWCoWCxWq729vdTBwaExJCSkZtmyZWVTpkwpDw0NrZFIJLLhAKPJILQiZgjKNfFhAEKlUim+dOlS3KZNm9Y0NzfHoSjqCm4G8beYNRJAKBWLxde//fbbH+Lj4284Ozs3jwQQGgCf+MGDBz7Xr18POnXqVHB9fX2ASqXyVqvVrmBqgnbEtBwOOioAR4b4+uDEQQmmv5LFYrU4OjrWiESiksTExMLY2NiSsLCw6rCwMBmCIKAZ1dbgickgJEMFWxuLgzA5OTlu48aNa5ubm+egKCqxBgixzQsH4bW9e/f+sGDBgusjAYQYAEGLOUmlUklubq7fxYsXg0+cOBFSW1sbrFKp/DQaDWxmzhCQQRAETE1rg86YuKEIApFRFAAJpquSyWRKORxOpaurW/Hq1asKnly0qDg0JKTKz88PwKgC89aSJuqYBuHly5fn/OY3v0kyB4QmWgQjDoSwcYFWa2lpERUVFfndvHkz9PDhw+EFBQUhnZ2d/hqNxk0PfPpazxgohvPfQUviYGxnMplNXC63IiwsLD8pKSlv/vz5D0NDQ2u5XCc5gjC6LaUVqQWhiRJpbS5gAiU+derUnF//+tdmgdDEuetAKBGLr31r45oQ035MBEGdyssrvDIzMyccOnQoOiUlJUKhUARqNBoPzOyE4AqAz4hM2Y6Q6M0EByMATcFiser4fP7DefPm5SQlJeXOmDGj2NfXtxFBkE5LAJFaEJookdZ+zFZAKBaLbdoc1TM/uRkZGT7nz5+P3rdv34z6+vrIrq4ufxRFhUhfVJkA+KzNZSPfM7wXABghsgrntjIOh1Pu5+eX8/zzz6cvXLgwe8qUKTUYECk9xqJBaIImpGAvt3lzFNuoHMH8zMrK8vv+++8jT5w4Mb21tTVaq9X6YqYn+IejUYbw4w45i8WqFgqFmatWrUpbt27d/aioqBqBQKCk0k8cjQQ0uuWaqwlHOwgx+kDwxfPOnTthu3btir5582a0QqGYgKKoF4IgXCyIZYL8UEA9oxymZABuoioZDEaVQCC4v2jRotu/+tWvsufOnVvp5OTUCoEdKsxTE4hIyQKH9SXmgtDg5MnJls1qQqCNTCbjMhgM7wsXLkR//vnnM3Lz8qJVnZ3jURQV6ZmfhHhIjiyEXmntQWB6djAYjDoul5s/a9ase5s3b86cN29eoVAolGKZTmbl/tIgNMEcpUAKbBKEuAZsbm72OX36dMzHH38cV1RUFKNWq8H/w3NsTZOZkY1GACKcLcqcnJyKpk2bdu+11167PW/evAcCgaDBXCCaRlAKpPDRV1iOQ4bebBFNSI4mNgdCLAjDkUqloAGnbt++fW5FRcV0tVrthyAIHLrrgi+W4xQ5Ag7DaNB2YH7CAX9JZGTk3T/96U83YmNjc4RCIQARIqsmZVvZCAitS9LhByFDy2AgkDFjE9FRPAra0tLidv369cl/+ctf4nNzc2f39PQEYAEYOHQfpT+kthUAGWTRtDo6OhbPnj37xttb306ZMX1GLpfLhYwnNam3YRSlQUibo3ADwk4ul/MzMjIm/POf/4y/cuVKfGdnZzh2BEExAE0RU1vCvy7bBoDYzOVy8xYuXJj8yiuvXJ0yZUqRQCCAJHzSxxc0CMc4CDGrAM4Bx3355Zexx44dW6hQKKaiKOqOJVqTk5GRjjFieAeNCOZnA5/Pv7dy5crLL7300q2YmJgKLIhDKlBDjsDEJmjzo4bfHNXdph92cxT3A8vLy32/++67J0ALtrS0TEdRFM4B4daDFeXDQugl+1ri4wFocKhfLRKJ7mzZsiVl48aN6f7+/tVkM2usSGTbweZAELY0N8/RWimBG6PCsINQzw90v3DhQswbb7yR0NjYGIui6HjsHFD/qpFR5hGXXaOvGkkDehEG0sFAGJVubm63//KXv1xJTEy8KxQK4ZI2BHEIBWpoEI5RcxTbiPjp6enhH330UcKZM2cSurq6whEEEQy462dBUIwK6IIP2G5vb188ffr05HfffffirFmzcng8XhtR/3DMghDuE1Jxi0JfQkmIFEWakMQX9SaKaUGHmpoan4MHD8bt3LlzcUtLyzSyfqBpXzftqf7pm/C4CY+Q3XjgqhNcCM5ct27d+Zde2nItImJSOVH/0DZBaGGqDbxPONbMUayygEt6enrU1q1bF2dlZS1Qq9VBmBlqhkyYyTgzHyeLHArHg9kJh/nVEonk1rvvvntpxYoVd3x9fSHh26hZagbBKVyClV9F+lIv9cJBkSYkTzhcC5aXl/vv2bNn3ldffbWkvb0doqFiBoKwCDkx5D87Fp7QpbexWKySkJCQlE8++eT8U089lUWkbAkNQoM366lH3QApHE4QQn0dl9TU1OhNmzY909DQkICiSACCoFCGwqg8WJwyIxuucA0Kzg/TN27ceHrz5s1Xw8LCKo1pQ6NEH9k0MTx70ppwCCIQF8pHRg4LCPGIaE1Njd+BAwfmffjhh0uVSuU0BEHEWCmKYWT3I/QxVLQJ/k5fXvE/Uy7DxHn6CLnwWxdwYJ/v5uZ24ZNPPrm4fv36Asw3HNTIoHwBw8hFwp+mEoSEP/rowGEDYUtLCy83N3fi1q1bn8nIyHharVaHWP9M0CDV8OrYcP6mXyWtv0gv9hQcnfSVSWQg9gjaf6EYZHm45FmXzobftnBwcMgTCoXX33///bTly5eXuLu7w418GoT6bB/DILRramqSHD9+fObbb7+9Qi6Xz0VR1BPLjDFxPzH7Mf06L1AZGwryKu3s7Frt7OxaGAwGCDAIOPwwtFqtvVarddZoNKC94WY/mNFQVApu+A8osWGiTiO+JLzeKcy5lcViVfH5/LyEhISsVatW5U6fPr3M39+/Gcs3HakgJEtEYuPHIgjxgExOTo7/F198kfDdd98t6+rqisEE2VqlHgeKN2g8AF47ZBCx2exGFovVDL8SiaQhKCio3tXVFWq+gDZEent7EYVCYV9VVQUVvT01Go07iqICqGuqVqvdsLKVcM6JFxa2pGbEb9/D3Os5HE6Jn59fLlz6jY+PLwoLC2vg8XhwA5+Ojhra1MiBkBiwiW+eupFWN0cBhK2trZCkPenNN99c+uDBg6c0Gk0gpkksKawGWdBXy4WhZDCQRgcHh3InJ6dC0ByxsbGNwcHBrQKBoIXD4bRqtVqVnZ2dflI0q7e3lyuXy8UKhUJYWFjIv3XrluT+/fvjurq6oKXBOOy8Ux+MJNkz5HBcc+vq0LBYrHI+n5//zDPP5CxfvvxhVFRUVUBAAGg/0I7AZ6MBZ2sTn0pimPwuciA0+TNDPUgpCIlsE3BTQs8UXdXW1jYXQRCPxwMyRN5mFk109/IQBIHy9JVCoTBv0aJFWQsXLnwYEhJS6+XlJRcKhV0CgQDGGOoNAhMEv5BdU1PDVigU7Pr6en5dXZ3n9evXA48dOxbW3t4epu7pCdT2mdpQA9W0QlSPk6KvPCIDUTAQRi2Xyy2MiIjITkxMzJszZ05pcHAwlNTHiwYbBR9ORRqEVi7+ixGeUhAagwQeFS0pKfH96quv4r/55psVnZ2dUxEEgdL/1jRF8UNtKENfGBoamrlx48aMmTNnQn3PeqwEfX8Ls8G0iIGWayy5XO5UW1srvn37tu+pU6fCrl69GiOXy6NRFPVHEASqAuCFiI2RazDNjZe5aLC3ty8F7QflEJ999tkC2Dz8/f3bMNOadC8LGoRjB4TcW7duhb/zzjuL09LSnlGr1WEQFWX0laO2xg9+IVbq5OQEQYubmzdvvjt79uwiOzs7GbSHI2q+DZzswNL8GRkZnmfOnIk8cODArObm5mm9vb1wORkH4oDHjWp+3G+Fo4caCLxERERkrl69Oj8hIaHS29tb5uLi0km++trP36VBuHEjFP+FKKFVyuAPkyYEbSe4dOnSE+vWrVvZ3NycgKKoj0n3BU2HKwhzm4ODQ8GsWbNS3njjjWugAcViMfhPlFQt+7lQMcJ5+PCh17lz56I/++yzOXV1ddMxIEKZDqKXlPEapFDkqYHNZpcKhcIH69evvx8fH58fFRVV5+3tDYEXs/tV0CB8cWNSs2z0gxC6UP3444+xr7766hqlUgn+IFzaJXVdiSj+DOgWEGgIZJS7u3te++ijDy8uWbIkUyQSNRGJHhL9Lj4OL9lfXl7uc+HChclQL6ehoQHuSY4jUK4DP3aAqG2bnZ1dDY/Hy501axYcO+THxsZWhIaGQpU14prbiLKlQThGNGFOTo7kzJkzs//2t7+t7ejoiEMQxJpdqOCIQcblcjNefvnlsy+++GJqUFAQ3EIHYFrEGsYrx9XV1Xn/+OOPMR988MHcpqYmuCkCPiJeuOoxyxY7dIdao41Q0MnDwyNv3bp1WQkJCQUxMTHgt1Ki/fQ/bDsgNGqak90PBx8/IDo6FsxRu4yMDLcDBw7M3bNnzxqVShWLpaoZD8qYzxedFmQymaXe3t5Xdu3adWbJkiWQ2Ez4vp2pnMeBWFFR4fOf//xn6pdffjmvubl5BoqiUEEOKgfg69c/dG+BQ3eBQJCH9aLIf+KJJyq5XK5ZfutQa7AdEJpKaROeox6EpCXVatFRzE9i37hxw3/nzp0JFy9eXNHd3T0Fu7xrHIQm0HfAI3Ak0ebk5JSxefPmE5s2bUoOCQkBLWhyiUAyU8Jr6GRnZ/vt3bt31oEDB6CGzhMoisLxDGTY4ClnukN3LpdbFBwcnLt27dqcuXPnFk2YMAHqyFi0VyGFICQtiGRoSXwsgWkMBUICjxOfy+AjhwQhlXPAQMi7efPmxJdeemlJXl7e0xqNBvJFOQgDYTzSHJyKlT0ee1SjCFInFAqv7t69+/j8+fNvu7m5yYjeOqdiSnBGCibo1atXw6CcY1paWkJ3d/dEzCyFoFCznZ1duUDAf7By5aqsZcuWFUyePLna29u7BTt2IHTobupcKQShqVOw/nMGQAhNQon5SNQgRAdCF7H42n4KWqMNNSVMEwivXLkybf369auaGpviUQT1tlK+KGiZThaLBWeC5/7xj3+cSUhIeAC5odT6gsaZgqKofXNzs9upU6embN269cmmpiZokS6BGqI8Hg/OKbPXrVuXO3/+/OJx48ZJqW760i/lBqZKg7AvMNMHQgbCtLRmsPYRBQZC0cWLF2evWbMmEZK2iURGjYs1oc0TTFG5g4PDvcWLFx976623Ls+cObPKWELzo2+mZiZ4ZTlocPrll1/O+M9//jO9q6tL4uLiUpuYmJi9ZMmSBzExMXAzXnfoTkWjF0IUMv/qBzUEIjpZqsY9ogn7jiiG1oTUL5OwT2jup/HKcsnJybNXrlyZJJfL5yAIAl11zfMHiU0MQNjs4OBwY82aNUdee+211JiYmCZqTFFiE9CXGaCFXC4XZGRkjP/Tn/4U4uzs7JSUlFQfGxtbFhIa2sBAEBMO3c2XSutrQvK0M3+VA95gljk62GzIrYswCM1dPA7C8+fPx61du3YNpgmJmd7mfhxBAIQyR0fHa0lJST9s2rTp+qxZs8AfJFUc1/xp9L0B04as2tpaflZWloDH49lNmDChXaPRKDw9PaFGjNnzIicGffOyPgipoqgZ77EICMnNZ9SBcBDhs4gmNEXQcfZgQIRADZ7UDWeYvdT6qOSEgQahvk9orolGnPZWB+Hly5fj/j/fcTg0oc4nXLJkyXHwCadPnw41VyDVyyKH9ERZgCeBD/c8aE2YnBy3cYyAEPMJcRAa9AnN0TCDPKuLjtrb2xdNnjz53Keffno6NjbWAtFRotCzzXG0JjQZhGRF9pHxuCZM3bt37+EFCxZcd3Z2htZaZvskA8UMj45eunRp1po1a1a3tbXNM3yP0GICClqv1sXFJWX//v0/zZ8//w6Px4OyFZSv1WIrsPCLaRCSBSEp7A062NogFFy5cmXqxo0bl1dXVydotVpI24JskUf4T2ppxAVT5xc6Ozvffv/9939at27dVU9Pzzq9ujHE3zToSAvNnIKZEXkFDUKyICRCVeNjrAlC4LFTWlrahD/84Q+LMzMz4S7hBPOrbRtfJDYCTFIlm82GXMyz27dvPz99+vQi6g/sCc/H5gbSIKQEhAR34p+HWRuE9jdv3vT9+9//Hn/u3LmV3d3dT1CdO2qQAn1/CSCE1DAwSa/97W9/O7N06dI73t7ejdRqQ5vDFuEJ0SCkBIQD6G0ck/0g/Oabbw4vXLjQYj4hdj6mu0Wxb9++Ofv37096/BaF8QmTkqjH45545syDuXPnXty2bdvl6Ojoh0KhEJKmSXe2JTyXETLwcRBSyA9bpQH154SkiWZtEDLhPuHRo0fjPvnkk6SOjg7ImrFiJYG+FtMIg1Ev4PPTf/nLX1765S9/eWvq1KlwXAE318d0kIbWhJbQhMZ3H6uDsKGhQXz8+PHZb731Fn6znljqGun9ZZDFMxAtgiJQyLdKJBLdffHFF68mJSXdg9sKcIxhan0Z46QmNoKqZRL72qOjaBCOERBCkd8TJ07MeP7556Hc4QIEQbysdJNCX+LA9IQbFJVisTj9hRdeuJ6UlHQ/ODi4ls/n4zfWDR7iDydITAEWmWdGKAjNYwn15ihxkmMzt7YmhM/ykpOTIzZv3ry0pKTkKa1WG2zVwr9YWTdUV/RXZ4KCRsxctWrV3ZUrV+ZFRkZWenp6kiqaS5zqtj1yhILQPKIOJwixmQ8HCNnZ2dn+n3zyycIjR44s7+rqsubt+oEMw4FY7+zsXBgZGZnz4osvZk+bNq3Q19cXLx+vqz9qC2ll5kmb8adpEBo1R83TuoZZwNAyGIhULBanWiM6ikdIKyoqXA8cOBD30c6dqzt/LvbUX3HNEisdQgR19TzhUi1U4nZxcclbu3Zt1tNPP/1w4sSJ1Xw+vwWrZg2AHYVg/JnaowOE+tIzQJIMCRbp+4TGNzOyI0ATNonF4mtWBKHuLt3Zs2envvTSSyva2tqg9ihkztgbuk1jJUDitT3BTwStWBYWFpYPVa1jY2NLJ0yYUOvu7t6KBW5GKRiH9SqTldhsAB6ECj2ZML0hDqwHzsKq5iimCWF6TtevXw999913F9+6dQsyZ8KxOpwW24wJkhHXinIWi1Xv5ORUHhoaWrhmzZrCmJiYcj0wQq3PUWemWoz4ZFWDNccTAqFlJ2Q2CI0Kt4EBUGfl4cOH3tCrfvfu3c92dnbO6DsvZNj1FR0b1h9cK8LlWh0YnZ2dK0JCQopWrFhRDB2bfHx86t3c3Fr5fD4caUCzmOExU40SnxwdaRDqV+AeosYMxXQ3G4T9bCYxMdh8oJ3Yjz/+OPXNN998tq2tLR4zSaGfn3FZIKHqyYnhI6NxMEJhYABjI2jGkJCQ0vj4+JJp06ZVBAYG1o4fP74ZL8QLZ4zwhpEaxDFOeDOoOeyPDiKgo0ETmkJbvNjRjRs3gv/85z8vunHjxhK1Wj0Ja5Zia7KAt83GNWOTg4NDjVgsLnvyySeLoBVZUFBQTUBAQIubmxtoRihbPyL9RlsjvCmyRfoZ6kFIQh31zdZqCdwDiQMmaW1trfvBgwfjtm/fvlypVM7Cqq8Zb5RCepmkWWPoAVwzgvmpZDKZ0NG3msvllsyaNavkySefrI6IiGgICAho8vPzgyAO7jdatFYoJSvDXkKDcAz0otAXGOySL//ixYuRmzdvfqaiomIhdnAPZeGtLw/EgY13yIXADCR+y9hsNrSprg0PD69etGhR2ZQpU8p9fX3rAgMDW52dnXVVs6F+zLD5jgSRan2iE5wYkWHE+ffo26jXhERm+8gYq9WYMaAJgWzssrIyv//85z9zPvvss2fa29unYQ1i4LjC1n/0wQh+YzuLxYKKbtVeXl6lCxYsKI2Nja0MDg6uCwoKahaJRO1Y62qbjaqOaBCaKi0WAWH/jkBka+g/rL+2l4IK3GTpgGlDuG0f8eabby7Ky3sQr9GoQ4foVkT2E9YYD2DEAQn+IIARTNVaJyenqnnz5pXHx8dDdLUmKCioQc9UHb6o6iBUoUE4xsxRkAO8fXZFRYXXf//732mffvrpk3K5PBaLlDoOi1lqHmxxMALAIC8VmpE2cDic6pCQkPLly5eXTp8+vdzf37/O1dW1BWvLbRiMRPZQsnM18k4ahGMQhBgQmVKp1KmgoGD8jh075iUnJz/d3d09GWuZZjxIQ1YQrTO+r8UZA9EgqK73oQK0o5OTU/X48eNLFy5cWDxr1izIxKnx8vLCjziGXTPSILQoCAfdAoctOjogSGNXX1/vcvbs2ah33nnnKalUOh9F0SCs/oxFuvhaB4s6M7XfVGUgSLsdiyUFzejh4VHy9NNPF8bGxpaEhYUBOIcdjDQILQrCPpEzAEVbAaEuSJOXl+dz4MCBaXv27Fkol8vxJpocY2apaZabaU+ZAV59U7UdjjggiMPlcoufffbZQtCOww1GGoRWAKEBAbIJEOJmKeSUXrt2bfxnn302++LFi4tUKlUMiqJw834kREuJ4nPgEYfUwcEBOvIWL1++/OGCBQtKoqKiqkNDQ2XgV1ozLY4G4caNa7HWaJLR2BqNiIRCE02FQiG4ePHixB07diTk5OQsUKvVYVhFtpHqHw629AFgZEo5HMcqFxeXomXLlhUuXry4GM4dAwICpBgYLV6ynwahPghHYS8KgiAEObBvaWlx/+GHH2K2b98e39jYCE00x2PHFuYD0epWqNGVPwJGJpPZxOFwqry9vQtXr15dsGDBgsLw8PAqFovV7OrqClk4FsvAoUFoyyC0ouCiWhSaZzuVlZV5Hz16NObjjz+eI5VKp6MoOg677mQ+EI3iYlgG6IMRoqmNXC63LCQk5EFiYmLO7NmzH44bN67e09MTauBYJJJKg9CWQWhlmcQO8Z2Kiop8/ve//03ZtWsXAHGa+UAcsJtYcXMhQcKfo6kMRhuLxarm8Xj5c+bMgR72D2fMmFHp5eUlw277U2qijlkQtiuV4pS+rkw/+4QGzVETJMb4I8OWtmZMKPWBeOjQoZivvvoqDgOiv15Gje3JjXGaG1s6/u94wjgc+jey2exygUDwcP369Q+WLl36MCoqCgpUtUCiOFX1Um2PmERJZcarARU6AAAgAElEQVS4AWlrRkBI9kOEpGFwEBJ6nOyc9MYTeD/QRyaTcVtaWrwBiLt27YpramqCiCkAkT9YSQzCsyIwB8LvstxASPwG8xOSxRv4fH5pTExM7vr167Nnz55dEBISUo+X3TD3HiMNQoOa0OJSYrOasF8dYEBUKpXex48fn7xz584ZMplsskajGYeiqAuCIJDeNsSBvsVpaDn4/fxmfRO1lc1mVwoEgtwNGzbcW7VqVS4cabS2tsp9fHygYJXJVcRpEBo1Ry3Ca5sHof4ZYk1Njef58+fD9+/fH52VlRWlUqnCUBT11MusGWY5GhrwRLYDI2NwExW0Yp1QKMyfO3du5oYNG7Lj4uKK3dzcGs0xT4eZeBYRcKMvtaw5avTzMGBEgFAPiI51dXXie/fu+f373/+elJKS8oRcLo9EUdQHM0+h1+FITnMjxDTsbiKU8pdxOJzSsLCwrBdeeCF94cKFOWKxuE4ikZjUV4MGoUU14aD7q5bBZEjFIvGwXGUiKnF6pqnuHFGhUDhnZmZ6nTlzJuLf//73FIVCMVGtVgeiKOpuC1qRiMYju3YD48HsBF8R6t9UikSi+y+++GLa6tWrM7G+GqSBOOpBaIgxtCYkL4rY9ScmlM7Pzc11S0tLG3fo0KGJWVlZ0QqFIgJFUV9MK0LRKBhHkWxZCVrkSKJfL7VKLBZnrFmz5tratWvvxcXFQYMbUkCkiFDkVjDco2kQms4B7AjDvr6+nvfgwQPP06dPhx88eDBaLpdHqNXqAEwrOiMIAof7AEYr//zc9MLQhymGdH9fDYFAcG/ZsmXXfvnLX6bHx8eTAuLoACFJytIgNA8XuFaUyWROdXV1kps3b/ofOnQoPCsrK1KpVE7s7e0FrYhHUAGMkI1jemnToXFl3mLMelq3KDjK0DW44fP56YsXL762ceNGUkAcHSAkSUgahCQJNshwXCvW1tY6FxUVeVy/fj3k+++/n1RbWxve2dkJvqIHZqLCcUYfGEfYD5G9g4EgvegAIP5/Ea10oqbpiCMKFTwkDUIinCA3MZu5ykRu2o+P1vMVHUpLS8X5+fnep06dCj5+/PgEhUIR0tPTA+eKAEYBgiDgL0IUdTTKXb9GFAgE6UlJSakvvPDCvenTpxs1TUcjMYzKFWkQGn0j6QGjBoQDI6itra2cmpoacXZ2tvfFixcDz549G6ZUKnEwQhQVMm4oBiO1u6QZb8OBCFHTe5s2bboKQHRxcakZ6viCBqFFjygGBeeoAyGsFNOKuuOMqqoqJ6lUKsrMzPQ5d+5cYGpqalhHRweA0R9FUVcDYBw5sjg0SnEgVri5ud19++23ryYmJqb7+PjUQOlFQyluI2fhpJXN4A9QownNihZQ14uCQrpQ9Sp9MMrlcqf8/HxxYWGhT3JycuC5c+dCOjo6gnp6evx6e3vh9j5oRkcEYdhDfxfTTFWzeEHVsvXfA0CEUhrlgYGB13fs2HFpzpw59yUSiZTBYED900d+aBBaQhMatWes3yTUEpJm7J04GCsqKtgsFsupqalJ9ODBA++rV6+Ov3LlSpBMJgvs6ury0/b2uqN9PiPUtWFjXaKMyKZRIhubnqX/HY4v2jgcTt7TTz99adu2bVemTp1aiCWEP5Jn2rdQm18PtfSiRhOaNSezNaFtsszwrPTB6OLiwqmqqnIpKyvzSE1NHXfy5MmAhoaGcWq12lutVntipipvgN9IsbKwCvXgQL8Hmp+6uLjc+cMf/nBh7dq1aQEBARCogYTv/l50FC/OLMG02sMWqcBNbvZmg5Dc56gbbY746pupra2tjg0NDcKysjLJ/fv3PS9fvuybk5MTAEcbPT09vlihKQAjaEf84N/y8mrOAh8nM2i8DhaLVRYUFJS8Y8eOc88+++x9BEFa9W9dWH5R1PGfsjfRIKSMlCa9SA+MdlKp1KG3t5dTUlLikpeX5wVV365evRqoUCjGd3d3+2o0GvAb4eCf22eqPnrEQS1mLGIVglnawuVyM9avX3/6pZdeSo6MjKzU14Y0CIe55KG1etabhBYrPKR3zmgvl8s5xcXFLiUlJR7p6em+ly5dGldZWenf2dnp39vb623MVB0akGbC1fTHweyEqGi5RCK5snPnztOrVq26z+PxQBtCAGdUHpoaFR1CmtB0ohv9vn5/wrEOQpxYA03V5uZmXlFRkSQzM8Pj/PkL/vn5+UEDTFUsqqqrjWpiVJUIqygZA9qw1dHRERK9T7/55pvJkyZNqsC1oQma0LLSScmSjbzEAAjnYLusgYRji6x3WH1Ci2oMMxmob6rCeWNRUZFTdXW1qKioyDMlJWV8cnIygDEAzht7e3shE0f4c1TVZsH4szYUS658teur00899RRowxbwDU0AoZlUtoHHyYHQIhMeVhBaZEUWeKkeINm4qZqdne2ZmZnpBwkATU1NQV1dXeN6e3vhlj/uN4JmxFLjLLKBmrpSnTZ0cnLK2Lhx4ynwDUNDQ0Eb9tAg7PMJh9CEj9OcAtbSICQhygNN1fr6ekFubq57RkaG3/HjxwPr6+sDVCoVaEa46Q/ZOBBVhSDO4PcaKWAiiSXAUJ02ZDKZpYGBgRf+9a9/nZwyZUqOi4uLggahURCazy0Db6BBSFKCdVKM9mfU2MlkMseWlhZ+fn6+6927d72OHj06rra2NqS7uzu4t7d3PHbEQd29RvPFAJYA2rCRz+df3759+9Fnn302bdy4cTIKQUjNLE3gDelHhjJH+1Zh8bXQICTNtUcfwAAJ54f2JSUl3OzsbHFmZqbv5cuXQwsKCiZ1dnaG9/b2+mFmKpw1Ervtb1nWw7mh3NHRMXP16tUnXn/99csxMTE1FILQTKpa8XHaJ7QisS38Kf0jjqKiIufi4mKPW7duBR89ejSqpqYmoqOjIxirDAcmKviL1N72JwdaMElVLBarZMKECRf+/ve/n549e3YxJSAkNw8Lc4XA62kQEiDSCBuiB0bH0tJSUVZ2tt+Vy5cnHD16NLq1tTVCo9HA7Q0xFkkdzspwkMBdLxQKUz/++ONjiYmJDygB4QjjF/gWTKVSKU7uK4NPOjDTt97Bth5CWxJtjlpIaDAwwsE/t6qqyv327dsh+/btm5SXlxfV0dEB9VK9EYTBQxDUIpeLCXAfTNJmJyen26+++uqp119/PY8GockgHBqKRmTMuiAkIBkWwsSwvFYvgONYU1Pjkpub63vkyJGIEydOPNHa2joFa3ADh/3DUXIDTNJ2R0fHvGefffbK3//+94c0CM0EoYkHGKPyUu+wIG6Ij+oFb7h37tzxOnbsWOS+fftiZTIZdJoKMLkJqnmbGoCwm8lkVoaEhNw5duxY2ZgCIU67Aebomubm5rmDZ8xYRLRoEFqErIZfCvyWSqVQGQ6OMqJ3794dJ5PJoPdiIHapmISPaA4C+5+Fo4omLy+vrJ9++qlyTIEQZxEOwkuXLsVt2rSJehAa5xMNQipAaJzO/V/BKsNxoPbNd999N2Xv3r0L2traZmGdppysnEcNfqFMIpHkffHFF6MQhAQYQxSEBF5lqihZ1yc0dZaj7DlcIxYVFfl//vnncadOnXpapVLFIAjixkAQVv8tW3zdlhMAXXDGxcXlwfbt26sspAlNmL0Jj5gqIwZACGlrcG+N2jOkwSdIg9BU5pn5HIqidgqFQnD27NnIrVu3Lq6urk7QarXBCIIMrQ2NyqfRAfoz14FQIBA8eOWVVywFQjMpZeHHB4AwUc8nJOEb6E+SFAPgQQBhk1gsvkb4KhPpT1iYiCP09ViwBmqk+nz++efz9uzZs0SlUk1DEESCRUutsTIdCJ2dnfMTExNpEG7atMk4CI0CwOiAgYztZTAYUrFYnPrtt98ejo+Pv+Hs7NxsTqNJQ5JDelaDiB8muP3/OljZvsfMOWuIM5lvYASBTVihUAjPnDkT/fLLLz/T2tq6EIuWQnqbhazDRyYKIGxxdHR8MGfOHMuCkCoh+Jn7ZvQz0KMB9ZqQjCToxgIIQROm7tmz53BCQkKaJUBIalYGmKV/e0Emk7FRFEXlcrk6KChITfWGQWqug/hsROUN14ZXr14d9+c//3nh7du3n1Wr1ZOxIwvKXJIh0jm0KIK02tvbPwwLC6u2BupNoq8lH8JBeObMGYiOJioUirnYFRgTzVHSpqmGwWA0enh4XN2zZ8+ROXPm3MQveFpy3UTfrX+Pr729nSuVSsU5OTnCxsZG7bJly5o8PT1lWGdam1d+g60ZfMPCwkL3vXv3zv3qq68SOzs7YxEEgbQ2ykD4+Lf7YalFEIaCZW9X7ipxbbQoCPXMmP6vGzJliAoHVeNwEJ48eTJu8+bNFIOQ0CzVTCaz3tvbO3nXrl0/Llmy5DbUqLQF7YKnfUGgQiqVSgoKCvwuXrwYtHfvXi8mk6n64IMP8pYuXZojEomgRTRoxBEJRJCB0tJSyenTp+P++Mc/runo6JiDbcQWBGG/bOgSuZlMZhOPx5NbDIR4xx64XJmVlWXn7e2tcXV17YY7VcPNOByEx44di3v55ZetDUJdPUomk1k1bty4S//85z+PLVmyJANBEMVwglC/sUtLS4uotLTU78aNG6GHDx+emJ+fH9Le3u7KZrPb4uLibr///vtXJk2alM/n821i4yC07Q0YpC8DW7ZsWaNUKnFriGIQGqwODjKgZjAZHWx7topyEOr3rtNoNOKCggL3tLQ0jp+fn/ypp56qc3Nzax3uHRQY0NDQID5//nzcK6+8kqjHAMwcJepdmMJ+3Q3rThaLVRQWFnbus88+O52QkPAAQRDlcGxO+qYngiDOOTk5Hrm5ucHHjh2bdPXq1UkKhSJIo9F4oCjqyGAw5Hw+H9pDX/jd7353XSAQVLq6ukIP90cqSptEFSs/pB8XeP7555MUCsUATWg5GWDA/WQEgUprkL5GXXkLfWY2NDTw6urqPO/evRv+/fffhz18+JAbEhJStX379nvx8fEP4WKjtRhniJQ4CI8cORL3zjvv4CA0+5yQINtAYBUsFit7ypQpJ7dv335x4sSJZT4+PgabhVhSNvVMT25ZWZlrXl6eP3RROn78+CS5XD6hu7vbD0VRvNknaAgVNMN0c3O7+d57711csWJFuoeHRz1WaZpCs5QgJc0gjnEQmvHygY8+vpw+TchgdLDZFGlCPdOTW15e7nrv3j2/U6dOTTh//nx0W1tbmEajceDxeEWbNm26vHHjxuthYWFVA0uBU7hko6+C+ZaUlIj37dsX949//GONSqWynCmiU3yP/AAIW1ks1q3p06cf3bp1a8qSJUvqDTUKMboQEwfo372rq6vTmZ6XLl2a8O2330bI5fJQlUoFPQVhU4KCu3hJQV1UF24A2NvbF0VGRia///77F+fOnZvL4/HALNXV0BwpPyADjY2NErCGXn75ZTBHh8MnbDTbJ8SZKZVKOb29vZLi4mL/S5cuhe7fvz9cJpOFdnd347U+GJA1DoGIDz74QFcKXL/4qbUZB5GxjIwMt927d8/573//m9jd3R2ni4wxEGY/Ziy3GevyBlks1vW4uLgjr7/+euqyZcugW4/FTboBUU/nwsJCuIUecvz48cjMzEzQfkFYQ0+ozTJYoSTYwWVOTk6ZS5YsufDb3/72elRUVLlIJAJz2uJroEpWQAYqKyvdDh8+PG/79u1gDVEeHR1ChHBrqNzd3b3BJJ9wIDOhJmR6evqEn376KSo9PT0CSphrtVpoCIkzE9QBHE5mLlu27Dz0bJsyZUo51uvbqozDTbBbt275vffeewmpqakrenp6IH8Q6ldS7JQbFBkdCNlsduozzzzzw+9//3sAI+UH9QO/jFsr7e3tzrW1tXDk4PfTTz+FXblyJbK9vT0cWpVhpqexBp66yB6DwagRCAR3161bl/ziiy/enTx5stGOtFQByNz3YDLAfvjwof+XX365cP/+/cs7OzunkDknNHOP1llDDg4OD8PDw8mfE+qHsGtqaiT37t3zP3bs2IRz585Fy+XyCLVa7YOiKAi0ft8AvPhptUgkuvXnP/8ZOtTcdXNzq6XenxiaRTB/mUzmnJqaGv67321+prlZthhF0VCjuYPmcv7n54EBUkdHx2u/+tWvfli/fr1FQah3pw6K6EoKCwt9T506FfLDDz9MANNTz1rBK5MR2Zj7W0OLRKL0LVu2pK5du/YeCNRwbKxk24phNOFdunRp0ksvvbS0tLR0EZY/atWMGQ6Hkz937lziGTMDQtjivLw83ytXroDpOVEqlYITH4CiKGg/8CMM3VgGximhyA34E3/9618vzJ49O9va/gSYIY2NjeJDhw7N+OMf/7i8o6NjHoIgXgN8H+og9/ibdCDkcrmpb7311mEAYVBQEOWaUJ9fzc3NLsXFxT6pqam6I4fi4uIJSqUS9/vwGp1kExX6W0NLJJL01157LTUpKSkjKChomIBInGUgA1Kp1PXIkSOztm3btgKLjEI1b/B/rfGjS1vj8XgPnnvuOWIgxEwZNpgy5eXlHnfu3NGFsG/dugUh7ECtVgsVkKFcAK79BlsIXGZs5vF4mWvXrj2/efPma/7+/lbzJ/B0pZycHP+dO3fGHz16dFlXVxeYohABtIYpigc3Gp2dnVM//PDDI6tXr07z8PCgDIQDXYWysjL39PT0oJMnT0akpaWBqxCs0Whg09HnFxHtZ4inuo2VwWBUurm5pb/yyivXVqxYkTF8GtE4fjBZ5t68eTPwo48+WnDhwoVnuru7o8mYosa/YnQEZMw0C4WCB2+//fbQINQvD1BTU+OakZHhf+rUqbBTp06BE6/vRzgObFk1yDT6zVKxWHz3jTfeuLJ+/fp0Pz8/q+yesAO2t7cLr1y5Ev273/72mSapNB67XW0tMwTIAtW2ank8XvKXX355dPny5XeoOvTW9/tkMpkkKysLotShZ86cgajnBMzvE+lVHDMVfPrshY21AwPi3S1btlxfunRphr+/f41IJOrAboxQeHxhVMAHHYDRB27Ye3/99dfTvvzyy/jW1taZKIr6Yk1JqaAHkQnq4gJisTjvww8/NHypd6ApU1JSAm2qJuzatWtSa2trWHd3N27KgB+hH8ImMoF+f8LT0/Pu9u3bU5cvX35PLBYDEC128IutiZOfnz9u9+7dc/fu3bu4s7MTtKA1r7BACWkVwmAUSSSScwcOHDg9bdq0ByKRqN2cg3p9v6+pqUmcn5/vl5ycHPLtt99ObG1tharU+kcOeMNNIrwiOqYfiGKJOD1pTdKNpKSk+9HR0bWNjY1KiyV8k4iOYAB0lEql3hcuXJj8zjvvzKutrZ2p1WrHYy6UQXOcxCeI0grG6cpbuLm55Xz//fcVjyFffzeFlsaZmZlBEMK+ceMGADAERREPBEGN1/ofeko6M8be3r4iKirq7rvvvpu6YMGCDB6PB4EaiwARRVH7lpYW9/Pnz8f84Q9/eKqxsTEOq7plWAsapP7jf0mSSboKzCwWK2Py5MnHP/zww8vx8fHQMBLaKpukLTB+OTQ3N4sqKyt9r1+/HvLjj4cn5uXlh8nlcjgi0o9SW7IKNQ7EKoFAkPXkk0/eXbt2bd7kyZMruVyuzNXVVTVcWhHXgFKp1PPmzZtRO3fujLt3796Mnp6eIKxvBWxMBn9I8pcIEPE22tW+vr53z549W9oPQnw3bW1tdVIqlRLInoAD96NHj+qyJ6AVFYqiYMoQNT2NTQhySJWOjo7l06ZNu/PGG29cmzVr1n2JREIpEPvWBffH2gUZGRkTPvvss/iLFy/Gd3d3h2PHEmQDEsbW9di/6zFSZ4Y4ODjceO6554787ne/uxYTE9Nk6kE3rK2kpITNZDKhOUr4sWPHYiDiB+d9Go3GE0FRAWqguy3pBRAXUNzKqedwOMUhISG569aty5o/f35BaGhoA4/HU8KGAxfSTN10yMxdz6LTFXm6ceNG1FdffTUrPT19eldXVyAWxR8UgAO/RREgAYSggArmz5+fvHv37ocMfdNTJpMJioqKfK5evTrh+++/n1RZWTmhs7NTfzftNz0pmhAAEWowlk2aNCkd8hEXLFiQBf4EaERzdk69AIV9e3s7786dO74HDx6c8dNPPyUoFIqpmIYga0qTkQFDY0Fb1Ds5OSW/++67R1etWnU7JCRE16POlBfDGgsLC53Pnj0b+vHHHy9oaWmZ293dDQVuwcSGzXI46mrqciLhVgiLxarm8/l5CxfGZy9ZsqwwMjKyavz48TIejwe+IvjGunVTDUg9mbaHFMqqqiqvmzdvRn777bczS0tLY3THMgjKR1DjrhRFcq7PXl1klMPh3P3Nb35zeuvWrXkAQjAtHfLz893u3r0b+NNPP01MS0uLVCgUoQOiaMRMGfLSBECEXMpKiURy77e//W1afHx8dlBQUJ2Hh0c7xizYPXTm2lAMw4gPw2CuIIAc8JHS09P99u3bF5GcnDxdLpfHoCgKLbSsXWFLd8iNIEipQCDQtcZatGgRXAky2R/EzzxPnToVvnXr1qelUukiFEXDsCQJi2v4IVgNa8XN00YHB4cySFtcsWLFw/nz55cEBwfX+vr6trq5uQE9dDdrMP4a5bGhb+rxHTAD62Y3NjZym5qaRHCUdu7cOUihnNLa2hql0WigSQzI/KAVuMkCj+R43UbM4/FSd+zYcXzNmjUP4OB6WlZWluDEiRNBP/zwAx5FA9MTdlMOA0HsUMte+QfC46HuKqFQkD1v3vyMRYsWFURFRdV4e3vLBQJBF5/PBzMGfmGsIf8JaAGazUGpVDrADlhfX+9x7969oMOHD4fn5uZO7OzshOYgcB4EALS2kOL+4P2JEyce/+tf/3p5yZIl/S2Tye9d/a3C2NnZ2f5ffPHF/IMHDy7FqofB5VTCZpYp3yb4DPAKeAYbTZOjo2MVl+tc/OSTC0vj4uJqQ0ND4YKwVCKRtDs4OKh5PB7OY9CSRH3kR/je3NzMhc6+ZWVlnmlpaZBIAtewIDgFFh3OewvQhhAU8XuEpT4+Pue/+OKLMwkJCcWM//73v29+/fXXrtnZ2aFKpRJyB3FHnvoONsaDNRDqbmSz2WVcLrcoLi6udP78+Y1BQUFtbm5uoMJbmExmh0gk6k8WViqVSGdnJ8PBwYEF/eo6Oztd29raIC3L9dq1a/45OTkh7e3KQI1G7YmiKJyN4WlZQ8+GEE0JimLfMNgBpRwO5/pzzz13dNOmTTfM8QfxL2NBB5eDBw9OfuONNxY3NTUtwI5dqNf0ptEE32RxMIJP3ODo6FgfGBhYO2PGjJrw8HCZr69vh1AobBUIBPDv7d3d3Ro3NzfU2RkC8AiC/xf4DT/w36bGJoaDowNLqVTyGxsb3ZRKpaikpER0/fp1r7t37/p3dXX5qVQqL6yws6lJCaSYbGSwbiN2cHDIXLhw4Yl33nnn8syZM2sYzz333N6TJ096KBSKEAyAxHu5UTm9vnfhOyccAEvZbHaTvb19s6OjY0tERER9ZGRknUgkauNwOBo7uz5F1tvbi/T09CAdHR0ORUVFEug7AFEwtVotVqvVrmq12g1zwKnxkUwXRBBCiBxe/vDDD4+tW7cuQyAQmH2lC09AKCsr8/3666/nfP3114uH0ecdSiJwMIKWg2tb7XZ2dq1sNlvGZDIVbDZb4e3t3Thp0qQaPz8/qETW4+LiggqFQoTNZiMcDoglouO1SqVC2trakNbWVkZzc7NDSUmJBHKBe3p63Ht7e10w3ktQFBXo3QSxSAMYkhDQNQnlcrnX33vvvaOJiYl9TUIPHz78xeuvv+5bX18/CUVRyKSArBdrHVoaNPExMAKzwF/ohigqi8WCwjjN2MEw7kPg8wTf1r63t5cPwNNqtZABA5oA1gK/JM/GTEOaER+pncViPYiIiDi7Y8eOc4sWLSrEjmOIml2Dvh7ThoKUlJTw7du3J9y6dSuhu7t7ApYFQtjsNrpqowMIiSTu38OGi/NYB0wWiwXBHB0o4WoXg8FAmMy+RCb4M/ygcB0WIjpare7PWq3WXqvVCnp6emCzBdABWsHawfkODxKXZ2rWOJhcw+ZT4urqenHfvn0nZ82a1dcuu6Sk5Lfbtm0LPHXq1Oyuri5w6sFkMzmFi8I14MIJKlyfYfBn+Dv833EC48EYnAH6gSTiTBhSjoiszuAY3BS9tWHDhhO///3vr02YMKGOqjuEeFJ9XV2d++nTp2P+9Kc/PSmVSmdjJd65j1zRIoQTAoOIkML4a/oDbgN4DPQiGjEGPutiAXpNQPs356GmQM0SBvnC4y+HNcFNoox169adeu2111IiIyMhJtDDkMvl03/88cegbdu2AeNi+/q3UaANya5w6PE44IhoDXI7n3FBMWmE3nLwVD2Iil766KOPTiclJWVRYYrqTwzPCMrNzfXbs2fPrAMHDjypUCig+xDk9VrEuiHL4qEJqXubPijJ0J0Q6Mi8kPBYYkTAZaBMJBJd+fzzz0/Pnz8/y9PTU3c8BWacO4RxP/300wWHDh1apFKpIvsPsYl9gPB8x+hA2NHb7O3tM+fOnXvy/fffvxQbGwtZMmBmE9lUCJMNM0t5KSkpYTt27FiQmpq6sLu7OwLjpwUigoSnNtYH6i4ucDicjJUrV55+/fXXU6ZOndovAwBCh87OThGco7z00ktPNzY2zkVQdBxK5Tna2AYzBGTq+Hx+6nvvvXds/fr1t93d3eHWhEXKQYBvLJPJXM+cOTN527ZtCQ0NDWCWQi8+iA4OCUTrsInCr1D4KgvuErDRQipmmaur6+WdO3eeXblyZRZWWaIvWQE3YyoqKvz27t0bt2vXrqdbW1v1M0osOL/R9WoDMgFEhoBMQURExAUIyMTExBRIJBKLVVbD+OlYVlbmc+jQoZjPPvtsXnNzM/Ti88cO8a2kEW0cIcTcHxKxhEFfCEGnJicnp3tJSUlnXn311dTo6Gi4rNBvCek+gkfX0tLSJn788ccJ58+fj+/q6pqAMEh2Ps0AABBsSURBVBBI7elnmo2T1dYQjSfq1goEgrS33nrr3AsvvHDL09MTqpNZtGgunrCcm5vrs2fPnpjvvvtubltbG/iHOBAJR0xtjagD50OxTA50D0iA0CCldIWx7OzsHvr4+CR/+umnF+Pj43MHxgNwEMJ/dbcMzp07N/XNN99MaGxshAaK42wgBYqcHFDMFXIff2Q0+AFwrJI7e/bsi9u3b78SHh5ebK2CSABEmUzGzc/P9/nXv/419cyZM3OVSuUT/RHToTKGbIeGZpCf1KOD+ebmgFCXHQP3LIVCYdqWLVsubdiwIT0sLKxu4Cbc/xHMjHEqLy/3OXDgwBOQBtXS0gJmDOTawZmbyccWpMhh04MJSyeYoTo/QCQSpUJNHagw5+/vL6PqWIIImXAgpqen+37xxRdTU1NT56pUKgAi8BTKkIwajUiEHoOMGSo4ZioI8dxZqYODw72EhIQLb7755vWJEydWGCqW/MhH8Kv/ULxp9+7dM44cOZLQ3t4O/iGEuSHjxNRJ/bx+wnJsBlkfe9SqHwUGqBkI0sBxckpfvXr1uTfeeONGVFQU+AHDUeBXpxFTUlJ8//nPfz5x//79OSqVCngKpqlhIFqVXIPz2UrTsAQIwQqS29nZFY4bNy7lgw8+uPT0008/GKye0mOgghIQbW1tvIyMjOBPPvlk7rVr1xZ0dnZGYgndVrv6o88Ac5jR/6w5LyG3HwAD2uzs7PKDgoKuwMXdBQsWPBz8XNDyE8M1ogEg4hrxsWCN5WdFjqgWHE21KQr8h8BbmUQiubVt27bk5cuXZ44fP37QWIBBzQZh7o6ODlFKSkrERx99NP/evXtzsGwaSAuy/B21kSsBwAC4MQBmaNrWrVuv/OIXv7jv7e3dZOlgjDEh1Qfi3r17Y9LS0uZ0dHTgGhEvd9j3mmHYuYacv+XlgaqADA7AShcXlzsbN25M/fWvf50RFhaGX1Q3CPjBQAh/z4arQCkpKdF//etf5xcXF8/UaDSBeudN5pumxiTHqv9uNqfx61gVfD7/zq9+9aurL7zwQgbUWbGVXn44ENPS0nz/P3dxSkpKSpxSqcSBiJ8jjjK+4kI0JH/1wWHq+vsBKBQK7/7iF7+4BgCMiYnRXVAf6uL2oB/Ezw+lUqnX0aNHp/zlL3+ZU19fD049RExBI5pmmpot61ZF5gDNMOi38bIOFVwuN33RokWpL7/88r2JEyfWWKNrERmS4kC8c+eOz//+97/JZ8+ejW1ra4OLzhhfGfZQDsRkKpOZjMkfMf6gdaah+4r+fViIhN5dvnz59eeffx5KP9ZIJBK4nvdzHqyBiQ2JeixQw5HJZN4//vhj9Pbt22fKZLLJGo0GLkjq15sxThVDI6xDKdPmRvyp/iK4HA7n3owZM66++uqrGbGxsdWPMYD4Oy06Ej9HTEtL8z59+nTkvn37ZrS0tABfIbMGL4loqUoKj66NlAyQGqxvVxOk52DvH/S7eBQUXBAAYPqq1auvP7dhQ6ZBAA4yC6OqFwci3NE7efLkhK+//jo6Ly8vGg7zsatPIyPUTZZ/Q7BN71WPAHDy5MnXXnvttfT58+fbLADxZeF8zcvL87h8+XLY/v37o0tKSqJVKlUoxldTylkSFHZrDRua6WaKBBTw7UEQFO6EVopEooznnnvuxoYNG+AoqpbMBmwUhEAuYFh9fb2jVquFW8uQpR8JFauUSuVk7MwJGGYLlyYtwF2DrNI3QaqcnJzA97u2efNmMEVtHoADgOggk8lcUlJS/A8dOjQxJSUlpq2tDe6WQuQU7mUaaxBDjOZmSrzRjxh8v/5fPj7AxCnhvIeDeKmdnR0E4bK3bNlyZ8WKFbmRkZGkqwUSAiEGRBhrL5fLuWlpaT779++ffOXKFfAnAIhQwZiPMBA2glJ5AGwimYxyzKwBunNALApayefzM+bMmXNj48aNNm2CDrZi/Srrt2/f1lk7e/fujYLmPj09PdBfBOqy6IqBUXa4b5NsJSQT4NsB7+HScR2Xy80PDw/PeuGFF3Li4+OLg4ODG7EgHNG7kLqPEgYhjES1UMNTlznjdO3aNZ8TJ05EHjhwYIpCoYBuTFDHEW8IQ51WtBrDCH0IzM8uOAdkMBgVIpHo/urVq2+tXr06Kzo6+nEnnBBfyQ4iNE+yL8XzhzllZWXitLQ0v9OnT4dcvnw5XKFQhPX29uLNfvSPMn6WHctMCVuDRV9OlE647wfV4ZpZLFa5QCDIW758+f2VK1c+eOKJJ2q6u7vlPj4+kJRNCoDkQKg3Xb0EYbfU1NRx0OknKytrilKpjMAuBePRU+rAiM+WwA28oY2Qof11AyzXL8cAh7D1bDa7WCwW52zatOn+8uXL86OioiAf0CKVw4lKCRXj8Bv6YO08fPhQcuXKFb+TJ09Cu/NohUIRjpWKBN7q1+shvpGTmaRNYE9XvQGvowrBF9B+hcHBwTmJiYm58fHxUL6x0cXFBWrkQulOAtL5OBFMJiBeLr++vp6XnZ3tdeHChYlQ8auvUQz0Okeg3TKYMXCUQS0YyTDT9LE4+OD8R6f97OzsaqCY7cyZM+8nJibmx8XFVTg7O7e4u7uDfzDoDmgb8kSMEPpdnWpr67gPHuR5Xr16FQI3k9rb26GfoZ9Go3HDbtjgdXzwHFST5WnI2ZEiIKnBhj6rv+lCjSMAHxQdqxAIBIWJiYl5ixcvLpg4cWKtv79/G3YlibT20/+wWUTDKx3LZDKn1tZW19u3b4+DOo/QB0+pVAar1Wro/uqK3cTQ9ynM+i4xcTJ5FM4EXfEhDHxQoq/S09OzYMOGDblz5syB3bDex8cH6u9Z9FqSyasw80Gct9AKvb29XVdE9+7du+NOnz4dUFZW5tfd3e2jVuvKSOrzVz+byiQemw2hQddt9M3AdwATvunqwNdXK5VbsmjRoqIlS5YUR0REVHt7e8vM1X6UgRB/kX4TmcLCQig/53vmzJmgO3fuhKhUqqCenh5fPWbp97IAyhhlllHymSlwetWf8YJSYF5AAm6jo6Njhbu7e8kzzzxTPH/+/LLp06fXeHl5tWDVtK3SU8H85Zn+BtxEbWtrg41WUFBQ4Jqeng6ZVL45OTkBnZ2dAT09PdCdGYpFg88I1c70uzQT4rHpMzT5Sdx0xE1OqIAAfIeKb1Bqs8bZ2bli6dKlJbGxsWVTpkypCQgIaObz+boS/qb4foPN1CgAiC5R34ypr693Li0tFWVlZUFfi8DU1NTgjo6O8cCs3t5eqA4NZ4sARv3KaPo+KmXz6p//z0jWJz78s34lN/D5Wuzt7RvYbHa1q6trxYoVK0qhJkxAQECDv79/q4uLCzjnVtZ+VtiGhmC0Hm9B07FLSko4DQ0NLgUFBZ4QE7hw4cL4zs5OX41G4wF1XhEUdcHKo+D81W8ei/OWQbbNNVFZNDBuIM9xjQfAA5MTslqgBmqDg4NDlb+/f0VCQkIlBFygkU1QUFALn88HgFqkmQ3lwv6oT1HLrampgZZdupLkZ86cGQeH/j09PWKNRiPS+RZ9KXAASPAd8VqR4GPgqVOmz7FPdvWdZSA+HmYGguKFaHW7H4vFAs1XExUVVQkH7pMnT64fP368NCIiQo6Zprp6p6Y64GYIkU08OqDXBxxXcQoLHworK6tcS0pK3G7evOl5+/Zt387OTnetVivUaDTwCxpSiGlInMf6cQJDfCbL84EBEX3Q4WYm8BrnObSigxvvsOE2M5lMKEVYv2DBgsrZs2dXBQUFNYSEhEATz3YXFxdwSXRl+S3Fd7KLJSwM+l2RgAFZWVnCuro6SXl5uUt6erpLZmamW1VVlS/snBqNhqfVankATKzuKZg0sOsCs/BfssEd/d0OwAMaT3fEwGAwoEcglNSHRjRQ/blp0qRJ1dOmTauLiIhoCgwMlHp4eLQGBQXhu5+u/4WlmECYqDY00JB2lMvl/OrqanFxcbEoNzcXAnaSyspKb7VaDaDkA4/VarVQr0ivDowMBGGhP2/COJ/JyCYOOuAT8BrAhvNc5+NB0yEAnZ2dHYCvg81mtwYEBNRFR0c3REZGtgQGBjZ7eXlJPT092zw9PYHvADzL8h0zcMgs1CQRGMAs2D3ZOTk5jh0dHfza2lpJYWGhS1FREbe0tNSlpqbGo6enR+foa7VaB41Gw4Wy5hjTQFvi+YxDzRtniK73AZRaB8IzmUzY/dR2dnadbDZbOnHixDowM0JDQ5U+Pj5t/v7+UqFQKPfy8lKJRCK8U5CWBt7QbB/QEUlnrtbU1LDLy8sd5HK5M/C4ublZWFJSwi0vLxdmZ2e7YVXSeSiKsuFXo9E4QZ8Q4DXmquABnsH8SX3NhwfSYNMFvsEGCzzvwHjeA/1LoLJ3eHi4zrQMCQnp9PX1Vbq7u7e4ubm1eXh4dHh6euqqveMdoqzJd4uDUC94o+cLIIyKigp7Pp8PzGJ3dnbat7a2ctvb212kUqmgurraEXoMlJaW8gsLC916enqgr4AziqIsrVY7kDH6a0CZTKaOKQwGoxvMDCisFBAQ0Dpu3LhusVis8fX17YLS466uri1cLlfJ5XJ73Nzc1PrA0zmnJp75GBLZ4fXoTNo7TXpoACBh2SyZTMbu6uqyr6+vZ6tUKo5UKhWqVCpBbW0tXAxgSaVS8DGda2pqJG1tbaAxwT0Bt4Sp0WoZzMEDd+BooEw7Hb91VdoZDIaKyWTKwH+HJkJeXl49wHMPD49uuFQNPAdwuru7q93c3DRCoRA3T/s7fRnnO/XctBoIB3J1IMNKSkpYQqFQx7CWlhaWWq22k8vlTgwGQ+dboCgK0TmmSqVidHV1MaARDAZI3auhaYi9vT108UE5HA78V93b26uADAcul6vg8XgaiUSi7e3t1Xp7e+MtuMzqi2eSpOo9RD07zZ0Rtc8bAKUdgI7NZtt3dnbCn5nA5+bmZkcGgyGws7MDd4Qrl8uhsSsT+AwNYOC/+MywTVb3v1wuF3V0dESB7y4uLlo2m92lVquh6xH4eEpb5PlgmzS1lKffRlOAJAVG+2ZkjBzDpgmNTYz+d5oCo4kCQ2001gHhWN/qjEnTWKMP2fWSHW+M3jb279YBoY0teqxPZ5TL9IhjLw3CEccyesK2SQHTtzYahLbJUXpWY4gCNAiHhdmm75rDMt0R8tGRSlUahCNEwOhpjl4KUAhC29yHbHNWo1eg6JWRp4BRENJCTJ6o9BM0BchQwCgIybyMHktTgKYAeQpYDYS0RiXPnLH1xNiVEKuBcGwJFL3asUEBajYOGoRjQ1roVdowBWgQDjtzzNxNzXx82JdPT8B4pTNqaURLDLX0pN82Gigw7JqQhuVoECN6DeZQYNhBaM7k6WdpCowGCtAgHA1cpNcwQihg2O6jQThC2EdPc/RSgAYhVby1EefWRqZBFVXHxHtoEI4JNj+6SBqoZJluWYrRIOznh2UJTZbtwzeepoO1af84CGkeWJsH9PdGCwVMxA6tCUeLANDrGLEUoEE4Elln4o5r3aWOiElSQhJzV0qDkBI20C+hKWA6BWgQmk47+kmaApRQgHIQmquaKVkV/RIboAAtCUSZQDkIiX6YHkdTgKZAHwWIg5De2GiZoSlgEQoQB6FFPj/IS2nAW5Pa9LeGmQL/B37+nk8jQfPrAAAAAElFTkSuQmCC';
    } else if (fileType.startsWith('audio/')) {
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDgwYzAtMTcuNy0xNC4zLTMyLTMyLTMycy0zMiAxNC4zLTMyIDMyVjIyNEg0OGMtMTcuNyAwLTMyIDE0LjMtMzIgMzJzMTQuMyAzMiAzMiAzMkg1MlY0NDhjMCAxNy43IDE0LjMgMzIgMzIgMzJzMzItMTQuMyAzMi0zMlYyODhoMTQ0VjQ0OGMwIDE3LjcgMTQuMyAzMiAzMiAzMnMzMi0xNC4zIDMyLTMyVjI4OGg0NGMxNy43IDAgMzItMTQuMyAzMi0zMnMtMTQuMy0zMi0zMi0zMkgyNTZWODB6Ii8+PC9zdmc+';
    }
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMTY1LjkgMzk3LjRjMCAyLTIuMyAzLjYtNS4yIDMuNi0zLjMuMy01LjYtMS4zLTUuNi0zLjYgMC0yIDIuMy0zLjYgNS4yLTMuNiAzLS4zIDUuNiAxLjMgNS42IDMuNnptLTMxLjEtNC41Yy0uNyAyIDEuMyA0LjMgNC4zIDQuOSAyLjYgMSA1LjYgMCA2LjItMnMtMS4zLTQuMy00LjMtNS4yYy0yLjYtLjctNS41LjMtNi4yIDIuM3ptNDQuMi0xLjdjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6TTI0NC44IDhhMjI0IDIyNCAwIDAgMCAwIDQ0OCAyMjQgMjI0IDAgMCAwIDAtNDQ4em0xMjQuNCAzMjUuMWMtMTMuNSAyLjQtMjcuNSAyLjc0Mi00MS42IDgtNDMgMTYuMS02Ni43IDU4LjEyLTYzIDExNyAwIDEtLjgIDMuMS0yLjQgNC4xLTE0LjUgMTAuNS0zMi4zIDIwLjItNDcuNCAzOS41LTIxLjEtMTkuOS0zNS02LjgtNDcuMi0yOS45LTE0LjUtMzQuMzM0LTEwMS4zNS03LjI1Ni05NC41LTYzLTUuOC0xNS41LTIuNC0yNi4yIDQuNS0zOC4yLTEwLTE1LjUtMjUuMi02LjItMzItMTcuNSA5LjMgMS43IDE1LjYgMzIuOCAyNCAyMi41IDE1LjUtMTguMi04LjctMTAuMy03LjItMjQuNSA2LjctMTktMTcuMS0zMS40IDQuNC01MS42IDIwLjItMTUgMjUuMi0xMC45IDI1LjItMTQuMiAwLTQxLjktNS4zLTQ3LjkgNS44LTY3LjQgMTAuOC0yMC40IDIxLTI0LjMgNC4yLTQ5LjNsOC42IDIxLjcgNi4zIDEyLjYgLjcgMiAxMC4xLTMwLjkgLjggMjIuMTIgNC4zIDEwLjE4LjIuNS0uMi0uNXM3LjItMjIuMSA2LjQtMzMuMmM2LjQgMS42IDguOC0xLjUgMTQuNC0xMS4zIDUuMi0xMy43IDIuMi0yMi4xLTctMjIuOS0uMy0zLjkgOS41LTI0LjcgNy42LTI4LjJsLTkuMiA1LjUgLjMtOS43IDEwLjggMTkuNHMtNC43IDI4LjIgMTMuOSAzNC4xYzE4LjMgNS44IDIwLjMtMzMuNSAyMC42LTM3LjduLTYuNCAzLjkgLjYtMTMuNmMtNC40LTExLjAzNi0yMi4yLTIyLjcxLTIzLjYtMjUuMjEtNC4yLTExLjQuOC0xNi44IDEwLjUtMTUgNS41IDEgOC44IDUuNiAxMS41IDEyLjggOS45IDE4LjIgOCA0Ni43IDE2LjMgNjIuOCAxMi41IDI0LjEgNTMgMzcgNDkuNCAxMy40IDMwLjggMTguNyAyMS4zIDMzLjYgMzguMyA1My4zIDE1LjkgMTguNiAxOS4zIDM1LjYgNDEuMSA0OS4xIDkgNS44IDM1LjUgMjUuNSAyNS45IDQwLjEtNC45IDcuMi0zOC43IDcuOS01MC4xIDcuNHptLTE3Mi4yLTY5YzEuMiAyLjQgMy42IDMuMiA1LjkyIDEuOCAyLjUyLTEuNCAzLjQyLTQuNiAyLjEyLTYuNzgtMS4zLTIuMi0zLjctMi45LTYtMS40LTIuNSAxLjMtMy4yIDQuNC0yIDYuNHptMjQuOCAxMC4zbC0uMiAxLjMgNS4zIDcuNnM2LjUtMi40IDguOS0uOWMtLjItLjEtOC4xLTYuMy0xNC0xLjJ6bTU0LjE0IDYuMyA2LjMyLS42LTMuMiA0LjIgNC41LjUgMy02LjMtMS4zLTRMMjc0LjU0IDI3NXMtNS40IDIuNS01LjggNy41bC40IDEyLjNhNi42NSA2LjY1IDAgMCAwIDIuNC4zczItMS4yIDEuMS00LjZjLS42LTIuMyA1LTYuMSA1LjQtNS42LjIuMi41IDMuNi40IDQuNmwtLjQgMS44cy0zLjMgMS44LTMuOSAyLjRjLTEgMSAyLjEgMS44IDIuMSAxLjguOS4xIDMuOC0xLjUgMy44LTEuNWwyLjUtMi4zcy4zIDIgLjcgMy4zYy0uNy0uMS0xLjUuMS0xLjcuOS0uMyAxLjUgMyAzLjUgMy43LjggMy42IDEuNSAyLjcgMy4xIDEuOCA1LjZ6bTQyIDguNWMtMi45LjctNC45IDIuNi00LjYgNC45LjMgMiAyLjkgMy4zIDUuOSAyLjYgMi45LS43IDQuOS0yLjYgNC42LTQuNi0uMy0xLjktMy0zLjItNS45LTIuOXpNMjEyLjEgMjI2LjNjLTIuOS43LTQuOSAyLjYtNC42IDQuOS4zIDIgMi45IDMuMyA1LjkgMi42IDIuOS0uNyA0LjktMi42IDQuNi00LjYtLjMtMS45LTMtMy4yLTUuOS0yLjl6bTExMC4yIDcwLjljLTMuMy0uMy01LjYgMS4zLTUuNiAzLjYgMCAyIDIuMyAzLjYgNS4yIDMuNiAzLjMuMyA1LjYtMS4zIDUuNi0zLjYgMC0xLjktMi4zLTMuNi01LjItMy42eiIvPjwvc3ZnPg==';
}
    function playSound(fileName) {
    const soundFile = uploadedFiles.find(file => file.name === fileName && file.type.startsWith('audio/'));
    if (soundFile) {
        const audio = new Audio(soundFile.src);
        audio.play();
    } else {
        console.error(`Sound file "${fileName}" not found in the file explorer.`);
    }
}
    function setupFileExplorerDragAndDrop() {
        const fileExplorer = document.getElementById('file-explorer');
        
        fileExplorer.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileExplorer.classList.add('drag-over');
        });

        fileExplorer.addEventListener('dragleave', () => {
            fileExplorer.classList.remove('drag-over');
        });

        fileExplorer.addEventListener('drop', (e) => {
            e.preventDefault();
            fileExplorer.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            handleFileUpload(files);
        });
    }

function createImageObject(imageSrc, x, y) {
    const img = new Image();
    img.onload = function() {
        const newObj = {
            x: x,
            y: y,
            rotation: 0,
            type: 'image',
            image: img,
            imageSrc: imageSrc, // Store the image name or identifier
            width: img.width,
            height: img.height,
            size: 100,
            name: `Image ${objects.length + 1}`,
            scripts: []
        };
        objects.push(newObj);
        updateObjectList();
        selectObject(objects.length - 1);
        render();
    };
    img.src = imageSrc;
}

function addScriptToObject(objectIndex, scriptContent, fileName) {
    const scriptId = `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scriptObj = {
        id: scriptId,
        src: scriptContent,
        name: fileName
    };
    if (!objects[objectIndex].scripts) {
        objects[objectIndex].scripts = [];
    }
    objects[objectIndex].scripts.push(scriptId);
    globalScripts[scriptId] = scriptObj;
    updateScriptsList(objectIndex);
}




function updateScriptsList(objectIndex) {
    const scriptsList = document.getElementById('object-scripts');
    scriptsList.innerHTML = '';
    if (objects[objectIndex] && objects[objectIndex].scripts) {
        objects[objectIndex].scripts.forEach((scriptId, index) => {
            const script = globalScripts[scriptId];
            if (script) {
                const li = document.createElement('li');
                li.textContent = script.name;
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.onclick = () => removeScriptFromObject(objectIndex, index);
                li.appendChild(removeButton);
                scriptsList.appendChild(li);
            }
        });
    }
}
function removeScriptFromObject(objectIndex, scriptIndex) {
    const scriptId = objects[objectIndex].scripts[scriptIndex];
    objects[objectIndex].scripts.splice(scriptIndex, 1);
    delete globalScripts[scriptId];
    updateScriptsList(objectIndex);
}

      // Setup drag and drop for canvas
    function setupCanvasDragAndDrop() {
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const fileIndex = e.dataTransfer.getData('text');
            if (fileIndex !== '') {
                const file = uploadedFiles[parseInt(fileIndex)];
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                if (file.type.startsWith('image/')) {
                    createImageObject(file.src, x, y);
                }
            }
        });
    }
  function setupScriptDragAndDrop() {
    const propertiesPanel = document.getElementById('properties');
    
    propertiesPanel.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    propertiesPanel.addEventListener('drop', (e) => {
        e.preventDefault();
        if (selectedObjectIndex !== null) {
            const fileIndex = e.dataTransfer.getData('text');
            if (fileIndex !== '') {
                const file = uploadedFiles[parseInt(fileIndex)];
                if (file.type === 'application/javascript' || file.type === 'text/javascript') {
                    addScriptToObject(selectedObjectIndex, file.src, file.name);
                }
            }
        }
    });
}

function decodeBase64Script(base64Src) {
    const base64Content = base64Src.split(',')[1];
    return atob(base64Content);
}
function executeScripts() {
    objects.forEach(obj => {
        if (obj.scripts && Array.isArray(obj.scripts)) {
            obj.scripts.forEach(scriptId => {
                const script = globalScripts[scriptId];
                if (script) {
                    const decodedScript = script.src.startsWith('data:') ? decodeBase64Script(script.src) : script.src;
                    try {
                        const scriptFunction = new Function('object', 'playSound', 'gameScene', 'findObjectNamed', 'addProperty', 'getProperty', 'setProperty', `
                            ${decodedScript}
                        `);
                        scriptFunction(
                            obj, 
                            playSound, 
                            gameScene, 
                            findObjectNamed,
                            (propertyName, propertyConfig) => {
                                if (!obj.customProperties) {
                                    obj.customProperties = {};
                                }
                                if (!obj.customProperties[propertyName]) {
                                    obj.customProperties[propertyName] = propertyConfig;
                                    updatePropertiesPanel();
                                }
                            },
                            (propertyName) => {
                                return obj.customProperties && obj.customProperties[propertyName] 
                                    ? obj.customProperties[propertyName].value 
                                    : undefined;
                            },
                            (propertyName, value) => {
                                if (obj.customProperties && obj.customProperties[propertyName]) {
                                    obj.customProperties[propertyName].value = value;
                                    updatePropertiesPanel();
                                    render();
                                }
                            }
                        );
                    } catch (error) {
                        console.error(`Error in script "${script.name}" for object "${obj.name}":`, error);
                        console.error('Error Line:', error.lineNumber);
                    }
                }
            });
        }
    });
}
function updatePropertiesPanel() {
    if (selectedObjectIndex !== null) {
        const obj = objects[selectedObjectIndex];
        const propertiesDiv = document.getElementById('properties');
        
        // Clear existing properties
        propertiesDiv.innerHTML = '<h3>Properties</h3>';
        
        // Add basic properties
        propertiesDiv.innerHTML += `
            <label for="object-name">Name:</label>
            <input type="text" id="object-name" value="${obj.name}"><br>
            <label for="position-x">Position X:</label>
            <input type="number" id="position-x" value="${obj.x}"><br>
            <label for="position-y">Position Y:</label>
            <input type="number" id="position-y" value="${obj.y}"><br>
            <label for="rotation">Rotation:</label>
            <input type="number" id="rotation" value="${obj.rotation}"><br>
            <label for="size">Size:</label>
            <input type="number" id="size" value="${obj.size}"><br>
        `;

        if (obj.type !== 'image') {
            propertiesDiv.innerHTML += `
                <label for="color">Color:</label>
                <input type="color" id="color" value="${obj.color}">
            `;
        }

        if (obj.type === 'text') {
            propertiesDiv.innerHTML += `
                <div id="text-properties">
                    <label for="text-content">Text content:</label>
                    <input type="text" id="text-content" value="${obj.textContent}"><br>
                    <label for="font-size">Font size:</label>
                    <input type="number" id="font-size" value="${obj.fontSize}"><br>
                </div>
            `;
        }

        // Add custom properties
        if (obj.customProperties) {
            const customPropertiesDiv = document.createElement('div');
            customPropertiesDiv.id = 'custom-properties';
            
            for (const [propName, propConfig] of Object.entries(obj.customProperties)) {
                const propertyDiv = document.createElement('div');
                propertyDiv.className = 'property';
                
                const label = document.createElement('label');
                label.textContent = propName;
                propertyDiv.appendChild(label);
                
                let input;
                switch (propConfig.type) {
                    case 'number':
                        input = document.createElement('input');
                        input.type = 'number';
                        input.value = propConfig.value;
                        input.step = propConfig.step || 1;
                        input.min = propConfig.min;
                        input.max = propConfig.max;
                        break;
                    case 'checkbox':
                        input = document.createElement('input');
                        input.type = 'checkbox';
                        input.checked = propConfig.value;
                        break;
                    case 'range':
                        input = document.createElement('input');
                        input.type = 'range';
                        input.value = propConfig.value;
                        input.min = propConfig.min;
                        input.max = propConfig.max;
                        input.step = propConfig.step || 1;
                        break;
                    default:
                        input = document.createElement('input');
                        input.type = 'text';
                        input.value = propConfig.value;
                }
                
                input.addEventListener('change', (e) => {
                    const newValue = input.type === 'checkbox' ? e.target.checked : 
                                     (input.type === 'number' || input.type === 'range') ? parseFloat(e.target.value) : 
                                     e.target.value;
                    obj.customProperties[propName].value = newValue;
                    render();
                });
                
                propertyDiv.appendChild(input);
                customPropertiesDiv.appendChild(propertyDiv);
            }
            
            propertiesDiv.appendChild(customPropertiesDiv);
        }

        // Add event listeners
        document.getElementById('object-name').addEventListener('input', e => {
            objects[selectedObjectIndex].name = e.target.value;
            updateObjectList();
        });

        document.getElementById('position-x').addEventListener('input', e => {
            objects[selectedObjectIndex].x = parseFloat(e.target.value);
            render();
        });

        document.getElementById('position-y').addEventListener('input', e => {
            objects[selectedObjectIndex].y = parseFloat(e.target.value);
            render();
        });

        document.getElementById('rotation').addEventListener('input', e => {
            objects[selectedObjectIndex].rotation = parseFloat(e.target.value);
            render();
        });

        document.getElementById('size').addEventListener('input', e => {
            objects[selectedObjectIndex].size = parseFloat(e.target.value);
            render();
        });

        if (obj.type !== 'image') {
            document.getElementById('color').addEventListener('input', e => {
                objects[selectedObjectIndex].color = e.target.value;
                render();
            });
        }

        if (obj.type === 'text') {
            document.getElementById('text-content').addEventListener('input', e => {
                objects[selectedObjectIndex].textContent = e.target.value;
                render();
            });

            document.getElementById('font-size').addEventListener('input', e => {
                objects[selectedObjectIndex].fontSize = parseInt(e.target.value);
                render();
            });
        }
    }
}

function initializeScriptManagement() {
    globalScripts = {};
    objects.forEach(obj => {
        if (obj.scripts) {
            obj.scripts = obj.scripts.map(script => {
                if (typeof script === 'string' && script.startsWith('script_')) {
                    return script; // Already in the correct format
                }
                const scriptId = `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                globalScripts[scriptId] = script;
                return scriptId;
            });
        }
    });
}
 // Initialize all event listeners and setup
    function init() {
        setupResponsiveCanvas();
        initializeScriptManagement();
        setupPropertyListeners();
        setupContextMenu();
        setupFullscreenButton();
        setupGameControls();
        setupThemeSwitcher();
        setupDragAndDrop();
        setupCanvasDragAndDrop();
        setupFileExplorerDragAndDrop();
        setupScriptDragAndDrop();

        // Set up file input
        document.getElementById('file-input').addEventListener('change', (e) => handleFileUpload(e.target.files));

        // Set up delete button
        document.getElementById("delete-object").addEventListener('click', deleteSelectedObject);
        document.getElementById("delete-object").disabled = true; // Initially disable the button

        // Set initial canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            render();
        });

        // Initialize with a default object
        createObject('square');
    }

    init(); // Start the editor functionalities
});