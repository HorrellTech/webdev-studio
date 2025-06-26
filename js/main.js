// Main application controller

class WebDevStudio {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.panels = {
            left: { collapsed: false, width: 300 },
            right: { collapsed: false, width: 350 }
        };

        this.initialize();
    }

    initialize() {
        console.log('WebDevStudio initialize() called');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
        } else {
            console.log('DOM ready, initializing components immediately...');
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            // Initialize components in order
            this.setupMenuSystem();
            this.setupToolbar();
            this.setupPanelResizing();
            this.setupKeyboardShortcuts();
            this.setupMobileInterface();
            this.loadPanelStates();

            // Mark as initialized
            this.isInitialized = true;

            // Show welcome message
            this.showWelcomeMessage();

            console.log('WebDev Studio initialized successfully');

        } catch (error) {
            console.error('Failed to initialize WebDev Studio:', error);
            this.showErrorMessage('Failed to initialize the application. Please refresh the page.');
        }
    }

    setupMenuSystem() {
        console.log('Setting up menu system...');

        const menuItems = document.querySelectorAll('.menu-item');
        const dropdownMenus = document.querySelectorAll('.dropdown-menu');

        console.log(`Found ${menuItems.length} menu items`);
        console.log(`Found ${dropdownMenus.length} dropdown menus`);

        // Menu item click handlers
        menuItems.forEach(item => {
            console.log(`Adding click handler to menu item: ${item.dataset.menu}`);
            item.addEventListener('click', (e) => {
                console.log(`Menu item clicked: ${item.dataset.menu}`);
                e.stopPropagation();
                const menuType = item.dataset.menu;
                this.toggleDropdownMenu(menuType, item);
            });
        });

        // Menu option click handlers
        dropdownMenus.forEach(menu => {
            menu.addEventListener('click', (e) => {
                const option = e.target.closest('.menu-option');
                if (option) {
                    console.log(`Menu option clicked: ${option.dataset.action}`);
                    const action = option.dataset.action;
                    this.handleMenuAction(action);
                    this.hideAllDropdownMenus();
                }
            });
        });

        // Hide menus when clicking elsewhere
        document.addEventListener('click', () => {
            this.hideAllDropdownMenus();
        });

        console.log('Menu system setup complete');
    }

    toggleDropdownMenu(menuType, menuItem) {
        console.log(`toggleDropdownMenu called for: ${menuType}`);

        const menu = document.getElementById(menuType + 'Menu');
        console.log(`Menu element found: ${!!menu}`);

        if (!menu) {
            console.error(`Menu not found: ${menuType}Menu`);
            // Show visual feedback
            const debugInfo = document.getElementById('debugInfo');
            if (debugInfo) {
                debugInfo.textContent = `ERROR: ${menuType} menu not found!`;
                setTimeout(() => debugInfo.textContent = '', 3000);
            }
            return;
        }

        // Hide all other menus
        this.hideAllDropdownMenus();

        // Position and show the menu
        const rect = menuItem.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = (rect.bottom + 1) + 'px';
        menu.classList.add('show');

        // Update menu item state
        menuItem.classList.add('active');

        console.log(`Menu ${menuType} shown at position: ${rect.left}, ${rect.bottom + 1}`);

        // Visual feedback
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.textContent = `${menuType} menu opened`;
            setTimeout(() => debugInfo.textContent = '', 2000);
        }
    }

    hideAllDropdownMenus() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new':
                window.codeEditor?.createNewFile();
                break;
            case 'open':
                window.codeEditor?.openFileDialog();
                break;
            case 'save':
                window.codeEditor?.saveCurrentFile();
                break;
            case 'save-as':
                this.saveFileAs();
                break;
            case 'import':
                this.importProject();
                break;
            case 'export':
                this.exportProject();
                break;
            case 'google-drive':
                window.googleDriveManager?.openDriveModal();
                break;
            case 'undo':
                window.codeEditor?.undo();
                break;
            case 'redo':
                window.codeEditor?.redo();
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
            case 'find':
                window.codeEditor?.find();
                break;
            case 'replace':
                window.codeEditor?.replace();
                break;
            case 'toggle-left-panel':
                this.togglePanel('left');
                break;
            case 'toggle-right-panel':
                this.togglePanel('right');
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'zen-mode':
                this.toggleZenMode();
                break;
            case 'about':
                this.showAboutDialog();
                break;
            case 'shortcuts':
                this.showShortcutsDialog();
                break;
            case 'documentation':
                this.openDocumentation();
                break;
        }
    }

    setupToolbar() {
        // New file button
        document.getElementById('newFileBtn').addEventListener('click', () => {
            window.codeEditor?.createNewFile();
        });

        // Open file button
        document.getElementById('openFileBtn').addEventListener('click', () => {
            window.codeEditor?.openFileDialog();
        });
        // Save file button
        document.getElementById('saveFileBtn').addEventListener('click', () => {
            window.codeEditor?.saveCurrentFile();
        });

        // Import project button
        document.getElementById('importProjectBtn').addEventListener('click', () => {
            this.importProject();
        });

        // Export project button
        document.getElementById('exportProjectBtn').addEventListener('click', () => {
            this.exportProject();
        });

        // Undo button
        document.getElementById('undoBtn').addEventListener('click', () => {
            window.codeEditor?.undo();
        });

        // Redo button
        document.getElementById('redoBtn').addEventListener('click', () => {
            window.codeEditor?.redo();
        });

        // Preview button
        document.getElementById('previewBtn').addEventListener('click', () => {
            window.previewManager?.openPreview();
        });

        // Run button
        document.getElementById('runBtn').addEventListener('click', () => {
            window.previewManager?.openPreview();
        });

        // Diagnostic button
        document.getElementById('diagnosticBtn').addEventListener('click', () => {
            this.runDiagnostic();
        });

        console.log('Toolbar setup complete');
    }

    setupPanelResizing() {
        console.log('Setting up panel resizing...');

        const leftResizer = document.querySelector('.left-resizer');
        const rightResizer = document.querySelector('.right-resizer');

        console.log(`Left resizer found: ${!!leftResizer}`);
        console.log(`Right resizer found: ${!!rightResizer}`);

        if (leftResizer) {
            console.log('Setting up left resizer');
            this.setupResizer(leftResizer, 'left');
        }

        if (rightResizer) {
            console.log('Setting up right resizer');
            this.setupResizer(rightResizer, 'right');
        }

        // Panel collapse buttons
        document.querySelectorAll('.panel-collapse').forEach(btn => {
            console.log(`Adding collapse handler for panel: ${btn.dataset.panel}`);
            btn.addEventListener('click', () => {
                console.log(`Panel collapse button clicked: ${btn.dataset.panel}`);
                const panelSide = btn.dataset.panel;
                this.togglePanel(panelSide);
            });
        });

        console.log('Panel resizing setup complete');
    }

    setupResizer(resizer, side) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;

            const panel = document.getElementById(side + 'Panel');
            startWidth = parseInt(getComputedStyle(panel).width);

            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const panel = document.getElementById(side + 'Panel');
            const deltaX = side === 'left' ? e.clientX - startX : startX - e.clientX;
            const newWidth = Math.max(200, Math.min(800, startWidth + deltaX));

            panel.style.width = newWidth + 'px';
            this.panels[side].width = newWidth;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save panel width
                this.savePanelStates();

                // Refresh editor
                setTimeout(() => {
                    window.codeEditor?.refresh();
                }, 100);
            }
        });
    }

    togglePanel(side) {
        const panel = document.getElementById(side + 'Panel');
        const isCollapsed = panel.classList.contains('collapsed');

        if (isCollapsed) {
            panel.classList.remove('collapsed');
            panel.style.width = this.panels[side].width + 'px';
            this.panels[side].collapsed = false;
        } else {
            panel.classList.add('collapsed');
            this.panels[side].collapsed = true;
        }

        // Update collapse button icon
        const collapseBtn = panel.querySelector('.panel-collapse i');
        if (collapseBtn) {
            if (side === 'left') {
                collapseBtn.className = isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            } else {
                collapseBtn.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            }
        }

        // Save state and refresh editor
        this.savePanelStates();
        setTimeout(() => {
            window.codeEditor?.refresh();
        }, 300);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default browser shortcuts that conflict with our app
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        if (!e.shiftKey) {
                            e.preventDefault();
                            window.codeEditor?.createNewFile();
                        } break;
                    case 's':
                        e.preventDefault();
                        window.codeEditor?.saveCurrentFile();
                        break;
                    case 'i':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.importProject();
                        }
                        break;
                    case 'o':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.exportProject();
                        } else {
                            e.preventDefault();
                            window.codeEditor?.openFileDialog();
                        }
                        break;
                    case 'p':
                        if (e.shiftKey) {
                            e.preventDefault();
                            window.previewManager?.openPreview();
                        }
                        break;
                    case 'e':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.togglePanel('left');
                        }
                        break;
                    case 'a':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.togglePanel('right');
                        }
                        break;
                    case 'd':
                        if (e.shiftKey) {
                            e.preventDefault();
                            window.googleDriveManager?.openDriveModal();
                        }
                        break;
                    case ',':
                        e.preventDefault();
                        window.settingsManager?.openSettingsModal();
                        break;
                }
            }

            // Function keys
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    setupMobileInterface() {
        // Add mobile menu toggle button for small screens
        const menubarLeft = document.querySelector('.menubar-left');
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.style.display = 'none';

        menubarLeft.insertBefore(mobileToggle, menubarLeft.firstChild);

        // Create mobile menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `
            <div class="mobile-menu-item" data-action="toggle-left-panel">
                <i class="fas fa-folder-tree"></i>
                <span>Explorer</span>
            </div>
            <div class="mobile-menu-item" data-action="toggle-right-panel">
                <i class="fas fa-robot"></i>
                <span>AI Assistant</span>
            </div>
            <div class="mobile-menu-item" data-action="new">
                <i class="fas fa-file"></i>
                <span>New File</span>
            </div>
            <div class="mobile-menu-item" data-action="open">
                <i class="fas fa-folder-open"></i>
                <span>Open File</span>
            </div>            <div class="mobile-menu-item" data-action="save">
                <i class="fas fa-save"></i>
                <span>Save</span>
            </div>
            <div class="mobile-menu-item" data-action="import">
                <i class="fas fa-upload"></i>
                <span>Import Project</span>
            </div>
            <div class="mobile-menu-item" data-action="export">
                <i class="fas fa-download"></i>
                <span>Export Project</span>
            </div>
            <div class="mobile-menu-item" data-action="google-drive">
                <i class="fab fa-google-drive"></i>
                <span>Google Drive</span>
            </div>
            <div class="mobile-menu-item" data-action="preview">
                <i class="fas fa-eye"></i>
                <span>Preview</span>
            </div>
        `;

        document.body.appendChild(mobileMenu);

        // Mobile menu toggle
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('show');
        });

        // Mobile menu item clicks
        mobileMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.mobile-menu-item');
            if (item) {
                const action = item.dataset.action;

                if (action === 'preview') {
                    window.previewManager?.openPreview();
                } else if (action === 'toggle-left-panel') {
                    this.toggleMobilePanel('left');
                } else if (action === 'toggle-right-panel') {
                    this.toggleMobilePanel('right');
                } else {
                    this.handleMenuAction(action);
                }

                mobileMenu.classList.remove('show');
            }
        });

        // Hide mobile menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('show');
            }
        });

        // Panel overlay for mobile
        const panelOverlay = document.createElement('div');
        panelOverlay.className = 'panel-overlay';
        document.body.appendChild(panelOverlay);

        panelOverlay.addEventListener('click', () => {
            this.hideMobilePanels();
        });

        // Handle viewport height changes (for mobile browsers)
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });

        // Prevent zoom on input focus (Android)
        if (/Android/.test(navigator.userAgent)) {
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                        input.style.fontSize = '16px';
                    }
                });
            });
        }

        // Responsive behavior
        this.handleResponsiveLayout();
        window.addEventListener('resize', () => {
            this.handleResponsiveLayout();
        });
    }

    handleResponsiveLayout() {
        const isMobile = window.innerWidth <= 768;
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const menuItems = document.querySelectorAll('.menubar-left .menu-item');

        if (isMobile) {
            mobileToggle.style.display = 'block';
            menuItems.forEach(item => item.style.display = 'none');
        } else {
            mobileToggle.style.display = 'none';
            menuItems.forEach(item => item.style.display = 'flex');
            this.hideMobilePanels();
        }
    }

    openSettings(activeTab = 'general') {
        const modal = document.getElementById('settingsModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Switch to the specified tab
        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));

        const targetTab = document.querySelector(`[data-tab="${activeTab}"]`);
        const targetPanel = document.getElementById(`${activeTab}Settings`);

        if (targetTab && targetPanel) {
            targetTab.classList.add('active');
            targetPanel.classList.add('active');
        }
    }

    toggleMobilePanel(side) {
        const panel = document.getElementById(side + 'Panel');
        const overlay = document.querySelector('.panel-overlay');
        const isShowing = panel.classList.contains('show');

        // Hide other panel first
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherPanel = document.getElementById(otherSide + 'Panel');
        otherPanel.classList.remove('show');

        if (isShowing) {
            panel.classList.remove('show');
            overlay.classList.remove('show');
        } else {
            panel.classList.add('show');
            overlay.classList.add('show');
        }
    }

    hideMobilePanels() {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('show');
        });
        document.querySelector('.panel-overlay').classList.remove('show');
    }

    savePanelStates() {
        const states = {
            left: {
                collapsed: this.panels.left.collapsed,
                width: this.panels.left.width
            },
            right: {
                collapsed: this.panels.right.collapsed,
                width: this.panels.right.width
            }
        };
        localStorage.setItem('webdev-studio-panels', JSON.stringify(states));
    }

    loadPanelStates() {
        const saved = localStorage.getItem('webdev-studio-panels');
        if (saved) {
            try {
                const states = JSON.parse(saved);

                Object.keys(states).forEach(side => {
                    const panel = document.getElementById(side + 'Panel');
                    const state = states[side];

                    if (state.width) {
                        panel.style.width = state.width + 'px';
                        this.panels[side].width = state.width;
                    }

                    if (state.collapsed) {
                        panel.classList.add('collapsed');
                        this.panels[side].collapsed = true;

                        // Update collapse button icon
                        const collapseBtn = panel.querySelector('.panel-collapse i');
                        if (collapseBtn) {
                            collapseBtn.className = side === 'left' ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
                        }
                    }
                });

            } catch (error) {
                console.warn('Failed to load panel states:', error);
            }
        }
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    toggleZenMode() {
        document.body.classList.toggle('zen-mode');

        if (document.body.classList.contains('zen-mode')) {
            this.showNotification('Zen mode enabled. Press Escape to exit.', 'info');
        }

        // Refresh editor after mode change
        setTimeout(() => {
            window.codeEditor?.refresh();
        }, 100);
    }

    saveFileAs() {
        const currentFile = window.codeEditor?.currentFile;
        if (!currentFile) {
            this.showNotification('No file is currently open', 'warning');
            return;
        }

        const newName = prompt('Save as:', currentFile.path.split('/').pop());
        if (!newName) return;

        const newPath = '/' + newName;
        const content = window.codeEditor.getValue();

        const newFile = fileSystem.createFile(newPath, content);
        window.codeEditor.openFile(newFile);

        this.showNotification(`File saved as ${newName}`, 'success');
    }

    async exportProject() {
        try {
            const zipBlob = await fileSystem.exportProject();

            // Create download link
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `webdev-project-${new Date().toISOString().split('T')[0]}.zip`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('Project exported as ZIP file', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Failed to export project', 'error');
        }
    }

    importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                let success = false;

                if (file.name.endsWith('.zip')) {
                    // Import ZIP file
                    success = await window.fileSystem.importProject(file);
                } else if (file.name.endsWith('.json')) {
                    // Import JSON file (legacy)
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const projectData = event.target.result;
                            success = await window.fileSystem.importProject(projectData);

                            if (success) {
                                // Close all open tabs
                                if (window.codeEditor) {
                                    Array.from(window.codeEditor.tabs.keys()).forEach(path => {
                                        window.codeEditor.closeTab(path);
                                    });
                                }

                                this.showNotification('Project imported successfully', 'success');
                            } else {
                                throw new Error('Invalid project file format');
                            }
                        } catch (error) {
                            console.error('Import failed:', error);
                            this.showNotification('Failed to import project: ' + error.message, 'error');
                        }
                    };
                    reader.readAsText(file);
                    return;
                }

                if (success) {
                    // Close all open tabs
                    if (window.codeEditor) {
                        Array.from(window.codeEditor.tabs.keys()).forEach(path => {
                            window.codeEditor.closeTab(path);
                        });
                    }

                    this.showNotification('Project imported successfully', 'success');
                } else {
                    throw new Error('Failed to import project');
                }
            } catch (error) {
                console.error('Import failed:', error);
                this.showNotification('Failed to import project: ' + error.message, 'error');
            }
        };

        input.click();
    }

    showAboutDialog() {
        const aboutContent = `
            <div style="text-align: center; padding: 20px;">
                <h2>WebDev Studio</h2>
                <p>Version 1.0.0</p>
                <p>A powerful web-based development environment</p>
                <br>
                <p><strong>Features:</strong></p>
                <ul style="text-align: left; margin: 16px 0;">
                    <li>Visual Studio Code-like interface</li>
                    <li>Syntax highlighting with CodeMirror</li>
                    <li>File management system</li>
                    <li>Live preview functionality</li>
                    <li>AI-powered assistant</li>
                    <li>Customizable themes</li>
                    <li>Mobile responsive design</li>
                </ul>
                <br>
                <p>Built with modern web technologies</p>
            </div>
        `;

        this.showModal('About WebDev Studio', aboutContent);
    }

    showShortcutsDialog() {
        const shortcutsContent = `
            <div style="padding: 20px;">
                <h3>Keyboard Shortcuts</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                    <div>
                        <h4>File Operations</h4>                        <div class="shortcut-list">
                            <div><kbd>Ctrl+N</kbd> New File</div>
                            <div><kbd>Ctrl+O</kbd> Open File</div>
                            <div><kbd>Ctrl+S</kbd> Save File</div>
                            <div><kbd>Ctrl+Shift+I</kbd> Import Project</div>
                            <div><kbd>Ctrl+Shift+O</kbd> Export Project</div>
                            <div><kbd>Ctrl+Shift+D</kbd> Google Drive</div>
                            <div><kbd>Ctrl+Shift+P</kbd> Preview</div>
                        </div>
                    </div>
                    <div>
                        <h4>Editor</h4>
                        <div class="shortcut-list">
                            <div><kbd>Ctrl+Z</kbd> Undo</div>
                            <div><kbd>Ctrl+Y</kbd> Redo</div>
                            <div><kbd>Ctrl+F</kbd> Find</div>
                            <div><kbd>Ctrl+H</kbd> Replace</div>
                        </div>
                    </div>
                    <div>
                        <h4>Panels</h4>
                        <div class="shortcut-list">
                            <div><kbd>Ctrl+Shift+E</kbd> Toggle Explorer</div>
                            <div><kbd>Ctrl+Shift+A</kbd> Toggle AI Assistant</div>
                        </div>
                    </div>
                    <div>
                        <h4>View</h4>
                        <div class="shortcut-list">
                            <div><kbd>F11</kbd> Fullscreen</div>
                            <div><kbd>Ctrl+,</kbd> Settings</div>
                            <div><kbd>Esc</kbd> Close Modal/Exit</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal('Keyboard Shortcuts', shortcutsContent);
    }

    openDocumentation() {
        window.open('https://github.com/your-username/webdev-studio/blob/main/README.md', '_blank');
    }

    showModal(title, content) {
        const modalId = 'temp-modal-' + Date.now();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="btn-close" onclick="document.getElementById('${modalId}').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showWelcomeMessage() {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.textContent = 'WebDev Studio Loaded';
        }

        console.log('WebDev Studio initialized and welcome message shown');

        // Check component states
        const components = ['fileSystem', 'codeEditor', 'fileExplorer', 'settingsManager', 'previewManager'];
        const componentStatus = components.map(comp => `${comp}: ${!!window[comp]}`).join(' | ');
        console.log('Component status:', componentStatus);

        // Check if elements exist
        const menuItems = document.querySelectorAll('.menu-item').length;
        const resizers = document.querySelectorAll('.panel-resizer').length;
        const fileTree = document.getElementById('fileTree');

        console.log(`Elements: ${menuItems} menu items, ${resizers} resizers, fileTree: ${!!fileTree}`);

        if (debugInfo) {
            debugInfo.textContent += ` | Components: ${components.filter(c => window[c]).length}/${components.length}`;
        }
    }

    runDiagnostic() {
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
        let componentResults = [];
        components.forEach(comp => {
            const exists = !!window[comp];
            console.log(`${exists ? '✓' : '✗'} ${comp}: ${exists ? 'OK' : 'MISSING'}`);
            componentResults.push({ name: comp, status: exists });
        });

        // Check DOM elements
        console.log('DOM Elements:');
        const elements = [
            { name: 'Menu Items', selector: '.menu-item', expected: 4 },
            { name: 'Dropdown Menus', selector: '.dropdown-menu', expected: 4 },
            { name: 'Panel Resizers', selector: '.panel-resizer', expected: 2 },
            { name: 'File Tree', selector: '#fileTree', expected: 1 },
            { name: 'Code Editor', selector: '#codeEditor', expected: 1 },
            { name: 'Panel Collapse Buttons', selector: '.panel-collapse', expected: 2 }
        ];

        let elementResults = [];
        elements.forEach(el => {
            const found = document.querySelectorAll(el.selector).length;
            const status = found >= el.expected;
            console.log(`${status ? '✓' : '✗'} ${el.name}: ${found}/${el.expected}`);
            elementResults.push({ name: el.name, found, expected: el.expected, status });
        });

        // Test file system
        console.log('File System Status:');
        let fileSystemStatus = null;
        if (window.fileSystem) {
            fileSystemStatus = {
                files: window.fileSystem.files.size,
                folders: window.fileSystem.folders.size
            };
            console.log(`✓ Files: ${fileSystemStatus.files}`);
            console.log(`✓ Folders: ${fileSystemStatus.folders}`);
        } else {
            console.log('✗ FileSystem not available');
        }

        // Show results in UI
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            const failedComponents = componentResults.filter(c => !c.status).length;
            const failedElements = elementResults.filter(e => !e.status).length;
            debugInfo.textContent = `Diagnostic: ${failedComponents + failedElements} issues found`;
            debugInfo.style.color = failedComponents + failedElements === 0 ? '#4ec9b0' : '#f44747';
        }

        console.log('=== End Diagnostic ===');

        // Test menu functionality
        this.testMenuFunctionality();
    }

    testMenuFunctionality() {
        console.log('Testing menu functionality...');

        const testMenu = (menuName) => {
            const menuItem = document.querySelector(`[data-menu="${menuName}"]`);
            if (menuItem) {
                console.log(`Testing ${menuName} menu...`);
                // Simulate click
                menuItem.click();

                setTimeout(() => {
                    const dropdown = document.getElementById(menuName + 'Menu');
                    if (dropdown && dropdown.classList.contains('show')) {
                        console.log(`✓ ${menuName} menu works`);
                        // Close the menu
                        this.hideAllDropdownMenus();
                    } else {
                        console.log(`✗ ${menuName} menu failed - dropdown not shown`);
                    }
                }, 50);
            } else {
                console.log(`✗ ${menuName} menu item not found`);
            }
        };

        // Test all menus with delays
        setTimeout(() => testMenu('file'), 100);
        setTimeout(() => testMenu('edit'), 300);
        setTimeout(() => testMenu('view'), 500);
        setTimeout(() => testMenu('help'), 700);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `app-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">×</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--info-color)'};
            color: white;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
            z-index: 25000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 350px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }
}

// Add additional CSS for zen mode and notifications
const additionalCSS = `
    .zen-mode .menubar,
    .zen-mode .toolbar,
    .zen-mode .statusbar {
        display: none !important;
    }
    
    .zen-mode .main-container {
        height: 100vh !important;
    }
    
    .zen-mode .left-panel,
    .zen-mode .right-panel {
        display: none !important;
    }
    
    .shortcut-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
    }
    
    .shortcut-list > div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: var(--font-size-sm);
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 16px;
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
    
    @media (max-width: 768px) {
        .mobile-menu-toggle {
            display: block !important;
        }
        
        .menubar-left .menu-item {
            display: none !important;
        }
    }
`;

const mainStyle = document.createElement('style');
mainStyle.textContent = additionalCSS;
document.head.appendChild(mainStyle);

// Initialize the application
const app = new WebDevStudio();

// Make it globally accessible
window.webDevStudio = app;

// Handle page visibility changes to pause/resume certain operations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause non-critical operations
        console.log('WebDev Studio paused');
    } else {
        // Page is visible again, resume operations
        console.log('WebDev Studio resumed');
        window.codeEditor?.refresh();
    }
});

// Handle beforeunload to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (window.codeEditor && window.codeEditor.tabs) {
        const hasUnsavedChanges = Array.from(window.codeEditor.tabs.values())
            .some(tab => tab.modified);

        if (hasUnsavedChanges) {
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    }
});

// Auto-save functionality
if (window.settingsManager?.getSetting('general', 'autoSave', true)) {
    setInterval(() => {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const content = window.codeEditor.getValue();
            if (content !== window.codeEditor.currentFile.content) {
                window.codeEditor.saveCurrentFile();
            }
        }
    }, 30000); // Auto-save every 30 seconds
}

// Create global ChatGPT assistant instance after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core components first - but don't create SettingsManager here
    // since it's already created in settings.js
    
    // Wait a bit for settings to load, then initialize other components
    setTimeout(() => {
        // Initialize other components that depend on settings
        window.codeEditor = new CodeEditor();
        window.fileExplorer = new FileExplorer();
        window.chatGPT = new ChatGPTAssistant();
        window.googleDriveManager = new GoogleDriveManager();
        
        // Apply initial settings if settingsManager exists
        if (window.settingsManager) {
            window.settingsManager.applySettings();
        }
    }, 100);
});

console.log('WebDev Studio main script loaded');
