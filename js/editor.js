// Code Editor functionality using CodeMirror

class CodeEditor {
    constructor() {
        this.editor = null;
        this.currentFile = null;
        this.tabs = new Map();
        this.settings = {
            fontSize: 14,
            tabSize: 2,
            wordWrap: false,
            lineNumbers: true,
            theme: 'material-darker'
        };
        
        this.initialize();
    }
    
    initialize() {
        // Initialize CodeMirror
        const textarea = document.getElementById('codeEditor');
        
        this.editor = CodeMirror.fromTextArea(textarea, {
            lineNumbers: this.settings.lineNumbers,
            mode: 'htmlmixed',
            theme: this.settings.theme,
            autoCloseBrackets: true,
            autoCloseTags: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            indentUnit: this.settings.tabSize,
            lineWrapping: this.settings.wordWrap,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            styleActiveLine: true,
            // Add mobile-specific options
            inputStyle: 'contenteditable',
            spellcheck: false,
            autocorrect: false,
            autocapitalize: false,
            extraKeys: {
                'Ctrl-S': () => this.saveCurrentFile(),
                'Ctrl-F': 'findPersistent',
                'Ctrl-H': 'replace',
                'Ctrl-G': 'jumpToLine',
                'Ctrl-/': 'toggleComment',
                'Ctrl-D': 'selectNextOccurrence',
                'Ctrl-Shift-D': 'selectAllOccurrences',
                'Tab': 'indentMore',
                'Shift-Tab': 'indentLess',
                'F11': () => this.toggleFullscreen(),
                'Esc': () => this.exitFullscreen(),
                // Add mobile backspace handling
                'Backspace': (cm) => {
                    if (cm.somethingSelected()) {
                        cm.replaceSelection('');
                    } else {
                        const cursor = cm.getCursor();
                        const line = cm.getLine(cursor.line);
                        if (cursor.ch > 0) {
                            cm.replaceRange('', {line: cursor.line, ch: cursor.ch - 1}, cursor);
                        } else if (cursor.line > 0) {
                            const prevLine = cm.getLine(cursor.line - 1);
                            cm.replaceRange('', {line: cursor.line - 1, ch: prevLine.length}, {line: cursor.line, ch: 0});
                        }
                    }
                }
            }
        });
        
        // Set up event listeners
        this.setupEventListeners();
    
        // Add mobile optimizations
        this.setupMobileOptimizations();
        
        // Apply font size
        this.updateFontSize();
        
        // Listen for file system changes
        fileSystem.watch((event, data) => {
            this.handleFileSystemEvent(event, data);
        });
    }

    setupMobileOptimizations() {
        // Detect if on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && this.editor) {
            // Disable problematic mobile features
            const input = this.editor.getInputField();
            if (input) {
                input.setAttribute('autocomplete', 'off');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
                input.setAttribute('spellcheck', 'false');
            }
            
            // Add mobile-specific event handlers
            this.editor.on('beforeChange', (cm, change) => {
                // Prevent certain changes that cause issues on mobile
                if (change.origin === '+input' && change.text.length === 1 && change.text[0] === '') {
                    // This is likely a mobile backspace issue
                    return;
                }
            });
            
            // Refresh editor on orientation change
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.editor.refresh();
                }, 100);
            });
        }
    }
    
    setupEventListeners() {
        // Editor change event
        this.editor.on('change', (instance, changeObj) => {
            if (this.currentFile) {
                this.markTabAsModified(this.currentFile.path);
                this.updateStatusBar();
            }
        });
        
        // Cursor activity
        this.editor.on('cursorActivity', (instance) => {
            this.updateCursorPosition();
        });
        
        // Focus/blur events
        this.editor.on('focus', () => {
            document.getElementById('editorWrapper').classList.add('focused');
        });
        
        this.editor.on('blur', () => {
            document.getElementById('editorWrapper').classList.remove('focused');
        });
        
        // Tab bar click events
        document.getElementById('tabBar').addEventListener('click', (e) => {
            const tab = e.target.closest('.tab');
            const closeBtn = e.target.closest('.tab-close');
            
            if (closeBtn && tab) {
                e.stopPropagation();
                this.closeTab(tab.dataset.path);
            } else if (tab) {
                this.switchToTab(tab.dataset.path);
            }
        });
        
        // Welcome screen buttons
        document.getElementById('newProjectBtn')?.addEventListener('click', () => {
            this.createNewFile();
        });
        
        document.getElementById('openProjectBtn')?.addEventListener('click', () => {
            this.openFileDialog();
        });
    }
    
    openFile(file) {
        if (!file) return;
        
        // Create or switch to tab
        if (this.tabs.has(file.path)) {
            this.switchToTab(file.path);
        } else {
            this.createTab(file);
        }
        
        // Set editor content and mode
        this.currentFile = file;
        this.editor.setValue(file.content || '');
        this.setEditorMode(file.path);
        
        // Hide welcome screen and show editor
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('editorWrapper').style.display = 'block';
        
        // Focus editor
        this.editor.focus();
        
        // Update status bar
        this.updateStatusBar();
        this.updateCursorPosition();
    }
    
    createTab(file) {
        const tabBar = document.getElementById('tabBar');
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.path = file.path;
        
        tab.innerHTML = `
            <span class="tab-title">${this.getFileName(file.path)}</span>
            <button class="tab-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        tabBar.appendChild(tab);
        this.tabs.set(file.path, { element: tab, file: file, modified: false });
        
        // Make this tab active
        this.setActiveTab(file.path);
    }
    
    switchToTab(filePath) {
        const tabData = this.tabs.get(filePath);
        if (!tabData) return;
        
        // Save current file content if switching from another file
        if (this.currentFile && this.currentFile.path !== filePath) {
            this.saveCurrentContent();
        }
        
        // Switch to new file
        this.currentFile = tabData.file;
        this.editor.setValue(tabData.file.content || '');
        this.setEditorMode(filePath);
        this.setActiveTab(filePath);
        
        // Update UI
        this.updateStatusBar();
        this.updateCursorPosition();
        this.editor.focus();
    }
    
    closeTab(filePath) {
        const tabData = this.tabs.get(filePath);
        if (!tabData) return;
        
        // Check if file is modified
        if (tabData.modified) {
            const save = confirm(`${this.getFileName(filePath)} has unsaved changes. Save before closing?`);
            if (save) {
                this.saveFile(filePath);
            }
        }
        
        // Remove tab element
        tabData.element.remove();
        this.tabs.delete(filePath);
        
        // If this was the current file, switch to another tab or show welcome screen
        if (this.currentFile && this.currentFile.path === filePath) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                this.currentFile = null;
                document.getElementById('welcomeScreen').style.display = 'flex';
                document.getElementById('editorWrapper').style.display = 'none';
                this.updateStatusBar();
            }
        }
    }
    
    setActiveTab(filePath) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to current tab
        const tabData = this.tabs.get(filePath);
        if (tabData) {
            tabData.element.classList.add('active');
        }
    }
    
    markTabAsModified(filePath) {
        const tabData = this.tabs.get(filePath);
        if (tabData) {
            tabData.modified = true;
            tabData.element.classList.add('modified');
        }
    }
    
    markTabAsSaved(filePath) {
        const tabData = this.tabs.get(filePath);
        if (tabData) {
            tabData.modified = false;
            tabData.element.classList.remove('modified');
        }
    }
    
    saveCurrentFile() {
        if (!this.currentFile) return;
        
        const content = this.editor.getValue();
        fileSystem.writeFile(this.currentFile.path, content);
        this.currentFile.content = content;
        
        this.markTabAsSaved(this.currentFile.path);
        this.updateStatusBar();
        
        // Show save notification
        this.showNotification('File saved successfully', 'success');
    }
    
    saveCurrentContent() {
        if (this.currentFile) {
            const content = this.editor.getValue();
            this.currentFile.content = content;
            fileSystem.writeFile(this.currentFile.path, content);
        }
    }
    
    saveFile(filePath) {
        const tabData = this.tabs.get(filePath);
        if (tabData) {
            if (filePath === this.currentFile?.path) {
                this.saveCurrentFile();
            } else {
                fileSystem.writeFile(filePath, tabData.file.content);
                this.markTabAsSaved(filePath);
            }
        }
    }
    
    createNewFile() {
        const fileName = prompt('Enter file name:', 'untitled.html');
        if (!fileName) return;
        
        const filePath = '/' + fileName;
        const file = fileSystem.createFile(filePath, '');
        this.openFile(file);
    }
    
    openFileDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.html,.css,.js,.txt,.json,.md,.xml,.svg';
        
        input.onchange = (e) => {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    const virtualFile = fileSystem.createFile('/' + file.name, content);
                    this.openFile(virtualFile);
                };
                reader.readAsText(file);
            });
        };
        
        input.click();
    }
    
    setEditorMode(filePath) {
        const extension = this.getFileExtension(filePath);
        let mode = 'text/plain';
        
        switch (extension.toLowerCase()) {
            case 'html':
            case 'htm':
                mode = 'text/html';
                break;
            case 'css':
                mode = 'text/css';
                break;
            case 'js':
            case 'json':
                mode = 'application/javascript';
                break;
            case 'xml':
            case 'svg':
                mode = 'application/xml';
                break;
            case 'md':
                mode = 'text/x-markdown';
                break;
        }
        
        this.editor.setOption('mode', mode);
    }
    
    updateStatusBar() {
        const fileStatus = document.getElementById('fileStatus');
        const fileType = document.getElementById('fileType');
        
        if (this.currentFile) {
            const extension = this.getFileExtension(this.currentFile.path);
            const isModified = this.tabs.get(this.currentFile.path)?.modified;
            
            fileStatus.textContent = isModified ? 'Modified' : 'Saved';
            fileType.textContent = extension ? extension.toUpperCase() : 'Plain Text';
        } else {
            fileStatus.textContent = 'Ready';
            fileType.textContent = 'No file open';
        }
    }
    
    updateCursorPosition() {
        const cursorPosition = document.getElementById('cursorPosition');
        if (this.editor && cursorPosition) {
            const cursor = this.editor.getCursor();
            cursorPosition.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
        }
    }
    
    updateFontSize() {
        if (this.editor) {
            const wrapper = this.editor.getWrapperElement();
            wrapper.style.fontSize = this.settings.fontSize + 'px';
        }
    }
    
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        if (this.editor) {
            if (newSettings.fontSize) {
                this.updateFontSize();
            }
            if (newSettings.tabSize) {
                this.editor.setOption('indentUnit', this.settings.tabSize);
            }
            if (newSettings.wordWrap !== undefined) {
                this.editor.setOption('lineWrapping', this.settings.wordWrap);
            }
            if (newSettings.lineNumbers !== undefined) {
                this.editor.setOption('lineNumbers', this.settings.lineNumbers);
            }
            if (newSettings.theme) {
                this.editor.setOption('theme', this.settings.theme);
            }
        }
    }
    
    toggleFullscreen() {
        const editorWrapper = document.getElementById('editorWrapper');
        if (editorWrapper.classList.contains('fullscreen')) {
            this.exitFullscreen();
        } else {
            editorWrapper.classList.add('fullscreen');
            document.body.classList.add('editor-fullscreen');
            this.editor.refresh();
        }
    }
    
    exitFullscreen() {
        const editorWrapper = document.getElementById('editorWrapper');
        editorWrapper.classList.remove('fullscreen');
        document.body.classList.remove('editor-fullscreen');
        this.editor.refresh();
    }
    
    handleFileSystemEvent(event, data) {
        switch (event) {
            case 'file-modified':
                // Refresh tab if file is open
                if (this.tabs.has(data.path)) {
                    const tabData = this.tabs.get(data.path);
                    tabData.file = data;
                }
                break;
            case 'file-deleted':
                // Close tab if file is deleted
                if (this.tabs.has(data.path)) {
                    this.closeTab(data.path);
                }
                break;
            case 'file-renamed':
                // Update tab if file is renamed
                if (this.tabs.has(data.oldPath)) {
                    const tabData = this.tabs.get(data.oldPath);
                    this.tabs.delete(data.oldPath);
                    this.tabs.set(data.newPath, tabData);
                    
                    tabData.element.dataset.path = data.newPath;
                    tabData.element.querySelector('.tab-title').textContent = this.getFileName(data.newPath);
                    tabData.file = data.file;
                    
                    if (this.currentFile && this.currentFile.path === data.oldPath) {
                        this.currentFile = data.file;
                    }
                }
                break;
        }
    }
    
    // Utility functions
    getFileName(filePath) {
        return filePath.split('/').pop() || '';
    }
    
    getFileExtension(filePath) {
        const fileName = this.getFileName(filePath);
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1) : '';
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">×</button>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
            color: white;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    // Public API methods
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }
    
    setValue(content) {
        if (this.editor) {
            this.editor.setValue(content);
        }
    }
    
    refresh() {
        if (this.editor) {
            this.editor.refresh();
        }
    }
    
    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }
    
    undo() {
        if (this.editor) {
            this.editor.undo();
        }
    }
    
    redo() {
        if (this.editor) {
            this.editor.redo();
        }
    }
    
    find() {
        if (this.editor) {
            this.editor.execCommand('find');
        }
    }
    
    replace() {
        if (this.editor) {
            this.editor.execCommand('replace');
        }
    }
}

// Add CSS for notifications
const notificationCSS = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    /* Mobile CodeMirror fixes */
    @media (max-width: 768px) {
        .CodeMirror {
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
        }
        
        .CodeMirror-scroll {
            -webkit-overflow-scrolling: touch;
        }
        
        .CodeMirror textarea {
            -webkit-appearance: none;
            border: none;
            outline: none;
            resize: none;
        }
        
        .CodeMirror-focused .CodeMirror-selected {
            background: #3390ff;
        }
    }
    
    .editor-fullscreen .app > *:not(.main-container) {
        display: none;
    }
    
    .editor-fullscreen .main-container .panel {
        display: none;
    }
    
    .editor-fullscreen .editor-wrapper.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: var(--primary-bg);
    }
`;

const editorStyle = document.createElement('style');
editorStyle.textContent = notificationCSS;
document.head.appendChild(editorStyle);

// Create global editor instance
window.codeEditor = new CodeEditor();
