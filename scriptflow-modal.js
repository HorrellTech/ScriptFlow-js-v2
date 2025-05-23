/**
 * ScriptFlow Modal
 * Creates a modal dialog that embeds the ScriptFlow editor
 */
class ScriptFlowModal {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'ScriptFlow.js Editor',
            width: options.width || '90%',
            height: options.height || '90%',
            onSave: options.onSave || null,
            editorUrl: options.editorUrl || 'editor.html'
        };
        
        this.modal = null;
        this.backdrop = null;
        this.iframe = null;
        this.isOpen = false;
    }
    
    open() {
        if (this.isOpen) return;
        
        // Create modal elements
        this.createModalElements();
        
        // Show the modal
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.modal);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        this.isOpen = true;
        
        // Add event listener for ESC key to close
        document.addEventListener('keydown', this.handleEscKey);
        
        // Setup message listener to receive code from the iframe
        window.addEventListener('message', this.handleMessage);
    }
    
    close() {
        if (!this.isOpen) return;
        
        // Remove modal elements
        document.body.removeChild(this.backdrop);
        document.body.removeChild(this.modal);
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        this.isOpen = false;
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleEscKey);
        window.removeEventListener('message', this.handleMessage);
    }
    
    createModalElements() {
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'scriptflow-modal-backdrop';
        this.backdrop.addEventListener('click', (e) => {
            // Only close if clicking directly on the backdrop
            if (e.target === this.backdrop) {
                this.close();
            }
        });
        
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'scriptflow-modal';
        this.modal.style.width = this.options.width;
        this.modal.style.height = this.options.height;
        
        // Create modal header
        const header = document.createElement('div');
        header.className = 'scriptflow-modal-header';
        
        const title = document.createElement('h2');
        title.textContent = this.options.title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'scriptflow-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.close());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create iframe to load editor.html
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'scriptflow-modal-iframe';
        this.iframe.src = this.options.editorUrl;
        this.iframe.style.width = '100%';
        this.iframe.style.height = 'calc(100% - 100px)'; // Adjust for header and footer
        this.iframe.style.border = 'none';
        this.iframe.setAttribute('frameborder', '0');
        this.iframe.setAttribute('allowfullscreen', 'true');
        
        // Create modal footer with Done button
        const footer = document.createElement('div');
        footer.className = 'scriptflow-modal-footer';
        
        const doneBtn = document.createElement('button');
        doneBtn.className = 'scriptflow-modal-done';
        doneBtn.textContent = 'Done';
        doneBtn.addEventListener('click', () => {
            // Request the generated code from the iframe before closing
            this.iframe.contentWindow.postMessage({ action: 'getGeneratedCode' }, '*');
            // Close will happen after we receive the code via handleMessage
        });
        
        footer.appendChild(doneBtn);
        
        // Assemble the modal
        this.modal.appendChild(header);
        this.modal.appendChild(this.iframe);
        this.modal.appendChild(footer);
        
        // Add modal styles
        this.addModalStyles();
    }
    
    addModalStyles() {
        // Check if styles already exist
        if (document.getElementById('scriptflow-modal-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'scriptflow-modal-styles';
        
        styleEl.textContent = `
            .scriptflow-modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9999;
            }
            
            .scriptflow-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #1a202c;
                color: #e2e8f0;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                max-width: 95vw;
                max-height: 95vh;
            }
            
            .scriptflow-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background-color: #2d3748;
                border-bottom: 1px solid #4a5568;
            }
            
            .scriptflow-modal-header h2 {
                margin: 0;
                font-size: 1.25rem;
                color: #81e6d9;
            }
            
            .scriptflow-modal-close {
                background: none;
                border: none;
                color: #e2e8f0;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0 5px;
            }
            
            .scriptflow-modal-iframe {
                flex: 1;
                background-color: #171923;
                min-height: 400px;
            }
            
            .scriptflow-modal-footer {
                padding: 12px 20px;
                background-color: #2d3748;
                border-top: 1px solid #4a5568;
                display: flex;
                justify-content: flex-end;
            }
            
            .scriptflow-modal-done {
                background-color: #4299e1;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .scriptflow-modal-done:hover {
                background-color: #3182ce;
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    // Handle ESC key press
    handleEscKey = (e) => {
        if (e.key === 'Escape') {
            this.close();
        }
    }
    
    // Handle messages from the iframe
    handleMessage = (event) => {
        // Make sure the message is from our iframe
        if (event.source === this.iframe.contentWindow) {
            const { action, code } = event.data;
            
            if (action === 'generatedCode' && this.options.onSave) {
                this.options.onSave(code);
                this.close();
            }
        }
    }
}

// Export to window object
window.ScriptFlowModal = ScriptFlowModal;