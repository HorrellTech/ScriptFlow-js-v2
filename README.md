# ScriptFlow.js - Visual Programming for JavaScript

https://horrelltech.github.io/ScriptFlow-js-v2/editor.html

ScriptFlow is a modern, web-based visual programming environment that makes JavaScript development accessible to both beginners and experienced developers. It allows you to create JavaScript code by connecting visual blocks in a drag-and-drop interface, similar to Scratch or Blueprints in Unreal Engine, but tailored for web development.

## Key Features

- **Visual Block-Based Programming**: Create code by connecting blocks rather than typing
- **Real-Time Code Generation**: See your visual blocks transform into JavaScript instantly
- **Embeddable Modal Interface**: Integrate ScriptFlow directly into your own applications
- **Standalone Editor Mode**: Use as a full-screen development environment
- **Tutorial System**: Interactive guided tutorial for beginners
- **Wide Range of Block Types**: From basic variables to DOM manipulation and API calls

## How It Works

ScriptFlow uses a visual block system where each block represents a JavaScript concept, statement, or expression. Blocks can be dragged from the palette onto the workspace and connected to create program flow.

### Core Components

1. **Block Palette**: Contains categories of blocks organized by function (Flow Control, Variables, etc.)
2. **Workspace**: The canvas where you arrange and connect blocks
3. **Code Output**: Shows the generated JavaScript code in real-time

### Block System

Blocks come in several types:

- **Flow blocks**: Control the execution sequence (if statements, loops, etc.)
- **Data blocks**: Represent data values and operations
- **Function blocks**: Define and call functions
- **Class blocks**: Handle object-oriented concepts
- **DOM blocks**: Interact with the webpage elements

### Connection System

Blocks connect through different types of connectors:

- **Flow connectors**: Connect the execution sequence (top/bottom of blocks)
- **Data connectors**: Pass values between blocks (left/right sides of blocks)
- **Branch connectors**: Special flow outputs for conditional paths (if/else, loops)

## Integration Options

### Modal Embedding

Use ScriptFlow as a modal dialog within your existing applications:

```javascript
const modal = new ScriptFlowModal({
    title: 'ScriptFlow Editor',
    width: '90%',
    height: '90%',
    onSave: function(code) {
        // Do something with the generated code
        console.log(code);
    }
});

modal.open();
```

### Standalone Mode

Run ScriptFlow as a full-screen editor by opening `editor.html` directly.

## Technical Implementation

ScriptFlow consists of several key files:

- **blocks.js**: Defines all block types, their appearance, behavior, and code generation
- **script.js**: Core engine handling the workspace, connections, and interactions
- **scriptflow-modal.js**: Wrapper for embedding in other applications
- **editor.html**: Standalone editor page
- **style.css**: Visual styling

### Block Definition Structure

Each block is defined with a consistent structure including:

```javascript
"block_type": {
    type: "block_type",
    label: "Human-readable Label",
    color: "#hexcolor",
    category: "Block Category",
    hasFlowIn: true/false,
    hasFlowOut: true/false,
    inputs: [
        // Input field definitions
    ],
    outputs: [
        // Output definitions
    ],
    toCode: function(block) {
        // Code generation logic
        return "generated JavaScript code;";
    }
}
```

### Code Generation

ScriptFlow generates code by traversing the connected blocks in order, starting from "Start" blocks. Each block's `toCode()` function determines how it translates to JavaScript, creating a clean, properly indented output.

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern browser
3. Click "Open ScriptFlow Modal" or "Open Standalone Version"
4. Try the interactive tutorial by clicking the "?" button in the workspace controls
5. Start dragging blocks onto the workspace and connecting them
6. Click "Generate Code" to see the JavaScript output

## Browser Compatibility

ScriptFlow works best in modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Web Storage API
- SVG manipulation

## Future Development

- Block library expansion
- Project saving to cloud storage
- Collaborative editing
- Mobile-responsive design
- More integration options (React/Vue components)
- Different programming languages

## License

MIT License - See LICENSE file for details
