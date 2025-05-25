// Only define BLOCK_DEFINITIONS if it doesn't already exist
if (typeof BLOCK_DEFINITIONS === 'undefined') {
    const BLOCK_DEFINITIONS = {
        "start": {
            type: "start",
            label: "Start",
            color: "#22c55e", // Green
            category: "Flow Control",
            hasFlowIn: false,
            hasFlowOut: true,
            inputs: [
                { name: "comment", type: "multiline", label: "Script start comments:", rows: 3 }
            ],
            outputs: [],
            toCode: function(block) {
                const comment = block.data.comment || "";
                return `/*\nScript Start${comment ? ": \n"  + comment : ""}\n*/\n`;
            }
        },
        "comment": {
            type: "comment",
            label: "Comment",
            color: "#22c55e", // Green
            category: "Misc",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "comment", type: "multiline", label: "Script start comments:", rows: 3 }
            ],
            outputs: [],
            toCode: function(block) {
                const comment = block.data.comment || "";
                return `/*\n${comment ? ": " + comment : ""}\n*/\n`;
            }
        },
        "console": {
            type: "console",
            label: "Log Console Message",
            color: "#3b82f6", // Blue
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "message", type: "multiline", label: "Message:", rows: 2 },
                // Add dropdown for log level if needed
                { name: "logLevel", type: "select", label: "Log Level:",
                options: [
                    { value: "info", label: "Info" },
                    { value: "warn", label: "Warning" },
                    { value: "error", label: "Error" },
                    { value: "debug", label: "Debug" }
                ]}
            ],
            outputs: [],
            toCode: function(block) {
                const message = block.data.message || "";
                const logLevel = block.data.logLevel || "info";
                // Format message based on log level
                if (logLevel === "warn") {
                    return `console.warn("${message.replace(/"/g, '\\"')}");\n`;
                } else if (logLevel === "error") {
                    return `console.error("${message.replace(/"/g, '\\"')}");\n`;
                } else if (logLevel === "debug") {
                    return `console.debug("${message.replace(/"/g, '\\"')}");\n`;
                } else {
                    return `console.log("${message.replace(/"/g, '\\"')}");\n`;
                }
            }
        },
        "variable_declare": {
            type: "variable_declare",
            label: "Declare Variable",
            color: "#a855f7", // Purple
            category: "Variables",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "varName", type: "string", label: "Name:" },
                { name: "value", type: "string", label: "Value:" },
                { name: "varType", type: "select", label: "Type:", 
                options: [
                    { value: "auto", label: "Auto" },
                    { value: "string", label: "String" },
                    { value: "number", label: "Number" },
                    { value: "boolean", label: "Boolean" },
                    { value: "object", label: "Object" },
                    { value: "array", label: "Array" }
                ]}
            ],
            outputs: [],
            toCode: function(block) {
                const varName = block.data.varName || "myVar";
                const value = block.data.value || "null";
                const varType = block.data.varType || "auto";
                
                // Format value based on type
                let formattedValue = value;
                if (varType === "string") {
                    formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                } else if (varType === "array") {
                    formattedValue = value.startsWith('[') ? value : `[${value}]`;
                } else if (varType === "object") {
                    formattedValue = value.startsWith('{') ? value : `{${value}}`;
                } else if (varType === "number") {
                    formattedValue = isNaN(parseFloat(value)) ? 0 : value;
                } else if (varType === "boolean") {
                    formattedValue = ["true", "yes", "1"].includes(value.toLowerCase()) ? "true" : "false";
                } else if (varType === "auto") {
                    // Basic type detection for strings
                    if (typeof value === 'string' && !value.match(/^(\d+(\.\d+)?|true|false|null|undefined)$/)) {
                        formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                    }
                }
                
                return `let ${varName} = ${formattedValue};\n`;
            }
        },
        "log_message": {
            type: "log_message",
            label: "Log Message",
            color: "#3b82f6", // Blue
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "message", type: "string", label: "Message:" }
            ],
            dataInputs: [
                { name: "input_message", type: "any", label: "Message" }
            ],
            outputs: [],
            toCode: function(block) {
                // Check if there's a connected input value first
                let message;
                
                // Try to get connected value using the global getConnectedValue function
                if (typeof getConnectedValue === 'function') {
                    const connectedValue = getConnectedValue(block, "input_message");
                    message = connectedValue || block.data.message || "";
                } else {
                    message = block.data.message || "";
                }
                
                // If the message is already a quoted string or expression, use it directly
                if (typeof message === 'string' && (message.startsWith('"') || message.startsWith("'") || message.includes('('))) {
                    return `console.log(${message});\n`;
                } else {
                    // Otherwise, wrap it in quotes
                    return `console.log("${String(message).replace(/"/g, '\\"')}");\n`;
                }
            }
        },
        "variable_get": {
            type: "variable_get",
            label: "Get Variable",
            color: "#a855f7", // Purple
            category: "Variables",
            hasFlowIn: false, // Not part of the flow
            hasFlowOut: false, // Not part of the flow
            inputs: [
                { name: "varName", type: "string", label: "Variable Name:" }
            ],
            dataOutputs: [
                { name: "value", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                return "";
            },
            // Helper function to get the actual value for use in connections
            getValue: function(block) {
                return block.data.varName || "myVar";
            }
        },

        "if_condition": {
            type: "if_condition",
            label: "If Condition",
            color: "#dd6b20", // Darker Orange for dark theme
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true, // Main flow out (after if block)
            hasBranchFlowOut: true, // For the 'true' branch
            isContainer: true, // Mark as container to properly handle nesting
            // Define data inputs (connectors on the left)
            dataInputs: [
                { name: "condition", type: "boolean", label: "Condition" }
            ],
            // Keep text input for condition as a fallback
            inputs: [ 
                { name: "condition_text", type: "string", label: "Condition (text fallback):" }
            ],
            outputs: [
                // we need an else branch output to handle the 'else' case
                { name: "else_branch", type: "flow", label: "Else Branch" }
            ], // Data outputs if any
            toCode: function(block, nextBlockCode, branchBlockCode) {
                // FIXED: Get the connected value properly
                let condition = "true";
                
                // First try to get from connected data input
                if (typeof getConnectedValue === 'function') {
                    const connectedCondition = getConnectedValue(block, "condition");
                    if (connectedCondition !== null) {
                        condition = connectedCondition;
                    } else {
                        // Fall back to text input
                        condition = block.data.condition_text || "true";
                    }
                } else {
                    // Fall back to text input if getConnectedValue not available
                    condition = block.data.condition_text || "true";
                }
                
                let code = `if (${condition}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },

        "multi_condition": {
            type: "multi_condition",
            label: "Multi Condition",
            color: "#f59e0b",
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false, // No default flow out
            isContainer: true,
            
            // Multiple data inputs
            dataInputs: [
                { name: "condition1", type: "boolean", label: "Condition 1" },
                { name: "condition2", type: "boolean", label: "Condition 2" },
                { name: "value", type: "any", label: "Value", position: { top: "80px" } }
            ],
            
            // Multiple flow outputs
            flowOutputs: [
                { name: "case1", label: "Case 1" },
                { name: "case2", label: "Case 2" },
                { name: "default", label: "Default" }
            ],
            
            // Custom toCode that handles all the connectors
            toCode: function(block, nextBlockCode, branchBlockCode) {
                // Get connected values for each input
                const condition1 = getConnectedValue(block, "condition1") || "false";
                const condition2 = getConnectedValue(block, "condition2") || "false";
                const value = getConnectedValue(block, "value") || "null";
                
                // Generate code based on connected outputs
                let code = `// Multi-condition check with value: ${value}\n`;
                code += `if (${condition1}) {\n`;
                code += `  // Case 1 code would go here\n`;
                code += `} else if (${condition2}) {\n`;
                code += `  // Case 2 code would go here\n`;
                code += `} else {\n`;
                code += `  // Default case code would go here\n`;
                code += `}\n`;
                
                return code;
            }
        },
        
        // Add a new block for boolean value output
        "boolean_value": {
            type: "boolean_value",
            label: "Boolean Value",
            color: "#84cc16", // Lime (matching Input/Output category)
            category: "Input/Output", // Changed from "Logic" to match the new Value block
            hasFlowIn: false, // Not part of the flow
            hasFlowOut: false, // Not part of the flow
            inputs: [
                { name: "value", type: "boolean", label: "Value:" }
            ],
            // Data output connector on the right
            dataOutputs: [
                { name: "output", type: "boolean", label: "Output" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                return "";
            }
        },
        
        // Class definition block
        "class_definition": {
            type: "class_definition",
            label: "Class Definition",
            color: "#0e7490", // Teal
            category: "Objects", 
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true, // Indicate this is a container block
            inputs: [
                { name: "className", type: "string", label: "Class Name:" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const className = block.data.className || "MyClass";
                let code = `class ${className} {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += `}\n`;
                return code;
            }
        },
        
        // Constructor block - for use inside class blocks
        "constructor_definition": {
            type: "constructor_definition",
            label: "Constructor",
            color: "#0369a1", // Lighter blue
            category: "Objects", 
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const params = block.data.params || "";
                let code = `constructor(${params}) {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "}\n";
                return code;
            }
        },
        
        // Function definition block
        "function_definition": {
            type: "function_definition",
            label: "Function Definition",
            color: "#7e22ce", // Indigo
            category: "Functions", 
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "funcName", type: "string", label: "Function Name:" },
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const funcName = block.data.funcName || "myFunction";
                const params = block.data.params || "";
                let code = `function ${funcName}(${params}) {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "}\n";
                return code;
            }
        },
        
        // Method definition block - for use inside class blocks
        "method_definition": {
            type: "method_definition",
            label: "Method Definition",
            color: "#0891b2", // Cyan
            category: "Objects", 
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "methodName", type: "string", label: "Method Name:" },
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const methodName = block.data.methodName || "myMethod";
                const params = block.data.params || "";
                let code = `${methodName}(${params}) {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "}\n";
                return code;
            }
        },
        
        // ===== NEW BLOCKS =====
        
        // For Loop
        "for_loop": {
            type: "for_loop",
            label: "For Loop",
            color: "#e11d48", // Rose
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true,
            hasBranchFlowOut: true, // For the loop body
            isContainer: true, // Mark as container to properly handle loop body nesting
            inputs: [
                { name: "init", type: "string", label: "Initialization:" },
                { name: "condition", type: "string", label: "Condition:" },
                { name: "increment", type: "string", label: "Increment:" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                const init = block.data.init || "let i = 0";
                const condition = block.data.condition || "i < 10";
                const increment = block.data.increment || "i++";
                
                let code = `for (${init}; ${condition}; ${increment}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },
        
        // While Loop
        "while_loop": {
            type: "while_loop",
            label: "While Loop",
            color: "#dc2626", // Red
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true,
            hasBranchFlowOut: true, // For the loop body
            isContainer: true, // Mark as container to properly handle loop body nesting
            inputs: [
                { name: "condition", type: "string", label: "Condition:" }
            ],
            dataInputs: [
                { name: "condition", type: "boolean", label: "Condition" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                const condition = block.data.condition || "true";
                
                let code = `while (${condition}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },
        
        // If-Else Condition
        "if_else_condition": {
            type: "if_else_condition",
            label: "If-Else Condition",
            color: "#ea580c", // Orange
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true,
            hasBranchFlowOut: true, // For the 'true' branch 
            hasElseBranchFlowOut: true, // For the 'else' branch
            isContainer: true, // Mark as container to properly handle nesting
            dataInputs: [
                { name: "condition", type: "boolean", label: "Condition" }
            ],
            inputs: [
                { name: "condition_text", type: "string", label: "Condition (text):" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, ifBlockCode, elseBlockCode) {
                const condition = block.data.condition_text || "true";
                
                let code = `if (${condition}) {\n`;
                if (ifBlockCode) {
                    code += ifBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
                }
                code += `} else {\n`;
                if (elseBlockCode) {
                    code += elseBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },
        
        // Array Operations
        "array_operation": {
            type: "array_operation",
            label: "Array Operation",
            color: "#eab308", // Yellow
            category: "Arrays",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "arrayName", type: "string", label: "Array Name:" },
                { name: "operation", type: "select", label: "Operation:", 
                options: [
                    { value: "push", label: "Push" },
                    { value: "pop", label: "Pop" },
                    { value: "shift", label: "Shift" },
                    { value: "unshift", label: "Unshift" },
                    { value: "sort", label: "Sort" },
                    { value: "reverse", label: "Reverse" }
                ]},
                { name: "value", type: "string", label: "Value (for push/unshift):" }
            ],
            outputs: [],
            toCode: function(block) {
                const arrayName = block.data.arrayName || "myArray";
                const operation = block.data.operation || "push";
                const value = block.data.value || "";
                
                if (["push", "unshift"].includes(operation) && value) {
                    return `${arrayName}.${operation}(${value});\n`;
                } else {
                    return `${arrayName}.${operation}();\n`;
                }
            }
        },
        
        // Object Property Access
        "object_property": {
            type: "object_property",
            label: "Object Property",
            color: "#14b8a6", // Teal
            category: "Objects",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "objectName", type: "string", label: "Object Name:" },
                { name: "propertyName", type: "string", label: "Property Name:" }
            ],
            dataOutputs: [
                { name: "value", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                return "";
            }
        },

        // Value Definition Block
        "value_definition": {
            type: "value_definition",
            label: "Value",
            color: "#84cc16", // Lime (matching Input/Output category)
            category: "Input/Output",
            hasFlowIn: false, // Not part of the flow - just provides values
            hasFlowOut: false, // Not part of the flow
            inputs: [
                { name: "valueType", type: "select", label: "Value Type:", 
                options: [
                    { value: "string", label: "String" },
                    { value: "number", label: "Number" },
                    { value: "boolean", label: "Boolean" },
                    { value: "array", label: "Array" },
                    { value: "object", label: "Object" },
                    { value: "null", label: "Null" },
                    { value: "undefined", label: "Undefined" }
                ]},
                { name: "stringValue", type: "string", label: "String Value:" },
                { name: "numberValue", type: "number", label: "Number Value:" },
                { name: "booleanValue", type: "boolean", label: "Boolean Value:" },
                { name: "arrayValue", type: "multiline", label: "Array Value (JSON):", rows: 3 },
                { name: "objectValue", type: "multiline", label: "Object Value (JSON):", rows: 3 }
            ],
            // Data output connector on the right
            dataOutputs: [
                { name: "output", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                // The actual value will be used when connected to other blocks
                const valueType = block.data.valueType || "string";
                
                switch(valueType) {
                    case "string":
                        return `"${(block.data.stringValue || "").replace(/"/g, '\\"')}"`;
                    case "number":
                        return String(block.data.numberValue || 0);
                    case "boolean":
                        return String(block.data.booleanValue === true);
                    case "array":
                        try {
                            return block.data.arrayValue || "[]";
                        } catch (e) {
                            return "[]";
                        }
                    case "object":
                        try {
                            return block.data.objectValue || "{}";
                        } catch (e) {
                            return "{}";
                        }
                    case "null":
                        return "null";
                    case "undefined":
                        return "undefined";
                    default:
                        return '""';
                }
            },
            // Helper function to get the actual value for use in connections
            getValue: function(block) {
                const valueType = block.data.valueType || "string";
                
                switch(valueType) {
                    case "string":
                        return `"${(block.data.stringValue || "").replace(/"/g, '\\"')}"`;
                    case "number":
                        return String(block.data.numberValue || 0);
                    case "boolean":
                        return block.data.booleanValue === true ? "true" : "false";
                    case "array":
                        try {
                            return block.data.arrayValue || "[]";
                        } catch (e) {
                            return "[]";
                        }
                    case "object":
                        try {
                            return block.data.objectValue || "{}";
                        } catch (e) {
                            return "{}";
                        }
                    case "null":
                        return "null";
                    case "undefined":
                        return "undefined";
                    default:
                        return '""';
                }
            }
        },
        
        // Assignment
        "assignment": {
            type: "assignment",
            label: "Assignment",
            color: "#a855f7", // Purple
            category: "Variables",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "varName", type: "string", label: "Variable Name:" },
                { name: "value", type: "string", label: "Value:" }
            ],
            dataInputs: [
                { name: "input_value", type: "any", label: "Value" }
            ],
            outputs: [],
            toCode: function(block) {
                const varName = block.data.varName || "myVar";
                const value = block.data.value || "null";
                return `${varName} = ${value};\n`;
            }
        },
        
        // Math Operation
        "math_operation": {
            type: "math_operation",
            label: "Math Operation",
            color: "#8b5cf6", // Violet
            category: "Math",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "left", type: "string", label: "Left Operand:" },
                { name: "operation", type: "select", label: "Operation:", 
                options: [
                    { value: "+", label: "Add (+)" },
                    { value: "-", label: "Subtract (-)" },
                    { value: "*", label: "Multiply (*)" },
                    { value: "/", label: "Divide (/)" },
                    { value: "%", label: "Modulo (%)" },
                    { value: "**", label: "Power (**)" }
                ]},
                { name: "right", type: "string", label: "Right Operand:" }
            ],
            dataInputs: [
                { name: "left_value", type: "number", label: "Left" },
                { name: "right_value", type: "number", label: "Right" }
            ],
            dataOutputs: [
                { name: "result", type: "number", label: "Result" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                return "";
            }
        },
        
        // String Operation
        "string_operation": {
            type: "string_operation",
            label: "String Operation",
            color: "#10b981", // Emerald
            category: "Strings",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "string", type: "string", label: "String:" },
                { name: "operation", type: "select", label: "Operation:", 
                options: [
                    { value: "toUpperCase", label: "To Upper Case" },
                    { value: "toLowerCase", label: "To Lower Case" },
                    { value: "trim", label: "Trim" },
                    { value: "substring", label: "Substring" }
                ]},
                { name: "param1", type: "string", label: "Parameter 1 (optional):" },
                { name: "param2", type: "string", label: "Parameter 2 (optional):" }
            ],
            dataOutputs: [
                { name: "result", type: "string", label: "Result" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                return "";
            }
        },
        
        // Function Call
        "function_call": {
            type: "function_call",
            label: "Function Call",
            color: "#6366f1", // Indigo
            category: "Functions",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "funcName", type: "string", label: "Function Name:" },
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            dataOutputs: [
                { name: "return_value", type: "any", label: "Return Value" }
            ],
            toCode: function(block) {
                const funcName = block.data.funcName || "myFunction";
                const params = block.data.params || "";
                return `${funcName}(${params});\n`;
            }
        },
        
        // Return Statement
        "return_statement": {
            type: "return_statement",
            label: "Return Statement",
            color: "#6366f1", // Indigo
            category: "Functions",
            hasFlowIn: true,
            hasFlowOut: false, // No flow out as this ends execution of the function
            inputs: [
                { name: "value", type: "string", label: "Return Value:" }
            ],
            dataInputs: [
                { name: "return_value", type: "any", label: "Value" }
            ],
            outputs: [],
            toCode: function(block) {
                const value = block.data.value || "";
                return `return ${value};\n`;
            }
        },
        
        // Comparison Operation
        "comparison": {
            type: "comparison",
            label: "Comparison",
            color: "#4c1d95", // Deep purple
            category: "Logic",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "left", type: "string", label: "Left Operand:" },
                { name: "operator", type: "select", label: "Operator:", 
                options: [
                    { value: "==", label: "Equal (==)" },
                    { value: "===", label: "Strictly Equal (===)" },
                    { value: "!=", label: "Not Equal (!=)" },
                    { value: "!==", label: "Strictly Not Equal (!==)" },
                    { value: ">", label: "Greater Than (>)" },
                    { value: ">=", label: "Greater Than or Equal (>=)" },
                    { value: "<", label: "Less Than (<)" },
                    { value: "<=", label: "Less Than or Equal (<=)" }
                ]},
                { name: "right", type: "string", label: "Right Operand:" }
            ],
            dataInputs: [
                { name: "left_value", type: "any", label: "Left" },
                { name: "right_value", type: "any", label: "Right" }
            ],
            dataOutputs: [
                { name: "result", type: "boolean", label: "Result" }
            ],
            toCode: function(block) {
                // This block provides a value, doesn't generate standalone code
                return "";
            }
        },
        
        // Try-Catch Block
        "try_catch": {
            type: "try_catch",
            label: "Try-Catch",
            color: "#b91c1c", // Dark red
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true,
            hasTryBranchFlowOut: true,    // For the try branch
            hasCatchBranchFlowOut: true,  // For the catch branch
            isContainer: true, // Mark as container to properly handle nesting
            inputs: [
                { name: "errorName", type: "string", label: "Error Variable Name:" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, tryBlockCode, catchBlockCode) {
                const errorName = block.data.errorName || "error";
                
                let code = "try {\n";
                if (tryBlockCode) {
                    code += tryBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
                }
                code += `} catch (${errorName}) {\n`;
                if (catchBlockCode) {
                    code += catchBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
                }
                code += "}\n";
                return code;
            }
        },
        
        // DOM Element Access
        "dom_element": {
            type: "dom_element",
            label: "DOM Element",
            color: "#84cc16", // Lime
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: true,
            inputs: [
                { name: "method", type: "select", label: "Selection Method:", 
                options: [
                    { value: "getElementById", label: "Get By ID" },
                    { value: "querySelector", label: "Query Selector" },
                    { value: "getElementsByClassName", label: "Get By Class Name" },
                    { value: "getElementsByTagName", label: "Get By Tag Name" }
                ]},
                { name: "selector", type: "string", label: "Selector:" },
                { name: "variable", type: "string", label: "Variable Name:" }
            ],
            outputs: [],
            toCode: function(block) {
                const method = block.data.method || "getElementById";
                const selector = block.data.selector || "";
                const variable = block.data.variable || "element";
                
                // Format selector based on method (add quotes for string methods)
                let formattedSelector = selector;
                if (method !== "getElementById" && method !== "getElementsByTagName") {
                    formattedSelector = `"${selector.replace(/"/g, '\\"')}"`;
                } else {
                    formattedSelector = `"${selector}"`;
                }
                
                return `const ${variable} = document.${method}(${formattedSelector});\n`;
            }
        },
        
        // Event Listener
        "event_listener": {
            type: "event_listener",
            label: "Event Listener",
            color: "#84cc16", // Lime
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true, // Mark as container for event handler content
            inputs: [
                { name: "element", type: "string", label: "Element Variable:" },
                { name: "event", type: "select", label: "Event Type:", 
                options: [
                    { value: "click", label: "Click" },
                    { value: "change", label: "Change" },
                    { value: "submit", label: "Submit" },
                    { value: "input", label: "Input" },
                    { value: "keydown", label: "Key Down" },
                    { value: "keyup", label: "Key Up" },
                    { value: "mouseover", label: "Mouse Over" },
                    { value: "mouseout", label: "Mouse Out" }
                ]}
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const element = block.data.element || "element";
                const event = block.data.event || "click";
                
                let code = `${element}.addEventListener("${event}", (event) => {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "});\n";
                return code;
            }
        },
        
        // Timer
        "timer": {
            type: "timer",
            label: "Timer",
            color: "#0369a1", // Blue
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true, // Mark as container for timer callback content
            inputs: [
                { name: "type", type: "select", label: "Timer Type:", 
                options: [
                    { value: "timeout", label: "Timeout (run once)" },
                    { value: "interval", label: "Interval (repeat)" }
                ]},
                { name: "delay", type: "number", label: "Delay (ms):" },
                { name: "variable", type: "string", label: "Timer Variable Name:" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const type = block.data.type || "timeout";
                const delay = block.data.delay || 1000;
                const variable = block.data.variable || "timer";
                
                let funcName = type === "timeout" ? "setTimeout" : "setInterval";
                
                let code = `const ${variable} = ${funcName}(() => {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += `}, ${delay});\n`;
                return code;
            }
        },
        
        // Switch Statement
        "switch_statement": {
            type: "switch_statement",
            label: "Switch Statement",
            color: "#f59e0b", // Amber
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true, // Mark as container for switch content
            inputs: [
                { name: "expression", type: "string", label: "Expression:" },
                { name: "cases", type: "multiline", label: "Cases (one per line):", rows: 5 },
                { name: "hasDefault", type: "boolean", label: "Include Default Case:" }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const expression = block.data.expression || "value";
                const cases = block.data.cases || "";
                const hasDefault = block.data.hasDefault === true;
                
                let code = `switch (${expression}) {\n`;
                
                // Process cases
                const caseLines = cases.split('\n').filter(line => line.trim() !== '');
                caseLines.forEach(caseLine => {
                    code += `  case ${caseLine}:\n`;
                    code += `    // Add code here\n`;
                    code += `    break;\n`;
                });
                
                // Add default case if needed
                if (hasDefault) {
                    code += `  default:\n`;
                    code += `    // Default case\n`;
                    code += `    break;\n`;
                }
                
                code += `}\n`;
                return code;
            }
        },
        
        // Fetch/API Request
        "fetch_request": {
            type: "fetch_request",
            label: "Fetch API Request",
            color: "#0284c7", // Sky blue
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: true,
            isContainer: true, // Mark as container for fetch callback content
            inputs: [
                { name: "url", type: "string", label: "URL:" },
                { name: "method", type: "select", label: "Method:", 
                options: [
                    { value: "GET", label: "GET" },
                    { value: "POST", label: "POST" },
                    { value: "PUT", label: "PUT" },
                    { value: "DELETE", label: "DELETE" }
                ]},
                { name: "headers", type: "multiline", label: "Headers (JSON):", rows: 3 },
                { name: "body", type: "multiline", label: "Body (JSON):", rows: 3 }
            ],
            outputs: [],
            toCode: function(block, nextBlockCode, childrenCode) {
                const url = block.data.url || "https://example.com/api";
                const method = block.data.method || "GET";
                const headers = block.data.headers || "{}";
                const body = block.data.body || "";
                
                let options = `{ method: "${method}", headers: ${headers}`;
                if (body && method !== "GET") {
                    options += `, body: JSON.stringify(${body})`;
                }
                options += " }";
                
                let code = `fetch("${url}", ${options})\n`;
                code += `  .then(response => response.json())\n`;
                code += `  .then(data => {\n`;
                
                // Add child content if any
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `    ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                } else {
                    code += "    console.log(data);\n";
                }
                
                code += `  })\n`;
                code += `  .catch(error => console.error("Error:", error));\n`;
                
                return code;
            }
        }
    };
    
    // Make it available globally
    window.BLOCK_DEFINITIONS = BLOCK_DEFINITIONS;
}
