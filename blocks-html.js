// HTML Block Definitions for ScriptFlow.js

if (typeof BLOCK_DEFINITIONS === 'undefined') {
    window.BLOCK_DEFINITIONS = {};
}

// HTML Block Definitions
window.HTML_BLOCK_DEFINITIONS = {
    "start": {
        type: "start",
        label: "Start",
        color: "#22c55e", // Green
        category: "HTML Structure",
        hasFlowIn: false,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "title", type: "string", label: "Page Title:" },
            { name: "lang", type: "string", label: "Language (e.g., 'en'):" },
            { name: "charset", type: "string", label: "Character Set:" }
        ],
        dataInputs: [
            { name: "head_content", type: "html", label: "Head Content" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode, context) {
            const title = block.data.title || "My Page";
            const lang = block.data.lang || "en";
            const charset = block.data.charset || "UTF-8";
            
            let code = `<!DOCTYPE html>\n<html lang="${lang}">\n<head>\n`;
            code += `<meta charset="${charset}">\n`;
            code += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
            code += `<title>${title}</title>\n`;
            
            // Get connected head content using the global getConnectedValue function
            if (typeof getConnectedValue === 'function') {
                const headContent = getConnectedValue(block, "head_content", context);
                if (headContent && headContent.trim()) {
                    // Clean and add head content with proper indentation
                    const headLines = headContent.trim().split('\n');
                    for (const line of headLines) {
                        if (line.trim()) {
                            code += `${line.trim()}\n`;
                        }
                    }
                }
            }
            
            // Also check for direct connections in context (fallback method)
            if (context && context.connections && context.blocks) {
                const connectionsToThisBlock = context.connections.filter(conn => 
                    conn.toBlockId === block.id && 
                    conn.toConnectorType === 'dataInput' &&
                    conn.toConnectorName === 'head_content'
                );
                
                for (const connection of connectionsToThisBlock) {
                    const sourceBlock = context.blocks.find(b => b.id === connection.fromBlockId);
                    if (sourceBlock && sourceBlock.definition) {
                        try {
                            let value = null;
                            
                            // Try getValue first (for data output blocks)
                            if (sourceBlock.definition.getValue) {
                                value = sourceBlock.definition.getValue(sourceBlock, context);
                            } 
                            // Fallback to toCode for flow blocks
                            else if (sourceBlock.definition.toCode) {
                                value = sourceBlock.definition.toCode(sourceBlock, "", "", context);
                            }
                            
                            if (value && value.trim()) {
                                // Clean and add head content
                                const headLines = value.trim().split('\n');
                                for (const line of headLines) {
                                    if (line.trim()) {
                                        code += `${line.trim()}\n`;
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Error getting head content from connected block:", error);
                            code += `<!-- Error: Could not process head content from ${sourceBlock.type} -->\n`;
                        }
                    }
                }
            }
            
            code += `</head>\n<body>\n`;
            
            // Add body content from branch blocks
            if (branchBlockCode && branchBlockCode.trim()) {
                // Clean and indent body content
                const bodyLines = branchBlockCode.trim().split('\n');
                for (const line of bodyLines) {
                    if (line.trim()) {
                        code += `  ${line.trim()}\n`;
                    }
                }
            }
            
            code += `</body>\n</html>`;
            return code;
        }
    },
    
    "html_script_container": {
        type: "html_script_container",
        label: "Script Container",
        color: "#f59e0b", // Amber
        category: "HTML Head",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "type", type: "select", label: "Script Type:", 
            options: [
                { value: "text/javascript", label: "JavaScript" },
                { value: "module", label: "ES6 Module" },
                { value: "text/json", label: "JSON" }
            ]},
            { name: "src", type: "string", label: "External Source (optional):" },
            { name: "async", type: "boolean", label: "Async:" },
            { name: "defer", type: "boolean", label: "Defer:" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const type = block.data.type || "text/javascript";
            const src = block.data.src || "";
            const async = block.data.async === true;
            const defer = block.data.defer === true;
            
            let attributes = ` type="${type}"`;
            if (src) attributes += ` src="${src}"`;
            if (async) attributes += ` async`;
            if (defer) attributes += ` defer`;
            
            let code = `<script${attributes}>\n`;
            
            // Add the branch code (JavaScript blocks) inside the script tags
            if (branchBlockCode && branchBlockCode.trim()) {
                // Clean and indent the JavaScript content
                const jsLines = branchBlockCode.trim().split('\n');
                for (const line of jsLines) {
                    if (line.trim()) {
                        code += `  ${line.trim()}\n`;
                    }
                }
            }
            
            code += `</script>\n`;
            return code;
        }
    },

    "html_style_container": {
        type: "html_style_container",
        label: "Style Container",
        color: "#3b82f6", // Blue
        category: "HTML Head",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "media", type: "string", label: "Media Query (optional):" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const media = block.data.media || "";
            
            let attributes = "";
            if (media) attributes += ` media="${media}"`;
            
            let code = `<style${attributes}>\n`;
            
            // Add the branch code (CSS blocks) inside the style tags
            if (branchBlockCode && branchBlockCode.trim()) {
                // Clean and indent the CSS content
                const cssLines = branchBlockCode.trim().split('\n');
                for (const line of cssLines) {
                    if (line.trim()) {
                        code += `  ${line.trim()}\n`;
                    }
                }
            }
            
            code += `</style>\n`;
            return code;
        }
    },

    "html_head_container": {
        type: "html_head_container",
        label: "Head Container",
        color: "#6366f1", // Indigo
        category: "HTML Head",
        hasFlowIn: false,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [],
        dataOutputs: [
            { name: "html_output", type: "html", label: "HTML" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            // When used in flow context, just return the branch content
            let condition = "<!-- Header Data -->";
                
            // First try to get from connected data input
            if (typeof getConnectedValue === 'function') {
                const connectedCondition = getConnectedValue(block, "condition");
                if (connectedCondition !== null) {
                    condition = connectedCondition;
                } else {
                    // Fall back to text input
                    condition = block.data.condition_text || "<!-- Header Data -->";
                }
            } else {
                condition = block.data.condition_text || "<!-- Header Data -->";
            }
            return "";
        },
        
        // Helper method for generating branch code
        generateBranchCode: function(block, context, visited) {
            if (!block || visited.has(block.id)) return "";
            
            visited.add(block.id);
            let code = "";
            
            try {
                // Generate code for this block
                if (block.definition && block.definition.getValue) {
                    code += block.definition.getValue(block, context);
                } else if (block.definition && block.definition.toCode) {
                    code += block.definition.toCode(block, "", "", context);
                }
                
                // Find next block in the flow
                const nextConnections = context.connections.filter(conn => 
                    conn.fromBlockId === block.id && 
                    conn.fromConnectorType === 'flowOut' &&
                    conn.fromConnectorName === 'next'
                );
                
                for (const conn of nextConnections) {
                    const nextBlock = context.blocks.find(b => b.id === conn.toBlockId);
                    if (nextBlock) {
                        code += this.generateBranchCode(nextBlock, context, visited);
                    }
                }
                
            } catch (error) {
                console.error("Error generating code for block:", block.type, error);
                code += `<!-- Error: ${error.message} -->\n`;
            }
            
            return code;
        }
    },

    "html_heading": {
        type: "html_heading",
        label: "Heading",
        color: "#1d4ed8", // Blue
        category: "HTML Content",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "level", type: "select", label: "Heading Level:", 
             options: [
                { value: "1", label: "H1" },
                { value: "2", label: "H2" },
                { value: "3", label: "H3" },
                { value: "4", label: "H4" },
                { value: "5", label: "H5" },
                { value: "6", label: "H6" }
             ]},
            { name: "text", type: "string", label: "Heading Text:" },
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const level = block.data.level || "1";
            const text = block.data.text || "Heading";
            const id = block.data.id || "";
            const className = block.data.class || "";
            
            let attributes = "";
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            
            return `<h${level}${attributes}>${text}</h${level}>\n`;
        }
    },

    "html_paragraph": {
        type: "html_paragraph",
        label: "Paragraph",
        color: "#2563eb", // Blue
        category: "HTML Content",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "text", type: "multiline", label: "Paragraph Text:", rows: 3 },
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const text = block.data.text || "Paragraph text here.";
            const id = block.data.id || "";
            const className = block.data.class || "";
            
            let attributes = "";
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            
            return `<p${attributes}>${text}</p>\n`;
        }
    },

    "html_div": {
        type: "html_div",
        label: "Div Container",
        color: "#7c3aed", // Purple
        category: "HTML Layout",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" },
            { name: "style", type: "string", label: "Inline Style (optional):" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const id = block.data.id || "";
            const className = block.data.class || "";
            const style = block.data.style || "";
            
            let attributes = "";
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            if (style) attributes += ` style="${style}"`;
            
            let code = `<div${attributes}>\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
            }
            code += `</div>`;
            return code;
        }
    },

    "html_header": {
        type: "html_header",
        label: "Header Section",
        color: "#059669", // Green
        category: "HTML Layout",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const id = block.data.id || "";
            const className = block.data.class || "";
            
            let attributes = "";
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            
            let code = `<header${attributes}>\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
            }
            code += `</header>`;
            return code;
        }
    },

    "html_nav": {
        type: "html_nav",
        label: "Navigation",
        color: "#0369a1", // Blue
        category: "HTML Layout",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const id = block.data.id || "";
            const className = block.data.class || "";
            
            let attributes = "";
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            
            let code = `<nav${attributes}>\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
            }
            code += `</nav>`;
            return code;
        }
    },

    "html_button": {
        type: "html_button",
        label: "Button",
        color: "#ea580c", // Orange
        category: "HTML UI Elements",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "text", type: "string", label: "Button Text:" },
            { name: "type", type: "select", label: "Button Type:", 
             options: [
                { value: "button", label: "Button" },
                { value: "submit", label: "Submit" },
                { value: "reset", label: "Reset" }
             ]},
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" },
            { name: "onclick", type: "string", label: "OnClick (optional):" }
        ],
        toCode: function(block) {
            const text = block.data.text || "Button";
            const type = block.data.type || "button";
            const id = block.data.id || "";
            const className = block.data.class || "";
            const onclick = block.data.onclick || "";
            
            let attributes = ` type="${type}"`;
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            if (onclick) attributes += ` onclick="${onclick}"`;
            
            return `<button${attributes}>${text}</button>\n`;
        }
    },

    "html_input": {
        type: "html_input",
        label: "Input Field",
        color: "#f59e0b", // Amber
        category: "HTML UI Elements",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "type", type: "select", label: "Input Type:", 
             options: [
                { value: "text", label: "Text" },
                { value: "password", label: "Password" },
                { value: "email", label: "Email" },
                { value: "number", label: "Number" },
                { value: "tel", label: "Telephone" },
                { value: "url", label: "URL" },
                { value: "date", label: "Date" },
                { value: "time", label: "Time" },
                { value: "color", label: "Color" },
                { value: "file", label: "File" },
                { value: "checkbox", label: "Checkbox" },
                { value: "radio", label: "Radio" }
             ]},
            { name: "name", type: "string", label: "Name:" },
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "placeholder", type: "string", label: "Placeholder (optional):" },
            { name: "value", type: "string", label: "Default Value (optional):" },
            { name: "required", type: "boolean", label: "Required:" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const type = block.data.type || "text";
            const name = block.data.name || "";
            const id = block.data.id || "";
            const placeholder = block.data.placeholder || "";
            const value = block.data.value || "";
            const required = block.data.required === true;
            const className = block.data.class || "";
            
            let attributes = ` type="${type}"`;
            if (name) attributes += ` name="${name}"`;
            if (id) attributes += ` id="${id}"`;
            if (placeholder) attributes += ` placeholder="${placeholder}"`;
            if (value) attributes += ` value="${value}"`;
            if (required) attributes += ` required`;
            if (className) attributes += ` class="${className}"`;
            
            return `<input${attributes}>\n`;
        }
    },

    "html_textarea": {
        type: "html_textarea",
        label: "Text Area",
        color: "#d97706", // Dark amber
        category: "HTML UI Elements",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "name", type: "string", label: "Name:" },
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "placeholder", type: "string", label: "Placeholder (optional):" },
            { name: "rows", type: "number", label: "Rows:" },
            { name: "cols", type: "number", label: "Columns:" },
            { name: "required", type: "boolean", label: "Required:" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const name = block.data.name || "";
            const id = block.data.id || "";
            const placeholder = block.data.placeholder || "";
            const rows = block.data.rows || 4;
            const cols = block.data.cols || 50;
            const required = block.data.required === true;
            const className = block.data.class || "";
            
            let attributes = ` rows="${rows}" cols="${cols}"`;
            if (name) attributes += ` name="${name}"`;
            if (id) attributes += ` id="${id}"`;
            if (placeholder) attributes += ` placeholder="${placeholder}"`;
            if (required) attributes += ` required`;
            if (className) attributes += ` class="${className}"`;
            
            return `<textarea${attributes}></textarea>\n`;
        }
    },

    "html_image": {
        type: "html_image",
        label: "Image",
        color: "#dc2626", // Red
        category: "HTML Media",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "src", type: "string", label: "Image URL/Path:" },
            { name: "alt", type: "string", label: "Alt Text:" },
            { name: "width", type: "string", label: "Width (optional):" },
            { name: "height", type: "string", label: "Height (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const src = block.data.src || "";
            const alt = block.data.alt || "";
            const width = block.data.width || "";
            const height = block.data.height || "";
            const className = block.data.class || "";
            
            let attributes = ` src="${src}" alt="${alt}"`;
            if (width) attributes += ` width="${width}"`;
            if (height) attributes += ` height="${height}"`;
            if (className) attributes += ` class="${className}"`;
            
            return `<img${attributes}>\n`;
        }
    },

    "html_link": {
        type: "html_link",
        label: "Link",
        color: "#1e40af", // Blue
        category: "HTML Content",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "href", type: "string", label: "URL/Link:" },
            { name: "text", type: "string", label: "Link Text:" },
            { name: "target", type: "select", label: "Target:", 
             options: [
                { value: "_self", label: "Same Window" },
                { value: "_blank", label: "New Window/Tab" },
                { value: "_parent", label: "Parent Frame" },
                { value: "_top", label: "Top Frame" }
             ]},
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const href = block.data.href || "#";
            const text = block.data.text || "Link";
            const target = block.data.target || "_self";
            const className = block.data.class || "";
            
            let attributes = ` href="${href}"`;
            if (target !== "_self") attributes += ` target="${target}"`;
            if (className) attributes += ` class="${className}"`;
            
            return `<a${attributes}>${text}</a>\n`;
        }
    },

    "html_list": {
        type: "html_list",
        label: "List",
        color: "#0891b2", // Cyan
        category: "HTML Content",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "listType", type: "select", label: "List Type:", 
             options: [
                { value: "ul", label: "Unordered List (ul)" },
                { value: "ol", label: "Ordered List (ol)" }
             ]},
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const listType = block.data.listType || "ul";
            const id = block.data.id || "";
            const className = block.data.class || "";
            
            let attributes = "";
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            
            let code = `<${listType}${attributes}>\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
            }
            code += `</${listType}>`;
            return code;
        }
    },

    "html_list_item": {
        type: "html_list_item",
        label: "List Item",
        color: "#0e7490", // Dark cyan
        category: "HTML Content",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "text", type: "string", label: "Item Text:" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const text = block.data.text || "List item";
            const className = block.data.class || "";
            
            let attributes = "";
            if (className) attributes += ` class="${className}"`;
            
            return `<li${attributes}>${text}</li>\n`;
        }
    },

    "html_form": {
        type: "html_form",
        label: "Form",
        color: "#b45309", // Orange-brown
        category: "HTML Forms",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        hasBranchFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "action", type: "string", label: "Action URL:" },
            { name: "method", type: "select", label: "Method:", 
             options: [
                { value: "get", label: "GET" },
                { value: "post", label: "POST" }
             ]},
            { name: "id", type: "string", label: "ID (optional):" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const action = block.data.action || "";
            const method = block.data.method || "get";
            const id = block.data.id || "";
            const className = block.data.class || "";
            
            let attributes = ` action="${action}" method="${method}"`;
            if (id) attributes += ` id="${id}"`;
            if (className) attributes += ` class="${className}"`;
            
            let code = `<form${attributes}>\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
            }
            code += `</form>`;
            return code;
        }
    },

    "html_label": {
        type: "html_label",
        label: "Label",
        color: "#a16207", // Dark yellow
        category: "HTML Forms",
        hasFlowIn: true,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "for", type: "string", label: "For (input ID):" },
            { name: "text", type: "string", label: "Label Text:" },
            { name: "class", type: "string", label: "CSS Class (optional):" }
        ],
        toCode: function(block) {
            const forId = block.data.for || "";
            const text = block.data.text || "Label";
            const className = block.data.class || "";
            
            let attributes = "";
            if (forId) attributes += ` for="${forId}"`;
            if (className) attributes += ` class="${className}"`;
            
            return `<label${attributes}>${text}</label>\n`;
        }
    },

    "html_meta": {
        type: "html_meta",
        label: "Meta Tag",
        color: "#1f2937", // Dark gray
        category: "HTML Head",
        hasFlowIn: false,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "name", type: "string", label: "Name:" },
            { name: "content", type: "string", label: "Content:" },
            { name: "property", type: "string", label: "Property (optional):" },
            { name: "httpEquiv", type: "string", label: "HTTP-Equiv (optional):" }
        ],
        dataOutputs: [
            { name: "html_output", type: "html", label: "HTML" }
        ],
        toCode: function(block) {
            // This is for when the block is used in flow context
            const name = block.data.name || "";
            const content = block.data.content || "";
            const property = block.data.property || "";
            const httpEquiv = block.data.httpEquiv || "";
            
            let attributes = "";
            if (name) attributes += ` name="${name}"`;
            if (property) attributes += ` property="${property}"`;
            if (httpEquiv) attributes += ` http-equiv="${httpEquiv}"`;
            if (content) attributes += ` content="${content}"`;
            
            return `<meta${attributes}>\n`;
        },
        getValue: function(block) {
            // This is for when the block is used as a data output
            const name = block.data.name || "";
            const content = block.data.content || "";
            const property = block.data.property || "";
            const httpEquiv = block.data.httpEquiv || "";
            
            let attributes = "";
            if (name) attributes += ` name="${name}"`;
            if (property) attributes += ` property="${property}"`;
            if (httpEquiv) attributes += ` http-equiv="${httpEquiv}"`;
            if (content) attributes += ` content="${content}"`;
            
            return `<meta${attributes}>`;
        }
    },

    "html_link_tag": {
        type: "html_link_tag",
        label: "Link Tag (CSS/Favicon)",
        color: "#374151", // Gray
        category: "HTML Head",
        hasFlowIn: false,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "rel", type: "select", label: "Relationship:", 
            options: [
                { value: "stylesheet", label: "Stylesheet" },
                { value: "icon", label: "Icon/Favicon" },
                { value: "shortcut icon", label: "Shortcut Icon" },
                { value: "apple-touch-icon", label: "Apple Touch Icon" },
                { value: "canonical", label: "Canonical" },
                { value: "preload", label: "Preload" },
                { value: "prefetch", label: "Prefetch" }
            ]},
            { name: "href", type: "string", label: "URL/Path:" },
            { name: "type", type: "string", label: "Type (optional):" },
            { name: "sizes", type: "string", label: "Sizes (optional):" }
        ],
        dataOutputs: [
            { name: "html_output", type: "html", label: "HTML" }
        ],
        toCode: function(block) {
            const rel = block.data.rel || "stylesheet";
            const href = block.data.href || "";
            const type = block.data.type || "";
            const sizes = block.data.sizes || "";
            
            let attributes = ` rel="${rel}" href="${href}"`;
            if (type) attributes += ` type="${type}"`;
            if (sizes) attributes += ` sizes="${sizes}"`;
            
            return `<link${attributes}>\n`;
        },
        getValue: function(block) {
            const rel = block.data.rel || "stylesheet";
            const href = block.data.href || "";
            const type = block.data.type || "";
            const sizes = block.data.sizes || "";
            
            let attributes = ` rel="${rel}" href="${href}"`;
            if (type) attributes += ` type="${type}"`;
            if (sizes) attributes += ` sizes="${sizes}"`;
            
            return `<link${attributes}>`;
        }
    },

    "html_script_tag": {
        type: "html_script_tag",
        label: "Script Tag",
        color: "#4b5563", // Dark gray
        category: "HTML Head",
        hasFlowIn: false,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "src", type: "string", label: "Source URL (optional):" },
            { name: "type", type: "select", label: "Type:", 
            options: [
                { value: "text/javascript", label: "JavaScript" },
                { value: "module", label: "ES6 Module" },
                { value: "text/json", label: "JSON" }
            ]},
            { name: "async", type: "boolean", label: "Async:" },
            { name: "defer", type: "boolean", label: "Defer:" },
            { name: "content", type: "multiline", label: "Inline Script Content:", rows: 5 }
        ],
        dataInputs: [
            { name: "javascript_code", type: "javascript", label: "JavaScript Code" }
        ],
        dataOutputs: [
            { name: "html_output", type: "html", label: "HTML" }
        ],
        toCode: function(block) {
            const src = block.data.src || "";
            const type = block.data.type || "text/javascript";
            const async = block.data.async === true;
            const defer = block.data.defer === true;
            let content = block.data.content || "";
            
            // Check for connected JavaScript code
            if (typeof getConnectedValue === 'function') {
                const connectedCode = getConnectedValue(block, "javascript_code");
                if (connectedCode) {
                    content = connectedCode;
                }
            }
            
            let attributes = ` type="${type}"`;
            if (src) attributes += ` src="${src}"`;
            if (async) attributes += ` async`;
            if (defer) attributes += ` defer`;
            
            if (content && !src) {
                return `<script${attributes}>\n${content}\n</script>\n`;
            } else {
                return `<script${attributes}></script>\n`;
            }
        },
        getValue: function(block) {
            const src = block.data.src || "";
            const type = block.data.type || "text/javascript";
            const async = block.data.async === true;
            const defer = block.data.defer === true;
            let content = block.data.content || "";
            
            // Check for connected JavaScript code
            if (typeof getConnectedValue === 'function') {
                const connectedCode = getConnectedValue(block, "javascript_code");
                if (connectedCode) {
                    content = connectedCode;
                }
            }
            
            let attributes = ` type="${type}"`;
            if (src) attributes += ` src="${src}"`;
            if (async) attributes += ` async`;
            if (defer) attributes += ` defer`;
            
            if (content && !src) {
                return `<script${attributes}>\n${content}\n</script>`;
            } else {
                return `<script${attributes}></script>`;
            }
        }
    },

    "html_style_tag": {
        type: "html_style_tag",
        label: "Style Tag",
        color: "#6b7280", // Gray
        category: "HTML Head",
        hasFlowIn: false,
        hasFlowOut: false,
        hasNextFlowOut: true,
        inputs: [
            { name: "css", type: "multiline", label: "CSS Content:", rows: 8 }
        ],
        dataOutputs: [
            { name: "html_output", type: "html", label: "HTML" }
        ],
        toCode: function(block) {
            const css = block.data.css || "";
            return `<style>\n${css}\n</style>\n`;
        },
        getValue: function(block) {
            const css = block.data.css || "";
            return `<style>\n${css}\n</style>`;
        }
    }
};

// Function to load HTML blocks
window.loadHTMLBlocks = function() {
    window.BLOCK_DEFINITIONS = { ...window.HTML_BLOCK_DEFINITIONS };
    
    // Trigger a refresh of the block palette if the function exists
    if (typeof window.refreshBlockPalette === 'function') {
        window.refreshBlockPalette();
    }
};