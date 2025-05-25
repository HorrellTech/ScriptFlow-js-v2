// Only define BLOCK_DEFINITIONS if it doesn't already exist
/*
    * ScriptFlow Block Definitions

    * This file contains the definitions for all blocks used in ScriptFlow.js.
    * Each block has properties like type, label, color, category, inputs, and methods to generate code.
    * 
    * WHAT THE OPTIONS MEAN:
    * type: Unique identifier for the block type.
    * label: Display name for the block in the editor.
    * color: Color code for the block.
    * category: Category under which the block will be listed in the editor.
    * hasFlowIn: Indicates if the block can accept flow input.
    * hasFlowOut: Indicates if the block can output flow.
    * hasNextFlowOut: Indicates if the block can output to the next block in the flow, making the next block come after it.
    * hasBranchFlowOut: (body) Indicates if the block can output to a branch (like in if-else conditions), will 
         place the next blocks inside the current block body '{}'.
    * isContainer: Indicates if the block can contain other blocks (like loops or conditionals).
    * inputs: Array of input fields for the block, each with a name, type, and label.
    * dataInputs: Array of data inputs that can be connected to other blocks, each with a name, type, and label.
    * dataOutputs: Array of data outputs that can be connected to other blocks, each with a name, type, and label.
    * toCode: Function that generates the code for the block based on its data.
    * getValue: Function that retrieves the value from the block, used for data inputs/outputs.
    * 
    * Example:
    * {
    *   type: "example_block",
    *   label: "Example Block",
    *   color: "#ff0000",
    *   category: "Example Category",
    *   hasFlowIn: true,
    *   hasFlowOut: true,
    *   hasNextFlowOut: true,
    *   hasBranchFlowOut: false,
    *   isContainer: false,
    *   inputs: [
    *       { name: "exampleInput", type: "string", label: "Example Input:" }
    *   ],
    *   dataInputs: [
    *       { name: "exampleDataInput", type: "any", label: "Example Data Input" }
    *   ],
    *   dataOutputs: [
    *       { name: "exampleDataOutput", type: "any", label: "Example Data Output" }
    *   ],
    *   toCode: function(block) {
    *       return `console.log("${block.data.exampleInput}");\n`;
    *   }
    * }
*/
if (typeof BLOCK_DEFINITIONS === 'undefined') {
    const BLOCK_DEFINITIONS = {
        "start": {
            type: "start",
            label: "Start",
            color: "#22c55e", // Green
            category: "Flow Control",
            hasFlowIn: false,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "comment", type: "multiline", label: "Script start comments:", rows: 3 }
            ],
            toCode: function(block) {
                const comment = block.data.comment || "";
                return `/*\nScript Start${comment ? ": \n" + comment : ""}\n*/\n`;
            }
        },

        "comment": {
            type: "comment",
            label: "Comment",
            color: "#6b7280", // Gray
            category: "Misc",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "comment", type: "multiline", label: "Comment:", rows: 3 }
            ],
            toCode: function(block) {
                const comment = block.data.comment || "";
                return `/*\n${comment}\n*/\n`;
            }
        },

        "log_message": {
            type: "log_message",
            label: "Log Message",
            color: "#3b82f6", // Blue
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "message", type: "string", label: "Message:" }
            ],
            dataInputs: [
                { name: "input_message", type: "any", label: "Message" }
            ],
            toCode: function(block, context) {
                // Check if there's a connected input value first
                let message = null;
                
                // Try to get connected value using the global getConnectedValue function
                if (typeof getConnectedValue === 'function') {
                    message = getConnectedValue(block, "input_message", context);
                }
                
                // If no connected value, fall back to the text input field
                if (message === null || message === undefined) {
                    message = block.data.message || "";
                    
                    // Auto-add this. to variable references in the message if needed
                    if (typeof addThisIfNeeded === 'function' && message && !message.startsWith('"') && !message.startsWith("'")) {
                        message = addThisIfNeeded(message, context);
                    }
                }
                
                // Handle empty message
                if (!message || message === "") {
                    message = ""; // Empty string for empty messages
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

        "console": {
            type: "console",
            label: "Log Console Message",
            color: "#3b82f6", // Blue
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "message", type: "multiline", label: "Message:", rows: 2 },
                { name: "logLevel", type: "select", label: "Log Level:",
                options: [
                    { value: "info", label: "Info" },
                    { value: "warn", label: "Warning" },
                    { value: "error", label: "Error" },
                    { value: "debug", label: "Debug" }
                ]}
            ],
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
            hasFlowOut: false,
            hasNextFlowOut: true,
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
            dataInputs: [
                { name: "input_value", type: "any", label: "Value" }
            ],
            toCode: function(block, context) {
                const varName = block.data.varName || "myVar";
                const varType = block.data.varType || "auto";
                
                // Try to get connected value first
                let value = null;
                if (typeof getConnectedValue === 'function') {
                    value = getConnectedValue(block, "input_value");
                }
                
                // Fall back to text input field
                if (value === null || value === undefined) {
                    value = block.data.value || "null";
                }
                
                // Format value based on type
                let formattedValue = value;
                if (varType === "string" && !String(value).startsWith('"')) {
                    formattedValue = `"${String(value).replace(/"/g, '\\"')}"`;
                } else if (varType === "array" && !String(value).startsWith('[')) {
                    formattedValue = `[${value}]`;
                } else if (varType === "object" && !String(value).startsWith('{')) {
                    formattedValue = `{${value}}`;
                } else if (varType === "number") {
                    formattedValue = isNaN(parseFloat(value)) ? 0 : value;
                } else if (varType === "boolean") {
                    formattedValue = ["true", "yes", "1"].includes(String(value).toLowerCase()) ? "true" : "false";
                }
                
                // In class methods, use this.varName instead of let varName
                if (context && context.inClass && context.inMethod) {
                    return `this.${varName} = ${formattedValue};\n`;
                } else {
                    return `let ${varName} = ${formattedValue};\n`;
                }
            }
        },

        "variable_get": {
            type: "variable_get",
            label: "Get Variable",
            color: "#a855f7", // Purple
            category: "Variables",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "varName", type: "string", label: "Variable Name:" }
            ],
            dataOutputs: [
                { name: "value", type: "any", label: "Value" }
            ],
            toCode: function(block, context) {
                return "";
            },
            getValue: function(block, context) {
                let varName = block.data.varName || "myVar";
                
                // Auto-add this. if needed
                if (typeof addThisIfNeeded === 'function') {
                    varName = addThisIfNeeded(varName, context);
                }
                
                return varName;
            }
        },

        "assignment": {
            type: "assignment",
            label: "Assignment",
            color: "#a855f7", // Purple
            category: "Variables",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "varName", type: "string", label: "Variable Name:" },
                { name: "value", type: "string", label: "Value:" }
            ],
            dataInputs: [
                { name: "input_value", type: "any", label: "Value" }
            ],
            toCode: function(block, context) {
                let varName = block.data.varName || "myVar";
                
                // Auto-add this. if needed
                if (typeof addThisIfNeeded === 'function') {
                    varName = addThisIfNeeded(varName, context);
                }
                
                // Try to get connected value first
                let value = null;
                if (typeof getConnectedValue === 'function') {
                    value = getConnectedValue(block, "input_value");
                }
                
                // Fall back to text input field
                if (value === null || value === undefined) {
                    value = block.data.value || "null";
                }
                
                return `${varName} = ${value};\n`;
            }
        },

        "if_condition": {
            type: "if_condition",
            label: "If Condition",
            color: "#dd6b20", // Orange
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            inputs: [ 
                { name: "condition_text", type: "string", label: "Condition:" }
            ],
            dataInputs: [
                { name: "condition", type: "boolean", label: "Condition" }
            ],
            toCode: function(block, nextBlockCode, branchBlockCode) {
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
                    condition = block.data.condition_text || "true";
                }
                
                let code = `if (${condition}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}`;
                return code;
            }
        },

        "else_if_condition": {
            type: "else_if_condition",
            label: "Else If Condition",
            color: "#f97316", // Orange
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            inputs: [
                { name: "condition_text", type: "string", label: "Condition:" }
            ],
            dataInputs: [
                { name: "condition", type: "boolean", label: "Condition" }
            ],
            toCode: function(block, nextBlockCode, branchBlockCode) {
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
                    condition = block.data.condition_text || "true";
                }
                
                let code = ` else if (${condition}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}`;
                return code;
            }
        },

        "else": {
            type: "else",
            label: "Else",
            color: "#ea580c", // Orange
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                let code = ` else {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}`;
                return code;
            }
        },

        "for_loop": {
            type: "for_loop",
            label: "For Loop",
            color: "#e11d48", // Rose
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "init", type: "string", label: "Initialization:" },
                { name: "condition", type: "string", label: "Condition:" },
                { name: "increment", type: "string", label: "Increment:" }
            ],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                const init = block.data.init || "let i = 0";
                const condition = block.data.condition || "i < 10";
                const increment = block.data.increment || "i++";
                
                let code = `for (let ${init} = 0; ${condition}; ${increment}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },

        "while_loop": {
            type: "while_loop",
            label: "While Loop",
            color: "#dc2626", // Red
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "condition", type: "string", label: "Condition:" }
            ],
            dataInputs: [
                { name: "condition_input", type: "boolean", label: "Condition" }
            ],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                let condition = "true";
                
                // Try to get connected condition first
                if (typeof getConnectedValue === 'function') {
                    const connectedCondition = getConnectedValue(block, "condition_input");
                    if (connectedCondition !== null) {
                        condition = connectedCondition;
                    } else {
                        condition = block.data.condition || "true";
                    }
                } else {
                    condition = block.data.condition || "true";
                }
                
                let code = `while (${condition}) {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },

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
                return "";
            },
            getValue: function(block) {
                // Try to get connected values first
                let leftValue = null;
                let rightValue = null;
                
                if (typeof getConnectedValue === 'function') {
                    leftValue = getConnectedValue(block, "left_value");
                    rightValue = getConnectedValue(block, "right_value");
                }
                
                // Fall back to text input fields if no connected values
                if (leftValue === null || leftValue === undefined) {
                    leftValue = block.data.left || "0";
                }
                if (rightValue === null || rightValue === undefined) {
                    rightValue = block.data.right || "0";
                }
                
                const operator = block.data.operator || "==";
                return `(${leftValue} ${operator} ${rightValue})`;
            }
        },

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
                return "";
            },
            getValue: function(block) {
                // Try to get connected values first
                let leftValue = null;
                let rightValue = null;
                
                if (typeof getConnectedValue === 'function') {
                    leftValue = getConnectedValue(block, "left_value");
                    rightValue = getConnectedValue(block, "right_value");
                }
                
                // Fall back to text input fields if no connected values
                if (leftValue === null || leftValue === undefined) {
                    leftValue = block.data.left || "0";
                }
                if (rightValue === null || rightValue === undefined) {
                    rightValue = block.data.right || "0";
                }
                
                const operation = block.data.operation || "+";
                return `(${leftValue} ${operation} ${rightValue})`;
            }
        },

        "value_definition": {
            type: "value_definition",
            label: "Value",
            color: "#84cc16", // Lime
            category: "Input/Output",
            hasFlowIn: false,
            hasFlowOut: false,
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
            dataOutputs: [
                { name: "output", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                return "";
            },
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
                        return block.data.arrayValue || "[]";
                    case "object":
                        return block.data.objectValue || "{}";
                    case "null":
                        return "null";
                    case "undefined":
                        return "undefined";
                    default:
                        return '""';
                }
            }
        },

        "boolean_value": {
            type: "boolean_value",
            label: "Boolean Value",
            color: "#84cc16", // Lime
            category: "Input/Output",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "value", type: "boolean", label: "Value:" }
            ],
            dataOutputs: [
                { name: "output", type: "boolean", label: "Output" }
            ],
            toCode: function(block) {
                return "";
            },
            getValue: function(block) {
                return block.data.value === true ? "true" : "false";
            }
        },

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
            dataInputs: [
                { name: "input_string", type: "string", label: "String" }
            ],
            dataOutputs: [
                { name: "result", type: "string", label: "Result" }
            ],
            toCode: function(block) {
                return "";
            },
            getValue: function(block) {
                let string = null;
                
                if (typeof getConnectedValue === 'function') {
                    string = getConnectedValue(block, "input_string");
                }
                
                if (string === null || string === undefined) {
                    string = block.data.string || '""';
                }
                
                const operation = block.data.operation || "toUpperCase";
                const param1 = block.data.param1 || "";
                const param2 = block.data.param2 || "";
                
                if (operation === "substring" && param1) {
                    return param2 ? `${string}.${operation}(${param1}, ${param2})` : `${string}.${operation}(${param1})`;
                } else {
                    return `${string}.${operation}()`;
                }
            }
        },

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
            dataInputs: [
                { name: "object_input", type: "object", label: "Object" }
            ],
            dataOutputs: [
                { name: "value", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                return "";
            },
            getValue: function(block) {
                let objectName = null;
                
                if (typeof getConnectedValue === 'function') {
                    objectName = getConnectedValue(block, "object_input");
                }
                
                if (objectName === null || objectName === undefined) {
                    objectName = block.data.objectName || "obj";
                }
                
                const propertyName = block.data.propertyName || "prop";
                return `${objectName}.${propertyName}`;
            }
        },

        "class_definition": {
            type: "class_definition",
            label: "Class Definition",
            color: "#0e7490", // Teal
            category: "Objects", 
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "className", type: "string", label: "Class Name:" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                const className = block.data.className || "MyClass";
                let code = `class ${className} {\n`;
                
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += `}\n`;
                return code;
            }
        },

        "constructor_definition": {
            type: "constructor_definition",
            label: "Constructor",
            color: "#0369a1", // Blue
            category: "Objects", 
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                const params = block.data.params || "";
                let code = `constructor(${params}) {\n`;
                
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "}\n";
                return code;
            }
        },

        "function_definition": {
            type: "function_definition",
            label: "Function Definition",
            color: "#7e22ce", // Indigo
            category: "Functions", 
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "funcName", type: "string", label: "Function Name:" },
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                const funcName = block.data.funcName || "myFunction";
                const params = block.data.params || "";
                let code = `function ${funcName}(${params}) {\n`;
                
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "}\n";
                return code;
            }
        },

        "method_definition": {
            type: "method_definition",
            label: "Method Definition",
            color: "#0891b2", // Cyan
            category: "Objects", 
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "methodName", type: "string", label: "Method Name:" },
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                const methodName = block.data.methodName || "myMethod";
                const params = block.data.params || "";
                let code = `${methodName}(${params}) {\n`;
                
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "}\n";
                return code;
            }
        },

        "function_call": {
            type: "function_call",
            label: "Function Call",
            color: "#6366f1", // Indigo
            category: "Functions",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            inputs: [
                { name: "funcName", type: "string", label: "Function Name:" },
                { name: "params", type: "string", label: "Parameters (comma-separated):" }
            ],
            dataInputs: [
                { name: "function_input", type: "function", label: "Function" },
                { name: "params_input", type: "any", label: "Parameters" }
            ],
            dataOutputs: [
                { name: "return_value", type: "any", label: "Return Value" }
            ],
            toCode: function(block) {
                let funcName = null;
                let params = null;
                
                if (typeof getConnectedValue === 'function') {
                    funcName = getConnectedValue(block, "function_input");
                    params = getConnectedValue(block, "params_input");
                }
                
                if (funcName === null || funcName === undefined) {
                    funcName = block.data.funcName || "myFunction";
                }
                if (params === null || params === undefined) {
                    params = block.data.params || "";
                }
                
                return `${funcName}(${params});\n`;
            }
        },

        "return_statement": {
            type: "return_statement",
            label: "Return Statement",
            color: "#6366f1", // Indigo
            category: "Functions",
            hasFlowIn: true,
            hasFlowOut: false,
            inputs: [
                { name: "value", type: "string", label: "Return Value:" }
            ],
            dataInputs: [
                { name: "return_value", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                // Try to get connected value first
                let value = null;
                if (typeof getConnectedValue === 'function') {
                    value = getConnectedValue(block, "return_value");
                }
                
                // Fall back to text input field
                if (value === null || value === undefined) {
                    value = block.data.value || "";
                }
                
                return `return ${value};\n`;
            }
        },

        "array_operation": {
            type: "array_operation",
            label: "Array Operation",
            color: "#eab308", // Yellow
            category: "Arrays",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
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
            dataInputs: [
                { name: "array_input", type: "array", label: "Array" },
                { name: "value_input", type: "any", label: "Value" }
            ],
            toCode: function(block) {
                let arrayName = null;
                let value = null;
                
                if (typeof getConnectedValue === 'function') {
                    arrayName = getConnectedValue(block, "array_input");
                    value = getConnectedValue(block, "value_input");
                }
                
                if (arrayName === null || arrayName === undefined) {
                    arrayName = block.data.arrayName || "myArray";
                }
                if (value === null || value === undefined) {
                    value = block.data.value || "";
                }
                
                const operation = block.data.operation || "push";
                
                if (["push", "unshift"].includes(operation) && value) {
                    return `${arrayName}.${operation}(${value});\n`;
                } else {
                    return `${arrayName}.${operation}();\n`;
                }
            }
        },

        "try_catch": {
            type: "try_catch",
            label: "Try-Catch",
            color: "#b91c1c", // Dark red
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasTryBranchFlowOut: true,
            hasCatchBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "errorName", type: "string", label: "Error Variable Name:" }
            ],
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

        "dom_element": {
            type: "dom_element",
            label: "DOM Element",
            color: "#84cc16", // Lime
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
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
            dataOutputs: [
                { name: "element", type: "element", label: "Element" }
            ],
            toCode: function(block) {
                const method = block.data.method || "getElementById";
                const selector = block.data.selector || "";
                const variable = block.data.variable || "element";
                
                const formattedSelector = `"${selector}"`;
                
                return `const ${variable} = document.${method}(${formattedSelector});\n`;
            }
        },

        "event_listener": {
            type: "event_listener",
            label: "Event Listener",
            color: "#84cc16", // Lime
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            isContainer: true,
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
            dataInputs: [
                { name: "element_input", type: "element", label: "Element" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                let element = null;
                
                if (typeof getConnectedValue === 'function') {
                    element = getConnectedValue(block, "element_input");
                }
                
                if (element === null || element === undefined) {
                    element = block.data.element || "element";
                }
                
                const event = block.data.event || "click";
                
                let code = `${element}.addEventListener("${event}", (event) => {\n`;
                
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += "});\n";
                return code;
            }
        },

        "timer": {
            type: "timer",
            label: "Timer",
            color: "#0369a1", // Blue
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "type", type: "select", label: "Timer Type:", 
                options: [
                    { value: "timeout", label: "Timeout (run once)" },
                    { value: "interval", label: "Interval (repeat)" }
                ]},
                { name: "delay", type: "number", label: "Delay (ms):" },
                { name: "variable", type: "string", label: "Timer Variable Name:" }
            ],
            dataInputs: [
                { name: "delay_input", type: "number", label: "Delay" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                const type = block.data.type || "timeout";
                const variable = block.data.variable || "timer";
                
                let delay = null;
                if (typeof getConnectedValue === 'function') {
                    delay = getConnectedValue(block, "delay_input");
                }
                
                if (delay === null || delay === undefined) {
                    delay = block.data.delay || 1000;
                }
                
                const funcName = type === "timeout" ? "setTimeout" : "setInterval";
                
                let code = `const ${variable} = ${funcName}(() => {\n`;
                
                if (childrenCode) {
                    code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                    if (!childrenCode.endsWith('\n')) code += '\n';
                }
                
                code += `}, ${delay});\n`;
                return code;
            }
        },

        "switch_statement": {
            type: "switch_statement",
            label: "Switch Statement",
            color: "#f59e0b", // Amber
            category: "Flow Control",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "expression", type: "string", label: "Expression:" },
                { name: "cases", type: "multiline", label: "Cases (one per line):", rows: 5 },
                { name: "hasDefault", type: "boolean", label: "Include Default Case:" }
            ],
            dataInputs: [
                { name: "expression_input", type: "any", label: "Expression" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                let expression = null;
                
                if (typeof getConnectedValue === 'function') {
                    expression = getConnectedValue(block, "expression_input");
                }
                
                if (expression === null || expression === undefined) {
                    expression = block.data.expression || "value";
                }
                
                const cases = block.data.cases || "";
                const hasDefault = block.data.hasDefault === true;
                
                let code = `switch (${expression}) {\n`;
                
                const caseLines = cases.split('\n').filter(line => line.trim() !== '');
                caseLines.forEach(caseLine => {
                    code += `  case ${caseLine}:\n`;
                    code += `    // Add code here\n`;
                    code += `    break;\n`;
                });
                
                if (hasDefault) {
                    code += `  default:\n`;
                    code += `    // Default case\n`;
                    code += `    break;\n`;
                }
                
                code += `}\n`;
                return code;
            }
        },

        "fetch_request": {
            type: "fetch_request",
            label: "Fetch API Request",
            color: "#0284c7", // Sky blue
            category: "Input/Output",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            isContainer: true,
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
            dataInputs: [
                { name: "url_input", type: "string", label: "URL" },
                { name: "body_input", type: "object", label: "Body" }
            ],
            toCode: function(block, nextBlockCode, childrenCode) {
                let url = null;
                let body = null;
                
                if (typeof getConnectedValue === 'function') {
                    url = getConnectedValue(block, "url_input");
                    body = getConnectedValue(block, "body_input");
                }
                
                if (url === null || url === undefined) {
                    url = block.data.url || "https://example.com/api";
                }
                if (body === null || body === undefined) {
                    body = block.data.body || "";
                }
                
                const method = block.data.method || "GET";
                const headers = block.data.headers || "{}";
                
                let options = `{ method: "${method}", headers: ${headers}`;
                if (body && method !== "GET") {
                    options += `, body: JSON.stringify(${body})`;
                }
                options += " }";
                
                let code = `fetch("${url}", ${options})\n`;
                code += `  .then(response => response.json())\n`;
                code += `  .then(data => {\n`;
                
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