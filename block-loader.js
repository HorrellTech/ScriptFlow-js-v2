window.BlockLoader = {
    currentBlockSet: 'javascript', // default
    availableBlockSets: {
        'javascript': {
            name: 'JavaScript',
            file: 'blocks.js',
            loaded: false
        },
        'html': {
            name: 'HTML',
            file: 'blocks-html.js',
            loaded: false
        }
    },

    // Initialize the block loader
    init: function() {
        this.createBlockSetSelector();
        this.loadBlockSet(this.currentBlockSet);
    },

    // Create UI for selecting block sets
    createBlockSetSelector: function() {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        const buttonContainer = toolbar.querySelector('.toolbar-buttons');
        if (!buttonContainer) return;

        // Create block set selector
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'block-set-selector';
        
        const label = document.createElement('span');
        label.textContent = 'Blocks: ';
        label.style.marginRight = '5px';
        label.style.color = '#e2e8f0';
        
        const selector = document.createElement('select');
        selector.id = 'block-set-selector';
        selector.style.background = '#2d3748';
        selector.style.color = '#e2e8f0';
        selector.style.border = '1px solid #4a5568';
        selector.style.borderRadius = '4px';
        selector.style.padding = '4px 8px';
        
        // Add options
        Object.keys(this.availableBlockSets).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = this.availableBlockSets[key].name;
            if (key === this.currentBlockSet) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
        
        // Handle selection change
        selector.addEventListener('change', (e) => {
            this.switchBlockSet(e.target.value);
        });
        
        selectorContainer.appendChild(label);
        selectorContainer.appendChild(selector);
        
        // Insert after the open project button
        const openBtn = buttonContainer.querySelector('#open-project-btn');
        if (openBtn) {
            buttonContainer.insertBefore(selectorContainer, openBtn.nextSibling);
        } else {
            buttonContainer.appendChild(selectorContainer);
        }
    },

    // Load a specific block set
    loadBlockSet: function(blockSetName) {
        return new Promise((resolve, reject) => {
            const blockSet = this.availableBlockSets[blockSetName];
            if (!blockSet) {
                reject(new Error(`Block set '${blockSetName}' not found`));
                return;
            }

            if (blockSet.loaded) {
                this.activateBlockSet(blockSetName);
                resolve();
                return;
            }

            // Load the script
            const script = document.createElement('script');
            script.src = blockSet.file;
            script.onload = () => {
                blockSet.loaded = true;
                this.activateBlockSet(blockSetName);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load block set: ${blockSet.file}`));
            };
            
            document.head.appendChild(script);
        });
    },

    // Activate a loaded block set
    activateBlockSet: function(blockSetName) {
        this.currentBlockSet = blockSetName;
        
        // Clear current blocks
        window.BLOCK_DEFINITIONS = {};
        
        // Load the appropriate block definitions
        switch(blockSetName) {
            case 'javascript':
                if (window.JAVASCRIPT_BLOCK_DEFINITIONS) {
                    window.BLOCK_DEFINITIONS = { ...window.JAVASCRIPT_BLOCK_DEFINITIONS };
                } else {
                    // If JavaScript blocks aren't loaded yet, use the existing BLOCK_DEFINITIONS
                    console.warn('JavaScript blocks not found, keeping existing definitions');
                }
                break;
            case 'html':
                if (window.HTML_BLOCK_DEFINITIONS) {
                    window.BLOCK_DEFINITIONS = { ...window.HTML_BLOCK_DEFINITIONS };
                } else {
                    console.warn('HTML blocks not found');
                }
                break;
            default:
                console.warn(`Unknown block set: ${blockSetName}`);
        }
        
        // Only refresh if we have block definitions
        if (Object.keys(window.BLOCK_DEFINITIONS).length > 0) {
            // Clear workspace (optional - you might want to ask user first)
            if (typeof window.clearWorkspace === 'function') {
                // window.clearWorkspace();
            }
            
            // Refresh the block palette - use the globally accessible function
            if (typeof window.refreshBlockPalette === 'function') {
                window.refreshBlockPalette();
            } else if (typeof window.populateBlockPalette === 'function') {
                // Fallback to direct call
                window.populateBlockPalette();
            }
        } else {
            console.warn('No block definitions available, skipping palette refresh');
        }
        
        // Update code generation area placeholder
        this.updateCodeAreaPlaceholder();
        
        console.log(`Switched to ${blockSetName} blocks`);
    },

    // Switch to a different block set
    switchBlockSet: function(blockSetName) {
        if (blockSetName === this.currentBlockSet) return;
        
        this.loadBlockSet(blockSetName).catch(error => {
            console.error('Error switching block set:', error);
            // Reset selector to current block set
            const selector = document.getElementById('block-set-selector');
            if (selector) {
                selector.value = this.currentBlockSet;
            }
        });
    },

    // Update the code generation area placeholder
    updateCodeAreaPlaceholder: function() {
        const codeArea = document.getElementById('generated-code');
        if (codeArea) {
            switch(this.currentBlockSet) {
                case 'javascript':
                    codeArea.placeholder = 'Generated JavaScript code will appear here...';
                    break;
                case 'html':
                    codeArea.placeholder = 'Generated HTML code will appear here...';
                    break;
                default:
                    codeArea.placeholder = 'Generated code will appear here...';
            }
        }
    },

    // Get current block set info
    getCurrentBlockSet: function() {
        return {
            name: this.currentBlockSet,
            info: this.availableBlockSets[this.currentBlockSet]
        };
    }
};