document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    const blockPalette = document.getElementById('block-palette');
    const generateCodeBtn = document.getElementById('generate-code-btn');
    const generatedCodeArea = document.getElementById('generated-code');
    const svgLayer = document.getElementById('connection-layer');

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

    // Make sure SVG layer covers the entire workspace area initially
    adjustSvgLayerSize();

    // Setup zoom and pan handlers
    setupZoomPan();

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
        // Get the absolute position in the DOM
        const rect = connectorElement.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();

        // Calculate the position in untransformed workspace coordinates
        // We need to convert from screen pixels to SVG coordinate system
        // Subtract pan offset (multiplied by scale) to align with transformed workspace
        const x = (rect.left + rect.width / 2 - workspaceRect.left) / scale + panX;
        const y = (rect.top + rect.height / 2 - workspaceRect.top) / scale + panY;

        return { x, y };
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
        if (!connection.fromConnectorElement || !connection.toConnectorElement) return;
        
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
        connection.pathElement.setAttribute('d', pathData);
    }

    function updateAllConnectionLines() {
        // Don't use requestAnimationFrame here - we want immediate updates
        // to prevent the "delayed" effect that causes parallax-like movement
        connections.forEach(conn => {
            updateConnectionLine(conn);
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

    // Define makeDraggable function before it's used in createBlock
    function makeDraggable(element) {
        element.addEventListener('mousedown', (e) => {
            // Ignore if clicked on input, connector, delete button, or using Ctrl
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'SELECT' ||
                e.target.classList.contains('connector') || 
                e.target.classList.contains('delete-block') ||
                e.ctrlKey) {
                return;
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
            labelText = 'In';
        } else if (className.includes('parent')) {
            if (name === 'parent') {
                labelText = 'Out';
            } else if (name === 'branch') {
                labelText = 'True';
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

    // Create collapsible block categories in the palette
    function populateBlockPalette() {
        blockPalette.innerHTML = '<h2>Blocks</h2>';
        
        // Group blocks by category
        const categories = {};
        Object.values(BLOCK_DEFINITIONS).forEach(def => {
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
            
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `<span class="category-toggle">▼</span> ${category}`;
            categoryHeader.addEventListener('click', () => {
                categoryContent.classList.toggle('collapsed');
                const toggle = categoryHeader.querySelector('.category-toggle');
                toggle.textContent = categoryContent.classList.contains('collapsed') ? '►' : '▼';
            });
            
            const categoryContent = document.createElement('div');
            categoryContent.className = 'category-content';
            
            // Add blocks to this category
            categories[category].forEach(def => {
                const paletteBlock = document.createElement('div');
                paletteBlock.className = 'palette-block';
                paletteBlock.textContent = def.label;
                paletteBlock.style.backgroundColor = def.color || '#ddd';
                if (def.color) paletteBlock.style.borderColor = darkenColor(def.color, 20);
                
                paletteBlock.draggable = true;
                paletteBlock.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', def.type);
                    // Indicate this is a new block being dragged from palette
                    activeDrag = { isNew: true, type: def.type };
                });
                categoryContent.appendChild(paletteBlock);
            });
            
            categoryContainer.appendChild(categoryHeader);
            categoryContainer.appendChild(categoryContent);
            blockPalette.appendChild(categoryContainer);
        });
    }

    // Initialize block palette with categories
    populateBlockPalette();

    workspace.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        if (activeDrag && activeDrag.isNew) {
            const type = e.dataTransfer.getData('text/plain');
            const workspaceRect = workspace.getBoundingClientRect();
            
            // Calculate precise drop position using the same coordinate system as dragging
            const x = (e.clientX - workspaceRect.left) / scale + panX;
            const y = (e.clientY - workspaceRect.top) / scale + panY;
            
            createBlock(type, x, y);
            
            // Save state after creating a block
            saveState();
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
        blockElement.style.left = `${x}px`;
        blockElement.style.top = `${y}px`;
        blockElement.style.backgroundColor = definition.color || '#60a5fa';
        blockElement.style.borderColor = definition.color ? darkenColor(definition.color, 30) : '#4a5568';

        // Add delete button (X) in top right
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-block';
        deleteBtn.innerHTML = '&times;'; // × symbol
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

        const blockData = {};

        // Add input fields from 'inputs' array in definition
        if (definition.inputs) {
            definition.inputs.forEach(inputDef => {
                const labelEl = document.createElement('label');
                labelEl.textContent = inputDef.label || inputDef.name;
                content.appendChild(labelEl);

                let inputField;
                
                // Create different input types based on the input definition
                switch(inputDef.type) {
                    case "boolean":
                        inputField = document.createElement('input');
                        inputField.type = "checkbox";
                        inputField.checked = blockData[inputDef.name] || false;
                        inputField.classList.add('input-checkbox');
                        inputField.addEventListener('change', e => {
                            blockData[inputDef.name] = e.target.checked;
                            saveState();
                        });
                        break;
                        
                    case "number":
                        inputField = document.createElement('input');
                        inputField.type = "number";
                        inputField.value = blockData[inputDef.name] || 0;
                        inputField.classList.add('input-number');
                        inputField.addEventListener('input', e => {
                            blockData[inputDef.name] = parseFloat(e.target.value) || 0;
                            saveState();
                        });
                        break;
                        
                    case "multiline":
                        inputField = document.createElement('textarea');
                        inputField.value = blockData[inputDef.name] || "";
                        inputField.rows = inputDef.rows || 3;
                        inputField.classList.add('input-multiline');
                        inputField.addEventListener('input', e => {
                            blockData[inputDef.name] = e.target.value;
                            saveState();
                        });
                        break;
                        
                    case "select":
                        inputField = document.createElement('select');
                        inputField.classList.add('input-select');
                        
                        // Add options from the options array
                        if (inputDef.options && Array.isArray(inputDef.options)) {
                            inputDef.options.forEach(option => {
                                const optionEl = document.createElement('option');
                                optionEl.value = option.value || option;
                                optionEl.textContent = option.label || option;
                                inputField.appendChild(optionEl);
                            });
                        }
                        
                        inputField.value = blockData[inputDef.name] || "";
                        inputField.addEventListener('change', e => {
                            blockData[inputDef.name] = e.target.value;
                            saveState();
                        });
                        break;
                        
                    case "string":
                    default:
                        inputField = document.createElement('input');
                        inputField.type = "text";
                        inputField.value = blockData[inputDef.name] || "";
                        inputField.classList.add('input-text');
                        inputField.addEventListener('input', e => {
                            blockData[inputDef.name] = e.target.value;
                            saveState();
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
        
        // Add Flow Connectors - Top/Bottom
        if (definition.hasFlowIn !== false) {
            const childConnector = createConnectorElement(blockId, 'flowIn', 'child', 'connector-child');
            blockElement.appendChild(childConnector);
        }
        
        if (definition.hasFlowOut) {
            const parentConnector = createConnectorElement(blockId, 'flowOut', 'parent', 'connector-parent');
            blockElement.appendChild(parentConnector);
        }
        
        if (definition.hasBranchFlowOut) { // For 'if' true branch
            const branchConnector = createConnectorElement(blockId, 'flowOut', 'branch', 'connector-parent');
            branchConnector.style.bottom = '-8px';
            branchConnector.style.left = '75%';
            blockElement.appendChild(branchConnector);
        }

        // Data Input connectors (Left side) - Positioned down the left side
        if (definition.dataInputs) {
            const blockHeight = 40 + (definition.inputs?.length || 0) * 30; // Estimate height based on inputs
            const inputCount = definition.dataInputs.length;
            const spacing = blockHeight / (inputCount + 1);
            
            definition.dataInputs.forEach((dataInputDef, index) => {
                const inputConnector = createConnectorElement(blockId, 'dataInput', dataInputDef.name, 'connector-input');
                // Position down the left side, evenly spaced
                inputConnector.style.top = `${spacing * (index + 1)}px`;
                inputConnector.style.left = '-8px';
                blockElement.appendChild(inputConnector);
            });
        }

        // Data Output connectors (Right side) - Positioned down the right side
        if (definition.dataOutputs) {
            const blockHeight = 40 + (definition.inputs?.length || 0) * 30; // Estimate height based on inputs
            const outputCount = definition.dataOutputs.length;
            const spacing = blockHeight / (outputCount + 1);
            
            definition.dataOutputs.forEach((dataOutputDef, index) => {
                const outputConnector = createConnectorElement(blockId, 'dataOutput', dataOutputDef.name, 'connector-output');
                // Position down the right side, evenly spaced
                outputConnector.style.top = `${spacing * (index + 1)}px`;
                outputConnector.style.right = '-8px';
                blockElement.appendChild(outputConnector);
            });
        }

        makeDraggable(blockElement); // Now this will work since it's defined above
        workspace.appendChild(blockElement);
        
        // Check if we need to expand the workspace
        ensureWorkspaceSize(x + blockElement.offsetWidth, y + blockElement.offsetHeight);
        
        // Store the input field data and create input listeners
        const inputFields = blockElement.querySelectorAll('input');
        inputFields.forEach(input => {
            const inputName = input.dataset.inputName;
            if (inputName) {
                if (input.type === 'checkbox') {
                    blockData[inputName] = input.checked;
                    input.addEventListener('change', e => {
                        blockData[inputName] = e.target.checked;
                        saveState(); // Save state when input changes
                    });
                } else {
                    blockData[inputName] = input.value;
                    input.addEventListener('input', e => {
                        blockData[inputName] = e.target.value;
                        saveState(); // Save state when input changes
                    });
                }
            }
        });
        
        blocks.push({ 
            id: blockId, 
            type: type, 
            element: blockElement, 
            definition, 
            data: blockData,
            // Initialize connection arrays
            connections: { 
                flowIn: null, 
                flowOut: [], 
                branch: [], 
                dataInputs: {}, 
                dataOutputs: {} 
            } 
        });
        
        return blocks[blocks.length - 1]; // Return the created block object
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
        // Calculate end position accounting for zoom and pan
        const endX = (e.clientX - workspaceRect.left) / scale;
        const endY = (e.clientY - workspaceRect.top) / scale;

        const startPos = getConnectorPosition(connectionStartInfo.connectorElement);
        const pathData = calculateBezierPath(
            startPos.x, startPos.y, 
            endX, endY, 
            getComputedStyle(connectionStartInfo.connectorElement).getPropertyValue('--connector-direction').trim(), // 'vertical' or 'horizontal'
            'auto' // For the target, direction is unknown until connection
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
    
    function showConnectorContextMenu(x, y) {
        hideContextMenu(); // Remove any existing menu
        
        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        
        const deleteItem = document.createElement('div');
        deleteItem.className = 'context-menu-item danger';
        deleteItem.textContent = 'Delete All Connections';
        deleteItem.addEventListener('click', deleteConnectorConnections);
        
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
        const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
        if (connectionIndex === -1) return;
        
        const connection = connections[connectionIndex];
        
        // Remove SVG elements
        if (connection.pathElement) svgLayer.removeChild(connection.pathElement);
        if (connection.dotElement) svgLayer.removeChild(connection.dotElement);
        
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
        }
        
        // Update to block connection references
        const toBlock = blocks.find(b => b.id === connection.toBlockId);
        if (toBlock) {
            if (connection.toConnectorType === 'flowIn') {
                toBlock.connections.flowIn = null;
            } else if (connection.toConnectorType === 'dataInput') {
                toBlock.connections.dataInputs[connection.toConnectorName] = null;
            }
        }
        
        // Remove from connections array
        connections.splice(connectionIndex, 1);
        
        console.log(`Connection ${connectionId} removed`);
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
            finalCode += generateCodeForBlock(startBlock);
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

    function generateCodeForBlock(block, visited = new Set()) {
        if (!block || visited.has(block.id)) return "";

        visited.add(block.id);
        let code = "";

        // Handle container blocks specially (class, function, etc.)
        if (block.definition.isContainer) {
            // Get child blocks (flow out from this container)
            let childrenCode = "";
            if (Array.isArray(block.connections.flowOut)) {
                for (const flowOutId of block.connections.flowOut) {
                    const conn = connections.find(c => c.id === flowOutId);
                    if (conn) {
                        const childBlockId = conn.toBlockId;
                        const childBlock = blocks.find(b => b.id === childBlockId);
                        if (childBlock) {
                            // Create separate visited set for children to allow proper nesting
                            const childVisited = new Set();
                            childrenCode += generateCodeForBlock(childBlock, childVisited);
                        }
                    }
                }
            }
            
            // Call the block's toCode with children code
            code += block.definition.toCode(block, "", childrenCode);
            
            // After container block, continue with main flow (not necessarily visited)
            // This requires special handling as containers operate on their own scope
        } 
        // Handle if block specially (it's a partial container)
        else if (block.definition.type === "if_condition") {
            // Get condition from input or text field
            const conditionText = block.data.condition_text || "true";
            let conditionValue = conditionText;
            
            // Check for data input connection for condition
            const condConnId = block.connections.dataInputs?.condition;
            if (condConnId) {
                const conn = connections.find(c => c.id === condConnId);
                if (conn) {
                    const sourceBlockId = conn.fromBlockId;
                    const sourceBlock = blocks.find(b => b.id === sourceBlockId);
                    if (sourceBlock && sourceBlock.data) {
                        // For boolean_value blocks, use their value
                        if (sourceBlock.type === "boolean_value") {
                            conditionValue = sourceBlock.data.value === true ? "true" : "false";
                        } else {
                            conditionValue = sourceBlock.data.value || conditionText;
                        }
                    }
                }
            }
            
            // Start the if statement
            code += `if (${conditionValue}) {\n`;
            
            // Process the true branch
            let branchCode = "";
            if (Array.isArray(block.connections.branch)) {
                for (const branchConnId of block.connections.branch) {
                    const conn = connections.find(c => c.id === branchConnId);
                    if (conn) {
                        const branchBlockId = conn.toBlockId;
                        const branchBlock = blocks.find(b => b.id === branchBlockId);
                        if (branchBlock) {
                            // Create a new visited set for the branch
                            const branchVisited = new Set();
                            branchCode += generateCodeForBlock(branchBlock, branchVisited);
                        }
                    }
                }
            }
            
            // Add the branch code (indentation is handled by the formatter)
            if (branchCode) {
                code += branchCode;
            }
            
            // Close the if statement
            code += '}\n';
        } 
        else if (block.definition.type === "class_definition") {
            // Initialize code sections
            let constructorCode = "";
            let methodsCode = "";
            
            // Process connected blocks
            if (Array.isArray(block.connections.flowOut)) {
                for (const flowOutId of block.connections.flowOut) {
                    const conn = connections.find(c => c.id === flowOutId);
                    if (conn) {
                        const childBlockId = conn.toBlockId;
                        const childBlock = blocks.find(b => b.id === childBlockId);
                        if (childBlock) {
                            const childVisited = new Set();
                            
                            // Detect if this child is a method or constructor content
                            if (childBlock.definition.type === "function_definition") {
                                // This is a class method - should appear directly inside the class
                                // but outside the constructor
                                methodsCode += generateCodeForBlock(childBlock, childVisited);
                            } else {
                                // Regular code - should go in constructor
                                constructorCode += generateCodeForBlock(childBlock, childVisited);
                            }
                        }
                    }
                }
            }
            
            // Generate the complete class code
            const className = block.data.class_name || "MyClass";
            code += `class ${className} {\n`;
            code += `  constructor() {\n${constructorCode}  }\n\n`;
            
            // Add methods outside constructor, directly inside the class
            code += methodsCode;
            
            code += `}\n`;
        }
        else {
            // For standard blocks
            code += block.definition.toCode(block);
        }
        
        // Continue with normal flow (for non-container blocks and after if-statements)
        if (!block.definition.isContainer && Array.isArray(block.connections.flowOut)) {
            for (const flowOutId of block.connections.flowOut) {
                const conn = connections.find(c => c.id === flowOutId);
                if (conn) {
                    const nextBlockId = conn.toBlockId;
                    const nextBlock = blocks.find(b => b.id === nextBlockId);
                    if (nextBlock) {
                        code += generateCodeForBlock(nextBlock, visited);
                    }
                }
            }
        }
        
        return code;
    }

    // Undo System Functions
    function saveState() {
        // Create a serializable state
        const state = {
            blocks: blocks.map(block => ({
                id: block.id,
                type: block.type,
                data: {...block.data},
                position: {
                    left: block.element.style.left,
                    top: block.element.style.top
                },
                connections: JSON.parse(JSON.stringify(block.connections)) // Deep copy
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

        // If we're at the end of history, add this state
        // Otherwise, truncate the history
        if (currentStateIndex === undoHistory.length - 1) {
            undoHistory.push(state);
            currentStateIndex = undoHistory.length - 1;
            
            // Limit history size
            if (undoHistory.length > MAX_UNDO_HISTORY) {
                undoHistory.shift(); // Remove oldest state
                currentStateIndex--;
            }
        } else {
            // Delete anything after current index
            undoHistory = undoHistory.slice(0, currentStateIndex + 1);
            undoHistory.push(state);
            currentStateIndex = undoHistory.length - 1;
        }
        
        // Update UI
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
            const inputFields = block.element.querySelectorAll('input');
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
            
            // Restore connection references (actual connections will be recreated later)
            block.connections = JSON.parse(JSON.stringify(blockData.connections));
        });
        
        // Recreate connections
        state.connections.forEach(connData => {
            const fromBlock = blocks.find(b => b.id === connData.fromBlockId);
            const toBlock = blocks.find(b => b.id === connData.toBlockId);
            
            if (fromBlock && toBlock) {
                // Find connector elements
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
        // Make sure the SVG layer covers the entire workspace
        const workspaceStyle = getComputedStyle(workspace);
        const width = workspaceStyle.minWidth || workspaceStyle.width;
        const height = workspaceStyle.minHeight || workspaceStyle.height;
        
        svgLayer.style.minWidth = width;
        svgLayer.style.minHeight = height;
        svgLayer.style.width = width;
        svgLayer.style.height = height;
        
        svgLayer.setAttribute('width', width);
        svgLayer.setAttribute('height', height);
        svgLayer.setAttribute('viewBox', `0 0 ${parseInt(width)} ${parseInt(height)}`);
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

        // Make the pan handlers use our improved transform function
        workspace.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const dx = e.clientX - lastMouseX;
                const dy = e.clientY - lastMouseY;
                
                // Update pan values, with proper scaling
                panX -= dx / scale;
                panY -= dy / scale;
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                // Apply the transform - this will also update connection lines
                applyTransform();
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

        // Zoom with mouse wheel
        workspace.addEventListener('wheel', (e) => {
            /*if (e.ctrlKey) { // Only zoom when Ctrl is pressed
                e.preventDefault(); // Prevent the default scroll behavior
                
                const delta = e.deltaY < 0 ? 1.1 : 0.9; // Zoom in/out factor
                
                // Get cursor position relative to workspace
                const rect = workspace.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate cursor position in workspace coordinates
                const mouseWorkspaceX = mouseX / scale + panX;
                const mouseWorkspaceY = mouseY / scale + panY;
                
                // Apply zoom
                const newScale = scale * delta;
                
                // Limit zoom level
                if (newScale > 0.1 && newScale < 5) {
                    scale = newScale;
                    
                    // Adjust pan to zoom at cursor position
                    panX = mouseWorkspaceX - mouseX / scale;
                    panY = mouseWorkspaceY - mouseY / scale;
                    
                    // Apply transform with the new scale and pan values
                    applyTransform();
                    
                    // After zooming, ensure connections are updated
                    window.requestAnimationFrame(() => {
                        updateAllConnectionLines();
                    });
                    
                    // Save state after significant zoom changes
                    if (Math.abs(delta - 1) > 0.05) {
                        saveState();
                    }
                }
            }*/
        });
        
        // Add zoom buttons to UI
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'workspace-controls';
        controlsContainer.className = 'workspace-controls';
        
        const zoomInBtn = document.createElement('button');
        zoomInBtn.textContent = '+';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.addEventListener('click', () => {
            scale = Math.min(scale * 1.2, 5);
            applyTransform();
            saveState();
        });
        
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.textContent = '−'; // Unicode minus sign
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.addEventListener('click', () => {
            scale = Math.max(scale * 0.8, 0.1);
            applyTransform();
            saveState();
        });
        
        const resetZoomBtn = document.createElement('button');
        resetZoomBtn.textContent = '1:1';
        resetZoomBtn.title = 'Reset Zoom';
        resetZoomBtn.addEventListener('click', () => {
            scale = 1;
            panX = 0;
            panY = 0;
            applyTransform();
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

        const resetPositionBtn = document.createElement('button');
        resetPositionBtn.textContent = '⌂'; // House symbol for "home position"
        resetPositionBtn.title = 'Reset Position';
        resetPositionBtn.addEventListener('click', () => {
            // Reset just the pan position, keep the current zoom
            panX = 0;
            panY = 0;
            applyTransform();
            saveState();
        });

        // Add it to the controls container
        controlsContainer.appendChild(document.createElement('div')).className = 'divider';
        controlsContainer.appendChild(resetPositionBtn);
        
        controlsContainer.appendChild(undoBtn);
        controlsContainer.appendChild(redoBtn);
        controlsContainer.appendChild(document.createElement('div')).className = 'divider';
        controlsContainer.appendChild(zoomOutBtn);
        controlsContainer.appendChild(resetZoomBtn);
        controlsContainer.appendChild(zoomInBtn);
        
        document.getElementById('workspace-container').appendChild(controlsContainer);
        
        // Initial state save
        saveState();
    }

    function applyTransform() {
        // Use a CSS transform matrix for more precise control
        const matrix = `matrix(${scale}, 0, 0, ${scale}, ${-panX * scale}, ${-panY * scale})`;
        
        // Apply the same transformation to both the workspace and SVG layer
        workspace.style.transform = matrix;
        workspace.style.transformOrigin = '0 0';
        
        svgLayer.style.transform = matrix;
        svgLayer.style.transformOrigin = '0 0';
        
        // Reset any additional positioning that might interfere
        workspace.style.left = '0px';
        workspace.style.top = '0px';
        svgLayer.style.left = '0px';
        svgLayer.style.top = '0px';
        
        // Apply grid background transformation
        workspace.style.backgroundPosition = `${-panX * scale}px ${-panY * scale}px`;
        workspace.style.backgroundSize = `${20 * scale}px ${20 * scale}px`;
        
        // Critical: Force connection line updates *after* transform is applied
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
            document.activeElement.tagName !== 'INPUT') {
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
    
    // Listen for window resize to adjust the SVG layer
    window.addEventListener('resize', adjustSvgLayerSize);
});