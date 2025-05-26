// CSS Block Definitions for ScriptFlow.js

if (typeof window.CSS_BLOCK_DEFINITIONS === 'undefined') {
    window.CSS_BLOCK_DEFINITIONS = {
        "css_rule": {
            type: "css_rule",
            label: "CSS Rule",
            color: "#2563eb", // Blue
            category: "CSS Structure",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "selector", type: "string", label: "CSS Selector:", placeholder: ".my-class, #my-id, div" }
            ],
            dataOutputs: [
                { name: "css_output", type: "css", label: "CSS" }
            ],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                const selector = block.data.selector || ".my-element";
                
                let code = `${selector} {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            },
            getValue: function(block, context) {
                // For data output, generate the CSS from child blocks
                const childBlocks = window.getChildBlocks ? window.getChildBlocks(block) : [];
                let css = "";
                
                if (childBlocks && childBlocks.length > 0) {
                    const selector = block.data.selector || ".my-element";
                    css = `${selector} {\n`;
                    
                    childBlocks.forEach(childBlock => {
                        const blockDef = window.BLOCK_DEFINITIONS[childBlock.type];
                        if (blockDef && blockDef.toCode) {
                            const blockCode = blockDef.toCode(childBlock, context);
                            css += `  ${blockCode.trim()}\n`;
                        }
                    });
                    
                    css += `}\n`;
                }
                
                return css;
            }
        },

        "css_property": {
            type: "css_property",
            label: "CSS Property",
            color: "#7c3aed", // Purple
            category: "CSS Properties",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "property", type: "string", label: "Property:", placeholder: "color, font-size, margin..." },
                { name: "value", type: "string", label: "Value:", placeholder: "red, 16px, 10px..." }
            ],
            dataInputs: [
                { name: "property_value", type: "any", label: "Value" }
            ],
            dataOutputs: [
                { name: "css_output", type: "css", label: "CSS Property" }
            ],
            toCode: function(block) {
                const property = block.data.property || "color";
                
                // Try to get connected value first
                let value = null;
                if (typeof getConnectedValue === 'function') {
                    value = getConnectedValue(block, "property_value");
                }
                
                // Fall back to text input field
                if (value === null || value === undefined) {
                    value = block.data.value || "inherit";
                }
                
                return `${property}: ${value};\n`;
            },
            getValue: function(block) {
                const property = block.data.property || "color";
                
                // Try to get connected value first
                let value = null;
                if (typeof getConnectedValue === 'function') {
                    value = getConnectedValue(block, "property_value");
                }
                
                // Fall back to text input field
                if (value === null || value === undefined) {
                    value = block.data.value || "inherit";
                }
                
                return `${property}: ${value};`;
            }
        },

        "css_color": {
            type: "css_color",
            label: "Color",
            color: "#ef4444", // Red
            category: "CSS Values",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "color", type: "color", label: "Color:", defaultValue: "#000000" }
            ],
            dataOutputs: [
                { name: "color_output", type: "color", label: "Color Value" }
            ],
            toCode: function(block) {
                return ""; // This block doesn't generate code in flow context
            },
            getValue: function(block) {
                return block.data.color || "#000000";
            }
        },

        "css_size": {
            type: "css_size",
            label: "Size/Length",
            color: "#f59e0b", // Amber
            category: "CSS Values",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "value", type: "number", label: "Value:", defaultValue: 16, min: 0 },
                { name: "unit", type: "select", label: "Unit:", 
                 options: [
                    { value: "px", label: "Pixels (px)" },
                    { value: "em", label: "Em (em)" },
                    { value: "rem", label: "Rem (rem)" },
                    { value: "%", label: "Percent (%)" },
                    { value: "vh", label: "Viewport Height (vh)" },
                    { value: "vw", label: "Viewport Width (vw)" },
                    { value: "pt", label: "Points (pt)" },
                    { value: "cm", label: "Centimeters (cm)" },
                    { value: "mm", label: "Millimeters (mm)" },
                    { value: "in", label: "Inches (in)" }
                 ]}
            ],
            dataOutputs: [
                { name: "size_output", type: "size", label: "Size Value" }
            ],
            toCode: function(block) {
                return ""; // This block doesn't generate code in flow context
            },
            getValue: function(block) {
                const value = block.data.value || 16;
                const unit = block.data.unit || "px";
                return `${value}${unit}`;
            }
        },

        "css_background": {
            type: "css_background",
            label: "Background",
            color: "#10b981", // Emerald
            category: "CSS Properties",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "type", type: "select", label: "Background Type:",
                 options: [
                    { value: "color", label: "Solid Color" },
                    { value: "image", label: "Image" },
                    { value: "gradient", label: "Gradient" }
                 ]},
                { name: "color", type: "color", label: "Background Color:", defaultValue: "#ffffff" },
                { name: "image", type: "string", label: "Image URL:", placeholder: "url(image.jpg)" },
                { name: "gradient", type: "string", label: "Gradient:", placeholder: "linear-gradient(45deg, red, blue)" },
                { name: "repeat", type: "select", label: "Repeat:",
                 options: [
                    { value: "repeat", label: "Repeat" },
                    { value: "no-repeat", label: "No Repeat" },
                    { value: "repeat-x", label: "Repeat X" },
                    { value: "repeat-y", label: "Repeat Y" }
                 ]},
                { name: "position", type: "string", label: "Position:", placeholder: "center, top left, 50% 50%" },
                { name: "size", type: "select", label: "Size:",
                 options: [
                    { value: "auto", label: "Auto" },
                    { value: "cover", label: "Cover" },
                    { value: "contain", label: "Contain" },
                    { value: "100%", label: "100%" }
                 ]}
            ],
            dataInputs: [
                { name: "color_input", type: "color", label: "Color" }
            ],
            toCode: function(block) {
                const type = block.data.type || "color";
                let css = "";
                
                if (type === "color") {
                    let color = null;
                    if (typeof getConnectedValue === 'function') {
                        color = getConnectedValue(block, "color_input");
                    }
                    if (color === null || color === undefined) {
                        color = block.data.color || "#ffffff";
                    }
                    css += `background-color: ${color};\n`;
                } else if (type === "image") {
                    const image = block.data.image || "";
                    const repeat = block.data.repeat || "no-repeat";
                    const position = block.data.position || "center";
                    const size = block.data.size || "cover";
                    
                    if (image) {
                        css += `background-image: ${image};\n`;
                        css += `background-repeat: ${repeat};\n`;
                        css += `background-position: ${position};\n`;
                        css += `background-size: ${size};\n`;
                    }
                } else if (type === "gradient") {
                    const gradient = block.data.gradient || "linear-gradient(45deg, #ff0000, #0000ff)";
                    css += `background: ${gradient};\n`;
                }
                
                return css;
            }
        },

        "css_border": {
            type: "css_border",
            label: "Border",
            color: "#8b5cf6", // Violet
            category: "CSS Properties",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "width", type: "number", label: "Width (px):", defaultValue: 1, min: 0 },
                { name: "style", type: "select", label: "Style:",
                 options: [
                    { value: "solid", label: "Solid" },
                    { value: "dashed", label: "Dashed" },
                    { value: "dotted", label: "Dotted" },
                    { value: "double", label: "Double" },
                    { value: "groove", label: "Groove" },
                    { value: "ridge", label: "Ridge" },
                    { value: "inset", label: "Inset" },
                    { value: "outset", label: "Outset" }
                 ]},
                { name: "color", type: "color", label: "Color:", defaultValue: "#000000" },
                { name: "radius", type: "number", label: "Border Radius (px):", defaultValue: 0, min: 0 }
            ],
            dataInputs: [
                { name: "color_input", type: "color", label: "Border Color" },
                { name: "width_input", type: "size", label: "Border Width" }
            ],
            toCode: function(block) {
                // Try to get connected values first
                let width = null;
                let color = null;
                
                if (typeof getConnectedValue === 'function') {
                    width = getConnectedValue(block, "width_input");
                    color = getConnectedValue(block, "color_input");
                }
                
                // Fall back to input fields
                if (width === null || width === undefined) {
                    width = (block.data.width || 1) + "px";
                }
                if (color === null || color === undefined) {
                    color = block.data.color || "#000000";
                }
                
                const style = block.data.style || "solid";
                const radius = block.data.radius || 0;
                
                let css = `border: ${width} ${style} ${color};\n`;
                if (radius > 0) {
                    css += `border-radius: ${radius}px;\n`;
                }
                
                return css;
            }
        },

        "css_margin": {
            type: "css_margin",
            label: "Margin",
            color: "#ec4899", // Pink
            category: "CSS Properties",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "type", type: "select", label: "Margin Type:",
                 options: [
                    { value: "all", label: "All Sides" },
                    { value: "individual", label: "Individual Sides" },
                    { value: "horizontal", label: "Horizontal (left/right)" },
                    { value: "vertical", label: "Vertical (top/bottom)" }
                 ]},
                { name: "all", type: "number", label: "All Sides (px):", defaultValue: 10, min: 0 },
                { name: "top", type: "number", label: "Top (px):", defaultValue: 0, min: 0 },
                { name: "right", type: "number", label: "Right (px):", defaultValue: 0, min: 0 },
                { name: "bottom", type: "number", label: "Bottom (px):", defaultValue: 0, min: 0 },
                { name: "left", type: "number", label: "Left (px):", defaultValue: 0, min: 0 },
                { name: "horizontal", type: "number", label: "Horizontal (px):", defaultValue: 10, min: 0 },
                { name: "vertical", type: "number", label: "Vertical (px):", defaultValue: 10, min: 0 }
            ],
            toCode: function(block) {
                const type = block.data.type || "all";
                
                switch(type) {
                    case "all":
                        const all = block.data.all || 10;
                        return `margin: ${all}px;\n`;
                    case "individual":
                        const top = block.data.top || 0;
                        const right = block.data.right || 0;
                        const bottom = block.data.bottom || 0;
                        const left = block.data.left || 0;
                        return `margin: ${top}px ${right}px ${bottom}px ${left}px;\n`;
                    case "horizontal":
                        const horizontal = block.data.horizontal || 10;
                        return `margin: 0 ${horizontal}px;\n`;
                    case "vertical":
                        const vertical = block.data.vertical || 10;
                        return `margin: ${vertical}px 0;\n`;
                    default:
                        return `margin: 10px;\n`;
                }
            }
        },

        "css_padding": {
            type: "css_padding",
            label: "Padding",
            color: "#06b6d4", // Cyan
            category: "CSS Properties",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "type", type: "select", label: "Padding Type:",
                 options: [
                    { value: "all", label: "All Sides" },
                    { value: "individual", label: "Individual Sides" },
                    { value: "horizontal", label: "Horizontal (left/right)" },
                    { value: "vertical", label: "Vertical (top/bottom)" }
                 ]},
                { name: "all", type: "number", label: "All Sides (px):", defaultValue: 10, min: 0 },
                { name: "top", type: "number", label: "Top (px):", defaultValue: 0, min: 0 },
                { name: "right", type: "number", label: "Right (px):", defaultValue: 0, min: 0 },
                { name: "bottom", type: "number", label: "Bottom (px):", defaultValue: 0, min: 0 },
                { name: "left", type: "number", label: "Left (px):", defaultValue: 0, min: 0 },
                { name: "horizontal", type: "number", label: "Horizontal (px):", defaultValue: 10, min: 0 },
                { name: "vertical", type: "number", label: "Vertical (px):", defaultValue: 10, min: 0 }
            ],
            toCode: function(block) {
                const type = block.data.type || "all";
                
                switch(type) {
                    case "all":
                        const all = block.data.all || 10;
                        return `padding: ${all}px;\n`;
                    case "individual":
                        const top = block.data.top || 0;
                        const right = block.data.right || 0;
                        const bottom = block.data.bottom || 0;
                        const left = block.data.left || 0;
                        return `padding: ${top}px ${right}px ${bottom}px ${left}px;\n`;
                    case "horizontal":
                        const horizontal = block.data.horizontal || 10;
                        return `padding: 0 ${horizontal}px;\n`;
                    case "vertical":
                        const vertical = block.data.vertical || 10;
                        return `padding: ${vertical}px 0;\n`;
                    default:
                        return `padding: 10px;\n`;
                }
            }
        },

        "css_text": {
            type: "css_text",
            label: "Text Styling",
            color: "#14b8a6", // Teal
            category: "CSS Properties",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "fontSize", type: "number", label: "Font Size (px):", defaultValue: 16, min: 1 },
                { name: "fontFamily", type: "select", label: "Font Family:",
                 options: [
                    { value: "Arial, sans-serif", label: "Arial" },
                    { value: "Helvetica, sans-serif", label: "Helvetica" },
                    { value: "Georgia, serif", label: "Georgia" },
                    { value: "Times New Roman, serif", label: "Times New Roman" },
                    { value: "Courier New, monospace", label: "Courier New" },
                    { value: "Verdana, sans-serif", label: "Verdana" },
                    { value: "Comic Sans MS, cursive", label: "Comic Sans MS" }
                 ]},
                { name: "fontWeight", type: "select", label: "Font Weight:",
                 options: [
                    { value: "normal", label: "Normal" },
                    { value: "bold", label: "Bold" },
                    { value: "lighter", label: "Lighter" },
                    { value: "bolder", label: "Bolder" },
                    { value: "100", label: "100" },
                    { value: "200", label: "200" },
                    { value: "300", label: "300" },
                    { value: "400", label: "400" },
                    { value: "500", label: "500" },
                    { value: "600", label: "600" },
                    { value: "700", label: "700" },
                    { value: "800", label: "800" },
                    { value: "900", label: "900" }
                 ]},
                { name: "textAlign", type: "select", label: "Text Align:",
                 options: [
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                    { value: "justify", label: "Justify" }
                 ]},
                { name: "color", type: "color", label: "Text Color:", defaultValue: "#000000" }
            ],
            dataInputs: [
                { name: "color_input", type: "color", label: "Text Color" },
                { name: "size_input", type: "size", label: "Font Size" }
            ],
            toCode: function(block) {
                // Try to get connected values first
                let color = null;
                let fontSize = null;
                
                if (typeof getConnectedValue === 'function') {
                    color = getConnectedValue(block, "color_input");
                    fontSize = getConnectedValue(block, "size_input");
                }
                
                // Fall back to input fields
                if (color === null || color === undefined) {
                    color = block.data.color || "#000000";
                }
                if (fontSize === null || fontSize === undefined) {
                    fontSize = (block.data.fontSize || 16) + "px";
                }
                
                const fontFamily = block.data.fontFamily || "Arial, sans-serif";
                const fontWeight = block.data.fontWeight || "normal";
                const textAlign = block.data.textAlign || "left";
                
                let css = "";
                css += `font-size: ${fontSize};\n`;
                css += `font-family: ${fontFamily};\n`;
                css += `font-weight: ${fontWeight};\n`;
                css += `text-align: ${textAlign};\n`;
                css += `color: ${color};\n`;
                
                return css;
            }
        },

        "css_flexbox": {
            type: "css_flexbox",
            label: "Flexbox",
            color: "#6366f1", // Indigo
            category: "CSS Layout",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "display", type: "select", label: "Display:",
                 options: [
                    { value: "flex", label: "Flex" },
                    { value: "inline-flex", label: "Inline Flex" }
                 ]},
                { name: "direction", type: "select", label: "Flex Direction:",
                 options: [
                    { value: "row", label: "Row" },
                    { value: "row-reverse", label: "Row Reverse" },
                    { value: "column", label: "Column" },
                    { value: "column-reverse", label: "Column Reverse" }
                 ]},
                { name: "justifyContent", type: "select", label: "Justify Content:",
                 options: [
                    { value: "flex-start", label: "Flex Start" },
                    { value: "flex-end", label: "Flex End" },
                    { value: "center", label: "Center" },
                    { value: "space-between", label: "Space Between" },
                    { value: "space-around", label: "Space Around" },
                    { value: "space-evenly", label: "Space Evenly" }
                 ]},
                { name: "alignItems", type: "select", label: "Align Items:",
                 options: [
                    { value: "stretch", label: "Stretch" },
                    { value: "flex-start", label: "Flex Start" },
                    { value: "flex-end", label: "Flex End" },
                    { value: "center", label: "Center" },
                    { value: "baseline", label: "Baseline" }
                 ]},
                { name: "flexWrap", type: "select", label: "Flex Wrap:",
                 options: [
                    { value: "nowrap", label: "No Wrap" },
                    { value: "wrap", label: "Wrap" },
                    { value: "wrap-reverse", label: "Wrap Reverse" }
                 ]}
            ],
            toCode: function(block) {
                const display = block.data.display || "flex";
                const direction = block.data.direction || "row";
                const justifyContent = block.data.justifyContent || "flex-start";
                const alignItems = block.data.alignItems || "stretch";
                const flexWrap = block.data.flexWrap || "nowrap";
                
                let css = "";
                css += `display: ${display};\n`;
                css += `flex-direction: ${direction};\n`;
                css += `justify-content: ${justifyContent};\n`;
                css += `align-items: ${alignItems};\n`;
                css += `flex-wrap: ${flexWrap};\n`;
                
                return css;
            }
        },

        "css_grid": {
            type: "css_grid",
            label: "CSS Grid",
            color: "#8b5cf6", // Violet
            category: "CSS Layout",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "display", type: "select", label: "Display:",
                 options: [
                    { value: "grid", label: "Grid" },
                    { value: "inline-grid", label: "Inline Grid" }
                 ]},
                { name: "templateColumns", type: "string", label: "Grid Template Columns:", placeholder: "1fr 1fr 1fr, 200px auto 100px" },
                { name: "templateRows", type: "string", label: "Grid Template Rows:", placeholder: "auto 200px auto" },
                { name: "gap", type: "number", label: "Grid Gap (px):", defaultValue: 10, min: 0 },
                { name: "columnGap", type: "number", label: "Column Gap (px):", defaultValue: 10, min: 0 },
                { name: "rowGap", type: "number", label: "Row Gap (px):", defaultValue: 10, min: 0 }
            ],
            toCode: function(block) {
                const display = block.data.display || "grid";
                const templateColumns = block.data.templateColumns || "1fr 1fr 1fr";
                const templateRows = block.data.templateRows || "auto";
                const gap = block.data.gap || 10;
                const columnGap = block.data.columnGap || null;
                const rowGap = block.data.rowGap || null;
                
                let css = "";
                css += `display: ${display};\n`;
                css += `grid-template-columns: ${templateColumns};\n`;
                css += `grid-template-rows: ${templateRows};\n`;
                
                if (columnGap !== null && rowGap !== null) {
                    css += `column-gap: ${columnGap}px;\n`;
                    css += `row-gap: ${rowGap}px;\n`;
                } else {
                    css += `gap: ${gap}px;\n`;
                }
                
                return css;
            }
        },

        "css_animation": {
            type: "css_animation",
            label: "Animation",
            color: "#f59e0b", // Amber
            category: "CSS Effects",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "name", type: "string", label: "Animation Name:", placeholder: "fadeIn, slideUp, bounce" },
                { name: "duration", type: "number", label: "Duration (seconds):", defaultValue: 1, min: 0, step: 0.1 },
                { name: "timingFunction", type: "select", label: "Timing Function:",
                 options: [
                    { value: "ease", label: "Ease" },
                    { value: "ease-in", label: "Ease In" },
                    { value: "ease-out", label: "Ease Out" },
                    { value: "ease-in-out", label: "Ease In Out" },
                    { value: "linear", label: "Linear" }
                 ]},
                { name: "delay", type: "number", label: "Delay (seconds):", defaultValue: 0, min: 0, step: 0.1 },
                { name: "iterationCount", type: "string", label: "Iteration Count:", placeholder: "1, infinite, 3" },
                { name: "direction", type: "select", label: "Direction:",
                 options: [
                    { value: "normal", label: "Normal" },
                    { value: "reverse", label: "Reverse" },
                    { value: "alternate", label: "Alternate" },
                    { value: "alternate-reverse", label: "Alternate Reverse" }
                 ]}
            ],
            toCode: function(block) {
                const name = block.data.name || "fadeIn";
                const duration = block.data.duration || 1;
                const timingFunction = block.data.timingFunction || "ease";
                const delay = block.data.delay || 0;
                const iterationCount = block.data.iterationCount || "1";
                const direction = block.data.direction || "normal";
                
                return `animation: ${name} ${duration}s ${timingFunction} ${delay}s ${iterationCount} ${direction};\n`;
            }
        },

        "css_transform": {
            type: "css_transform",
            label: "Transform",
            color: "#ef4444", // Red
            category: "CSS Effects",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            inputs: [
                { name: "translateX", type: "number", label: "Translate X (px):", defaultValue: 0 },
                { name: "translateY", type: "number", label: "Translate Y (px):", defaultValue: 0 },
                { name: "rotate", type: "number", label: "Rotate (degrees):", defaultValue: 0 },
                { name: "scaleX", type: "number", label: "Scale X:", defaultValue: 1, step: 0.1 },
                { name: "scaleY", type: "number", label: "Scale Y:", defaultValue: 1, step: 0.1 },
                { name: "skewX", type: "number", label: "Skew X (degrees):", defaultValue: 0 },
                { name: "skewY", type: "number", label: "Skew Y (degrees):", defaultValue: 0 }
            ],
            toCode: function(block) {
                const translateX = block.data.translateX || 0;
                const translateY = block.data.translateY || 0;
                const rotate = block.data.rotate || 0;
                const scaleX = block.data.scaleX || 1;
                const scaleY = block.data.scaleY || 1;
                const skewX = block.data.skewX || 0;
                const skewY = block.data.skewY || 0;
                
                let transforms = [];
                
                if (translateX !== 0 || translateY !== 0) {
                    transforms.push(`translate(${translateX}px, ${translateY}px)`);
                }
                if (rotate !== 0) {
                    transforms.push(`rotate(${rotate}deg)`);
                }
                if (scaleX !== 1 || scaleY !== 1) {
                    transforms.push(`scale(${scaleX}, ${scaleY})`);
                }
                if (skewX !== 0 || skewY !== 0) {
                    transforms.push(`skew(${skewX}deg, ${skewY}deg)`);
                }
                
                if (transforms.length > 0) {
                    return `transform: ${transforms.join(' ')};\n`;
                } else {
                    return `transform: none;\n`;
                }
            }
        },

        "css_media_query": {
            type: "css_media_query",
            label: "Media Query",
            color: "#059669", // Green
            category: "CSS Structure",
            hasFlowIn: true,
            hasFlowOut: false,
            hasNextFlowOut: true,
            hasBranchFlowOut: true,
            isContainer: true,
            inputs: [
                { name: "condition", type: "string", label: "Media Condition:", placeholder: "(max-width: 768px), (min-width: 1024px)" }
            ],
            toCode: function(block, nextBlockCode, branchBlockCode) {
                const condition = block.data.condition || "(max-width: 768px)";
                
                let code = `@media ${condition} {\n`;
                if (branchBlockCode) {
                    code += branchBlockCode.split('\n').map(line => line ? `  ${line}` : line).join('\n').trimEnd() + "\n";
                }
                code += `}\n`;
                return code;
            }
        },

        "css_raw": {
            type: "css_raw",
            label: "Raw CSS",
            color: "#374151", // Gray
            category: "CSS Structure",
            hasFlowIn: false,
            hasFlowOut: false,
            inputs: [
                { name: "css", type: "multiline", label: "CSS Code:", rows: 8, placeholder: "/* Enter raw CSS here */" }
            ],
            dataOutputs: [
                { name: "css_output", type: "css", label: "CSS Code" }
            ],
            toCode: function(block) {
                return block.data.css || "";
            },
            getValue: function(block) {
                return block.data.css || "";
            }
        }
    };
}

// Function to load CSS blocks
window.loadCSSBlocks = function() {
    window.BLOCK_DEFINITIONS = { ...window.CSS_BLOCK_DEFINITIONS };
    
    // Trigger a refresh of the block palette if the function exists
    if (typeof window.refreshBlockPalette === 'function') {
        window.refreshBlockPalette();
    }
};