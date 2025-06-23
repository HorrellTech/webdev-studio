// WebDev Studio Diagnostic Script
// Run this in the browser console to check functionality

console.log('=== WebDev Studio Diagnostic ===');

// Check if all components are loaded
const components = [
    'fileSystem',
    'codeEditor', 
    'fileExplorer',
    'settingsManager',
    'previewManager',
    'chatGPT',
    'webDevStudio'
];

console.log('Component Status:');
components.forEach(comp => {
    const exists = !!window[comp];
    console.log(`${exists ? '✓' : '✗'} ${comp}: ${exists ? 'OK' : 'MISSING'}`);
});

// Check DOM elements
console.log('\nDOM Elements:');
const elements = [
    { name: 'Menu Items', selector: '.menu-item', expected: 4 },
    { name: 'Dropdown Menus', selector: '.dropdown-menu', expected: 4 },
    { name: 'Panel Resizers', selector: '.panel-resizer', expected: 2 },
    { name: 'File Tree', selector: '#fileTree', expected: 1 },
    { name: 'Code Editor', selector: '#codeEditor', expected: 1 },
    { name: 'Panel Collapse Buttons', selector: '.panel-collapse', expected: 2 }
];

elements.forEach(el => {
    const found = document.querySelectorAll(el.selector).length;
    const status = found >= el.expected ? '✓' : '✗';
    console.log(`${status} ${el.name}: ${found}/${el.expected}`);
});

// Test menu functionality
console.log('\nTesting Menu Functionality:');
function testMenu(menuName) {
    const menuItem = document.querySelector(`[data-menu="${menuName}"]`);
    if (menuItem) {
        console.log(`Testing ${menuName} menu...`);
        menuItem.click();
        
        setTimeout(() => {
            const dropdown = document.getElementById(menuName + 'Menu');
            if (dropdown && dropdown.classList.contains('show')) {
                console.log(`✓ ${menuName} menu works`);
                // Close the menu
                document.body.click();
            } else {
                console.log(`✗ ${menuName} menu failed`);
            }
        }, 100);
    } else {
        console.log(`✗ ${menuName} menu item not found`);
    }
}

// Test all menus
['file', 'edit', 'view', 'help'].forEach(menu => testMenu(menu));

// Test file system
console.log('\nFile System Status:');
if (window.fileSystem) {
    console.log(`✓ Files: ${window.fileSystem.files.size}`);
    console.log(`✓ Folders: ${window.fileSystem.folders.size}`);
    
    // List files
    console.log('Files in system:');
    window.fileSystem.getAllFiles().forEach(file => {
        console.log(`  - ${file.path} (${file.size} bytes)`);
    });
} else {
    console.log('✗ FileSystem not available');
}

// Test resizers
console.log('\nTesting Resizers:');
const leftResizer = document.querySelector('.left-resizer');
const rightResizer = document.querySelector('.right-resizer');

if (leftResizer) {
    const style = window.getComputedStyle(leftResizer);
    console.log(`✓ Left resizer cursor: ${style.cursor}`);
} else {
    console.log('✗ Left resizer not found');
}

if (rightResizer) {
    const style = window.getComputedStyle(rightResizer);
    console.log(`✓ Right resizer cursor: ${style.cursor}`);
} else {
    console.log('✗ Right resizer not found');
}

// Test CodeMirror
console.log('\nCodeMirror Status:');
if (window.CodeMirror) {
    console.log('✓ CodeMirror library loaded');
    if (window.codeEditor && window.codeEditor.editor) {
        console.log('✓ CodeMirror editor instance created');
    } else {
        console.log('✗ CodeMirror editor instance not found');
    }
} else {
    console.log('✗ CodeMirror library not loaded');
}

console.log('\n=== End Diagnostic ===');

// Return a summary object
const summary = {
    components: components.reduce((acc, comp) => {
        acc[comp] = !!window[comp];
        return acc;
    }, {}),
    elements: elements.reduce((acc, el) => {
        acc[el.name] = document.querySelectorAll(el.selector).length;
        return acc;
    }, {}),
    fileSystem: window.fileSystem ? {
        files: window.fileSystem.files.size,
        folders: window.fileSystem.folders.size
    } : null,
    codeMirror: !!window.CodeMirror
};

console.log('Summary object returned:', summary);
return summary;
