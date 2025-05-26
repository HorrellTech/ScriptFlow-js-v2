document.addEventListener('DOMContentLoaded', () => {
    const nextLabel = "v";
    const previousLabel = "^";
    const bodyLabel = "{--}"

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Touch handling variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTouchEnd = 0;
    let touchDevice = false;

    // Make getConnectedValue available globally for blocks.js
    window.getConnectedValue = getConnectedValue;

     // Check if we're running in modal mode
    const isModalMode = window.SCRIPTFLOW_MODAL_MODE === true;
    
    // Create and insert toolbar before the app container
    const appContainer = document.getElementById('app-container');
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'toolbar';
    toolbar.className = 'toolbar';
    
    // Add logo
    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.textContent = 'ScriptFlow.js';
    toolbar.appendChild(logo);
    
    // Create toolbar buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'toolbar-buttons';
    
    // New Project button
    const newProjectBtn = document.createElement('button');
    newProjectBtn.id = 'new-project-btn';
    newProjectBtn.textContent = 'New';
    newProjectBtn.title = 'New Project';
    newProjectBtn.addEventListener('click', createNewProject);
    buttonContainer.appendChild(newProjectBtn);
    
    // Save Project button
    const saveProjectBtn = document.createElement('button');
    saveProjectBtn.id = 'save-project-btn';
    saveProjectBtn.textContent = 'Save';
    saveProjectBtn.title = 'Save Project';
    saveProjectBtn.addEventListener('click', saveProject);
    buttonContainer.appendChild(saveProjectBtn);
    
    // Open Project button
    const openProjectBtn = document.createElement('button');
    openProjectBtn.id = 'open-project-btn';
    openProjectBtn.textContent = 'Open';
    openProjectBtn.title = 'Open Project';
    openProjectBtn.addEventListener('click', openProject);
    buttonContainer.appendChild(openProjectBtn);
    
    // Hidden file input for opening projects
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileSelect);
    buttonContainer.appendChild(fileInput);
    
    toolbar.appendChild(buttonContainer);
    
    // Create right-side toolbar section
    const toolbarRight = document.createElement('div');
    toolbarRight.className = 'toolbar-right';
    
    // Tutorial button
    const tutorialBtn = document.createElement('button');
    tutorialBtn.id = 'show-tutorial-btn';
    tutorialBtn.textContent = 'Tutorial';
    tutorialBtn.title = 'Show Tutorial';
    tutorialBtn.addEventListener('click', showTutorial);
    toolbarRight.appendChild(tutorialBtn);
    
    toolbar.appendChild(toolbarRight);
    
    // Insert toolbar before app container
    document.body.insertBefore(toolbar, appContainer);
    
    // Add CSS for toolbar directly via JS
    const style = document.createElement('style');
    style.textContent = `
        /* Top Toolbar */
        #toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #1a202c;
            padding: 10px 15px;
            border-bottom: 1px solid #4a5568;
            color: #e2e8f0;
        }
        
        .logo {
            font-size: 1.2rem;
            font-weight: bold;
            color: #81e6d9;
            text-shadow: 0 0 10px rgba(129, 230, 217, 0.5);
        }
        
        .toolbar-buttons {
            display: flex;
            gap: 10px;
        }
        
        .toolbar-right {
            display: flex;
            gap: 10px;
        }
        
        #toolbar button {
            background-color: #2d3748;
            color: #e2e8f0;
            border: 1px solid #4a5568;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        
        #toolbar button:hover {
            background-color: #4a5568;
        }
        
        #show-tutorial-btn {
            background-color: #4299e1;
            border-color: #3182ce;
        }
        
        #show-tutorial-btn:hover {
            background-color: #3182ce;
        }
        
        /* Ensure app container takes remaining height */
        #app-container {
            height: calc(100vh - 51px); /* Subtract toolbar height + border */
        }
    `;
    document.head.appendChild(style);

    // Listen for messages from parent window (modal mode)
    window.addEventListener('message', (event) => {
        const { action, fileContents } = event.data;
        
        if (action === 'loadProject' && fileContents) {
            // Process the project file contents sent from parent
            try {
                processProjectFile(fileContents);
            } catch (error) {
                console.error("Error loading project from parent:", error);
                alert("Error loading project file. The file may be corrupted or in an incompatible format.");
            }
        } else if (action === 'getGeneratedCode') {
            // Parent is requesting the generated code
            const generatedCode = document.getElementById('generated-code').textContent;
            window.parent.postMessage({
                action: 'generatedCode',
                code: generatedCode
            }, '*');
        }
    });

    const workspace = document.getElementById('workspace');
    const blockPalette = document.getElementById('block-palette');
    const generateCodeBtn = document.getElementById('generate-code-btn');
    const generatedCodeArea = document.getElementById('generated-code');
    const svgLayer = document.getElementById('connection-layer');
    const canvas = document.getElementById('connection-layer-canvas');
    //const ctx = canvas.getContext('2d');

    // State variables
    let blocks = [];
    let nextBlockId = 0;
    let activeDrag = null; // { element, offsetX, offsetY, isNew }
    
    let connections = []; // { id, fromBlockId, fromConnector, toBlockId, toConnector, lineElement }
    let nextConnectionId = 0;

    let isConnecting = false;
    let connectionStartInfo = null; // { blockId, connectorElement, connectorType, connectorName, isOutput }
    let tempLine = null;

    // Context menu variables
    let contextMenu = null;
    let rightClickedConnectionId = null;
    let rightClickedConnectorElement = null;

    // Undo system variables
    const MAX_UNDO_HISTORY = 30; // Maximum number of states to keep in history
    let undoHistory = [];
    let currentStateIndex = -1;

    // Zoom and pan variables
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Tutorial mode variables
    let tutorialMode = localStorage.getItem('tutorialCompleted') !== 'true';
    let tutorialStep = 0;
    let tutorialTooltip = null;
    const tutorialSteps = [
        {
            target: '.category-flow-control',
            message: 'Welcome to ScriptFlow! Let\'s start by clicking on "Flow Control" to expand blocks',
            position: 'right',
            autoAdvance: false
        },
        {
            target: '[data-block-type="start"]',
            message: 'Drag a "Start" block to the workspace - this is the entry point of your program',
            position: 'right'
        },
        {
            target: '.category-objects',
            message: 'Now click on "Objects" to see object-oriented programming blocks',
            position: 'right',
            autoAdvance: false
        },
        {
            target: '[data-block-type="class_definition"]',
            message: 'Drag a "Class Definition" block to the workspace - we\'ll build a simple class',
            position: 'right',
            waitForBlock: block => block.type === 'class_definition'
        },
        {
            target: '.connector-parent',
            message: 'Connect the Start block to the Class block by dragging from the Start block\'s output connector to the Class block\'s input connector',
            position: 'right',
            waitForConnection: true,
            highlightConnectors: true
        },
        {
            target: '[data-block-type="class_definition"] input',
            message: 'Type a name for your class (e.g. "Calculator")',
            position: 'bottom',
            waitForAction: element => {
                const classBlock = blocks.find(b => b.type === 'class_definition');
                return classBlock && classBlock.data.className && classBlock.data.className.length > 0;
            }
        },
        {
            target: '.category-functions',
            message: 'Click on "Functions" to see function-related blocks',
            position: 'right',
            autoAdvance: false
        },
        {
            target: '[data-block-type="function_definition"]',
            message: 'Drag a "Function Definition" block to the workspace - this will be a method in our class',
            position: 'right',
            waitForBlock: block => block.type === 'function_definition'
        },
        {
            target: '.connector-parent',
            message: 'Connect the Class block\'s output connector to the Function block\'s input connector',
            position: 'right',
            waitForConnection: conn => {
                const fromBlock = blocks.find(b => b.id === conn.fromBlockId);
                const toBlock = blocks.find(b => b.id === conn.toBlockId);
                return fromBlock && toBlock && 
                    fromBlock.type === 'class_definition' && 
                    toBlock.type === 'function_definition';
            },
            highlightConnectors: true
        },
        {
            target: '[data-block-type="function_definition"] input',
            message: 'Name your function (e.g. "calculate")',
            position: 'bottom',
            waitForAction: element => {
                const functionBlock = blocks.find(b => b.type === 'function_definition');
                return functionBlock && functionBlock.data.funcName && functionBlock.data.funcName.length > 0;
            }
        },
        {
            target: '.category-logic',
            message: 'Let\'s add some logic. Click on "Logic" to see logic blocks',
            position: 'right',
            autoAdvance: false
        },
        {
            target: '[data-block-type="if_condition"]',
            message: 'Drag an "If Condition" block to the workspace',
            position: 'right',
            waitForBlock: block => block.type === 'if_condition'
        },
        {
            target: '.connector-parent',
            message: 'Connect the Function block\'s output to the If block\'s input',
            position: 'right',
            waitForConnection: conn => {
                const fromBlock = blocks.find(b => b.id === conn.fromBlockId);
                const toBlock = blocks.find(b => b.id === conn.toBlockId);
                return fromBlock && toBlock && 
                    fromBlock.type === 'function_definition' && 
                    toBlock.type === 'if_condition';
            },
            highlightConnectors: true
        },
        {
            target: '[data-block-type="if_condition"] input',
            message: 'Type a condition (e.g. "x > 0")',
            position: 'bottom',
            waitForAction: element => {
                const ifBlock = blocks.find(b => b.type === 'if_condition');
                return ifBlock && ifBlock.data.condition_text && ifBlock.data.condition_text.length > 0;
            }
        },
        {
            target: '.category-input-output',
            message: 'Finally, add some output. Click on "Input/Output"',
            position: 'right',
            autoAdvance: false
        },
        {
            target: '[data-block-type="log_message"]',
            message: 'Drag a "Log Message" block to the workspace',
            position: 'right',
            waitForBlock: block => block.type === 'log_message'
        },
        {
            target: '.connector-parent',
            message: 'Connect the If block\'s "True" branch to the Log Message block',
            position: 'right',
            waitForConnection: conn => {
                const fromBlock = blocks.find(b => b.id === conn.fromBlockId);
                const toBlock = blocks.find(b => b.id === conn.toBlockId);
                return fromBlock && toBlock && 
                    fromBlock.type === 'if_condition' && 
                    toBlock.type === 'log_message';
            },
            highlightConnectors: true
        },
        {
            target: '[data-block-type="log_message"] input',
            message: 'Type a message to log (e.g. "Condition is true!")',
            position: 'bottom',
            waitForAction: element => {
                const logBlock = blocks.find(b => b.type === 'log_message');
                return logBlock && logBlock.data.message && logBlock.data.message.length > 0;
            }
        },
        {
            target: '#generate-code-btn',
            message: 'Great job! Now click "Generate Code" to see your complete JavaScript program.',
            position: 'left'
        },
        {
            target: '#generated-code',
            message: 'You\'ve created a class with a method that includes conditional logic! This is the essence of visual programming with ScriptFlow.',
            position: 'top'
        }
    ];

     // Initialize the block loader system
    if (typeof window.BlockLoader !== 'undefined') {
        // Add a small delay to ensure blocks.js is fully loaded
        setTimeout(() => {
            window.BlockLoader.init();
        }, 100);
    }

    // Add refresh function for block palette
    window.refreshBlockPalette = function() {
        // Check if BLOCK_DEFINITIONS exists and has content before rebuilding
        if (typeof window.BLOCK_DEFINITIONS === 'undefined' || 
            Object.keys(window.BLOCK_DEFINITIONS).length === 0) {
            console.warn('BLOCK_DEFINITIONS is empty or undefined, skipping palette refresh');
            return;
        }
        
        // Clear current palette
        blockPalette.innerHTML = '';
        
        // Rebuild palette with current block definitions
        populateBlockPalette();
    };

    // Make populateBlockPalette globally accessible
    window.populateBlockPalette = populateBlockPalette;

    // Add clear workspace function
    window.clearWorkspace = function() {
        if (confirm('Clear workspace? This will remove all blocks.')) {
            blocks = [];
            connections = [];
            workspace.innerHTML = '';
            saveState();
        }
    };

    // Make sure SVG layer covers the entire workspace area initially
    adjustSvgLayerSize();

    // Setup zoom and pan handlers
    setupZoomPan();

    // New function definitions for toolbar actions
    function createNewProject() {
        if (blocks.length > 0) {
            if (!confirm('Are you sure you want to create a new project? All unsaved changes will be lost.')) {
                return;
            }
        }
        
        // Clear workspace
        while (blocks.length > 0) {
            const block = blocks[0];
            if (block.element && block.element.parentNode) {
                block.element.parentNode.removeChild(block.element);
            }
            blocks.shift();
        }
        
        // Clear SVG connections
        while (svgLayer.firstChild) {
            svgLayer.removeChild(svgLayer.firstChild);
        }
        connections = [];
        
        // Reset IDs - but only when creating a truly new project, not when loading
        nextBlockId = 0;
        nextConnectionId = 0;
        
        // Reset zoom and pan
        scale = 1;
        panX = 0;
        panY = 0;
        applyZoomOnly();
        
        // Reset history
        undoHistory = [];
        currentStateIndex = -1;
        
        // Reset generated code area
        generatedCodeArea.textContent = "// Code will appear here";
        
        // Don't save state here - let the caller decide when to save
    }
    
    function saveProject() {
        // Create a serializable state with all necessary data
        const projectData = {
            blocks: blocks.map(block => ({
                id: block.id,
                type: block.type,
                data: {...block.data},
                position: {
                    left: block.element.style.left,
                    top: block.element.style.top
                },
                connections: JSON.parse(JSON.stringify(block.connections))
            })),
            connections: connections.map(conn => ({
                id: conn.id,
                fromBlockId: conn.fromBlockId,
                fromConnectorType: conn.fromConnectorType,
                fromConnectorName: conn.fromConnectorName,
                toBlockId: conn.toBlockId,
                toConnectorType: conn.toConnectorType,
                toConnectorName: conn.toConnectorName
            })),
            nextBlockId,
            nextConnectionId,
            viewSettings: {
                panX,
                panY,
                scale
            },
            version: "2.0.0" // Version for compatibility checking in future
        };
        
        // Convert to JSON string
        const jsonData = JSON.stringify(projectData, null, 2);
        
        // Use the FileSaver API if available in modern browsers
        if (window.showSaveFilePicker) {
            saveWithFilePicker(jsonData);
        } else {
            // Fallback to traditional download method
            saveWithDownloadLink(jsonData);
        }
    }

    async function saveWithFilePicker(jsonData) {
        try {
            const opts = {
                types: [{
                    description: 'ScriptFlow Project File',
                    accept: {'application/json': ['.json']}
                }],
                suggestedName: 'scriptflow-project.json'
            };
            
            const fileHandle = await window.showSaveFilePicker(opts);
            const writable = await fileHandle.createWritable();
            await writable.write(jsonData);
            await writable.close();
            
            console.log('File saved successfully using File System Access API');
        } catch (err) {
            console.error('Error saving file with File System Access API:', err);
            // Fall back to the download link method if the File System Access API fails
            saveWithDownloadLink(jsonData);
        }
    }
    
    function saveWithDownloadLink(jsonData) {
        // Create a download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'scriptflow-project.json';
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    }
    
    function openProject() {
        // Check if we're in an iframe (modal mode)
        if (window.parent !== window) {
            // Send message to parent to handle file opening
            window.parent.postMessage({
                action: 'openProject'
            }, '*');
            return;
        }
        
        // Standalone mode logic
        if (window.showOpenFilePicker) {
            openWithFilePicker();
        } else {
            document.getElementById('file-input').click();
        }
    }

    async function openWithFilePicker() {
        try {
            // Define accepted file types
            const pickerOpts = {
                types: [{
                    description: 'ScriptFlow Project Files',
                    accept: {'application/json': ['.json']}
                }],
                multiple: false
            };
            
            // Show the file picker
            const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
            const file = await fileHandle.getFile();
            const contents = await file.text();
            
            // Process the file contents
            processProjectFile(contents);
            
        } catch (err) {
            console.error('Error opening file with File System Access API:', err);
            // If user canceled or API failed, do nothing or show a message
            if (err.name !== 'AbortError') {
                alert('Error opening file. Please try again or use the Open button.');
            }
        }
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Confirm before replacing current project
        if (blocks.length > 0) {
            if (!confirm('Opening a project will replace your current work. Continue?')) {
                event.target.value = ''; // Reset the file input
                return;
            }
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Process the file contents
                processProjectFile(e.target.result);
            } catch (error) {
                console.error("Error reading project file:", error);
                alert("Error reading project file. The file may be corrupted or in an incompatible format.");
            }
            
            // Reset the file input for future use
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }

    function processProjectFile(fileContents) {
        try {
            const projectData = JSON.parse(fileContents);
            
            // Version check for compatibility
            if (!projectData.version) {
                alert('Warning: This project was created with an older version of ScriptFlow.');
            }
            
            // Clear current project
            createNewProject();
            
            // Load the project data
            if (projectData.viewSettings) {
                scale = projectData.viewSettings.scale || 1;
                panX = projectData.viewSettings.panX || 0;
                panY = projectData.viewSettings.panY || 0;
                applyZoomOnly();
            }
            
            // Set next IDs to continue from where the saved project left off
            nextBlockId = projectData.nextBlockId || 0;
            nextConnectionId = projectData.nextConnectionId || 0;
            
            // Create a mapping from old block IDs to new block objects
            const blockIdMapping = {};
            
            // Create blocks and maintain ID mapping
            projectData.blocks.forEach(blockData => {
                const left = parseFloat(blockData.position.left) || 0;
                const top = parseFloat(blockData.position.top) || 0;
                
                const block = createBlock(blockData.type, left, top);
                
                // Restore block data
                if (block) {
                    // Store the mapping from saved ID to new block
                    blockIdMapping[blockData.id] = block;
                    
                    // Restore the saved block data
                    block.data = {...blockData.data};
                    
                    // Update the input fields with the data
                    const inputFields = block.element.querySelectorAll('input, textarea, select');
                    inputFields.forEach(input => {
                        const inputName = input.dataset.inputName;
                        if (inputName && blockData.data[inputName] !== undefined) {
                            if (input.type === 'checkbox') {
                                input.checked = blockData.data[inputName];
                            } else {
                                input.value = blockData.data[inputName];
                            }
                        }
                    });
                    
                    // Don't restore connection references yet - we'll do this after creating connections
                }
            });
            
            // Create connections using the ID mapping
            if (projectData.connections && Array.isArray(projectData.connections)) {
                projectData.connections.forEach(connData => {
                    const fromBlock = blockIdMapping[connData.fromBlockId];
                    const toBlock = blockIdMapping[connData.toBlockId];
                    
                    if (fromBlock && toBlock) {
                        // Find connector elements using the new block IDs
                        const fromConnectorSelector = `.connector[data-block-id="${fromBlock.id}"][data-connector-type="${connData.fromConnectorType}"][data-connector-name="${connData.fromConnectorName}"]`;
                        const toConnectorSelector = `.connector[data-block-id="${toBlock.id}"][data-connector-type="${connData.toConnectorType}"][data-connector-name="${connData.toConnectorName}"]`;
                        
                        const fromConnector = fromBlock.element.querySelector(fromConnectorSelector);
                        const toConnector = toBlock.element.querySelector(toConnectorSelector);
                        
                        if (fromConnector && toConnector) {
                            createConnection(
                                { 
                                    blockId: fromBlock.id, 
                                    connectorElement: fromConnector, 
                                    connectorType: connData.fromConnectorType, 
                                    connectorName: connData.fromConnectorName 
                                },
                                { 
                                    blockId: toBlock.id, 
                                    connectorElement: toConnector, 
                                    connectorType: connData.toConnectorType, 
                                    connectorName: connData.toConnectorName 
                                }
                            );
                        } else {
                            console.warn("Could not find connector elements for connection:", connData);
                            console.warn("From connector selector:", fromConnectorSelector);
                            console.warn("To connector selector:", toConnectorSelector);
                        }
                    } else {
                        console.warn("Could not find blocks for connection:", connData);
                        console.warn("Available block mappings:", Object.keys(blockIdMapping));
                    }
                });
            }
            
            // Force update of all connections to ensure proper rendering
            updateAllConnectionLines();
            
            // Save initial state for undo/redo
            saveState();
            
        } catch (error) {
            console.error("Error loading project:", error);
            alert("Error loading project file. The file may be corrupted or in an incompatible format.");
        }
    }

    function setupTouchEvents() {
        let touchStarted = false;
        let initialDistance = 0;
        let initialScale = 1;
        
        // Touch start
        workspace.addEventListener('touchstart', (e) => {
            touchStarted = true;
            touchStartTime = Date.now();
            
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch to zoom setup
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialScale = scale;
                isPanning = true;
            }
        }, { passive: false });
        
        // Touch move
        workspace.addEventListener('touchmove', (e) => {
            if (!touchStarted) return;
            
            if (e.touches.length === 1 && isPanning) {
                // Single finger pan
                const deltaX = (e.touches[0].clientX - touchStartX) / scale;
                const deltaY = (e.touches[0].clientY - touchStartY) / scale;
                
                // Move all blocks
                blocks.forEach(block => {
                    const left = parseFloat(block.element.style.left) || 0;
                    const top = parseFloat(block.element.style.top) || 0;
                    
                    block.element.style.left = `${left + deltaX}px`;
                    block.element.style.top = `${top + deltaY}px`;
                });
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                updateAllConnectionLines();
                
                e.preventDefault();
            } else if (e.touches.length === 2) {
                // Pinch to zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                const newScale = Math.max(0.2, Math.min(3, initialScale * (currentDistance / initialDistance)));
                scale = newScale;
                applyZoomOnly();
                
                e.preventDefault();
            }
        }, { passive: false });
        
        // Touch end
        workspace.addEventListener('touchend', (e) => {
            if (touchStarted) {
                const touchDuration = Date.now() - touchStartTime;
                
                if (e.touches.length === 0) {
                    isPanning = false;
                    touchStarted = false;
                    
                    // Save state after touch interaction
                    if (touchDuration > 100) {
                        saveState();
                    }
                }
                
                // Prevent double-tap zoom
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }
        });
        
        // Prevent context menu on long press
        workspace.addEventListener('contextmenu', (e) => {
            if (touchDevice) {
                e.preventDefault();
            }
        });
    }

    function makeBlockCollapsible(blockElement, blockObject) {
        // Create collapse button
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'block-collapse-btn';
        collapseBtn.innerHTML = '−';
        collapseBtn.title = 'Collapse/Expand Block';
        
        // Add collapse functionality
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBlockCollapse(blockElement, blockObject, collapseBtn);
        });
        
        blockElement.appendChild(collapseBtn);
        
        // Store original height for animation
        blockObject.originalHeight = blockElement.offsetHeight;
    }
    
    function toggleBlockCollapse(blockElement, blockObject, collapseBtn) {
        const isCollapsed = blockElement.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand block
            blockElement.classList.remove('collapsed');
            collapseBtn.innerHTML = '−';
            collapseBtn.title = 'Collapse Block';
            
            // Show all connectors and restore their original positions
            const connectors = blockElement.querySelectorAll('.connector');
            connectors.forEach(connector => {
                connector.style.display = 'flex';
                
                // Restore original position from stored values
                const id = `${connector.dataset.connectorType}-${connector.dataset.connectorName}`;
                const originalPos = blockObject.originalConnectorPositions?.[id];
                
                if (originalPos) {
                    connector.style.top = originalPos.top || '';
                    connector.style.bottom = originalPos.bottom || '';
                    connector.style.left = originalPos.left || '';
                    connector.style.right = originalPos.right || '';
                    connector.style.transform = originalPos.transform || '';
                } else {
                    // Fallback: clear all positioning to let CSS take over
                    connector.style.top = '';
                    connector.style.bottom = '';
                    connector.style.left = '';
                    connector.style.right = '';
                    connector.style.transform = '';
                }
            });
        } else {
            // Collapse block - IMPORTANT: Preserve the block's absolute position
            const currentLeft = blockElement.style.left;
            const currentTop = blockElement.style.top;
            
            blockElement.classList.add('collapsed');
            collapseBtn.innerHTML = '+';
            collapseBtn.title = 'Expand Block';
            
            // CRITICAL: Force the block to maintain its exact position
            blockElement.style.left = currentLeft;
            blockElement.style.top = currentTop;
            blockElement.style.position = 'absolute'; // Ensure it's absolutely positioned
            
            // Hide non-essential connectors (CSS will handle showing and positioning essential ones)
            const connectors = blockElement.querySelectorAll('.connector');
            connectors.forEach(connector => {
                if (!connector.classList.contains('connector-child') && 
                    !connector.classList.contains('connector-parent') &&
                    !connector.classList.contains('connector-input') &&
                    !connector.classList.contains('connector-output')) {
                    connector.style.display = 'none';
                }
            });
        }
        
        // Force update connection lines after a short delay to ensure DOM and CSS have updated
        setTimeout(() => {
            updateAllConnectionLines();
        }, 100);
        
        // Save state after collapsing/expanding
        saveState();
    }

    function makeBlockCollapsible(blockElement, blockObject) {
        // Create collapse button
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'block-collapse-btn';
        collapseBtn.innerHTML = '−';
        collapseBtn.title = 'Collapse/Expand Block';
        
        // Store original connector positions when block is first created
        blockObject.originalConnectorPositions = {};
        
        // Add collapse functionality
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBlockCollapse(blockElement, blockObject, collapseBtn);
        });
        
        blockElement.appendChild(collapseBtn);
        
        // Store original height for animation
        blockObject.originalHeight = blockElement.offsetHeight;
        
        // Store original connector positions after a short delay to ensure everything is rendered
        setTimeout(() => {
            const connectors = blockElement.querySelectorAll('.connector');
            connectors.forEach(connector => {
                const id = `${connector.dataset.connectorType}-${connector.dataset.connectorName}`;
                blockObject.originalConnectorPositions[id] = {
                    top: connector.style.top,
                    bottom: connector.style.bottom,
                    left: connector.style.left,
                    right: connector.style.right,
                    transform: connector.style.transform
                };
            });
        }, 50);
    }
    
    function showTutorial() {
        // Reset tutorial state
        tutorialMode = true;
        tutorialStep = 0;
        localStorage.removeItem('tutorialCompleted');
        
        // Initialize tutorial
        if (tutorialTooltip) {
            tutorialTooltip.remove();
            tutorialTooltip = null;
        }
        
        // Remove any existing skip button
        const existingSkipBtn = document.getElementById('skip-tutorial-btn');
        if (existingSkipBtn) {
            existingSkipBtn.remove();
        }
        
        // Create new skip button
        const skipBtn = document.createElement('button');
        skipBtn.id = 'skip-tutorial-btn';
        skipBtn.className = 'skip-tutorial-btn';
        skipBtn.textContent = 'Skip Tutorial';
        skipBtn.addEventListener('click', endTutorial);
        document.body.appendChild(skipBtn);
        
        // Clear any previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        document.querySelectorAll('.connector-highlight').forEach(el => {
            el.classList.remove('connector-highlight');
        });
        
        // Make sure palette blocks have proper data attributes for targeting
        updatePaletteBlocksForTutorial();
        
        // Wait a moment to ensure DOM is ready
        setTimeout(() => {
            // Start with first step
            showTutorialStep(0);
            
            // Automatically expand Flow Control category for the first step
            const flowControlCategory = document.querySelector('.category-flow-control');
            if (flowControlCategory) {
                const header = flowControlCategory.querySelector('.category-header');
                if (header && flowControlCategory.querySelector('.category-content.collapsed')) {
                    header.click();
                }
            }
        }, 200);
    }

    // Helper to ensure palette blocks have the right data attributes
    function updatePaletteBlocksForTutorial() {
        // Add data-block-type attributes to palette blocks for targeting in tutorial
        const paletteBlocks = document.querySelectorAll('.palette-block');
        paletteBlocks.forEach(block => {
            const blockText = block.textContent.trim();
            const blockType = blockText.toLowerCase().replace(/\s+/g, '_');
            block.setAttribute('data-block-type', blockType);
            
            // Log for debugging
            console.log(`Set palette block data-block-type: ${blockType}`);
        });
    }

    // Define helper functions that are used throughout
    function darkenColor(hex, percent) {
        hex = hex.replace(/^#/, '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        r = Math.max(0, Math.floor(r * (1 - percent / 100)));
        g = Math.max(0, Math.floor(g * (1 - percent / 100)));
        b = Math.max(0, Math.floor(b * (1 - percent / 100)));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function getConnectorPosition(connectorElement) {
        if (!connectorElement) return { x: 0, y: 0 };
        
        // Cache the workspace rect calculation to avoid repeated DOM queries
        if (!window._workspaceRect || window._lastTransform !== workspace.style.transform) {
            window._workspaceRect = workspace.getBoundingClientRect();
            window._lastTransform = workspace.style.transform;
        }
        
        const rect = connectorElement.getBoundingClientRect(); // Connector's screen bounds
        const workspaceRect = window._workspaceRect; // Use cached version
        
        // Center of the connector in screen coordinates
        const connectorScreenX = rect.left + rect.width / 2;
        const connectorScreenY = rect.top + rect.height / 2;
        
        // Position of the connector relative to the transformed workspace's top-left corner on screen
        const relativeScreenX = connectorScreenX - workspaceRect.left;
        const relativeScreenY = connectorScreenY - workspaceRect.top;
        
        // Convert back to untransformed workspace (model) coordinates
        const modelX = (relativeScreenX / scale) + panX;
        const modelY = (relativeScreenY / scale) + panY;
        
        return { x: modelX, y: modelY };
    }

    function calculatePanBoundaries() {
        // Get block palette width as a hard boundary on the left
        const blockPaletteWidth = blockPalette.offsetWidth + 20; // Add some margin
        
        // Get bounds of all blocks to ensure we don't lose them
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let minTop = Infinity;
        let maxBottom = -Infinity;
        
        blocks.forEach(block => {
            const left = parseFloat(block.element.style.left) || 0;
            const top = parseFloat(block.element.style.top) || 0;
            const width = block.element.offsetWidth;
            const height = block.element.offsetHeight;
            
            minLeft = Math.min(minLeft, left);
            maxRight = Math.max(maxRight, left + width);
            minTop = Math.min(minTop, top);
            maxBottom = Math.max(maxBottom, top + height);
        });
        
        // If no blocks, use reasonable defaults
        if (minLeft === Infinity) {
            minLeft = 0;
            maxRight = 0;
            minTop = 0;
            maxBottom = 0;
        }
        
        // Add padding around blocks
        const padding = 200;
        
        // Calculate visible area in workspace coordinates
        const visibleWidth = workspace.clientWidth / scale;
        const visibleHeight = workspace.clientHeight / scale;
        
        // Calculate boundaries
        
        // Left boundary: Ensure workspace doesn't move past the block palette
        // This sets how far left you can pan (negative means moving content right)
        const minPanX = -blockPaletteWidth / scale;
        
        // Right boundary: Ensure the rightmost block stays visible
        // Don't limit it if there are no blocks or if they're all within visible area
        const maxPanX = Math.max(0, maxRight + padding - visibleWidth);
        
        // Top boundary: Ensure the topmost block stays visible
        const minPanY = Math.min(0, minTop - padding);
        
        // Bottom boundary: Ensure the bottommost block stays visible
        const maxPanY = Math.max(0, maxBottom + padding - visibleHeight);
        
        return {
            minX: minPanX,
            maxX: maxPanX,
            minY: minPanY,
            maxY: maxPanY
        };
    }

    function calculateBezierPath(x1, y1, x2, y2, dir1, dir2) {
        // Control point distance - adjust for smoother or tighter curves
        const cpDistance = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 0.5 + 50;
        
        // Set default directions if not specified
        dir1 = dir1 || 'horizontal';
        dir2 = dir2 || 'horizontal';
        
        let cpX1, cpY1, cpX2, cpY2;
        
        if (dir1 === 'horizontal') {
            cpX1 = x1 + cpDistance;
            cpY1 = y1;
        } else { // vertical
            cpX1 = x1;
            cpY1 = y1 + cpDistance;
        }
        
        if (dir2 === 'horizontal' || dir2 === 'auto') {
            cpX2 = x2 - cpDistance;
            cpY2 = y2;
        } else { // vertical
            cpX2 = x2;
            cpY2 = y2 - cpDistance;
        }
        
        return `M ${x1} ${y1} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x2} ${y2}`;
    }

    // Connection line functions
    function updateConnectionLine(connection) {
        if (!connection || !connection.fromConnectorElement || !connection.toConnectorElement) {
            console.warn("Cannot update connection, missing elements:", connection?.id);
            return;
        }
        
        try {
            // Get precise positions of connectors in the workspace coordinate system
            const fromPos = getConnectorPosition(connection.fromConnectorElement);
            const toPos = getConnectorPosition(connection.toConnectorElement);
            
            // Get connector directions from CSS variables
            const fromDir = getComputedStyle(connection.fromConnectorElement).getPropertyValue('--connector-direction').trim() || 'horizontal';
            const toDir = getComputedStyle(connection.toConnectorElement).getPropertyValue('--connector-direction').trim() || 'horizontal';
            
            // Calculate the path with proper control points
            const pathData = calculateBezierPath(
                fromPos.x, fromPos.y, 
                toPos.x, toPos.y, 
                fromDir, toDir
            );
            
            // Update the SVG path
            if (connection.pathElement) {
                connection.pathElement.setAttribute('d', pathData);
            }
        } catch (error) {
            console.error("Error updating connection line:", error);
        }
    }

    function updateAllConnectionLines() {
        // First filter out any invalid connections
        connections = connections.filter(conn => 
            conn && conn.fromConnectorElement && conn.toConnectorElement && 
            conn.pathElement && conn.pathElement.parentNode
        );
        
        // Then update all valid connections
        connections.forEach(connection => {
            updateConnectionLine(connection);
        });
    }

    function setupConnectionObservers() {
        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || 
                    mutation.attributeName === 'transform')) {
                    needsUpdate = true;
                }
            });
            
            if (needsUpdate) {
                updateAllConnectionLines();
            }
        });
        
        // Observe all script blocks for position changes
        blocks.forEach(block => {
            observer.observe(block.element, { 
                attributes: true, 
                attributeFilter: ['style', 'transform'] 
            });
        });
    }

    // Enhanced mobile support functions
    function setupMobileSupport() {
        if (isMobile || isTouchDevice) {
            touchDevice = true;
            
            // Add mobile navigation helper
            const mobileHelper = document.createElement('div');
            mobileHelper.className = 'mobile-nav-helper';
            mobileHelper.innerHTML = 'Pinch to zoom • Two-finger pan • Tap to select';
            document.body.appendChild(mobileHelper);
            
            // Hide helper after 5 seconds
            setTimeout(() => {
                mobileHelper.style.opacity = '0';
                setTimeout(() => mobileHelper.remove(), 500);
            }, 5000);
            
            // Setup touch event handlers
            setupTouchEvents();
            
            // Modify workspace for mobile
            workspace.style.touchAction = 'manipulation';
            
            // Add mobile-specific CSS class
            document.body.classList.add('mobile-device');
        }
    }

    // Define makeDraggable function before it's used in createBlock
    function makeDraggable(element) {
        element.addEventListener('mousedown', (e) => {
            // Ignore if clicked on input, textarea, select, connector, delete button, or using Ctrl
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'SELECT' ||
                e.target.classList.contains('connector') || 
                e.target.classList.contains('delete-block') ||
                e.ctrlKey) {
                return; // Don't prevent default for these elements
            }
            e.preventDefault();
            
            const rect = element.getBoundingClientRect();
            const workspaceRect = workspace.getBoundingClientRect();
            
            // Store current block position in workspace coordinates
            const blockX = parseFloat(element.style.left) || 0;
            const blockY = parseFloat(element.style.top) || 0;
            
            // Calculate mouse position in workspace coordinates
            const mouseWorkspaceX = (e.clientX - workspaceRect.left) / scale + panX;
            const mouseWorkspaceY = (e.clientY - workspaceRect.top) / scale + panY;
            
            // Calculate offset as the difference between mouse position and block position
            // This ensures the block stays exactly at the mouse position during dragging
            activeDrag = {
                element: element,
                offsetX: mouseWorkspaceX - blockX,
                offsetY: mouseWorkspaceY - blockY,
                initialX: blockX,
                initialY: blockY,
                isNew: false
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUpDraggable);
        });
    }

    function onMouseMove(e) {
        if (!activeDrag || activeDrag.isNew) return;
        e.preventDefault();
        const { element, offsetX, offsetY } = activeDrag;
        
        const workspaceRect = workspace.getBoundingClientRect();
        
        // Calculate mouse position in workspace coordinates
        const mouseWorkspaceX = (e.clientX - workspaceRect.left) / scale + panX;
        const mouseWorkspaceY = (e.clientY - workspaceRect.top) / scale + panY;
        
        // Apply new position by subtracting the offset
        const newX = mouseWorkspaceX - offsetX;
        const newY = mouseWorkspaceY - offsetY;
        
        // Apply the new position
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        
        // Check if we need to expand the workspace
        ensureWorkspaceSize(newX, newY);
        
        // Update connection lines during dragging - this prevents "jumping"
        updateAllConnectionLines();
    }

    function onMouseUpDraggable(e) {
        if (!activeDrag || activeDrag.isNew) return;
        updateAllConnectionLines();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUpDraggable);
        
        // Save state after moving a block
        saveState();
        
        activeDrag = null;
    }

    function createConnectorElement(blockId, type, name, className) {
        const connector = document.createElement('div');
        connector.className = `connector ${className}`;
        connector.dataset.blockId = blockId;
        connector.dataset.connectorType = type;
        connector.dataset.connectorName = name;
        connector.title = `${type}: ${name}`;

        // Add standard events
        connector.addEventListener('mousedown', handleConnectorMouseDown);
        connector.addEventListener('mouseup', handleConnectorMouseUp);
        
        // Add right-click handler for connectors
        connector.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            rightClickedConnectorElement = connector;
            showConnectorContextMenu(e.clientX, e.clientY);
        });
        
        // Create text inside connector
        let labelText = name;
        
        // Set appropriate label text
        if (className.includes('child')) {
            labelText = previousLabel;
        } else if (className.includes('parent')) {
            if (name === 'parent') {
                labelText = 'Out';
            } else if (name === 'branch' || name === 'body') {
                labelText = bodyLabel;
            }
            else if (name === 'next') {
                labelText = nextLabel; // Keep as 'Next' for sequential flow
            }
        } else if (className.includes('input')) {
            // Keep the name or use a shorter version if needed
            labelText = name.charAt(0).toUpperCase() + name.slice(1, 3);
        } else if (className.includes('output')) {
            // Keep the name or use a shorter version if needed
            labelText = name.charAt(0).toUpperCase() + name.slice(1, 3);
        }
        
        // Set the text inside the connector
        const textSpan = document.createElement('span');
        textSpan.className = 'connector-text';
        textSpan.textContent = labelText;
        connector.appendChild(textSpan);
        
        return connector;
    }

    function createAndPositionTooltip(targetEl, step) {
        // Create tooltip
        tutorialTooltip = document.createElement('div');
        tutorialTooltip.className = `tutorial-tooltip tooltip-${step.position}`;
        tutorialTooltip.innerHTML = `
            <div class="tooltip-arrow"></div>
            <div class="tooltip-content">
                <p>${step.message}</p>
                <div class="tooltip-buttons">
                    <button class="next-btn">${step.autoAdvance === false ? 'Done' : 'Next'}</button>
                </div>
            </div>
        `;
        
        // Add tooltip styles if they don't exist
        if (!document.getElementById('tutorial-styles')) {
            const tutorialStyles = document.createElement('style');
            tutorialStyles.id = 'tutorial-styles';
            tutorialStyles.textContent = `
                .tutorial-tooltip {
                    position: fixed;
                    z-index: 1000;
                    background: #1a202c;
                    color: white;
                    padding: 12px 15px;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    max-width: 300px;
                    font-size: 14px;
                    pointer-events: auto;
                    border: 1px solid #4299e1;
                }
                .tutorial-highlight {
                    position: relative;
                    z-index: 999;
                    box-shadow: 0 0 0 4px #4299e1, 0 0 0 8px rgba(66, 153, 225, 0.3);
                    border-radius: 4px;
                }
                .connector-highlight {
                    box-shadow: 0 0 0 3px rgba(255, 255, 120, 0.7);
                }
                .tooltip-content {
                    line-height: 1.4;
                }
                .tooltip-buttons {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 10px;
                }
                .tooltip-buttons button {
                    background: #4299e1;
                    color: white;
                    border: none;
                    padding: 5px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .tooltip-buttons button:hover {
                    background: #3182ce;
                }
                .skip-tutorial-btn {
                    position: fixed;
                    bottom: 15px;
                    right: 15px;
                    background: #4a5568;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    z-index: 1001;
                }
                .skip-tutorial-btn:hover {
                    background: #2d3748;
                }
            `;
            document.head.appendChild(tutorialStyles);
        }
        
        // Position tooltip relative to target
        document.body.appendChild(tutorialTooltip);
        positionTooltip(tutorialTooltip, targetEl, step.position);
        
        // Highlight target
        targetEl.classList.add('tutorial-highlight');
        
        // Add button event listeners
        tutorialTooltip.querySelector('.next-btn').addEventListener('click', () => {
            targetEl.classList.remove('tutorial-highlight');
            if (step.autoAdvance !== false) {
                showTutorialStep(tutorialStep + 1);
            }
        });
        
        // Special case: highlight connectors if needed
        if (step.highlightConnectors) {
            document.querySelectorAll('.connector').forEach(connector => {
                connector.classList.add('connector-highlight');
            });
        }
        
        // Add event listeners for auto-advancing based on user actions
        setupTutorialStepListeners(targetEl, step, tutorialStep);
    }

    // Create collapsible block categories in the palette
    function populateBlockPalette() {
        blockPalette.innerHTML = '<h2>Blocks</h2>';
        
        // Define category colors
        const categoryColors = {
            'Flow Control': '#f97316', // Orange
            'Logic': '#0ea5e9',        // Sky blue
            'Math': '#8b5cf6',         // Violet
            'Variables': '#ec4899',    // Pink
            'Strings': '#10b981',      // Emerald
            'Input/Output': '#84cc16', // Lime
            'Functions': '#6366f1',    // Indigo
            'Arrays': '#f59e0b',       // Amber
            'Objects': '#14b8a6',      // Teal

            // HTML categories
            'HTML Structure': '#e11d48', // Red
            'HTML Content': '#2563eb',   // Blue
            'HTML Layout': '#7c3aed',    // Purple
            'HTML UI Elements': '#ea580c', // Orange
            'HTML Forms': '#b45309',     // Orange-brown
            'HTML Media': '#dc2626',     // Red
            'HTML Tables': '#16a34a',    // Green
            'Misc': '#6b7280'          // Gray
        };
        
        // Group blocks by category
        const categories = {};
        Object.values(BLOCK_DEFINITIONS).forEach(def => {
            // Safety check for each definition
            if (!def) {
                console.warn('Undefined block definition found');
                return;
            }
            
            const category = def.category || 'Misc';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(def);
        });
        
        // Sort categories
        const orderedCategories = [
            'Flow Control',
            'Logic',
            'Math',
            'Variables',
            'Strings',
            'Input/Output',
            'Functions',
            'Arrays',
            'Objects',
            'Misc'
        ];
        
        // Order categories and add any missing ones at the end
        const sortedCategories = [
            ...orderedCategories,
            ...Object.keys(categories).filter(cat => !orderedCategories.includes(cat))
        ].filter(cat => categories[cat]); // Only include categories that have blocks
        
        // Create collapsible categories
        sortedCategories.forEach(category => {
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'block-category';
            
            // Add a category-specific class for CSS targeting
            const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            categoryContainer.classList.add(`category-${categorySlug}`);
            
            // Set a background color for the category if defined
            const categoryColor = categoryColors[category] || '#6b7280';
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.style.backgroundColor = categoryColor;
            categoryHeader.style.color = '#ffffff';
            
            // Create toggle with correct starting state (always collapsed initially)
            const toggleSpan = document.createElement('span');
            toggleSpan.className = 'category-toggle';
            toggleSpan.textContent = '►';
            
            categoryHeader.appendChild(toggleSpan);
            categoryHeader.appendChild(document.createTextNode(` ${category}`));
            
            // Click anywhere on the header to toggle
            categoryHeader.addEventListener('click', () => {
                categoryContent.classList.toggle('collapsed');
                toggleSpan.textContent = categoryContent.classList.contains('collapsed') ? '►' : '▼';
                toggleSpan.style.transform = categoryContent.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(90deg)';
            });
            
            const categoryContent = document.createElement('div');
            categoryContent.className = 'category-content collapsed'; // Start all collapsed
            
            // Add blocks to this category
            categories[category].forEach(def => {
                const paletteBlock = document.createElement('div');
                paletteBlock.className = 'palette-block';
                
                // Create color indicator
                const blockIcon = document.createElement('span');
                blockIcon.className = 'palette-block-icon';
                blockIcon.style.backgroundColor = def.color || categoryColor;
                paletteBlock.appendChild(blockIcon);
                
                // Add block text
                paletteBlock.appendChild(document.createTextNode(def.label));
                
                // Set background with subtle gradient based on block color
                const baseColor = def.color || '#3a4553';
                paletteBlock.style.background = `linear-gradient(to right, ${baseColor}15, ${baseColor}30)`;
                
                // Make drag-and-drop work
                paletteBlock.draggable = true;
                paletteBlock.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', def.type);
                    // Indicate this is a new block being dragged from palette
                    activeDrag = { isNew: true, type: def.type };
                    
                    // Add dragging class for styling
                    paletteBlock.classList.add('dragging');
                });
                
                paletteBlock.addEventListener('dragend', () => {
                    paletteBlock.classList.remove('dragging');
                });
                
                categoryContent.appendChild(paletteBlock);
            });
            
            categoryContainer.appendChild(categoryHeader);
            categoryContainer.appendChild(categoryContent);
            blockPalette.appendChild(categoryContainer);
        });
    }

    function initTutorialMode() {
        if (!tutorialMode) return;
        
        // Create skip tutorial button
        const skipBtn = document.createElement('button');
        skipBtn.id = 'skip-tutorial-btn';
        skipBtn.className = 'skip-tutorial-btn';
        skipBtn.textContent = 'Skip Tutorial';
        skipBtn.addEventListener('click', endTutorial);
        document.body.appendChild(skipBtn);
        
        // Update palette blocks for targeting
        updatePaletteBlocksForTutorial();
        
        // Start the tutorial
        showTutorialStep(0);
        
        // Automatically expand Flow Control category for the first step
        setTimeout(() => {
            const flowControlCategory = document.querySelector('.category-flow-control');
            if (flowControlCategory) {
                const header = flowControlCategory.querySelector('.category-header');
                if (header && flowControlCategory.querySelector('.category-content.collapsed')) {
                    header.click();
                }
            }
        }, 500);
    }

    function expandCategoryForStep(step) {
        // For category-related steps, ensure the category is expanded if needed
        if (step.target.includes('category-') && !step.target.includes('category-content')) {
            const categoryContainer = document.querySelector(step.target);
            if (categoryContainer) {
                // Scroll the category into view in the palette
                categoryContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
                
                const categoryContent = categoryContainer.querySelector('.category-content');
                if (categoryContent && categoryContent.classList.contains('collapsed')) {
                    const header = categoryContainer.querySelector('.category-header');
                    if (header) {
                        console.log(`Automatically expanding category for tutorial step`);
                        header.click();
                    }
                }
            }
        }
        
        // For specific block types inside a category, make sure the category is expanded
        if (step.target.includes('data-block-type')) {
            // Extract the block type
            const blockTypeMatch = step.target.match(/data-block-type="([^"]+)"/);
            if (blockTypeMatch && blockTypeMatch[1]) {
                const blockType = blockTypeMatch[1];
                
                // Find which category contains this block
                const blockDef = Object.values(BLOCK_DEFINITIONS).find(def => 
                    def.type === blockType || 
                    def.label.toLowerCase().replace(/\s+/g, '_') === blockType);
                    
                if (blockDef && blockDef.category) {
                    const categorySlug = blockDef.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const categoryContainer = document.querySelector(`.category-${categorySlug}`);
                    
                    if (categoryContainer) {
                        // Scroll the category into view
                        categoryContainer.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'nearest'
                        });
                        
                        const categoryContent = categoryContainer.querySelector('.category-content');
                        if (categoryContent && categoryContent.classList.contains('collapsed')) {
                            const header = categoryContainer.querySelector('.category-header');
                            if (header) {
                                console.log(`Expanding category ${blockDef.category} for block type ${blockType}`);
                                header.click();
                            }
                        }
                    }
                }
            }
        }
    }
    
    function showTutorialStep(stepIndex) {
        if (stepIndex >= tutorialSteps.length) {
            endTutorial();
            return;
        }
        
        tutorialStep = stepIndex;
        const step = tutorialSteps[stepIndex];
        
        // Remove previous tooltip if it exists
        if (tutorialTooltip) {
            tutorialTooltip.remove();
        }
        
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        document.querySelectorAll('.connector-highlight').forEach(el => {
            el.classList.remove('connector-highlight');
        });
        
        console.log(`Tutorial step ${stepIndex}: Targeting ${step.target}`);
        
        // Expand categories if needed based on the step
        if (step.target.includes('category')) {
            expandCategoryForStep(step);
            
            // Give time for the category to expand and scroll
            setTimeout(() => {
                let targetEl = document.querySelector(step.target);
                if (targetEl) {
                    createAndPositionTooltip(targetEl, step);
                } else {
                    console.warn(`Tutorial target not found after category expansion: ${step.target}`);
                    setTimeout(() => showTutorialStep(stepIndex + 1), 1000);
                }
            }, 600); // Increased delay to allow for smooth scrolling
            return;
        }
        
        // Find target element with retry mechanism
        let targetEl = document.querySelector(step.target);
        
        // If not found immediately, try with a delay (helps with dynamic elements)
        if (!targetEl) {
            console.log(`Target ${step.target} not found immediately, will retry...`);
            setTimeout(() => {
                let retryTarget = document.querySelector(step.target);
                if (retryTarget) {
                    console.log(`Target ${step.target} found on retry`);
                    
                    // Scroll target into view if it's in the palette
                    if (blockPalette.contains(retryTarget)) {
                        retryTarget.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center',
                            inline: 'nearest'
                        });
                        
                        // Wait for scroll to complete before showing tooltip
                        setTimeout(() => {
                            createAndPositionTooltip(retryTarget, step);
                        }, 300);
                    } else {
                        createAndPositionTooltip(retryTarget, step);
                    }
                } else {
                    console.warn(`Tutorial target still not found even after retry: ${step.target}`);
                    // Move to next step after a short delay if target cannot be found
                    setTimeout(() => showTutorialStep(stepIndex + 1), 1000);
                }
            }, 500);
            return;
        }
        
        // Scroll target into view if it's in the palette
        if (blockPalette.contains(targetEl)) {
            targetEl.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
            
            // Wait for scroll to complete before showing tooltip
            setTimeout(() => {
                createAndPositionTooltip(targetEl, step);
            }, 300);
        } else {
            createAndPositionTooltip(targetEl, step);
        }
    }

    function setupTutorialStepListeners(targetEl, step, stepIndex) {
        if (step.waitForBlock) {
            // For generic block waiting
            if (typeof step.waitForBlock === 'boolean') {
                const originalBlockCount = blocks.length;
                const checkForNewBlock = () => {
                    if (blocks.length > originalBlockCount) {
                        targetEl.classList.remove('tutorial-highlight');
                        showTutorialStep(stepIndex + 1);
                    } else if (tutorialMode) {
                        setTimeout(checkForNewBlock, 500);
                    }
                };
                setTimeout(checkForNewBlock, 500);
            } 
            // For specific block type checking
            else if (typeof step.waitForBlock === 'function') {
                const originalBlocks = [...blocks]; // Copy current blocks
                const checkForSpecificBlock = () => {
                    // Find new blocks that weren't in the original list
                    const newBlocks = blocks.filter(b => !originalBlocks.some(ob => ob.id === b.id));
                    const hasMatchingBlock = newBlocks.some(block => step.waitForBlock(block));
                    
                    if (hasMatchingBlock) {
                        targetEl.classList.remove('tutorial-highlight');
                        document.querySelectorAll('.connector-highlight').forEach(el => {
                            el.classList.remove('connector-highlight');
                        });
                        showTutorialStep(stepIndex + 1);
                    } else if (tutorialMode) {
                        setTimeout(checkForSpecificBlock, 500);
                    }
                };
                setTimeout(checkForSpecificBlock, 500);
            }
        }
        
        if (step.waitForConnection) {
            // For simple connection checking
            if (step.waitForConnection === true) {
                const originalConnectionCount = connections.length;
                const checkForNewConnection = () => {
                    if (connections.length > originalConnectionCount) {
                        targetEl.classList.remove('tutorial-highlight');
                        document.querySelectorAll('.connector-highlight').forEach(el => {
                            el.classList.remove('connector-highlight');
                        });
                        showTutorialStep(stepIndex + 1);
                    } else if (tutorialMode) {
                        setTimeout(checkForNewConnection, 500);
                    }
                };
                setTimeout(checkForNewConnection, 500);
            }
            // For specific connection checking
            else if (typeof step.waitForConnection === 'function') {
                const originalConnections = [...connections]; // Copy current connections
                const checkForSpecificConnection = () => {
                    // Find new connections that weren't in the original list
                    const newConnections = connections.filter(c => 
                        !originalConnections.some(oc => oc.id === c.id));
                    
                    const hasMatchingConnection = newConnections.some(conn => step.waitForConnection(conn));
                    
                    if (hasMatchingConnection) {
                        targetEl.classList.remove('tutorial-highlight');
                        document.querySelectorAll('.connector-highlight').forEach(el => {
                            el.classList.remove('connector-highlight');
                        });
                        showTutorialStep(stepIndex + 1);
                    } else if (tutorialMode) {
                        setTimeout(checkForSpecificConnection, 500);
                    }
                };
                setTimeout(checkForSpecificConnection, 500);
            }
        }
        
        // For custom action checking - Fixed to handle category expansion properly
        if (step.waitForAction && typeof step.waitForAction === 'function') {
            const checkForAction = () => {
                if (step.waitForAction(targetEl)) {
                    targetEl.classList.remove('tutorial-highlight');
                    document.querySelectorAll('.connector-highlight').forEach(el => {
                        el.classList.remove('connector-highlight');
                    });
                    showTutorialStep(stepIndex + 1);
                } else if (tutorialMode) {
                    setTimeout(checkForAction, 500);
                }
            };
            setTimeout(checkForAction, 500);
        }
        
        // Special handling for category steps that need to wait for user interaction
        if (step.autoAdvance === false && step.target.includes('category-')) {
            const categoryContainer = targetEl;
            const categoryContent = categoryContainer.querySelector('.category-content');
            const header = categoryContainer.querySelector('.category-header');
            
            if (header && categoryContent) {
                const originalClickHandler = header.onclick;
                
                // Override the header click to advance tutorial
                const tutorialClickHandler = () => {
                    // Call original click handler
                    if (originalClickHandler) originalClickHandler();
                    
                    // Check if category was expanded
                    setTimeout(() => {
                        if (!categoryContent.classList.contains('collapsed')) {
                            targetEl.classList.remove('tutorial-highlight');
                            showTutorialStep(stepIndex + 1);
                            
                            // Restore original click handler
                            header.onclick = originalClickHandler;
                        }
                    }, 100);
                };
                
                header.onclick = tutorialClickHandler;
            }
        }
    }
    
    function positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        switch (position) {
            case 'top':
                tooltip.style.left = (targetRect.left + targetRect.width/2 - tooltipRect.width/2) + 'px';
                tooltip.style.top = (targetRect.top - tooltipRect.height - 10) + 'px';
                break;
            case 'bottom':
                tooltip.style.left = (targetRect.left + targetRect.width/2 - tooltipRect.width/2) + 'px';
                tooltip.style.top = (targetRect.bottom + 10) + 'px';
                break;
            case 'left':
                tooltip.style.left = (targetRect.left - tooltipRect.width - 10) + 'px';
                tooltip.style.top = (targetRect.top + targetRect.height/2 - tooltipRect.height/2) + 'px';
                break;
            case 'right':
                tooltip.style.left = (targetRect.right + 10) + 'px';
                tooltip.style.top = (targetRect.top + targetRect.height/2 - tooltipRect.height/2) + 'px';
                break;
        }
    }
    
    function endTutorial() {
        tutorialMode = false;
        localStorage.setItem('tutorialCompleted', 'true');
        
        // Clean up tutorial elements
        if (tutorialTooltip) {
            tutorialTooltip.remove();
            tutorialTooltip = null;
        }
        
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        const skipBtn = document.getElementById('skip-tutorial-btn');
        if (skipBtn) skipBtn.remove();
    }

    // Add a Reset Tutorial button in the main UI
    function addTutorialControls() {
        const controlsContainer = document.getElementById('workspace-controls');
        
        const tutorialBtn = document.createElement('button');
        tutorialBtn.textContent = '?';
        tutorialBtn.title = 'Start Tutorial';
        tutorialBtn.addEventListener('click', () => {
            tutorialMode = true;
            localStorage.removeItem('tutorialCompleted');
            initTutorialMode();
        });
        
        controlsContainer.appendChild(document.createElement('div')).className = 'divider';
        controlsContainer.appendChild(tutorialBtn);
    }

    // Initialize block palette with categories
    populateBlockPalette();
    initTutorialMode();

    workspace.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        if (activeDrag && activeDrag.isNew) {
            const type = e.dataTransfer.getData('text/plain') || activeDrag.type;
            
            // FIXED: Get the actual workspace element bounds in the transformed space
            const workspaceRect = workspace.getBoundingClientRect();
            
            // Calculate position relative to the workspace
            const relativeX = e.clientX - workspaceRect.left;
            const relativeY = e.clientY - workspaceRect.top;
            
            // Since workspace has CSS transform applied, convert back to model coordinates
            // The transform is: transform: matrix(scale, 0, 0, scale, 0, 0)
            const modelX = relativeX / scale;
            const modelY = relativeY / scale;
            
            // Create a block with the correct type
            const blockDefinition = BLOCK_DEFINITIONS[type];
            if (!blockDefinition) {
                console.error("Unknown block type:", type);
                activeDrag = null;
                return;
            }

            // Create the block at the calculated position
            const block = createBlock(type, modelX - 75, modelY - 50); // Center the block
            
            if (block) {
                updateAllConnectionLines();
                saveState();
            }
        }
        activeDrag = null;
    });

    function createBlock(type, x, y) {
        const definition = BLOCK_DEFINITIONS[type];
        if (!definition) return;

        const blockId = `block-${nextBlockId++}`;
        const blockElement = document.createElement('div');
        blockElement.id = blockId;
        blockElement.className = 'script-block';
        
        // Position the block in model coordinates
        blockElement.style.left = `${Math.round(x)}px`;
        blockElement.style.top = `${Math.round(y)}px`;
        
        blockElement.style.backgroundColor = definition.color || '#60a5fa';
        blockElement.style.borderColor = definition.color ? darkenColor(definition.color, 30) : '#4a5568';

        // Add delete button (X) in top right
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-block';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Delete block';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBlock(blockId);
        });
        blockElement.appendChild(deleteBtn);

        const header = document.createElement('div');
        header.className = 'script-block-header';
        header.textContent = definition.label;
        blockElement.appendChild(header);

        const content = document.createElement('div');
        content.className = 'script-block-content';
        blockElement.appendChild(content);

        // Initialize blockData object FIRST
        const blockData = {};

        // Add input fields from 'inputs' array in definition
        if (definition.inputs) {
            definition.inputs.forEach(inputDef => {
                const labelEl = document.createElement('label');
                labelEl.textContent = inputDef.label || inputDef.name;
                content.appendChild(labelEl);

                let inputField;
                
                // Set default value in blockData
                let defaultValue;
                switch(inputDef.type) {
                    case "boolean":
                        defaultValue = false;
                        break;
                    case "number":
                        defaultValue = 0;
                        break;
                    case "select":
                        defaultValue = inputDef.options && inputDef.options[0] ? inputDef.options[0].value : "";
                        break;
                    default:
                        defaultValue = "";
                        break;
                }
                blockData[inputDef.name] = defaultValue;
                
                // Create different input types based on the input definition
                switch(inputDef.type) {
                    case "boolean":
                        inputField = document.createElement('input');
                        inputField.type = "checkbox";
                        inputField.checked = defaultValue;
                        inputField.classList.add('input-checkbox');
                        inputField.addEventListener('change', e => {
                            blockData[inputDef.name] = e.target.checked;
                            console.log(`Updated ${inputDef.name}:`, e.target.checked);
                        });
                        break;
                        
                    case "number":
                        inputField = document.createElement('input');
                        inputField.type = "number";
                        inputField.value = defaultValue;
                        inputField.classList.add('input-number');
                        inputField.addEventListener('input', e => {
                            blockData[inputDef.name] = parseFloat(e.target.value) || 0;
                            console.log(`Updated ${inputDef.name}:`, blockData[inputDef.name]);
                        });
                        break;
                        
                    case "multiline":
                        inputField = document.createElement('textarea');
                        inputField.value = defaultValue;
                        inputField.rows = inputDef.rows || 3;
                        inputField.classList.add('input-multiline');
                        inputField.addEventListener('input', e => {
                            blockData[inputDef.name] = e.target.value;
                            console.log(`Updated ${inputDef.name}:`, e.target.value);
                        });
                        break;

                    case "select":
                        inputField = document.createElement('select');
                        inputField.classList.add('input-select');
                        
                        // Add options from definition
                        if (inputDef.options) {
                            inputDef.options.forEach(option => {
                                const optionEl = document.createElement('option');
                                optionEl.value = option.value;
                                optionEl.textContent = option.label;
                                inputField.appendChild(optionEl);
                            });
                        }
                        
                        inputField.value = defaultValue;
                        inputField.addEventListener('change', e => {
                            blockData[inputDef.name] = e.target.value;
                            console.log(`Updated ${inputDef.name}:`, e.target.value);
                        });
                        break;
                            
                    case "string":
                    default:
                        inputField = document.createElement('input');
                        inputField.type = "text";
                        inputField.value = defaultValue;
                        inputField.classList.add('input-text');
                        inputField.addEventListener('input', e => {
                            blockData[inputDef.name] = e.target.value;
                            console.log(`Updated ${inputDef.name}:`, e.target.value);
                        });
                        break;
                }
                
                // Common properties for all input types
                inputField.placeholder = inputDef.placeholder || inputDef.name;
                inputField.dataset.inputName = inputDef.name;
                
                // Add any additional attributes from the input definition
                if (inputDef.attributes) {
                    Object.entries(inputDef.attributes).forEach(([key, value]) => {
                        inputField.setAttribute(key, value);
                    });
                }
                
                content.appendChild(inputField);
                
                // Only add line break after non-checkbox inputs
                if (inputDef.type !== "boolean") {
                    content.appendChild(document.createElement('br'));
                }
            });
        }
        
        // Add the block to the workspace FIRST so we can measure its actual size
        makeDraggable(blockElement);
        workspace.appendChild(blockElement);
        
        // Create the block object
        const blockObject = { 
            id: blockId, 
            type: type, 
            element: blockElement, 
            definition, 
            data: blockData,
            connections: { 
                flowIn: null, 
                flowOut: [], 
                branch: [], 
                elseBranch: [],
                next: [],
                customFlowOutputs: {},
                dataInputs: {}, 
                dataOutputs: {} 
            }
        };
        
        // Make block collapsible
        makeBlockCollapsible(blockElement, blockObject);
        
        // Add connectors (existing code)
        const actualBlockHeight = blockElement.offsetHeight;
        const actualBlockWidth = blockElement.offsetWidth;
        
        // Flow Input Connectors (Top)
        if (definition.hasFlowIn !== false) {
            const childConnector = createConnectorElement(blockId, 'flowIn', 'child', 'connector-child');
            blockElement.appendChild(childConnector);
        }
        
        // Flow Output Connectors (Bottom)
        if (definition.hasFlowOut) {
            const parentConnector = createConnectorElement(blockId, 'flowOut', 'parent', 'connector-parent');
            blockElement.appendChild(parentConnector);
        }

        if (definition.hasNextFlowOut) {
            const nextConnector = createConnectorElement(blockId, 'flowOut', 'next', 'connector-parent connector-next');
            nextConnector.style.bottom = '-8px';
            nextConnector.style.right = '10px';
            nextConnector.querySelector('.connector-text').textContent = nextLabel || 'Next';
            blockElement.appendChild(nextConnector);
        }
        
        // Branch Flow Outputs (Multiple if needed)
        if (definition.hasBranchFlowOut) {
            const branchConnector = createConnectorElement(blockId, 'flowOut', 'body', 'connector-parent');
            branchConnector.style.bottom = '-8px';
            branchConnector.style.left = '75%';
            branchConnector.querySelector('.connector-text').textContent = bodyLabel || 'Body';
            blockElement.appendChild(branchConnector);
        }

        if (definition.hasElseBranchFlowOut) {
            const elseBranchConnector = createConnectorElement(blockId, 'flowOut', 'elseBranch', 'connector-parent connector-else-branch');
            elseBranchConnector.style.bottom = '-8px';
            elseBranchConnector.style.left = '25%';
            elseBranchConnector.querySelector('.connector-text').textContent = 'Else';
            blockElement.appendChild(elseBranchConnector);
        }

        // Data Input connectors
        if (definition.dataInputs) {
            const minHeightForInputs = Math.max(actualBlockHeight, 40 + (definition.dataInputs.length * 35));
            
            if (minHeightForInputs > actualBlockHeight) {
                blockElement.style.minHeight = `${minHeightForInputs}px`;
            }
            
            definition.dataInputs.forEach((dataInputDef, index) => {
                const inputConnector = createConnectorElement(blockId, 'dataInput', dataInputDef.name, 'connector-input');
                
                const blockHeight = Math.max(actualBlockHeight, minHeightForInputs);
                const totalInputs = definition.dataInputs.length;
                const usableHeight = blockHeight - 40;
                const spacing = usableHeight / (totalInputs + 1);
                
                inputConnector.style.top = `${40 + spacing * (index + 1)}px`;
                inputConnector.style.left = '-8px';
                
                if (dataInputDef.position) {
                    if (dataInputDef.position.top !== undefined) {
                        inputConnector.style.top = dataInputDef.position.top;
                    }
                    if (dataInputDef.position.left !== undefined) {
                        inputConnector.style.left = dataInputDef.position.left;
                    }
                }
                
                blockElement.appendChild(inputConnector);
            });
        }

        // Data Output connectors
        if (definition.dataOutputs) {
            const minHeightForOutputs = Math.max(actualBlockHeight, 40 + (definition.dataOutputs.length * 35));
            
            if (minHeightForOutputs > actualBlockHeight) {
                blockElement.style.minHeight = `${minHeightForOutputs}px`;
            }
            
            definition.dataOutputs.forEach((dataOutputDef, index) => {
                const outputConnector = createConnectorElement(blockId, 'dataOutput', dataOutputDef.name, 'connector-output');
                
                const blockHeight = Math.max(actualBlockHeight, minHeightForOutputs);
                const totalOutputs = definition.dataOutputs.length;
                const usableHeight = blockHeight - 40;
                const spacing = usableHeight / (totalOutputs + 1);
                
                outputConnector.style.top = `${40 + spacing * (index + 1)}px`;
                outputConnector.style.right = '-8px';
                
                if (dataOutputDef.position) {
                    if (dataOutputDef.position.top !== undefined) {
                        outputConnector.style.top = dataOutputDef.position.top;
                    }
                    if (dataOutputDef.position.right !== undefined) {
                        outputConnector.style.right = dataOutputDef.position.right;
                    }
                }
                
                blockElement.appendChild(outputConnector);
            });
        }
        
        // Check if we need to expand the workspace
        ensureWorkspaceSize(x + blockElement.offsetWidth, y + blockElement.offsetHeight);
        
        blocks.push(blockObject);
        
        return blockObject;
    }

    function handleConnectorMouseDown(e) {
        e.stopPropagation(); // Prevent block dragging
        isConnecting = true;
        const connectorElement = e.currentTarget; // Use currentTarget to get the element with the event listener
        const blockId = connectorElement.dataset.blockId;
        const connectorType = connectorElement.dataset.connectorType;
        const connectorName = connectorElement.dataset.connectorName;
        
        connectionStartInfo = {
            blockId,
            connectorElement,
            connectorType,
            connectorName,
            isOutput: connectorType === 'flowOut' || connectorType === 'dataOutput' // Determine if it's an output connector
        };

        const startPos = getConnectorPosition(connectorElement);
        
        // Use path for tempLine to show curve preview
        tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempLine.setAttribute('d', `M ${startPos.x} ${startPos.y} C ${startPos.x} ${startPos.y}, ${startPos.x} ${startPos.y}, ${startPos.x} ${startPos.y}`);
        tempLine.setAttribute('class', 'connection-line temp-connection-line');
        tempLine.setAttribute('stroke-dasharray', '5,5'); // Make the temp line dashed
        svgLayer.appendChild(tempLine);

        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp, { once: true }); // Auto-remove after one fire
    }

    function handleDocumentMouseMove(e) {
        if (!isConnecting || !tempLine) return;
        const workspaceRect = workspace.getBoundingClientRect();
        
        // Calculate end position in SVG coordinates
        const endX = (e.clientX - workspaceRect.left) / scale;
        const endY = (e.clientY - workspaceRect.top) / scale;

        const startPos = getConnectorPosition(connectionStartInfo.connectorElement);
        const pathData = calculateBezierPath(
            startPos.x, startPos.y, 
            endX, endY, 
            getComputedStyle(connectionStartInfo.connectorElement).getPropertyValue('--connector-direction').trim(),
            'auto'
        );
        
        tempLine.setAttribute('d', pathData);
        
        // Ensure workspace size is adequate
        ensureWorkspaceSize(Math.max(startPos.x, endX), Math.max(startPos.y, endY));
    }
    
    function handleConnectorMouseUp(e) {
        e.stopPropagation();
        if (!isConnecting || !connectionStartInfo) return;

        const endConnectorElement = e.currentTarget; // Use currentTarget to get the element with the event listener
        const endBlockId = endConnectorElement.dataset.blockId;
        const endConnectorType = endConnectorElement.dataset.connectorType;
        const endConnectorName = endConnectorElement.dataset.connectorName;

        // Basic validation:
        // 1. Not connecting to self
        // 2. Connecting output to input (or vice-versa, depending on start)
        // 3. Flow to Flow, Data to Data (more specific type checking later)
        const isValidConnection = 
            connectionStartInfo.blockId !== endBlockId &&
            connectionStartInfo.isOutput !== (endConnectorType === 'flowOut' || endConnectorType === 'dataOutput') &&
            ( (connectionStartInfo.connectorType.startsWith('flow') && endConnectorType.startsWith('flow')) ||
              (connectionStartInfo.connectorType.startsWith('data') && endConnectorType.startsWith('data')) );

        if (isValidConnection) {
            const fromInfo = connectionStartInfo.isOutput ? connectionStartInfo : { 
                blockId: endBlockId, 
                connectorElement: endConnectorElement, 
                connectorType: endConnectorType, 
                connectorName: endConnectorName 
            };
            const toInfo = connectionStartInfo.isOutput ? { 
                blockId: endBlockId, 
                connectorElement: endConnectorElement, 
                connectorType: endConnectorType, 
                connectorName: endConnectorName 
            } : connectionStartInfo;
            
            // Check if target INPUT connector is already connected
            // We now ALLOW multiple connections to an output
            let canConnect = true;
            
            // Check if this exact connection already exists
            const connectionExists = connections.some(conn => 
                conn.fromBlockId === fromInfo.blockId && 
                conn.fromConnectorType === fromInfo.connectorType && 
                conn.fromConnectorName === fromInfo.connectorName &&
                conn.toBlockId === toInfo.blockId &&
                conn.toConnectorType === toInfo.connectorType &&
                conn.toConnectorName === toInfo.connectorName
            );
            
            if (connectionExists) {
                canConnect = false;
                console.warn("This exact connection already exists.");
            }
            
            // For INPUT connectors, ensure they have at most one connection
            if (canConnect && toInfo.connectorType.endsWith('In')) {
                const existingInputConn = connections.find(conn => 
                    conn.toBlockId === toInfo.blockId && 
                    conn.toConnectorType === toInfo.connectorType && 
                    conn.toConnectorName === toInfo.connectorName
                );
                
                if (existingInputConn) {
                    canConnect = false;
                    console.warn("Target input connector already has a connection. Remove it first.");
                }
            }

            if (canConnect) {
                createConnection(fromInfo, toInfo);
                
                // Save state after creating a connection
                saveState();
            } else {
                console.warn("Connection rejected: Target connector already in use or duplicate connection.");
            }
        } else {
            console.warn("Invalid connection attempt.");
        }
        
        cleanupConnectionAttempt();
    }

    function handleDocumentMouseUp(e) { // Called if mouseup occurs not on a connector
        if (isConnecting) {
            cleanupConnectionAttempt();
        }
    }

    function cleanupConnectionAttempt() {
        if (tempLine) {
            svgLayer.removeChild(tempLine);
            tempLine = null;
        }
        isConnecting = false;
        connectionStartInfo = null;
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        // document.removeEventListener('mouseup', handleDocumentMouseUp); // Removed by {once: true} or explicitly if needed
    }

    // Create SVG paths with event listeners
    function createConnection(from, to) {
        const connectionId = `conn-${nextConnectionId++}`;
        const pathId = `path-${connectionId}`;

        // Create SVG path element for the curve
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('id', pathId);
        pathElement.setAttribute('class', 'connection-line');
        
        // Add event listeners for the connection line
        pathElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            rightClickedConnectionId = connectionId; // This sets the correct ID
            showConnectionContextMenu(e.clientX, e.clientY);
        });
        
        pathElement.addEventListener('mouseover', () => {
            pathElement.classList.add('hover');
        });
        
        pathElement.addEventListener('mouseout', () => {
            pathElement.classList.remove('hover');
        });
        
        // Create SVG circle for the animated dot
        const dotElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dotElement.setAttribute('class', 'connection-dot');
        dotElement.setAttribute('r', '4'); // Ensure radius is set

        dotElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            rightClickedConnectionId = connectionId;
            showConnectionContextMenu(e.clientX, e.clientY);
        });
        
        // Create animateMotion element for the dot
        const animateMotionElement = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animateMotionElement.setAttribute('dur', '3s'); // Duration of one loop
        animateMotionElement.setAttribute('repeatCount', 'indefinite');
        
        // Use mpath to reference the path by ID
        const mpathElement = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
        mpathElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`);
        animateMotionElement.appendChild(mpathElement);
        dotElement.appendChild(animateMotionElement);

        const newConnection = {
            id: connectionId,
            fromBlockId: from.blockId,
            fromConnectorName: from.connectorName, 
            fromConnectorType: from.connectorType, 
            fromConnectorElement: from.connectorElement,
            toBlockId: to.blockId,
            toConnectorName: to.connectorName,   
            toConnectorType: to.connectorType,   
            toConnectorElement: to.connectorElement,
            pathElement: pathElement,
            dotElement: dotElement 
        };
        connections.push(newConnection);

        // Update block objects with connection info
        const fromBlock = blocks.find(b => b.id === from.blockId);
        const toBlock = blocks.find(b => b.id === to.blockId);

        if (fromBlock && toBlock) {
            // For outputs (fromBlock), allow multiple connections
            if (from.connectorType === 'flowOut') {
                if (from.connectorName === 'parent') {
                    fromBlock.connections.flowOut = fromBlock.connections.flowOut || [];
                    fromBlock.connections.flowOut.push(newConnection.id);
                } else if (from.connectorName === 'branch') {
                    fromBlock.connections.branch = fromBlock.connections.branch || [];
                    fromBlock.connections.branch.push(newConnection.id);
                } else if (from.connectorName === 'next') {
                    // Add support for "next" connections
                    fromBlock.connections.next = fromBlock.connections.next || [];
                    fromBlock.connections.next.push(newConnection.id);
                }
            } else if (from.connectorType === 'dataOutput') {
                fromBlock.connections.dataOutputs[from.connectorName] = fromBlock.connections.dataOutputs[from.connectorName] || [];
                fromBlock.connections.dataOutputs[from.connectorName].push(newConnection.id);
            }

            // For inputs (toBlock), only allow single connection (enforced earlier)
            if (to.connectorType === 'flowIn') {
                toBlock.connections.flowIn = newConnection.id;
            } else if (to.connectorType === 'dataInput') {
                toBlock.connections.dataInputs[to.connectorName] = newConnection.id;
            }
        }
        
        // Add the path and dot to the SVG layer
        svgLayer.appendChild(pathElement);
        svgLayer.appendChild(dotElement);
        
        // Draw the initial path
        updateConnectionLine(newConnection);
        
        console.log("Connection created:", newConnection);
        return newConnection; // Return in case caller needs it
    }

    // Block deletion function
    function deleteBlock(blockId) {
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return;
        
        const block = blocks[blockIndex];
        const blockElement = block.element;
        
        // First, remove all connections to/from this block
        const connectionsToRemove = connections.filter(conn => 
            conn.fromBlockId === blockId || conn.toBlockId === blockId
        );
        
        connectionsToRemove.forEach(conn => {
            removeConnection(conn.id);
        });
        
        // Then remove the block element from DOM
        if (blockElement && blockElement.parentNode) {
            blockElement.parentNode.removeChild(blockElement);
        }
        
        // Remove from blocks array
        blocks.splice(blockIndex, 1);
        
        console.log(`Block ${blockId} deleted`);
        
        // Save state after deleting a block
        saveState();
    }

    // Context menu functions
    function showConnectionContextMenu(x, y) {
        hideContextMenu(); // Remove any existing menu
        
        console.log("Right-clicked connection ID:", rightClickedConnectionId);
        
        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        
        const deleteItem = document.createElement('div');
        deleteItem.className = 'context-menu-item danger';
        deleteItem.textContent = 'Delete Connection';
        deleteItem.addEventListener('click', () => {
            console.log("Delete connection item clicked, ID:", rightClickedConnectionId);
            deleteSelectedConnection();
        });
        
        contextMenu.appendChild(deleteItem);
        document.body.appendChild(contextMenu);
        
        // Position the menu at cursor
        const menuRect = contextMenu.getBoundingClientRect();
        if (x + menuRect.width > window.innerWidth) {
            x = window.innerWidth - menuRect.width - 5;
        }
        if (y + menuRect.height > window.innerHeight) {
            y = window.innerHeight - menuRect.height - 5;
        }
        
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    }
    
    function showConnectionContextMenu(x, y) {
        hideContextMenu(); // Remove any existing menu
        
        // Add debug logging
        console.log("Right-clicked connection ID:", rightClickedConnectionId);
        
        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        
        const deleteItem = document.createElement('div');
        deleteItem.className = 'context-menu-item danger';
        deleteItem.textContent = 'Delete Connection';
        deleteItem.addEventListener('click', () => {
            // Store the ID locally to make sure it's captured in the closure
            const connectionIdToDelete = rightClickedConnectionId;
            console.log("Deleting connection with ID:", connectionIdToDelete);
            removeConnection(connectionIdToDelete);
            hideContextMenu();
            saveState();
        });
        
        contextMenu.appendChild(deleteItem);
        document.body.appendChild(contextMenu);
        
        // Position the menu at cursor
        const menuRect = contextMenu.getBoundingClientRect();
        if (x + menuRect.width > window.innerWidth) {
            x = window.innerWidth - menuRect.width - 5;
        }
        if (y + menuRect.height > window.innerHeight) {
            y = window.innerHeight - menuRect.height - 5;
        }
        
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    }
    
    function hideContextMenu() {
        if (contextMenu) {
            document.body.removeChild(contextMenu);
            contextMenu = null;
            // DO NOT clear rightClickedConnectionId here
            rightClickedConnectorElement = null;
        }
    }

    function deleteSelectedConnection() {
        console.log("Deleting connection:", rightClickedConnectionId);
        
        if (rightClickedConnectionId) {
            removeConnection(rightClickedConnectionId);
            hideContextMenu();

            // Save state after deleting a connection
            saveState();
        } else {
            console.error("No connection ID was set - deletion failed");
        }
    }
    
    function deleteConnectorConnections() {
        if (rightClickedConnectorElement) {
            const blockId = rightClickedConnectorElement.dataset.blockId;
            const connectorType = rightClickedConnectorElement.dataset.connectorType;
            const connectorName = rightClickedConnectorElement.dataset.connectorName;
            
            // Find all connections for this connector
            const connectionsToRemove = connections.filter(conn => {
                return (conn.fromBlockId === blockId && 
                        conn.fromConnectorType === connectorType && 
                        conn.fromConnectorName === connectorName) || 
                       (conn.toBlockId === blockId && 
                        conn.toConnectorType === connectorType && 
                        conn.toConnectorName === connectorName);
            });
            
            // Remove each connection
            connectionsToRemove.forEach(conn => {
                removeConnection(conn.id);
            });
            
            hideContextMenu();
            
            // Save state after deleting connections
            saveState();
        }
    }
    
    // Remove connection by ID
    function removeConnection(connectionId) {
        console.log("Attempting to remove connection:", connectionId);
        
        const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
        if (connectionIndex === -1) {
            console.error("Connection not found:", connectionId);
            return;
        }
        
        const connection = connections[connectionIndex];
        console.log("Found connection to remove:", connection);
        
        // Remove SVG elements with error checking
        try {
            if (connection.pathElement && connection.pathElement.parentNode) {
                connection.pathElement.parentNode.removeChild(connection.pathElement);
            } else {
                console.warn("Path element not found or already removed");
            }
            
            if (connection.dotElement && connection.dotElement.parentNode) {
                connection.dotElement.parentNode.removeChild(connection.dotElement);
            } else {
                console.warn("Dot element not found or already removed");
            }
        } catch (error) {
            console.error("Error removing SVG elements:", error);
        }
        
        // Update from block connection references
        const fromBlock = blocks.find(b => b.id === connection.fromBlockId);
        if (fromBlock) {
            if (connection.fromConnectorType === 'flowOut') {
                if (connection.fromConnectorName === 'parent' && Array.isArray(fromBlock.connections.flowOut)) {
                    fromBlock.connections.flowOut = fromBlock.connections.flowOut.filter(id => id !== connectionId);
                } else if (connection.fromConnectorName === 'branch' && Array.isArray(fromBlock.connections.branch)) {
                    fromBlock.connections.branch = fromBlock.connections.branch.filter(id => id !== connectionId);
                }
            } else if (connection.fromConnectorType === 'dataOutput' && 
                    fromBlock.connections.dataOutputs[connection.fromConnectorName]) {
                fromBlock.connections.dataOutputs[connection.fromConnectorName] = 
                    fromBlock.connections.dataOutputs[connection.fromConnectorName].filter(id => id !== connectionId);
            }
        } else {
            console.warn("Source block not found:", connection.fromBlockId);
        }
        
        // Update to block connection references
        const toBlock = blocks.find(b => b.id === connection.toBlockId);
        if (toBlock) {
            if (connection.toConnectorType === 'flowIn') {
                toBlock.connections.flowIn = null;
            } else if (connection.toConnectorType === 'dataInput') {
                toBlock.connections.dataInputs[connection.toConnectorName] = null;
            }
        } else {
            console.warn("Target block not found:", connection.toBlockId);
        }
        
        // Remove from connections array
        connections.splice(connectionIndex, 1);
        
        console.log(`Connection ${connectionId} removed successfully`);
    }

    // Enhanced code generation with better formatting
    function generateCodeBtn_click() {
        let finalCode = "";
        const startBlocks = blocks.filter(b => b.definition.type === 'start' && !b.connections.flowIn);
        
        if (startBlocks.length === 0) {
            generatedCodeArea.textContent = "// No Start block found or Start block has an input.";
            return;
        }

        // Process all start blocks (multiple entry points)
        startBlocks.forEach((startBlock, index) => {
            if (index > 0) {
                finalCode += "\n\n// === New Start Block ===\n\n";
            }
            // Pass initial empty context
            const initialContext = { inClass: false, className: null, inMethod: false, methodName: null };
            finalCode += generateCodeForBlock(startBlock, new Set(), initialContext);
        });
        
        // Format the generated code for better readability
        try {
            // Apply simple formatting (you could use a proper code formatter library here)
            finalCode = formatCode(finalCode);
        } catch (e) {
            console.error("Error formatting code:", e);
        }
        
        generatedCodeArea.textContent = finalCode || "// No executable flow found or an error occurred.";
    }

    // Simple code formatter
    function formatCode(code) {
        // Split by lines
        const lines = code.split('\n');
        let formatted = [];
        let indentLevel = 0;
        
        for (let line of lines) {
            line = line.trim();
            
            // Decrease indent for closing braces
            if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Apply current indent
            const indent = '    '.repeat(indentLevel);
            formatted.push(indent + line);
            
            // Increase indent after opening braces if not immediately closed
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            const openBrackets = (line.match(/\[/g) || []).length;
            const closeBrackets = (line.match(/\]/g) || []).length;
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;
            
            // Check for block openers that should increase indent
            if ((openBraces > closeBraces) || 
                (openBrackets > closeBrackets && line.endsWith('[')) || 
                (openParens > closeParens && line.endsWith('('))) {
                indentLevel++;
            }
        }
        
        return formatted.join('\n');
    }

    function getConnectedValue(block, inputName, context) {
        // Check if there's a data input connection for this input
        const connId = block.connections.dataInputs?.[inputName];
        if (connId) {
            const conn = connections.find(c => c.id === connId);
            if (conn) {
                const sourceBlockId = conn.fromBlockId;
                const sourceBlock = blocks.find(b => b.id === sourceBlockId);
                if (sourceBlock) {
                    // Handle different source block types
                    if (sourceBlock.type === "value_definition") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    } else if (sourceBlock.type === "variable_get") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    } else if (sourceBlock.type === "comparison") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    } else if (sourceBlock.type === "math_operation") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    } else if (sourceBlock.type === "string_operation") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    } else if (sourceBlock.type === "object_property") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    } else if (sourceBlock.type === "boolean_value") {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    }
                    
                    // Generic fallback: check if the block has a getValue method
                    if (sourceBlock.definition && sourceBlock.definition.getValue) {
                        return sourceBlock.definition.getValue(sourceBlock, context);
                    }
                }
            }
        }
        
        // If no connection found, return null (caller should handle fallback to input fields)
        return null;
    }

    function generateCodeForBlock(block, visited = new Set(), context = { inClass: false, className: null, inMethod: false, methodName: null }) {
        if (!block || visited.has(block.id)) return "";

        visited.add(block.id);
        let code = "";

        // Update context based on current block type
        let currentContext = { ...context };
        
        if (block.definition.type === "class_definition") {
            currentContext.inClass = true;
            currentContext.className = block.data.className || "MyClass";
        } else if (block.definition.type === "method_definition" || 
                block.definition.type === "constructor_definition" ||
                block.definition.type === "function_definition") {
            if (context.inClass) {
                currentContext.inMethod = true;
                currentContext.methodName = block.data.methodName || block.data.funcName || "constructor";
            } else {
                // Reset class context if we're in a standalone function
                currentContext.inClass = false;
            }
        }

        // Handle container blocks (blocks that can contain other blocks)
        if (block.definition.isContainer || block.definition.hasBranchFlowOut) {
            
            // Get child blocks from branch connections - these go INSIDE the {}
            let bodyCode = "";
            
            // 1. Check for connections FROM this block's body connector TO other blocks
            const bodyConnections = connections.filter(conn => 
                conn.fromBlockId === block.id && 
                conn.fromConnectorName === 'body'
            );
            
            for (const conn of bodyConnections) {
                const childBlock = blocks.find(b => b.id === conn.toBlockId);
                if (childBlock) {
                    const childVisited = new Set(visited);
                    bodyCode += generateCodeForBlock(childBlock, childVisited, currentContext);
                }
            }
            
            // 2. Also check branch connections array for backward compatibility
            if (Array.isArray(block.connections.branch)) {
                for (const branchConnId of block.connections.branch) {
                    const conn = connections.find(c => c.id === branchConnId);
                    if (conn) {
                        const childBlockId = conn.toBlockId;
                        const childBlock = blocks.find(b => b.id === childBlockId);
                        if (childBlock) {
                            const childVisited = new Set(visited);
                            bodyCode += generateCodeForBlock(childBlock, childVisited, currentContext);
                        }
                    }
                }
            }
            
            // Special handling for if/else blocks with chaining
            if (block.definition.type === "if_condition" || 
                block.definition.type === "else_if_condition" || 
                block.definition.type === "else") {
                
                // Use bodyCode for the if body content
                code += block.definition.toCode(block, "", bodyCode, currentContext);
                
                // Handle chained else-if/else blocks through "next" connections
                if (Array.isArray(block.connections.next)) {
                    for (const nextConnId of block.connections.next) {
                        const conn = connections.find(c => c.id === nextConnId);
                        if (conn) {
                            const nextBlockId = conn.toBlockId;
                            const nextBlock = blocks.find(b => b.id === nextBlockId);
                            if (nextBlock && (nextBlock.type === 'else_if_condition' || nextBlock.type === 'else')) {
                                // Chain else-if/else blocks directly
                                const chainedCode = generateCodeForBlock(nextBlock, visited, currentContext);
                                code += chainedCode;
                            } else if (nextBlock) {
                                // Regular next block - add newline and continue AFTER the if block
                                code += "\n" + generateCodeForBlock(nextBlock, visited, currentContext);
                            }
                        }
                    }
                }
                
                return code + (code.endsWith('\n') ? '' : '\n');
            }
            // Handle all other container blocks uniformly
            else {
                // Call the block's toCode with the body content and context
                code += block.definition.toCode(block, "", bodyCode, currentContext);
                
                // Handle "next" connections for container blocks - these come AFTER the container
                const nextConnections = connections.filter(conn => 
                    conn.fromBlockId === block.id && 
                    conn.fromConnectorName === 'next'
                );
                
                for (const conn of nextConnections) {
                    const nextBlock = blocks.find(b => b.id === conn.toBlockId);
                    if (nextBlock) {
                        // Reset context after leaving a class or method
                        let nextContext = currentContext;
                        if (block.definition.type === "class_definition") {
                            nextContext = { inClass: false, className: null, inMethod: false, methodName: null };
                        } else if (block.definition.type === "method_definition" || 
                                block.definition.type === "constructor_definition" ||
                                block.definition.type === "function_definition") {
                            nextContext = { ...currentContext, inMethod: false, methodName: null };
                        }
                        code += generateCodeForBlock(nextBlock, visited, nextContext);
                    }
                }
                
                // Fallback: Check flowOut connections for "parent" connector (standard sequential flow)
                if (nextConnections.length === 0) {
                    const parentConnections = connections.filter(conn => 
                        conn.fromBlockId === block.id && 
                        conn.fromConnectorName === 'parent'
                    );
                    
                    for (const conn of parentConnections) {
                        const nextBlock = blocks.find(b => b.id === conn.toBlockId);
                        if (nextBlock) {
                            let nextContext = currentContext;
                            if (block.definition.type === "class_definition") {
                                nextContext = { inClass: false, className: null, inMethod: false, methodName: null };
                            }
                            code += generateCodeForBlock(nextBlock, visited, nextContext);
                        }
                    }
                }
            }
        }
        // Handle non-container blocks
        else {
            // For standard blocks, generate their code with context
            code += block.definition.toCode(block, currentContext);
            
            // Handle next blocks for non-container blocks
            const nextConnections = connections.filter(conn => 
                conn.fromBlockId === block.id && 
                conn.fromConnectorName === 'next'
            );
            
            for (const conn of nextConnections) {
                const nextBlock = blocks.find(b => b.id === conn.toBlockId);
                if (nextBlock) {
                    code += generateCodeForBlock(nextBlock, visited, currentContext);
                }
            }
            
            // Fallback to parent connections for backwards compatibility
            if (nextConnections.length === 0) {
                const parentConnections = connections.filter(conn => 
                    conn.fromBlockId === block.id && 
                    conn.fromConnectorName === 'parent'
                );
                
                for (const conn of parentConnections) {
                    const nextBlock = blocks.find(b => b.id === conn.toBlockId);
                    if (nextBlock) {
                        code += generateCodeForBlock(nextBlock, visited, currentContext);
                    }
                }
            }
        }
        
        return code;
    }

    // Add helper function to auto-add "this." when needed
    function addThisIfNeeded(variableName, context) {
        if (!context || !context.inClass || !context.inMethod) {
            return variableName;
        }
        
        // Don't add this. to certain reserved words or patterns
        const reservedWords = ['console', 'window', 'document', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean'];
        const isReserved = reservedWords.some(word => variableName.startsWith(word));
        
        // Don't add this. if it already has it, or if it's a function call, or if it contains dots
        if (variableName.startsWith('this.') || 
            variableName.includes('(') || 
            variableName.includes('.') ||
            isReserved ||
            variableName.startsWith('"') ||
            variableName.startsWith("'") ||
            /^\d/.test(variableName)) { // Starts with number
            return variableName;
        }
        
        return `this.${variableName}`;
    }

    // Undo System Functions
    function saveState() {
        const state = {
            blocks: blocks.map(block => ({
                id: block.id,
                type: block.type,
                data: {...block.data},
                position: {
                    left: block.element.style.left,
                    top: block.element.style.top
                },
                connections: JSON.parse(JSON.stringify(block.connections)),
                collapsed: block.element.classList.contains('collapsed') // Save collapsed state
            })),
            connections: connections.map(conn => ({
                id: conn.id,
                fromBlockId: conn.fromBlockId,
                fromConnectorType: conn.fromConnectorType,
                fromConnectorName: conn.fromConnectorName,
                toBlockId: conn.toBlockId,
                toConnectorType: conn.toConnectorType,
                toConnectorName: conn.toConnectorName
            })),
            nextBlockId: nextBlockId,
            nextConnectionId: nextConnectionId,
            panX: panX,
            panY: panY,
            scale: scale
        };

        if (currentStateIndex === undoHistory.length - 1) {
            undoHistory.push(state);
            currentStateIndex = undoHistory.length - 1;
            
            if (undoHistory.length > MAX_UNDO_HISTORY) {
                undoHistory.shift();
                currentStateIndex--;
            }
        } else {
            undoHistory = undoHistory.slice(0, currentStateIndex + 1);
            undoHistory.push(state);
            currentStateIndex = undoHistory.length - 1;
        }
        
        updateUndoButtons();
    }

    function undo() {
        if (currentStateIndex <= 0) return; // Nothing to undo
        
        currentStateIndex--;
        loadState(undoHistory[currentStateIndex]);
        updateUndoButtons();
    }

    function redo() {
        if (currentStateIndex >= undoHistory.length - 1) return; // Nothing to redo
        
        currentStateIndex++;
        loadState(undoHistory[currentStateIndex]);
        updateUndoButtons();
    }

    function loadState(state) {
        // Clear current workspace
        while (blocks.length > 0) {
            const block = blocks[0];
            if (block.element && block.element.parentNode) {
                block.element.parentNode.removeChild(block.element);
            }
            blocks.shift();
        }
        
        // Clear SVG connections
        while (svgLayer.firstChild) {
            svgLayer.removeChild(svgLayer.firstChild);
        }
        connections = [];
        
        // Set next IDs
        nextBlockId = state.nextBlockId;
        nextConnectionId = state.nextConnectionId;
        
        // Restore pan and zoom if stored
        if (state.panX !== undefined && state.panY !== undefined) {
            panX = state.panX;
            panY = state.panY;
        }
        
        if (state.scale !== undefined) {
            scale = state.scale;
        }
        
        applyTransform();
        
        // Recreate blocks
        state.blocks.forEach(blockData => {
            const block = createBlock(blockData.type, 
                                     parseInt(blockData.position.left), 
                                     parseInt(blockData.position.top));
            
            // Update block data
            block.data = {...blockData.data};
            
            // Update the input fields with the data
            const inputFields = block.element.querySelectorAll('input, textarea, select');
            inputFields.forEach(input => {
                const inputName = input.dataset.inputName;
                if (inputName && blockData.data[inputName] !== undefined) {
                    if (input.type === 'checkbox') {
                        input.checked = blockData.data[inputName];
                    } else {
                        input.value = blockData.data[inputName];
                    }
                }
            });
            
            // Restore collapsed state if it exists
            if (blockData.collapsed) {
                const collapseBtn = block.element.querySelector('.block-collapse-btn');
                if (collapseBtn) {
                    toggleBlockCollapse(block.element, block, collapseBtn);
                }
            }
            
            // Restore connection references
            block.connections = JSON.parse(JSON.stringify(blockData.connections));
        });
        
        // Recreate connections
        state.connections.forEach(connData => {
            const fromBlock = blocks.find(b => b.id === connData.fromBlockId);
            const toBlock = blocks.find(b => b.id === connData.toBlockId);
            
            if (fromBlock && toBlock) {
                const fromConnector = [...fromBlock.element.querySelectorAll('.connector')].find(c => 
                    c.dataset.blockId === connData.fromBlockId &&
                    c.dataset.connectorType === connData.fromConnectorType &&
                    c.dataset.connectorName === connData.fromConnectorName
                );
                
                const toConnector = [...toBlock.element.querySelectorAll('.connector')].find(c => 
                    c.dataset.blockId === connData.toBlockId &&
                    c.dataset.connectorType === connData.toConnectorType &&
                    c.dataset.connectorName === connData.toConnectorName
                );
                
                if (fromConnector && toConnector) {
                    createConnection(
                        { 
                            blockId: connData.fromBlockId, 
                            connectorElement: fromConnector, 
                            connectorType: connData.fromConnectorType, 
                            connectorName: connData.fromConnectorName 
                        },
                        { 
                            blockId: connData.toBlockId, 
                            connectorElement: toConnector, 
                            connectorType: connData.toConnectorType, 
                            connectorName: connData.toConnectorName 
                        }
                    );
                }
            }
        });
    }

    function updateUndoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = currentStateIndex <= 0;
        }
        
        if (redoBtn) {
            redoBtn.disabled = currentStateIndex >= undoHistory.length - 1;
        }
    }

    // Adjusted SVG layer size
    function adjustSvgLayerSize() {
        // Make SVG layer slightly larger than the workspace to accommodate panning
        const width = Math.max(workspace.scrollWidth, workspace.clientWidth * 2);
        const height = Math.max(workspace.scrollHeight, workspace.clientHeight * 2);
        
        // Set explicit sizes for the SVG layer
        svgLayer.setAttribute('width', width);
        svgLayer.setAttribute('height', height);
        svgLayer.style.width = `${width}px`;
        svgLayer.style.height = `${height}px`;
        
        // Set the viewBox to ensure SVG coordinates match workspace coordinates
        svgLayer.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Force connection update after resize
        updateAllConnectionLines();
    }

    // Function to ensure workspace is big enough
    function ensureWorkspaceSize(x, y) {
        // Add some padding to make sure it's big enough
        const padding = 500; // 500px extra around the furthest element
        
        // Get the current size of the content
        const minWidth = x + padding;
        const minHeight = y + padding;

        // Adjust the workspace and SVG layer sizes if needed
        if (minWidth > workspace.clientWidth) {
            workspace.style.minWidth = `${minWidth}px`;
        }
        
        if (minHeight > workspace.clientHeight) {
            workspace.style.minHeight = `${minHeight}px`;
        }
        
        // Also adjust SVG layer
        adjustSvgLayerSize();
    }

    // Zoom and Pan functions
    function setupZoomPan() {
        // Track if middle mouse button is pressed
        workspace.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle button or Alt+Left click
                isPanning = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                workspace.style.cursor = 'move';
                e.preventDefault(); // Prevent default behavior
            }
        });

        // Modified mousemove for direct block movement panning
        workspace.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                
                // Get the current boundaries
                const boundaries = calculatePanBoundaries();
                
                // Update the mouse position for next movement
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                // Calculate the movement in model coordinates
                const deltaX = dx / scale;
                const deltaY = dy / scale;
                
                // Move all blocks by this amount
                blocks.forEach(block => {
                    // Get current position
                    const left = parseFloat(block.element.style.left) || 0;
                    const top = parseFloat(block.element.style.top) || 0;
                    
                    // Apply the movement
                    block.element.style.left = `${left + deltaX}px`;
                    block.element.style.top = `${top + deltaY}px`;
                });
                
                // Update connections after moving blocks
                updateAllConnectionLines();
                
                e.preventDefault();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (isPanning) {
                isPanning = false;
                workspace.style.cursor = 'default';
                
                // Save state after panning
                if (e.button === 1 || (e.button === 0 && e.altKey)) {
                    saveState();
                }
            }
        });

        // Add zoom buttons to UI (keep this part)
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'workspace-controls';
        controlsContainer.className = 'workspace-controls';
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.textContent = '+';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.addEventListener('click', () => {
            scale = Math.min(scale * 1.2, 5);
            applyZoomOnly();  // Changed to just apply zoom, not transform
            saveState();
        });
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.textContent = '−'; // Unicode minus sign
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.addEventListener('click', () => {
            scale = Math.max(scale * 0.8, 0.1);
            applyZoomOnly();  // Changed to just apply zoom, not transform
            saveState();
        });
        
        const resetZoomBtn = document.createElement('button');
        resetZoomBtn.textContent = '1:1';
        resetZoomBtn.title = 'Reset Zoom';
        resetZoomBtn.addEventListener('click', () => {
            scale = 1;
            applyZoomOnly();  // Changed to just apply zoom
            saveState();
        });
        
        const undoBtn = document.createElement('button');
        undoBtn.id = 'undo-btn';
        undoBtn.textContent = '↩'; // Undo arrow
        undoBtn.title = 'Undo';
        undoBtn.disabled = true;
        undoBtn.addEventListener('click', undo);
        
        const redoBtn = document.createElement('button');
        redoBtn.id = 'redo-btn';
        redoBtn.textContent = '↪'; // Redo arrow
        redoBtn.title = 'Redo';
        redoBtn.disabled = true;
        redoBtn.addEventListener('click', redo);

        const centerViewBtn = document.createElement('button');
        centerViewBtn.textContent = '⌂'; // House symbol
        centerViewBtn.title = 'Center View';
        centerViewBtn.addEventListener('click', centerView);

        // Add to controls container
        controlsContainer.appendChild(document.createElement('div')).className = 'divider';
        controlsContainer.appendChild(centerViewBtn);
        
        controlsContainer.appendChild(undoBtn);
        controlsContainer.appendChild(redoBtn);
        controlsContainer.appendChild(document.createElement('div')).className = 'divider';
        controlsContainer.appendChild(zoomOutBtn);
        controlsContainer.appendChild(resetZoomBtn);
        controlsContainer.appendChild(zoomInBtn);
        
        document.getElementById('workspace-container').appendChild(controlsContainer);
        
        // Initial state save
        saveState();

        addTutorialControls();
    }

    function applyZoomOnly() {
        // Apply zoom directly to workspace
        const matrix = `matrix(${scale}, 0, 0, ${scale}, 0, 0)`;
        
        workspace.style.transform = matrix;
        workspace.style.transformOrigin = '0 0';
        
        svgLayer.style.transform = matrix;
        svgLayer.style.transformOrigin = '0 0';
        
        // Update grid background to match scale
        workspace.style.backgroundSize = `${20 * scale}px ${20 * scale}px`;
        
        // Update connection lines AFTER the transform has been applied
        requestAnimationFrame(() => {
            updateAllConnectionLines();
        });
    }

    function centerView() {
        if (blocks.length === 0) return;
        
        // Calculate average position of all blocks
        let totalX = 0;
        let totalY = 0;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        
        blocks.forEach(block => {
            const left = parseFloat(block.element.style.left) || 0;
            const top = parseFloat(block.element.style.top) || 0;
            const width = block.element.offsetWidth;
            const height = block.element.offsetHeight;
            
            totalX += left + width/2;
            totalY += top + height/2;
            
            minX = Math.min(minX, left);
            maxX = Math.max(maxX, left + width);
            minY = Math.min(minY, top);
            maxY = Math.max(maxY, top + height);
        });
        
        const avgX = totalX / blocks.length;
        const avgY = totalY / blocks.length;
        
        // Calculate viewport center
        const viewportWidth = workspace.clientWidth / scale;
        const viewportHeight = workspace.clientHeight / scale;
        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;
        
        // Calculate movement needed to center
        const deltaX = viewportCenterX - avgX;
        const deltaY = viewportCenterY - avgY;
        
        // Move all blocks
        blocks.forEach(block => {
            const left = parseFloat(block.element.style.left) || 0;
            const top = parseFloat(block.element.style.top) || 0;
            
            block.element.style.left = `${left + deltaX}px`;
            block.element.style.top = `${top + deltaY}px`;
        });
        
        // Update connections
        updateAllConnectionLines();
        saveState();
    }

    function applyTransform() {
        // Apply constraints before setting transform
        const boundaries = calculatePanBoundaries();
        panX = Math.max(boundaries.minX, Math.min(boundaries.maxX, panX));
        panY = Math.max(boundaries.minY, Math.min(boundaries.maxY, panY));
        
        // Calculate the transform with constrained values
        const translateX = -panX * scale;
        const translateY = -panY * scale;
        
        // Apply transform to both workspace and SVG layer
        const matrix = `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
        
        workspace.style.transform = matrix;
        workspace.style.transformOrigin = '0 0';
        
        svgLayer.style.transform = matrix;
        svgLayer.style.transformOrigin = '0 0';
        
        // Fix: Calculate background position to match pan and scale
        workspace.style.backgroundPosition = `${-panX * scale % (20 * scale)}px ${-panY * scale % (20 * scale)}px`;
        workspace.style.backgroundSize = `${20 * scale}px ${20 * scale}px`;
        
        // Update connection lines AFTER the transform has been applied
        requestAnimationFrame(() => {
            updateAllConnectionLines();
        });
    }

    function updateAfterTransform() {
        // Wait until the browser has updated the DOM and calculated new positions
        window.requestAnimationFrame(() => {
            updateAllConnectionLines();
        });
    }

    // Register event listeners
    generateCodeBtn.addEventListener('click', generateCodeBtn_click);
    
    // Hide context menu when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (contextMenu && !contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            undo();
            e.preventDefault();
        }
        
        // Ctrl+Shift+Z or Ctrl+Y for redo
        if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
            redo();
            e.preventDefault();
        }
        
        // Delete key to remove selected block (if any)
        if ((e.key === 'Delete' || e.key === 'Backspace') && 
            document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
            // Delete code would go here
            e.preventDefault();
        }
        
        // Prevent any other special handling for Ctrl key
        if (e.ctrlKey) {
            // Don't do any special behavior with Ctrl here
        }
    });

    // Initial draw of any existing connections if loaded from save
    updateAllConnectionLines();

    // Call this after initial loading
    setupConnectionObservers();

    // Prevent default scrolling on workspace
    workspace.addEventListener('wheel', (e) => {
        // If control key is not pressed, prevent default scrolling, otherwise allow zooming
        if (!e.ctrlKey) {
            e.preventDefault();
        }
    }
    );

    /// CONSOLE PANEL SETUP

    // Console Panel Implementation
    function setupConsolePanel() {
        // Create console panel elements
        const consolePanel = document.createElement('div');
        consolePanel.id = 'console-panel';
        consolePanel.className = 'console-panel collapsed';
        
        // Create header with toggle capability
        const consoleHeader = document.createElement('div');
        consoleHeader.className = 'console-header';
        consoleHeader.innerHTML = '<span class="console-title">Console</span><span class="console-toggle">▲</span>';
        consoleHeader.addEventListener('click', toggleConsolePanel);
        
        // Create console output area
        const consoleOutput = document.createElement('div');
        consoleOutput.id = 'console-output';
        consoleOutput.className = 'console-output';
        
        // Create console actions
        const consoleActions = document.createElement('div');
        consoleActions.className = 'console-actions';
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearConsole();
        });
        
        consoleActions.appendChild(clearBtn);
        consoleHeader.appendChild(consoleActions);
        
        // Assemble console panel
        consolePanel.appendChild(consoleHeader);
        consolePanel.appendChild(consoleOutput);
        
        // Add to DOM - at the bottom of workspace container
        document.getElementById('workspace-container').appendChild(consolePanel);
        
        // Override console methods to capture logs
        setupConsoleOverrides();
    }

    function toggleConsolePanel(e) {
        const panel = document.getElementById('console-panel');
        panel.classList.toggle('collapsed');
        
        const toggle = document.querySelector('.console-toggle');
        if (panel.classList.contains('collapsed')) {
            toggle.textContent = '▲';
        } else {
            toggle.textContent = '▼';
        }
    }

    function clearConsole() {
        const output = document.getElementById('console-output');
        if (output) {
            output.innerHTML = '';
        }
    }

    function appendToConsole(message, type = 'log') {
        const output = document.getElementById('console-output');
        if (!output) return;
        
        const entry = document.createElement('div');
        entry.className = `console-entry console-${type}`;
        
        // Format the message based on its type
        let formattedMessage = message;
        if (typeof message === 'object') {
            try {
                formattedMessage = JSON.stringify(message, null, 2);
            } catch (err) {
                formattedMessage = String(message);
            }
        }
        
        // Create timestamp
        const timestamp = new Date().toLocaleTimeString();
        const timestampEl = document.createElement('span');
        timestampEl.className = 'console-timestamp';
        timestampEl.textContent = timestamp;
        
        // Create message content
        const contentEl = document.createElement('span');
        contentEl.className = 'console-content';
        contentEl.textContent = formattedMessage;
        
        // Add elements to entry
        entry.appendChild(timestampEl);
        entry.appendChild(contentEl);
        
        // Add to console
        output.appendChild(entry);
        
        // Auto-scroll to bottom
        output.scrollTop = output.scrollHeight;
        
        // Show console on error
        if (type === 'error' && document.getElementById('console-panel').classList.contains('collapsed')) {
            toggleConsolePanel();
        }
    }

    function setupConsoleOverrides() {
        // Save original console methods
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };
        
        // Override console.log
        console.log = function() {
            // Call original function
            originalConsole.log.apply(console, arguments);
            // Add to our console
            appendToConsole(Array.from(arguments).join(' '), 'log');
        };
        
        // Override console.warn
        console.warn = function() {
            originalConsole.warn.apply(console, arguments);
            appendToConsole(Array.from(arguments).join(' '), 'warn');
        };
        
        // Override console.error
        console.error = function() {
            originalConsole.error.apply(console, arguments);
            appendToConsole(Array.from(arguments).join(' '), 'error');
        };
        
        // Override console.info
        console.info = function() {
            originalConsole.info.apply(console, arguments);
            appendToConsole(Array.from(arguments).join(' '), 'info');
        };
        
        // Catch global errors
        window.addEventListener('error', function(event) {
            appendToConsole(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, 'error');
            // Don't prevent default error handling
            return false;
        });
        
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            appendToConsole(`Unhandled Promise Rejection: ${event.reason}`, 'error');
        });
    }

    // Add console panel to DOM when script loads
    setupConsolePanel();

    // Initialize mobile support
    setupMobileSupport();
    
    // Listen for window resize to adjust the SVG layer
    window.addEventListener('resize', adjustSvgLayerSize);
});