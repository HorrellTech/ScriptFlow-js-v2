const BLOCK_DEFINITIONS = {
    // ============ FLOW CONTROL BLOCKS ============
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
    "if_condition": {
        type: "if_condition",
        label: "If Condition",
        color: "#dd6b20", // Darker Orange
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true, // Main flow out (after if block)
        hasBranchFlowOut: true, // For the 'true' branch
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [ 
            { name: "condition_text", type: "string", label: "Condition (text fallback):" }
        ],
        outputs: [],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            let code = `if (${condition}) {\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "if_else_condition": {
        type: "if_else_condition",
        label: "If-Else Condition",
        color: "#dd6b20", // Orange
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // True branch
        hasBranchAltFlowOut: true, // False branch
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [
            { name: "condition_text", type: "string", label: "Condition (text):" }
        ],
        toCode: function(block, nextBlockCode, trueBranchCode, falseBranchCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            let code = `if (${condition}) {\n`;
            if (trueBranchCode) {
                code += trueBranchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} else {\n`;
            if (falseBranchCode) {
                code += falseBranchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "for_loop": {
        type: "for_loop",
        label: "For Loop",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // Loop body
        inputs: [
            { name: "init", type: "string", label: "Initialization:" },
            { name: "condition", type: "string", label: "Condition:" },
            { name: "update", type: "string", label: "Update:" }
        ],
        toCode: function(block, nextBlockCode, loopBodyCode) {
            const init = block.data.init || "let i = 0";
            const condition = block.data.condition || "i < 10";
            const update = block.data.update || "i++";
            
            let code = `for (${init}; ${condition}; ${update}) {\n`;
            if (loopBodyCode) {
                code += loopBodyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "while_loop": {
        type: "while_loop",
        label: "While Loop",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true,
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [
            { name: "condition_text", type: "string", label: "Condition (text):" }
        ],
        toCode: function(block, nextBlockCode, loopBodyCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            
            let code = `while (${condition}) {\n`;
            if (loopBodyCode) {
                code += loopBodyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "do_while_loop": {
        type: "do_while_loop",
        label: "Do-While Loop",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true,
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [
            { name: "condition_text", type: "string", label: "Condition (text):" }
        ],
        toCode: function(block, nextBlockCode, loopBodyCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            
            let code = `do {\n`;
            if (loopBodyCode) {
                code += loopBodyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} while (${condition})`;
            return code + "\n";
        }
    },
    "switch_statement": {
        type: "switch_statement",
        label: "Switch Statement",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        dataInputs: [
            { name: "expression", type: "any", label: "Expression" }
        ],
        inputs: [
            { name: "expression_text", type: "string", label: "Expression (text):" },
            { name: "cases", type: "multiline", label: "Cases (value:code format):", rows: 5 }
        ],
        toCode: function(block, nextBlockCode, childrenCode) {
            const expression = block.data.expression || block.data.expression_text || "value";
            const cases = block.data.cases || "";
            
            let code = `switch (${expression}) {\n`;
            
            // Parse case statements
            if (cases) {
                const caseLines = cases.split('\n');
                for (const line of caseLines) {
                    if (line.includes(':')) {
                        const [value, codeFragment] = line.split(':', 2);
                        code += `  case ${value.trim()}:\n    ${codeFragment.trim()};\n    break;\n`;
                    }
                }
            }
            
            // Add default case
            code += `  default:\n    // Default case\n    break;\n`;
            code += `}`;
            return code + "\n";
        }
    },
    "try_catch": {
        type: "try_catch",
        label: "Try-Catch",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // Try branch
        hasBranchAltFlowOut: true, // Catch branch
        inputs: [
            { name: "error_var", type: "string", label: "Error variable name:" }
        ],
        toCode: function(block, nextBlockCode, tryCode, catchCode) {
            const errorVar = block.data.error_var || "error";
            
            let code = `try {\n`;
            if (tryCode) {
                code += tryCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} catch (${errorVar}) {\n`;
            if (catchCode) {
                code += catchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "try_catch_finally": {
        type: "try_catch_finally",
        label: "Try-Catch-Finally",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // Try branch
        hasBranchAltFlowOut: true, // Catch branch
        hasBranchFinallyFlowOut: true, // Finally branch
        inputs: [
            { name: "error_var", type: "string", label: "Error variable name:" }
        ],
        toCode: function(block, nextBlockCode, tryCode, catchCode, finallyCode) {
            const errorVar = block.data.error_var || "error";
            
            let code = `try {\n`;
            if (tryCode) {
                code += tryCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} catch (${errorVar}) {\n`;
            if (catchCode) {
                code += catchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} finally {\n`;
            if (finallyCode) {
                code += finallyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "return": {
        type: "return",
        label: "Return",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: false,
        dataInputs: [
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "value_text", type: "string", label: "Return value (text):" }
        ],
        toCode: function(block) {
            const value = block.data.value || block.data.value_text || "";
            return `return ${value};`;
        }
    },
    "break": {
        type: "break",
        label: "Break",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: false,
        toCode: function() {
            return "break;";
        }
    },
    "continue": {
        type: "continue",
        label: "Continue",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: false,
        toCode: function() {
            return "continue;";
        }
    },

    // ============ VARIABLES BLOCKS ============
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
    "const_declare": {
        type: "const_declare",
        label: "Declare Constant",
        color: "#a855f7", // Purple
        category: "Variables",
        hasFlowIn: true,
        hasFlowOut: true,
        inputs: [
            { name: "constName", type: "string", label: "Name:" },
            { name: "value", type: "string", label: "Value:" },
            { name: "constType", type: "select", label: "Type:", 
              options: [
                  { value: "auto", label: "Auto" },
                  { value: "string", label: "String" },
                  { value: "number", label: "Number" },
                  { value: "boolean", label: "Boolean" },
                  { value: "object", label: "Object" },
                  { value: "array", label: "Array" }
              ]}
        ],
        toCode: function(block) {
            const constName = block.data.constName || "MY_CONST";
            const value = block.data.value || "null";
            const constType = block.data.constType || "auto";
            
            // Format value based on type
            let formattedValue = value;
            if (constType === "string") {
                formattedValue = `"${value.replace(/"/g, '\\"')}"`;
            } else if (constType === "array") {
                formattedValue = value.startsWith('[') ? value : `[${value}]`;
            } else if (constType === "object") {
                formattedValue = value.startsWith('{') ? value : `{${value}}`;
            } else if (constType === "number") {
                formattedValue = isNaN(parseFloat(value)) ? 0 : value;
            } else if (constType === "boolean") {
                formattedValue = ["true", "yes", "1"].includes(value.toLowerCase()) ? "true" : "false";
            } else if (constType === "auto") {
                if (typeof value === 'string' && !value.match(/^(\d+(\.\d+)?|true|false|null|undefined)$/)) {
                    formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                }
            }
            
            return `const ${constName} = ${formattedValue};\n`;
        }
    },
    "variable_assign": {
        type: "variable_assign",
        label: "Assign Variable",
        color: "#a855f7", // Purple
        category: "Variables",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "varName", type: "string", label: "Variable name:" },
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        toCode: function(block) {
            const varName = block.data.varName || "myVar";
            const value = block.data.value || block.data.value_text || "null";
            return `${varName} = ${value};\n`;
        }
    },

    // ============ LOGIC BLOCKS ============
    "boolean_value": {
        type: "boolean_value",
        label: "Boolean Value",
        color: "#4c1d95", // Deep purple
        category: "Logic", 
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
        }
    },
    "compare": {
        type: "compare",
        label: "Compare",
        color: "#4c1d95",
        category: "Logic",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "valueA", type: "any", label: "Value A" },
            { name: "valueB", type: "any", label: "Value B" }
        ],
        inputs: [
            { name: "valueA_text", type: "string", label: "Value A (text):" },
            { name: "valueB_text", type: "string", label: "Value B (text):" },
            { name: "operator", type: "select", label: "Operator:", 
              options: [
                  { value: "==", label: "==" },
                  { value: "===", label: "===" },
                  { value: "!=", label: "!=" },
                  { value: "!==", label: "!==" },
                  { value: ">", label: ">" },
                  { value: ">=", label: ">=" },
                  { value: "<", label: "<" },
                  { value: "<=", label: "<=" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "boolean", label: "Result" }
        ],
        toCode: function(block) {
            const valueA = block.data.valueA || block.data.valueA_text || "a";
            const valueB = block.data.valueB || block.data.valueB_text || "b";
            const operator = block.data.operator || "===";
            return `(${valueA} ${operator} ${valueB})`;
        }
    },
    "logical_operation": {
        type: "logical_operation",
        label: "Logical Operation",
        color: "#4c1d95",
        category: "Logic",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "valueA", type: "boolean", label: "Value A" },
            { name: "valueB", type: "boolean", label: "Value B" }
        ],
        inputs: [
            { name: "valueA_text", type: "string", label: "Value A (text):" },
            { name: "valueB_text", type: "string", label: "Value B (text):" },
            { name: "operator", type: "select", label: "Operator:", 
              options: [
                  { value: "&&", label: "AND (&&)" },
                  { value: "||", label: "OR (||)" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "boolean", label: "Result" }
        ],
        toCode: function(block) {
            const valueA = block.data.valueA || block.data.valueA_text || "true";
            const valueB = block.data.valueB || block.data.valueB_text || "true";
            const operator = block.data.operator || "&&";
            return `(${valueA} ${operator} ${valueB})`;
        }
    },
    "not_operation": {
        type: "not_operation",
        label: "NOT Operation",
        color: "#4c1d95",
        category: "Logic",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "value", type: "boolean", label: "Value" }
        ],
        inputs: [
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "boolean", label: "Result" }
        ],
        toCode: function(block) {
            const value = block.data.value || block.data.value_text || "true";
            return `!(${value})`;
        }
    },

    // ============ MATH BLOCKS ============
    "math_operation": {
        type: "math_operation",
        label: "Math Operation",
        color: "#8b5cf6", // Purple
        category: "Math",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "valueA", type: "number", label: "Value A" },
            { name: "valueB", type: "number", label: "Value B" }
        ],
        inputs: [
            { name: "valueA_text", type: "string", label: "Value A (text):" },
            { name: "valueB_text", type: "string", label: "Value B (text):" },
            { name: "operator", type: "select", label: "Operator:", 
              options: [
                  { value: "+", label: "+" },
                  { value: "-", label: "-" },
                  { value: "*", label: "*" },
                  { value: "/", label: "/" },
                  { value: "%", label: "%" },
                  { value: "**", label: "**" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "number", label: "Result" }
        ],
        toCode: function(block) {
            const valueA = block.data.valueA || block.data.valueA_text || "0";
            const valueB = block.data.valueB || block.data.valueB_text || "0";
            const operator = block.data.operator || "+";
            return `(${valueA} ${operator} ${valueB})`;
        }
    },
    "math_function": {
        type: "math_function",
        label: "Math Function",
        color: "#8b5cf6",
        category: "Math",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "value", type: "number", label: "Value" }
        ],
        inputs: [
            { name: "value_text", type: "string", label: "Value (text):" },
            { name: "function", type: "select", label: "Function:", 
              options: [
                  { value: "abs", label: "Absolute (abs)" },
                  { value: "round", label: "Round" },
                  { value: "floor", label: "Floor" },
                  { value: "ceil", label: "Ceiling" },
                  { value: "sqrt", label: "Square Root" },
                  { value: "sin", label: "Sine" },
                  { value: "cos", label: "Cosine" },
                  { value: "tan", label: "Tangent" },
                  { value: "log", label: "Logarithm" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "number", label: "Result" }
        ],
        toCode: function(block) {
            const value = block.data.value || block.data.value_text || "0";
            const func = block.data.function || "abs";
            return `Math.${func}(${value})`;
        }
    },
    "random_number": {
        type: "random_number",
        label: "Random Number",
        color: "#8b5cf6",
        category: "Math",
        hasFlowIn: false,
        hasFlowOut: false,
        inputs: [
            { name: "min", type: "string", label: "Min:" },
            { name: "max", type: "string", label: "Max:" }
        ],
        dataOutputs: [
            { name: "result", type: "number", label: "Result" }
        ],
        toCode: function(block) {
            const min = block.data.min || "0";
            const max = block.data.max || "1";
            return `(Math.random() * (${max} - ${min}) + ${min})`;
        }
    },

    // ============ STRING BLOCKS ============
    "string_operation": {
        type: "string_operation",
        label: "String Operation",
        color: "#10b981", // Teal
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "operation", type: "select", label: "Operation:", 
              options: [
                  { value: "length", label: "Length" },
                  { value: "uppercase", label: "To Uppercase" },
                  { value: "lowercase", label: "To Lowercase" },
                  { value: "trim", label: "Trim" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const operation = block.data.operation || "length";
            
            switch(operation) {
                case "length": return `${string}.length`;
                case "uppercase": return `${string}.toUpperCase()`;
                case "lowercase": return `${string}.toLowerCase()`;
                case "trim": return `${string}.trim()`;
                default: return string;
            }
        }
    },
    "string_concat": {
        type: "string_concat",
        label: "String Concatenation",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "stringA", type: "string", label: "String A" },
            { name: "stringB", type: "string", label: "String B" }
        ],
        inputs: [
            { name: "stringA_text", type: "string", label: "String A (text):" },
            { name: "stringB_text", type: "string", label: "String B (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "string", label: "Result" }
        ],
        toCode: function(block) {
            const stringA = block.data.stringA || block.data.stringA_text || '""';
            const stringB = block.data.stringB || block.data.stringB_text || '""';
            return `(${stringA} + ${stringB})`;
        }
    },
    "string_substring": {
        type: "string_substring",
        label: "String Substring",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "start", type: "string", label: "Start index:" },
            { name: "end", type: "string", label: "End index (optional):" }
        ],
        dataOutputs: [
            { name: "result", type: "string", label: "Result" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const start = block.data.start || "0";
            const end = block.data.end || "";
            
            if (end) {
                return `${string}.substring(${start}, ${end})`;
            } else {
                return `${string}.substring(${start})`;
            }
        }
    },
    "string_split": {
        type: "string_split",
        label: "String Split",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "separator", type: "string", label: "Separator:" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Result Array" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const separator = block.data.separator || '","';
            return `${string}.split(${separator})`;
        }
    },
    "string_replace": {
        type: "string_replace",
        label: "String Replace",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "search", type: "string", label: "Search for:" },
            { name: "replace", type: "string", label: "Replace with:" },
            { name: "global", type: "boolean", label: "Global replace:" }
        ],
        dataOutputs: [
            { name: "result", type: "string", label: "Result" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const search = block.data.search || '""';
            const replace = block.data.replace || '""';
            const global = block.data.global === true;
            
            if (global) {
                return `${string}.replace(new RegExp(${search}, 'g'), ${replace})`;
            } else {
                return `${string}.replace(${search}, ${replace})`;
            }
        }
    },

    // ============ ARRAY BLOCKS ============
    "array_operation": {
        type: "array_operation",
        label: "Array Operation",
        color: "#f59e0b", // Amber
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "operation", type: "select", label: "Operation:", 
              options: [
                  { value: "length", label: "Length" },
                  { value: "join", label: "Join" },
                  { value: "reverse", label: "Reverse" },
                  { value: "sort", label: "Sort" }
              ]},
            { name: "separator", type: "string", label: "Separator (for join):" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const operation = block.data.operation || "length";
            const separator = block.data.separator || '","';
            
            switch(operation) {
                case "length": return `${array}.length`;
                case "join": return `${array}.join(${separator})`;
                case "reverse": return `[...${array}].reverse()`;
                case "sort": return `[...${array}].sort()`;
                default: return array;
            }
        }
    },
    "array_element": {
        type: "array_element",
        label: "Array Element",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "index", type: "string", label: "Index:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Element" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const index = block.data.index || "0";
            return `${array}[${index}]`;
        }
    },
    "array_push": {
        type: "array_push",
        label: "Array Push",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "array", type: "array", label: "Array" },
            { name: "item", type: "any", label: "Item" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "item_text", type: "string", label: "Item (text):" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "myArray";
            const item = block.data.item || block.data.item_text || "item";
            return `${array}.push(${item});\n`;
        }
    },
    "array_map": {
        type: "array_map",
        label: "Array Map",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "itemVar", type: "string", label: "Item variable name:" },
            { name: "expression", type: "string", label: "Transformation:" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Result Array" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const itemVar = block.data.itemVar || "item";
            const expression = block.data.expression || "item";
            return `${array}.map(${itemVar} => ${expression})`;
        }
    },
    "array_filter": {
        type: "array_filter",
        label: "Array Filter",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "itemVar", type: "string", label: "Item variable name:" },
            { name: "condition", type: "string", label: "Condition:" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Result Array" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const itemVar = block.data.itemVar || "item";
            const condition = block.data.condition || "true";
            return `${array}.filter(${itemVar} => ${condition})`;
        }
    },
    "array_reduce": {
        type: "array_reduce",
        label: "Array Reduce",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "accumVar", type: "string", label: "Accumulator variable:" },
            { name: "itemVar", type: "string", label: "Item variable:" },
            { name: "expression", type: "string", label: "Reduce expression:" },
            { name: "initial", type: "string", label: "Initial value:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const accumVar = block.data.accumVar || "acc";
            const itemVar = block.data.itemVar || "item";
            const expression = block.data.expression || "acc + item";
            const initial = block.data.initial || "0";
            return `${array}.reduce((${accumVar}, ${itemVar}) => ${expression}, ${initial})`;
        }
    },

    // ============ OBJECT BLOCKS ============
    "object_property": {
        type: "object_property",
        label: "Object Property",
        color: "#14b8a6", // Emerald
        category: "Objects",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "object", type: "object", label: "Object" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" },
            { name: "property", type: "string", label: "Property name:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Value" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "{}";
            const property = block.data.property || "property";
            
            // Check if the property needs bracket notation
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(property)) {
                return `${object}.${property}`;
            } else {
                return `${object}["${property}"]`;
            }
        }
    },
    "object_set_property": {
        type: "object_set_property",
        label: "Set Object Property",
        color: "#14b8a6",
        category: "Objects",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "object", type: "object", label: "Object" },
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" },
            { name: "property", type: "string", label: "Property name:" },
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "myObject";
            const property = block.data.property || "property";
            const value = block.data.value || block.data.value_text || "null";
            
            // Check if the property needs bracket notation
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(property)) {
                return `${object}.${property} = ${value};\n`;
            } else {
                return `${object}["${property}"] = ${value};\n`;
            }
        }
    },
    "object_keys": {
        type: "object_keys",
        label: "Object Keys",
        color: "#14b8a6",
        category: "Objects",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "object", type: "object", label: "Object" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Keys Array" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "{}";
            return `Object.keys(${object})`;
        }
    },
    "object_values": {
        type: "object_values",
        label: "Object Values",
        color: "#14b8a6",
        category: "Objects",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "object", type: "object", label: "Object" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Values Array" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "{}";
            return `Object.values(${object})`;
        }
    },

    // ============ FUNCTION BLOCKS ============
    "function_definition": {
        type: "function_definition",
        label: "Function Definition",
        color: "#6366f1", // Indigo
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
    "function_call": {
        type: "function_call",
        label: "Function Call",
        color: "#6366f1",
        category: "Functions",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [],
        inputs: [
            { name: "funcName", type: "string", label: "Function Name:" },
            { name: "args", type: "string", label: "Arguments (comma-separated):" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Return Value" }
        ],
        toCode: function(block) {
            const funcName = block.data.funcName || "myFunction";
            const args = block.data.args || "";
            return `${funcName}(${args});\n`;
        }
    },
    "arrow_function": {
        type: "arrow_function",
        label: "Arrow Function",
        color: "#6366f1",
        category: "Functions",
        hasFlowIn: false,
        hasFlowOut: false,
        inputs: [
            { name: "params", type: "string", label: "Parameters (comma-separated):" },
            { name: "body", type: "multiline", label: "Function Body:", rows: 3 },
            { name: "multiline", type: "boolean", label: "Multiline:" }
        ],
        dataOutputs: [
            { name: "result", type: "function", label: "Function" }
        ],
        toCode: function(block) {
            const params = block.data.params || "";
            const body = block.data.body || "return null;";
            const multiline = block.data.multiline === true;
            
            if (multiline) {
                return `(${params}) => {\n  ${body.replace(/\n/g, '\n  ')}\n}`;
            } else {
                return `(${params}) => ${body}`;
            }
        }
    },
    "callback_function": {
        type: "callback_function",
        label: "Callback Function",
        color: "#6366f1",
        category: "Functions",
        hasFlowIn: false,
        hasFlowOut: false,
        isContainer: true,
        inputs: [
            { name: "params", type: "string", label: "Parameters (comma-separated):" }
        ],
        dataOutputs: [
            { name: "callback", type: "function", label: "Callback" }
        ],
        toCode: function(block, nextBlockCode, childrenCode) {
            const params = block.data.params || "";
            let code = `function(${params}) {\n`;
            
            // Add child content if any
            if (childrenCode) {
                code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!childrenCode.endsWith('\n')) code += '\n';
            }
            
            code += "}";
            return code;
        }
    },

    // ============ DOM BLOCKS ============
    "get_element": {
        type: "get_element",
        label: "Get DOM Element",
        color: "#84cc16", // Lime
        category: "Input/Output",
        hasFlowIn: false,
        hasFlowOut: false,
        inputs: [
            { name: "selector", type: "string", label: "CSS Selector:" },
            { name: "method", type: "select", label: "Selection Method:", 
              options: [
                  { value: "querySelector", label: "querySelector (first match)" },
                  { value: "querySelectorAll", label: "querySelectorAll (all matches)" },
                  { value: "getElementById", label: "getElementById" }
              ]}
        ],
        dataOutputs: [
            { name: "element", type: "object", label: "Element(s)" }
        ],
        toCode: function(block) {
            const selector = block.data.selector || '""';
            const method = block.data.method || "querySelector";
            
            if (method === "getElementById") {
                // Remove any quotes for getElementById since we're wrapping it ourselves
                const id = selector.replace(/['"]/g, '');
                return `document.getElementById("${id}")`;
            } else {
                return `document.${method}(${selector})`;
            }
        }
    },
    "set_element_property": {
        type: "set_element_property",
        label: "Set Element Property",
        color: "#84cc16",
        category: "Input/Output",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "element", type: "object", label: "Element" },
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "element_text", type: "string", label: "Element (text):" },
            { name: "property", type: "string", label: "Property:" },
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        toCode: function(block) {
            const element = block.data.element || block.data.element_text || "element";
            const property = block.data.property || "textContent";
            const value = block.data.value || block.data.value_text || '""';
            
            return `${element}.${property} = ${value};\n`;
        }
    },
    "add_event_listener": {
        type: "add_event_listener",
        label: "Add Event Listener",
        color: "#84cc16",
        category: "Input/Output",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        dataInputs: [
            { name: "element", type: "object", label: "Element" }
        ],
        inputs: [
            { name: "element_text", type: "string", label: "Element (text):" },
            { name: "event", type: "string", label: "Event type:" }
        ],
        toCode: function(block, nextBlockCode, callbackCode) {
            const element = block.data.element || block.data.element_text || "element";
            const event = block.data.event || "click";
            
            let code = `${element}.addEventListener("${event}", function(event) {\n`;
            
            if (callbackCode) {
                code += callbackCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!callbackCode.endsWith('\n')) code += '\n';
            }
            
            code += "});\n";
            return code;
        }
    },
    "create_element": {
        type: "create_element",
        label: "Create Element",
        color: "#84cc16",
        category: "Input/Output",
        hasFlowIn: true,
        hasFlowOut: true,
        inputs: [
            { name: "tag", type: "string", label: "Tag name:" },
            { name: "varName", type: "string", label: "Variable name:" }
        ],
        dataOutputs: [
            { name: "element", type: "object", label: "Element" }
        ],
        toCode: function(block) {
            const tag = block.data.tag || "div";
            const varName = block.data.varName || "newElement";
            
            return `const ${varName} = document.createElement("${tag}");\n`;
        }
    },
    "append_element": {
        type: "append_element",
        label: "Append Element",
        color: "#84cc16",
        category: "Input/Output",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "parent", type: "object", label: "Parent" },
            { name: "child", type: "object", label: "Child" }
        ],
        inputs: [
            { name: "parent_text", type: "string", label: "Parent (text):" },
            { name: "child_text", type: "string", label: "Child (text):" }
        ],
        toCode: function(block) {
            const parent = block.data.parent || block.data.parent_text || "parentElement";
            const child = block.data.child || block.data.child_text || "childElement";
            
            return `${parent}.appendChild(${child});\n`;
        }
    },

    // ============ ASYNC BLOCKS ============
    "promise": {
        type: "promise",
        label: "Create Promise",
        color: "#6b7280", // Gray
        category: "Misc",
        hasFlowIn: false,
        hasFlowOut: false,
        isContainer: true,
        inputs: [
            { name: "varName", type: "string", label: "Variable name:" }
        ],
        dataOutputs: [
            { name: "promise", type: "object", label: "Promise" }
        ],
        toCode: function(block, nextBlockCode, childrenCode) {
            const varName = block.data.varName || "myPromise";
            
            let code = `const ${varName} = new Promise((resolve, reject) => {\n`;
            
            if (childrenCode) {
                code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!childrenCode.endsWith('\n')) code += '\n';
            }
            
            code += "});\n";
            return code;
        }
    },
    "promise_then": {
        type: "promise_then",
        label: "Promise.then()",
        color: "#6b7280",
        category: "Misc",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        dataInputs: [
            { name: "promise", type: "object", label: "Promise" }
        ],
        inputs: [
            { name: "promise_text", type: "string", label: "Promise (text):" },
            { name: "paramName", type: "string", label: "Parameter name:" }
        ],
        toCode: function(block, nextBlockCode, callbackCode) {
            const promise = block.data.promise || block.data.promise_text || "myPromise";
            const paramName = block.data.paramName || "result";
            
            let code = `${promise}.then(${paramName} => {\n`;
            
            if (callbackCode) {
                code += callbackCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!callbackCode.endsWith('\n')) code += '\n';
            }
            
            code += "})";
            
            // If there's no next block, add a semicolon and newline
            if (!nextBlockCode) {
                code += ";\n";
            } else {
                code += "\n";
            }
            
            return code;
        }
    },
    "promise_catch": {
        type: "promise_catch",
        label: "Promise.catch()",
        color: "#6b7280",
        category: "Misc",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        dataInputs: [
            { name: "promise", type: "object", label: "Promise" }
        ],
        inputs: [
            { name: "promise_text", type: "string", label: "Promise (text):" },
            { name: "errorName", type: "string", label: "Error parameter name:" }
        ],
        toCode: function(block, nextBlockCode, callbackCode) {
            const promise = block.data.promise || block.data.promise_text || "myPromise";
            const errorName = block.data.errorName || "error";
            
            let code = `${promise}.catch(${errorName} => {\n`;
            
            if (callbackCode) {
                code += callbackCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!callbackCode.endsWith('\n')) code += '\n';
            }
            
            code += "})";
            
            // If there's no next block, add a semicolon and newline
            if (!nextBlockCode) {
                code += ";\n";
            } else {
                code += "\n";
            }
            
            return code;
        }
    },
    "async_function": {
        type: "async_function",
        label: "Async Function",
        color: "#6b7280",
        category: "Misc",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "funcName", type: "string", label: "Function name:" },
            { name: "params", type: "string", label: "Parameters (comma-separated):" }
        ],
        toCode: function(block, nextBlockCode, childrenCode) {
            const funcName = block.data.funcName || "myAsyncFunction";
            const params = block.data.params || "";
            
            let code = `async function ${funcName}(${params}) {\n`;
            
            if (childrenCode) {
                code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!childrenCode.endsWith('\n')) code += '\n';
            }
            
            code += "}\n";
            return code;
        }
    },
    "await": {
        type: "await",
        label: "Await",
        color: "#6b7280",
        category: "Misc",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "promise", type: "object", label: "Promise" }
        ],
        inputs: [
            { name: "promise_text", type: "string", label: "Promise (text):" },
            { name: "varName", type: "string", label: "Result variable name:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const promise = block.data.promise || block.data.promise_text || "myPromise";
            const varName = block.data.varName || "result";
            
            return `const ${varName} = await ${promise};\n`;
        }
    },
    "set_timeout": {
        type: "set_timeout",
        label: "setTimeout",
        color: "#6b7280",
        category: "Misc",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        inputs: [
            { name: "delay", type: "string", label: "Delay (ms):" }
        ],
        toCode: function(block, nextBlockCode, callbackCode) {
            const delay = block.data.delay || "1000";
            
            let code = `setTimeout(() => {\n`;
            
            if (callbackCode) {
                code += callbackCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!callbackCode.endsWith('\n')) code += '\n';
            }
            
            code += `}, ${delay});\n`;
            return code;
        }
    },
    
    // ============ CLASS BLOCKS ============
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
        toCode: (block, nextBlockCode, methodsCode = "") => {
            const className = block.data.className || "MyClass";
            let code = `class ${className} {\n`;
            
            // Add methods
            if (methodsCode) {
                code += methodsCode;
            }
            
            code += `}\n`;
            return code;
        }
    },
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
    
    // ============ MISCELLANEOUS BLOCKS ============
    "comment": {
        type: "comment",
        label: "Comment",
        color: "#22c55e", // Green
        category: "Misc",
        hasFlowIn: true,
        hasFlowOut: true,
        inputs: [
            { name: "comment", type: "multiline", label: "Comments:", rows: 3 }
        ],
        outputs: [],
        toCode: function(block) {
            const comment = block.data.comment || "";
            return `/*\n${comment}\n*/\n`;
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
            // filepath: c:\Users\Flight\Desktop\ScriptFlow-js-v2\blocks.js
const BLOCK_DEFINITIONS = {
    // ============ FLOW CONTROL BLOCKS ============
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
    "if_condition": {
        type: "if_condition",
        label: "If Condition",
        color: "#dd6b20", // Darker Orange
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true, // Main flow out (after if block)
        hasBranchFlowOut: true, // For the 'true' branch
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [ 
            { name: "condition_text", type: "string", label: "Condition (text fallback):" }
        ],
        outputs: [],
        toCode: function(block, nextBlockCode, branchBlockCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            let code = `if (${condition}) {\n`;
            if (branchBlockCode) {
                code += branchBlockCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "if_else_condition": {
        type: "if_else_condition",
        label: "If-Else Condition",
        color: "#dd6b20", // Orange
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // True branch
        hasBranchAltFlowOut: true, // False branch
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [
            { name: "condition_text", type: "string", label: "Condition (text):" }
        ],
        toCode: function(block, nextBlockCode, trueBranchCode, falseBranchCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            let code = `if (${condition}) {\n`;
            if (trueBranchCode) {
                code += trueBranchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} else {\n`;
            if (falseBranchCode) {
                code += falseBranchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "for_loop": {
        type: "for_loop",
        label: "For Loop",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // Loop body
        inputs: [
            { name: "init", type: "string", label: "Initialization:" },
            { name: "condition", type: "string", label: "Condition:" },
            { name: "update", type: "string", label: "Update:" }
        ],
        toCode: function(block, nextBlockCode, loopBodyCode) {
            const init = block.data.init || "let i = 0";
            const condition = block.data.condition || "i < 10";
            const update = block.data.update || "i++";
            
            let code = `for (${init}; ${condition}; ${update}) {\n`;
            if (loopBodyCode) {
                code += loopBodyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "while_loop": {
        type: "while_loop",
        label: "While Loop",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true,
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [
            { name: "condition_text", type: "string", label: "Condition (text):" }
        ],
        toCode: function(block, nextBlockCode, loopBodyCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            
            let code = `while (${condition}) {\n`;
            if (loopBodyCode) {
                code += loopBodyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "do_while_loop": {
        type: "do_while_loop",
        label: "Do-While Loop",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true,
        dataInputs: [
            { name: "condition", type: "boolean", label: "Condition" }
        ],
        inputs: [
            { name: "condition_text", type: "string", label: "Condition (text):" }
        ],
        toCode: function(block, nextBlockCode, loopBodyCode) {
            const condition = block.data.condition || block.data.condition_text || "true";
            
            let code = `do {\n`;
            if (loopBodyCode) {
                code += loopBodyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} while (${condition})`;
            return code + "\n";
        }
    },
    "switch_statement": {
        type: "switch_statement",
        label: "Switch Statement",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        isContainer: true,
        dataInputs: [
            { name: "expression", type: "any", label: "Expression" }
        ],
        inputs: [
            { name: "expression_text", type: "string", label: "Expression (text):" },
            { name: "cases", type: "multiline", label: "Cases (value:code format):", rows: 5 }
        ],
        toCode: function(block, nextBlockCode, childrenCode) {
            const expression = block.data.expression || block.data.expression_text || "value";
            const cases = block.data.cases || "";
            
            let code = `switch (${expression}) {\n`;
            
            // Parse case statements
            if (cases) {
                const caseLines = cases.split('\n');
                for (const line of caseLines) {
                    if (line.includes(':')) {
                        const [value, codeFragment] = line.split(':', 2);
                        code += `  case ${value.trim()}:\n    ${codeFragment.trim()};\n    break;\n`;
                    }
                }
            }
            
            // Add default case
            code += `  default:\n    // Default case\n    break;\n`;
            code += `}`;
            return code + "\n";
        }
    },
    "try_catch": {
        type: "try_catch",
        label: "Try-Catch",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // Try branch
        hasBranchAltFlowOut: true, // Catch branch
        inputs: [
            { name: "error_var", type: "string", label: "Error variable name:" }
        ],
        toCode: function(block, nextBlockCode, tryCode, catchCode) {
            const errorVar = block.data.error_var || "error";
            
            let code = `try {\n`;
            if (tryCode) {
                code += tryCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} catch (${errorVar}) {\n`;
            if (catchCode) {
                code += catchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "try_catch_finally": {
        type: "try_catch_finally",
        label: "Try-Catch-Finally",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: true,
        hasBranchFlowOut: true, // Try branch
        hasBranchAltFlowOut: true, // Catch branch
        hasBranchFinallyFlowOut: true, // Finally branch
        inputs: [
            { name: "error_var", type: "string", label: "Error variable name:" }
        ],
        toCode: function(block, nextBlockCode, tryCode, catchCode, finallyCode) {
            const errorVar = block.data.error_var || "error";
            
            let code = `try {\n`;
            if (tryCode) {
                code += tryCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} catch (${errorVar}) {\n`;
            if (catchCode) {
                code += catchCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `} finally {\n`;
            if (finallyCode) {
                code += finallyCode.split('\n').map(line => `  ${line}`).join('\n').trimEnd() + "\n";
            }
            code += `}`;
            return code + "\n";
        }
    },
    "return": {
        type: "return",
        label: "Return",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: false,
        dataInputs: [
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "value_text", type: "string", label: "Return value (text):" }
        ],
        toCode: function(block) {
            const value = block.data.value || block.data.value_text || "";
            return `return ${value};`;
        }
    },
    "break": {
        type: "break",
        label: "Break",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: false,
        toCode: function() {
            return "break;";
        }
    },
    "continue": {
        type: "continue",
        label: "Continue",
        color: "#dd6b20",
        category: "Flow Control",
        hasFlowIn: true,
        hasFlowOut: false,
        toCode: function() {
            return "continue;";
        }
    },

    // ============ VARIABLES BLOCKS ============
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
    "const_declare": {
        type: "const_declare",
        label: "Declare Constant",
        color: "#a855f7", // Purple
        category: "Variables",
        hasFlowIn: true,
        hasFlowOut: true,
        inputs: [
            { name: "constName", type: "string", label: "Name:" },
            { name: "value", type: "string", label: "Value:" },
            { name: "constType", type: "select", label: "Type:", 
              options: [
                  { value: "auto", label: "Auto" },
                  { value: "string", label: "String" },
                  { value: "number", label: "Number" },
                  { value: "boolean", label: "Boolean" },
                  { value: "object", label: "Object" },
                  { value: "array", label: "Array" }
              ]}
        ],
        toCode: function(block) {
            const constName = block.data.constName || "MY_CONST";
            const value = block.data.value || "null";
            const constType = block.data.constType || "auto";
            
            // Format value based on type
            let formattedValue = value;
            if (constType === "string") {
                formattedValue = `"${value.replace(/"/g, '\\"')}"`;
            } else if (constType === "array") {
                formattedValue = value.startsWith('[') ? value : `[${value}]`;
            } else if (constType === "object") {
                formattedValue = value.startsWith('{') ? value : `{${value}}`;
            } else if (constType === "number") {
                formattedValue = isNaN(parseFloat(value)) ? 0 : value;
            } else if (constType === "boolean") {
                formattedValue = ["true", "yes", "1"].includes(value.toLowerCase()) ? "true" : "false";
            } else if (constType === "auto") {
                if (typeof value === 'string' && !value.match(/^(\d+(\.\d+)?|true|false|null|undefined)$/)) {
                    formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                }
            }
            
            return `const ${constName} = ${formattedValue};\n`;
        }
    },
    "variable_assign": {
        type: "variable_assign",
        label: "Assign Variable",
        color: "#a855f7", // Purple
        category: "Variables",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "varName", type: "string", label: "Variable name:" },
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        toCode: function(block) {
            const varName = block.data.varName || "myVar";
            const value = block.data.value || block.data.value_text || "null";
            return `${varName} = ${value};\n`;
        }
    },

    // ============ LOGIC BLOCKS ============
    "boolean_value": {
        type: "boolean_value",
        label: "Boolean Value",
        color: "#4c1d95", // Deep purple
        category: "Logic", 
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
        }
    },
    "compare": {
        type: "compare",
        label: "Compare",
        color: "#4c1d95",
        category: "Logic",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "valueA", type: "any", label: "Value A" },
            { name: "valueB", type: "any", label: "Value B" }
        ],
        inputs: [
            { name: "valueA_text", type: "string", label: "Value A (text):" },
            { name: "valueB_text", type: "string", label: "Value B (text):" },
            { name: "operator", type: "select", label: "Operator:", 
              options: [
                  { value: "==", label: "==" },
                  { value: "===", label: "===" },
                  { value: "!=", label: "!=" },
                  { value: "!==", label: "!==" },
                  { value: ">", label: ">" },
                  { value: ">=", label: ">=" },
                  { value: "<", label: "<" },
                  { value: "<=", label: "<=" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "boolean", label: "Result" }
        ],
        toCode: function(block) {
            const valueA = block.data.valueA || block.data.valueA_text || "a";
            const valueB = block.data.valueB || block.data.valueB_text || "b";
            const operator = block.data.operator || "===";
            return `(${valueA} ${operator} ${valueB})`;
        }
    },
    "logical_operation": {
        type: "logical_operation",
        label: "Logical Operation",
        color: "#4c1d95",
        category: "Logic",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "valueA", type: "boolean", label: "Value A" },
            { name: "valueB", type: "boolean", label: "Value B" }
        ],
        inputs: [
            { name: "valueA_text", type: "string", label: "Value A (text):" },
            { name: "valueB_text", type: "string", label: "Value B (text):" },
            { name: "operator", type: "select", label: "Operator:", 
              options: [
                  { value: "&&", label: "AND (&&)" },
                  { value: "||", label: "OR (||)" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "boolean", label: "Result" }
        ],
        toCode: function(block) {
            const valueA = block.data.valueA || block.data.valueA_text || "true";
            const valueB = block.data.valueB || block.data.valueB_text || "true";
            const operator = block.data.operator || "&&";
            return `(${valueA} ${operator} ${valueB})`;
        }
    },
    "not_operation": {
        type: "not_operation",
        label: "NOT Operation",
        color: "#4c1d95",
        category: "Logic",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "value", type: "boolean", label: "Value" }
        ],
        inputs: [
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "boolean", label: "Result" }
        ],
        toCode: function(block) {
            const value = block.data.value || block.data.value_text || "true";
            return `!(${value})`;
        }
    },

    // ============ MATH BLOCKS ============
    "math_operation": {
        type: "math_operation",
        label: "Math Operation",
        color: "#8b5cf6", // Purple
        category: "Math",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "valueA", type: "number", label: "Value A" },
            { name: "valueB", type: "number", label: "Value B" }
        ],
        inputs: [
            { name: "valueA_text", type: "string", label: "Value A (text):" },
            { name: "valueB_text", type: "string", label: "Value B (text):" },
            { name: "operator", type: "select", label: "Operator:", 
              options: [
                  { value: "+", label: "+" },
                  { value: "-", label: "-" },
                  { value: "*", label: "*" },
                  { value: "/", label: "/" },
                  { value: "%", label: "%" },
                  { value: "**", label: "**" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "number", label: "Result" }
        ],
        toCode: function(block) {
            const valueA = block.data.valueA || block.data.valueA_text || "0";
            const valueB = block.data.valueB || block.data.valueB_text || "0";
            const operator = block.data.operator || "+";
            return `(${valueA} ${operator} ${valueB})`;
        }
    },
    "math_function": {
        type: "math_function",
        label: "Math Function",
        color: "#8b5cf6",
        category: "Math",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "value", type: "number", label: "Value" }
        ],
        inputs: [
            { name: "value_text", type: "string", label: "Value (text):" },
            { name: "function", type: "select", label: "Function:", 
              options: [
                  { value: "abs", label: "Absolute (abs)" },
                  { value: "round", label: "Round" },
                  { value: "floor", label: "Floor" },
                  { value: "ceil", label: "Ceiling" },
                  { value: "sqrt", label: "Square Root" },
                  { value: "sin", label: "Sine" },
                  { value: "cos", label: "Cosine" },
                  { value: "tan", label: "Tangent" },
                  { value: "log", label: "Logarithm" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "number", label: "Result" }
        ],
        toCode: function(block) {
            const value = block.data.value || block.data.value_text || "0";
            const func = block.data.function || "abs";
            return `Math.${func}(${value})`;
        }
    },
    "random_number": {
        type: "random_number",
        label: "Random Number",
        color: "#8b5cf6",
        category: "Math",
        hasFlowIn: false,
        hasFlowOut: false,
        inputs: [
            { name: "min", type: "string", label: "Min:" },
            { name: "max", type: "string", label: "Max:" }
        ],
        dataOutputs: [
            { name: "result", type: "number", label: "Result" }
        ],
        toCode: function(block) {
            const min = block.data.min || "0";
            const max = block.data.max || "1";
            return `(Math.random() * (${max} - ${min}) + ${min})`;
        }
    },

    // ============ STRING BLOCKS ============
    "string_operation": {
        type: "string_operation",
        label: "String Operation",
        color: "#10b981", // Teal
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "operation", type: "select", label: "Operation:", 
              options: [
                  { value: "length", label: "Length" },
                  { value: "uppercase", label: "To Uppercase" },
                  { value: "lowercase", label: "To Lowercase" },
                  { value: "trim", label: "Trim" }
              ]}
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const operation = block.data.operation || "length";
            
            switch(operation) {
                case "length": return `${string}.length`;
                case "uppercase": return `${string}.toUpperCase()`;
                case "lowercase": return `${string}.toLowerCase()`;
                case "trim": return `${string}.trim()`;
                default: return string;
            }
        }
    },
    "string_concat": {
        type: "string_concat",
        label: "String Concatenation",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "stringA", type: "string", label: "String A" },
            { name: "stringB", type: "string", label: "String B" }
        ],
        inputs: [
            { name: "stringA_text", type: "string", label: "String A (text):" },
            { name: "stringB_text", type: "string", label: "String B (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "string", label: "Result" }
        ],
        toCode: function(block) {
            const stringA = block.data.stringA || block.data.stringA_text || '""';
            const stringB = block.data.stringB || block.data.stringB_text || '""';
            return `(${stringA} + ${stringB})`;
        }
    },
    "string_substring": {
        type: "string_substring",
        label: "String Substring",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "start", type: "string", label: "Start index:" },
            { name: "end", type: "string", label: "End index (optional):" }
        ],
        dataOutputs: [
            { name: "result", type: "string", label: "Result" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const start = block.data.start || "0";
            const end = block.data.end || "";
            
            if (end) {
                return `${string}.substring(${start}, ${end})`;
            } else {
                return `${string}.substring(${start})`;
            }
        }
    },
    "string_split": {
        type: "string_split",
        label: "String Split",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "separator", type: "string", label: "Separator:" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Result Array" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const separator = block.data.separator || '","';
            return `${string}.split(${separator})`;
        }
    },
    "string_replace": {
        type: "string_replace",
        label: "String Replace",
        color: "#10b981",
        category: "Strings",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "string", type: "string", label: "String" }
        ],
        inputs: [
            { name: "string_text", type: "string", label: "String (text):" },
            { name: "search", type: "string", label: "Search for:" },
            { name: "replace", type: "string", label: "Replace with:" },
            { name: "global", type: "boolean", label: "Global replace:" }
        ],
        dataOutputs: [
            { name: "result", type: "string", label: "Result" }
        ],
        toCode: function(block) {
            const string = block.data.string || block.data.string_text || '""';
            const search = block.data.search || '""';
            const replace = block.data.replace || '""';
            const global = block.data.global === true;
            
            if (global) {
                return `${string}.replace(new RegExp(${search}, 'g'), ${replace})`;
            } else {
                return `${string}.replace(${search}, ${replace})`;
            }
        }
    },

    // ============ ARRAY BLOCKS ============
    "array_operation": {
        type: "array_operation",
        label: "Array Operation",
        color: "#f59e0b", // Amber
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "operation", type: "select", label: "Operation:", 
              options: [
                  { value: "length", label: "Length" },
                  { value: "join", label: "Join" },
                  { value: "reverse", label: "Reverse" },
                  { value: "sort", label: "Sort" }
              ]},
            { name: "separator", type: "string", label: "Separator (for join):" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const operation = block.data.operation || "length";
            const separator = block.data.separator || '","';
            
            switch(operation) {
                case "length": return `${array}.length`;
                case "join": return `${array}.join(${separator})`;
                case "reverse": return `[...${array}].reverse()`;
                case "sort": return `[...${array}].sort()`;
                default: return array;
            }
        }
    },
    "array_element": {
        type: "array_element",
        label: "Array Element",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "index", type: "string", label: "Index:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Element" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const index = block.data.index || "0";
            return `${array}[${index}]`;
        }
    },
    "array_push": {
        type: "array_push",
        label: "Array Push",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "array", type: "array", label: "Array" },
            { name: "item", type: "any", label: "Item" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "item_text", type: "string", label: "Item (text):" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "myArray";
            const item = block.data.item || block.data.item_text || "item";
            return `${array}.push(${item});\n`;
        }
    },
    "array_map": {
        type: "array_map",
        label: "Array Map",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "itemVar", type: "string", label: "Item variable name:" },
            { name: "expression", type: "string", label: "Transformation:" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Result Array" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const itemVar = block.data.itemVar || "item";
            const expression = block.data.expression || "item";
            return `${array}.map(${itemVar} => ${expression})`;
        }
    },
    "array_filter": {
        type: "array_filter",
        label: "Array Filter",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "itemVar", type: "string", label: "Item variable name:" },
            { name: "condition", type: "string", label: "Condition:" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Result Array" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const itemVar = block.data.itemVar || "item";
            const condition = block.data.condition || "true";
            return `${array}.filter(${itemVar} => ${condition})`;
        }
    },
    "array_reduce": {
        type: "array_reduce",
        label: "Array Reduce",
        color: "#f59e0b",
        category: "Arrays",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "array", type: "array", label: "Array" }
        ],
        inputs: [
            { name: "array_text", type: "string", label: "Array (text):" },
            { name: "accumVar", type: "string", label: "Accumulator variable:" },
            { name: "itemVar", type: "string", label: "Item variable:" },
            { name: "expression", type: "string", label: "Reduce expression:" },
            { name: "initial", type: "string", label: "Initial value:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Result" }
        ],
        toCode: function(block) {
            const array = block.data.array || block.data.array_text || "[]";
            const accumVar = block.data.accumVar || "acc";
            const itemVar = block.data.itemVar || "item";
            const expression = block.data.expression || "acc + item";
            const initial = block.data.initial || "0";
            return `${array}.reduce((${accumVar}, ${itemVar}) => ${expression}, ${initial})`;
        }
    },

    // ============ OBJECT BLOCKS ============
    "object_property": {
        type: "object_property",
        label: "Object Property",
        color: "#14b8a6", // Emerald
        category: "Objects",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "object", type: "object", label: "Object" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" },
            { name: "property", type: "string", label: "Property name:" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Value" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "{}";
            const property = block.data.property || "property";
            
            // Check if the property needs bracket notation
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(property)) {
                return `${object}.${property}`;
            } else {
                return `${object}["${property}"]`;
            }
        }
    },
    "object_set_property": {
        type: "object_set_property",
        label: "Set Object Property",
        color: "#14b8a6",
        category: "Objects",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [
            { name: "object", type: "object", label: "Object" },
            { name: "value", type: "any", label: "Value" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" },
            { name: "property", type: "string", label: "Property name:" },
            { name: "value_text", type: "string", label: "Value (text):" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "myObject";
            const property = block.data.property || "property";
            const value = block.data.value || block.data.value_text || "null";
            
            // Check if the property needs bracket notation
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(property)) {
                return `${object}.${property} = ${value};\n`;
            } else {
                return `${object}["${property}"] = ${value};\n`;
            }
        }
    },
    "object_keys": {
        type: "object_keys",
        label: "Object Keys",
        color: "#14b8a6",
        category: "Objects",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "object", type: "object", label: "Object" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Keys Array" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "{}";
            return `Object.keys(${object})`;
        }
    },
    "object_values": {
        type: "object_values",
        label: "Object Values",
        color: "#14b8a6",
        category: "Objects",
        hasFlowIn: false,
        hasFlowOut: false,
        dataInputs: [
            { name: "object", type: "object", label: "Object" }
        ],
        inputs: [
            { name: "object_text", type: "string", label: "Object (text):" }
        ],
        dataOutputs: [
            { name: "result", type: "array", label: "Values Array" }
        ],
        toCode: function(block) {
            const object = block.data.object || block.data.object_text || "{}";
            return `Object.values(${object})`;
        }
    },

    // ============ FUNCTION BLOCKS ============
    "function_definition": {
        type: "function_definition",
        label: "Function Definition",
        color: "#6366f1", // Indigo
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
    "function_call": {
        type: "function_call",
        label: "Function Call",
        color: "#6366f1",
        category: "Functions",
        hasFlowIn: true,
        hasFlowOut: true,
        dataInputs: [],
        inputs: [
            { name: "funcName", type: "string", label: "Function Name:" },
            { name: "args", type: "string", label: "Arguments (comma-separated):" }
        ],
        dataOutputs: [
            { name: "result", type: "any", label: "Return Value" }
        ],
        toCode: function(block) {
            const funcName = block.data.funcName || "myFunction";
            const args = block.data.args || "";
            return `${funcName}(${args});\n`;
        }
    },
    "arrow_function": {
        type: "arrow_function",
        label: "Arrow Function",
        color: "#6366f1",
        category: "Functions",
        hasFlowIn: false,
        hasFlowOut: false,
        inputs: [
            { name: "params", type: "string", label: "Parameters (comma-separated):" },
            { name: "body", type: "multiline", label: "Function Body:", rows: 3 },
            { name: "multiline", type: "boolean", label: "Multiline:" }
        ],
        dataOutputs: [
            { name: "result", type: "function", label: "Function" }
        ],
        toCode: function(block) {
            const params = block.data.params || "";
            const body = block.data.body || "return null;";
            const multiline = block.data.multiline === true;
            
            if (multiline) {
                return `(${params}) => {\n  ${body.replace(/\n/g, '\n  ')}\n}`;
            } else {
                return `(${params}) => ${body}`;
            }
        }
    },
    "callback_function": {
        type: "callback_function",
        label: "Callback Function",
        color: "#6366f1",
        category: "Functions",
        hasFlowIn: false,
        hasFlowOut: false,
        isContainer: true,
        inputs: [
            { name: "params", type: "string", label: "Parameters (comma-separated):" }
        ],
        dataOutputs: [
            { name: "callback", type: "function", label: "Callback" }
        ],
        toCode: function(block, nextBlockCode, childrenCode) {
            const params = block.data.params || "";
            let code = `function(${params}) {\n`;
            
            // Add child content if any
            if (childrenCode) {
                code += childrenCode.split('\n').map(line => `  ${line}`).join('\n');
                if (!childrenCode.endsWith('\n')) code += '\n';
            }
            
            code += "}";
            return code;
        }
    },

    // ============ DOM BLOCKS ============
    "get_element": {
        type: "get_element",
        label: "Get DOM Element",
        color: "#84cc16", // Lime
        category: "Input/Output",
        hasFlowIn: false,
        hasFlowOut: false,
        inputs: [
            { name: "selector", type: "string", label: "CSS Selector:" },
            { name: "method", type: "select", label: "Selection Method:", 
              options: [
                  { value: "querySelector", label: "querySelector (first match)" },
                  { value: "querySelectorAll", label: "querySelectorAll (all matches)" },
                  { value: "getElementById", label: "getElementById" }
              ]}
        ],
        dataOutputs: [
            { name: "element", type: "object", label: "Element(s)" }
        ],
        toCode: function(block) {
            const selector = block.data.selector || '""';
            const method = block.data.method || "querySelector";
            
            if (method === "getElementById") {
                // Remove any quotes for getElementById since we're wrapping it ourselves
                const id = selector.replace(/['"]/g, '');
                return `document.getElementById("${id}")`;
            } else {
                return `document.${method}(${selector})`;
            }
        }
    },
    "set_element_property": {
        type: "set_element_property",
        label: "Set Element Property",
        color: "#84cc16",
        category: "Input/Output",…