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
    "log": {
        type: "log",
        label: "Log Message",
        color: "#3b82f6", // Blue
        category: "Input/Output",
        hasFlowIn: true,
        hasFlowOut: true,
        inputs: [
            { name: "message", type: "multiline", label: "Message:", rows: 2 }
        ],
        outputs: [],
        toCode: function(block) {
            const message = block.data.message || "";
            return `console.log("${message.replace(/"/g, '\\"')}");\n`;
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
    "if_condition": {
        type: "if_condition",
        label: "If Condition",
        color: "#dd6b20", // Darker Orange for dark theme
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true, // Main flow out (after if block)
        hasBranchFlowOut: true, // For the 'true' branch
        // Define data inputs (connectors on the left)
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        // Keep text input for condition as a fallback
        inputs: [ 
            { name: "condition_text", type: "string", label: "Condition (text fallback):" }
        ],
        outputs: [], // Data outputs if any
        toCode: function(block, nextBlockCode, branchBlockCode) {
            // Use the condition set by code generation function
            const condition = block.data.condition || block.data.condition_text || "true";
            
            let code = `if (${condition}) {\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    
    // Add a new block for boolean value output
    "boolean_value": {
        type: "boolean_value",
        label: "Boolean Value",
        color: "#4c1d95", // Deep purple
        category: "Logic", 
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
            // The value will be used by connected blocks like if_condition
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
        toCode: (block, constructorCode = "", methodsCode = "") => {
            const className = block.data.class_name || "MyClass";
            let code = `class ${className} {\n`;
            //code += `  constructor() {\n${constructorCode}  }\n\n`;
            
            // Add methods outside constructor
            code += methodsCode;
            
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
    }
    // Future blocks: loops, property definition, etc.
};
