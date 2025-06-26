// File Explorer functionality

class FileExplorer {
    constructor() {
        this.expandedFolders = new Set();
        this.selectedItem = null;
        this.contextMenu = null;
        this.draggedItem = null;
        this.dropTarget = null;
        this.loadingModal = null;

        this.initialize();
    }

    initialize() {
        console.log('FileExplorer initialize() called');
        console.log('FileSystem available:', !!window.fileSystem);

        this.renderFileTree();
        this.setupEventListeners();
        this.setupDragAndDrop();

        // Listen for file system changes
        if (window.fileSystem) {
            window.fileSystem.watch((event, data) => {
                this.handleFileSystemEvent(event, data);
            });
            console.log('FileExplorer initialized successfully');
        } else {
            console.error('FileSystem not available for FileExplorer');
        }
    }

    setupEventListeners() {
        const fileTree = document.getElementById('fileTree');

        // Add import button to panel header
        this.addImportButton();

        // Add new file and folder buttons to panel header
        this.addNewItemButtons();

        // Click event for file tree
        fileTree.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            const folderItem = e.target.closest('.folder-item');
            const folderIcon = e.target.closest('.folder-icon');

            if (folderIcon && folderItem) {
                // Toggle folder expansion
                e.stopPropagation();
                this.toggleFolder(folderItem.dataset.path);
            } else if (fileItem) {
                // Open file
                this.selectFile(fileItem.dataset.path);
                const file = window.fileSystem.readFile(fileItem.dataset.path);
                if (file) {
                    // Try to handle as media file first
                    if (!this.handleMediaFileOpen(file)) {
                        // If not a media file, open in code editor
                        if (window.codeEditor) {
                            window.codeEditor.openFile(file);
                        }
                    }
                }
            } else if (folderItem) {
                // Select folder
                this.selectFolder(folderItem.dataset.path);
            } else {
                // Clicked on empty space - clear selection
                this.selectedItem = null;
                this.updateSelection();
            }
        });

        // Context menu (right-click)
        fileTree.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const fileItem = e.target.closest('.file-item');
            const folderItem = e.target.closest('.folder-item');

            if (fileItem) {
                this.showContextMenu(e, 'file', fileItem.dataset.path);
            } else if (folderItem) {
                this.showContextMenu(e, 'folder', folderItem.dataset.path);
            } else {
                // Right-clicked on empty space - show workspace context menu
                this.showContextMenu(e, 'workspace', '/');
            }
        });

        // Double-click to rename
        fileTree.addEventListener('dblclick', (e) => {
            const fileItem = e.target.closest('.file-item');
            const folderItem = e.target.closest('.folder-item');

            if (fileItem) {
                this.renameItem(fileItem.dataset.path, 'file');
            } else if (folderItem) {
                this.renameItem(folderItem.dataset.path, 'folder');
            }
        });

        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.createNewFolder();
                        } else {
                            e.preventDefault();
                            this.createNewFile();
                        }
                        break;
                    case 'delete':
                        e.preventDefault();
                        this.deleteSelectedItem();
                        break;
                    case 'f2':
                        e.preventDefault();
                        this.renameSelectedItem();
                        break;
                    case 'i':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.importFiles();
                        }
                        break;
                }
            }
        });

        // File drop on file tree (including empty space)
        fileTree.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';

            // Add visual feedback for the entire file tree area
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileTree.classList.add('drag-over');
            }
        });

        fileTree.addEventListener('dragleave', (e) => {
            // Only remove drag-over class if we're leaving the file tree entirely
            const rect = fileTree.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right ||
                e.clientY < rect.top || e.clientY > rect.bottom) {
                fileTree.classList.remove('drag-over');
            }
        });

        fileTree.addEventListener('drop', (e) => {
            e.preventDefault();
            fileTree.classList.remove('drag-over');
            this.handleFileDrop(e);
        });
    }

    addImportButton() {
        const panelHeader = document.querySelector('.left-panel .panel-header');
        if (panelHeader && !panelHeader.querySelector('.import-btn')) {
            const importBtn = document.createElement('button');
            importBtn.className = 'btn-icon import-btn';
            importBtn.innerHTML = '<i class="fas fa-file-import"></i>';
            importBtn.title = 'Import Files (Ctrl+Shift+I)';
            importBtn.addEventListener('click', () => this.importFiles());

            // Insert before the collapse button
            const collapseBtn = panelHeader.querySelector('.panel-collapse');
            panelHeader.insertBefore(importBtn, collapseBtn);
        }
    }

    addNewItemButtons() {
        const panelHeader = document.querySelector('.left-panel .panel-header');
        if (panelHeader && !panelHeader.querySelector('.file-explorer-actions')) {
            // Create action buttons container
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'file-explorer-actions';

            // New File button
            const newFileBtn = document.createElement('button');
            newFileBtn.className = 'btn-icon new-file-btn';
            newFileBtn.innerHTML = '<i class="fas fa-file"></i>';
            newFileBtn.title = 'New File (Ctrl+N)';
            newFileBtn.addEventListener('click', () => this.createNewFile());

            // New Folder button
            const newFolderBtn = document.createElement('button');
            newFolderBtn.className = 'btn-icon new-folder-btn';
            newFolderBtn.innerHTML = '<i class="fas fa-folder"></i>';
            newFolderBtn.title = 'New Folder (Ctrl+Shift+N)';
            newFolderBtn.addEventListener('click', () => this.createNewFolder());

            // Add buttons to container
            actionsContainer.appendChild(newFileBtn);
            actionsContainer.appendChild(newFolderBtn);

            // Insert after the title but before other buttons
            const title = panelHeader.querySelector('.panel-title');
            const importBtn = panelHeader.querySelector('.import-btn');

            if (importBtn) {
                panelHeader.insertBefore(actionsContainer, importBtn);
            } else {
                const collapseBtn = panelHeader.querySelector('.panel-collapse');
                panelHeader.insertBefore(actionsContainer, collapseBtn);
            }
        }
    }

    setupDragAndDrop() {
        const fileTree = document.getElementById('fileTree');

        // Drag start
        fileTree.addEventListener('dragstart', (e) => {
            const fileItem = e.target.closest('.file-item');
            const folderItem = e.target.closest('.folder-item');

            if (fileItem || folderItem) {
                this.draggedItem = {
                    path: (fileItem || folderItem).dataset.path,
                    type: fileItem ? 'file' : 'folder',
                    element: fileItem || folderItem
                };

                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.draggedItem.path);

                // Add visual feedback
                (fileItem || folderItem).classList.add('dragging');
            }
        });

        // Drag over
        fileTree.addEventListener('dragover', (e) => {
            e.preventDefault();

            // Handle external file drops
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                e.dataTransfer.dropEffect = 'copy';
                return;
            }

            // Handle internal drag and drop
            if (!this.draggedItem) return;

            const folderItem = e.target.closest('.folder-item');

            // Remove previous drop target styling
            document.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });

            if (folderItem && folderItem.dataset.path !== this.draggedItem.path) {
                e.dataTransfer.dropEffect = 'move';
                folderItem.classList.add('drop-target');
                this.dropTarget = folderItem.dataset.path;
            } else {
                // Dropping to root (empty space or file tree background)
                e.dataTransfer.dropEffect = 'move';
                this.dropTarget = '/';

                // Add visual feedback for root drop
                if (!folderItem) {
                    fileTree.classList.add('root-drop-target');
                }
            }
        });

        // Drag leave
        fileTree.addEventListener('dragleave', (e) => {
            const folderItem = e.target.closest('.folder-item');
            if (folderItem) {
                folderItem.classList.remove('drop-target');
            }

            // Remove root drop target styling when leaving the file tree
            const rect = fileTree.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right ||
                e.clientY < rect.top || e.clientY > rect.bottom) {
                fileTree.classList.remove('root-drop-target');
            }
        });

        // Drop
        fileTree.addEventListener('drop', (e) => {
            e.preventDefault();

            // Clean up visual feedback
            fileTree.classList.remove('root-drop-target');

            // Handle file drops from outside
            if (e.dataTransfer.files.length > 0) {
                this.handleFileDrop(e);
                return;
            }

            // Handle internal drag and drop
            if (this.draggedItem && this.dropTarget !== undefined) {
                this.handleInternalDrop();
            }

            this.cleanupDragAndDrop();
        });

        // Drag end
        fileTree.addEventListener('dragend', () => {
            fileTree.classList.remove('root-drop-target');
            this.cleanupDragAndDrop();
        });

        // Touch events for mobile drag and drop
        this.setupTouchDragAndDrop();
    }

    setupTouchDragAndDrop() {
        const fileTree = document.getElementById('fileTree');
        let touchStartTime = 0;
        let touchTimeout = null;
        let isDragging = false;
        let ghostElement = null;

        fileTree.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.file-item, .folder-item');
            if (!target) return;

            touchStartTime = Date.now();

            // Long press to start drag
            touchTimeout = setTimeout(() => {
                if (!isDragging) {
                    this.startTouchDrag(e, target);
                }
            }, 500); // 500ms long press
        }, { passive: false });

        fileTree.addEventListener('touchmove', (e) => {
            if (touchTimeout) {
                clearTimeout(touchTimeout);
                touchTimeout = null;
            }

            if (isDragging) {
                e.preventDefault();
                this.handleTouchMove(e);
            }
        }, { passive: false });

        fileTree.addEventListener('touchend', (e) => {
            if (touchTimeout) {
                clearTimeout(touchTimeout);
                touchTimeout = null;
            }

            if (isDragging) {
                this.handleTouchEnd(e);
            }

            isDragging = false;
            if (ghostElement) {
                ghostElement.remove();
                ghostElement = null;
            }
        });

        // Helper functions for touch drag and drop
        this.startTouchDrag = (e, target) => {
            isDragging = true;

            this.draggedItem = {
                path: target.dataset.path,
                type: target.classList.contains('.file-item') ? 'file' : 'folder',
                element: target
            };

            // Create ghost element
            ghostElement = target.cloneNode(true);
            ghostElement.style.position = 'fixed';
            ghostElement.style.pointerEvents = 'none';
            ghostElement.style.zIndex = '10000';
            ghostElement.style.opacity = '0.7';
            ghostElement.style.transform = 'rotate(5deg)';
            document.body.appendChild(ghostElement);

            target.classList.add('dragging');

            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        };

        this.handleTouchMove = (e) => {
            if (!ghostElement) return;

            const touch = e.touches[0];
            ghostElement.style.left = touch.clientX - 50 + 'px';
            ghostElement.style.top = touch.clientY - 25 + 'px';

            // Find drop target
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const folderItem = elementBelow?.closest('.folder-item');

            // Remove previous drop target styling
            document.querySelectorAll('.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });

            if (folderItem && folderItem.dataset.path !== this.draggedItem.path) {
                folderItem.classList.add('drop-target');
                this.dropTarget = folderItem.dataset.path;
            } else {
                this.dropTarget = '/';
            }
        };

        this.handleTouchEnd = (e) => {
            if (this.draggedItem && this.dropTarget) {
                this.handleInternalDrop();

                // Haptic feedback for successful drop
                if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }
            }

            this.cleanupDragAndDrop();
        };
    }

    handleFileDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // Determine target folder
        const folderItem = e.target.closest('.folder-item');
        let targetPath = '/'; // Default to root

        if (folderItem) {
            targetPath = folderItem.dataset.path;
        }

        this.importFilesToFolder(files, targetPath);
    }

    handleInternalDrop() {
        if (!this.draggedItem || !this.dropTarget) return;

        const sourcePath = this.draggedItem.path;
        const targetPath = this.dropTarget;

        // Prevent dropping into itself or child
        if (sourcePath === targetPath || targetPath.startsWith(sourcePath + '/')) {
            this.showNotification('Cannot move item into itself', 'error');
            return;
        }

        // Get the item name
        const itemName = sourcePath.split('/').pop();
        const newPath = targetPath === '/' ? `/${itemName}` : `${targetPath}/${itemName}`;

        // **FIX: Check if source and destination paths are the same**
        if (sourcePath === newPath) {
            this.showNotification('Item is already in this location', 'info');
            return;
        }

        // Check if target already exists
        if (this.draggedItem.type === 'file') {
            if (window.fileSystem.readFile(newPath)) {
                if (!confirm(`A file named "${itemName}" already exists. Replace it?`)) {
                    return;
                }
            }

            // Move file
            const file = window.fileSystem.readFile(sourcePath);
            if (file) {
                window.fileSystem.createFile(newPath, file.content);
                // **FIX: Only delete the source file if it's actually moving to a different location**
                if (sourcePath !== newPath) {
                    window.fileSystem.deleteFile(sourcePath);
                }

                // Update editor tab if file is open
                if (window.codeEditor && window.codeEditor.tabs.has(sourcePath)) {
                    window.codeEditor.closeTab(sourcePath);
                    window.codeEditor.openFile(window.fileSystem.readFile(newPath));
                }
            }
        } else {
            // Move folder
            if (window.fileSystem.getAllFolders().find(f => f.path === newPath)) {
                if (!confirm(`A folder named "${itemName}" already exists. Merge contents?`)) {
                    return;
                }
            }

            this.moveFolder(sourcePath, newPath);
        }

        // Expand target folder
        if (targetPath !== '/') {
            this.expandedFolders.add(targetPath);
        }

        this.renderFileTree();
        this.showNotification(`Moved "${itemName}" successfully`, 'success');
    }

    moveFolder(sourcePath, targetPath) {
        // Create target folder
        window.fileSystem.createFolder(targetPath);

        // Move all files
        window.fileSystem.getAllFiles().forEach(file => {
            if (file.path.startsWith(sourcePath + '/') || file.path === sourcePath) {
                const relativePath = file.path.substring(sourcePath.length);
                const newFilePath = targetPath + relativePath;
                window.fileSystem.createFile(newFilePath, file.content);
                window.fileSystem.deleteFile(file.path);

                // Update editor tabs
                if (window.codeEditor && window.codeEditor.tabs.has(file.path)) {
                    window.codeEditor.closeTab(file.path);
                }
            }
        });

        // Move all subfolders
        window.fileSystem.getAllFolders().forEach(folder => {
            if (folder.path.startsWith(sourcePath + '/')) {
                const relativePath = folder.path.substring(sourcePath.length);
                const newFolderPath = targetPath + relativePath;
                window.fileSystem.createFolder(newFolderPath);
                window.fileSystem.deleteFolder(folder.path);
            }
        });

        // Delete source folder
        window.fileSystem.deleteFolder(sourcePath);
    }

    cleanupDragAndDrop() {
        // Remove visual feedback
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });

        this.draggedItem = null;
        this.dropTarget = null;
    }

    renderFileTree() {
        console.log('FileExplorer: Rendering file tree...');

        const fileTree = document.getElementById('fileTree');
        if (!fileTree) {
            console.error('FileExplorer: fileTree element not found!');
            return;
        }

        if (!window.fileSystem) {
            console.error('FileExplorer: fileSystem not available!');
            return;
        }

        const tree = window.fileSystem.getFileTree();
        console.log('FileExplorer: File tree data:', tree);

        const renderedHTML = this.renderTreeNode(tree);
        console.log('FileExplorer: Rendered HTML length:', renderedHTML.length);

        // Add empty state message if no files
        if (!renderedHTML.trim()) {
            fileTree.innerHTML = `
            <div class="file-tree-empty-state">
                <div class="empty-state-content">
                    <i class="fas fa-folder-open empty-state-icon"></i>
                    <p class="empty-state-message">No files in workspace</p>
                    <div class="empty-state-actions">
                        <button class="btn-secondary create-file-btn" onclick="window.fileExplorer.createNewFile()">
                            <i class="fas fa-file"></i> New File
                        </button>
                        <button class="btn-secondary create-folder-btn" onclick="window.fileExplorer.createNewFolder()">
                            <i class="fas fa-folder"></i> New Folder
                        </button>
                        <button class="btn-secondary import-files-btn" onclick="window.fileExplorer.importFiles()">
                            <i class="fas fa-file-import"></i> Import Files
                        </button>
                    </div>
                    <p class="empty-state-tip">
                        <i class="fas fa-lightbulb"></i>
                        Drag and drop files here or right-click to get started
                    </p>
                </div>
            </div>
        `;
        } else {
            // Wrap the rendered content in a scrollable container
            fileTree.innerHTML = `<div class="file-tree-content">${renderedHTML}</div>`;
        }

        console.log('FileExplorer: File tree rendered successfully');
    }

    renderTreeNode(node, level = 0) {
        if (node.type === 'folder' && node.path === '/') {
            // Root folder - render children only
            return node.children.map(child => this.renderTreeNode(child, level)).join('');
        }

        const indent = level * 16;
        const isExpanded = this.expandedFolders.has(node.path);

        if (node.type === 'folder') {
            const children = isExpanded ?
                node.children.map(child => this.renderTreeNode(child, level + 1)).join('') : '';

            return `
                <div class="folder-item ${this.selectedItem === node.path ? 'selected' : ''}" 
                     data-path="${node.path}" 
                     draggable="true"
                     style="padding-left: ${indent}px">
                    <i class="folder-icon fas fa-chevron-right ${isExpanded ? 'expanded' : ''}"></i>
                    <i class="fas fa-folder" style="color: #dcb67a; margin-right: 8px;"></i>
                    <span class="folder-name">${node.name}</span>
                </div>
                <div class="folder-children ${isExpanded ? '' : 'collapsed'}">
                    ${children}
                </div>
            `;
        } else {
            const icon = this.getFileIcon(node.name);
            const size = this.formatFileSize(node.size);

            return `
                <div class="file-item ${this.selectedItem === node.path ? 'selected' : ''}" 
                     data-path="${node.path}" 
                     draggable="true"
                     style="padding-left: ${indent + 24}px"
                     title="${node.name} (${size})">
                    <i class="${icon}"></i>
                    <span class="file-name">${node.name}</span>
                </div>
            `;
        }
    }

    getFileIcon(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const iconMap = {
            'html': 'fab fa-html5',
            'htm': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'js': 'fab fa-js-square',
            'json': 'fas fa-code',
            'md': 'fab fa-markdown',
            'txt': 'fas fa-file-alt',
            'xml': 'fas fa-code',
            'svg': 'fas fa-image',
            'png': 'fas fa-image',
            'jpg': 'fas fa-image',
            'jpeg': 'fas fa-image',
            'gif': 'fas fa-image',
            'pdf': 'fas fa-file-pdf',
            'zip': 'fas fa-file-archive'
        };

        return iconMap[extension] || 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    toggleFolder(folderPath) {
        if (this.expandedFolders.has(folderPath)) {
            this.expandedFolders.delete(folderPath);
        } else {
            this.expandedFolders.add(folderPath);
        }
        this.renderFileTree();
    }

    selectFile(filePath) {
        this.selectedItem = filePath;
        this.updateSelection();
    }

    selectFolder(folderPath) {
        this.selectedItem = folderPath;
        this.updateSelection();
    }

    updateSelection() {
        // Remove previous selection
        document.querySelectorAll('.file-item, .folder-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to current item
        if (this.selectedItem) {
            const item = document.querySelector(`[data-path="${this.selectedItem}"]`);
            if (item) {
                item.classList.add('selected');
            }
        }
    }

    showContextMenu(event, type, path) {
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            background: var(--secondary-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
            z-index: 10000;
            min-width: 150px;
            padding: var(--spacing-xs) 0;
        `;

        const options = this.getContextMenuOptions(type, path);
        menu.innerHTML = options.map(option => `
            <div class="context-menu-item" data-action="${option.action}" data-path="${path}">
                <i class="${option.icon}"></i>
                <span>${option.label}</span>
            </div>
        `).join('');

        // Add click handlers
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.context-menu-item');
            if (item) {
                this.handleContextMenuAction(item.dataset.action, item.dataset.path);
                this.hideContextMenu();
            }
        });

        document.body.appendChild(menu);
        this.contextMenu = menu;

        // Adjust position if menu goes off screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (event.clientX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (event.clientY - rect.height) + 'px';
        }
    }

    getContextMenuOptions(type, path) {
        const options = [];

        if (type === 'file') {
            options.push(
                { action: 'open', label: 'Open', icon: 'fas fa-folder-open' },
                { action: 'rename', label: 'Rename', icon: 'fas fa-edit' },
                { action: 'delete', label: 'Delete', icon: 'fas fa-trash' },
                { action: 'duplicate', label: 'Duplicate', icon: 'fas fa-copy' }
            );
        } else if (type === 'folder') {
            options.push(
                { action: 'new-file', label: 'New File', icon: 'fas fa-file' },
                { action: 'new-folder', label: 'New Folder', icon: 'fas fa-folder' },
                { action: 'import', label: 'Import Files', icon: 'fas fa-file-import' },
                { action: 'rename', label: 'Rename', icon: 'fas fa-edit' },
                { action: 'delete', label: 'Delete', icon: 'fas fa-trash' }
            );
        } else if (type === 'workspace') {
            options.push(
                { action: 'new-file', label: 'New File', icon: 'fas fa-file' },
                { action: 'new-folder', label: 'New Folder', icon: 'fas fa-folder' },
                { action: 'import', label: 'Import Files', icon: 'fas fa-file-import' },
                { action: 'upload', label: 'Upload Files', icon: 'fas fa-upload' },
                { action: 'refresh', label: 'Refresh', icon: 'fas fa-sync' }
            );
        }

        return options;
    }

    handleContextMenuAction(action, path) {
        switch (action) {
            case 'open':
                const file = window.fileSystem.readFile(path);
                if (file && window.codeEditor) {
                    window.codeEditor.openFile(file);
                }
                break;
            case 'new-file':
                this.createNewFile(path === '/' ? '' : path);
                break;
            case 'new-folder':
                this.createNewFolder(path === '/' ? '' : path);
                break;
            case 'import':
                this.importFiles(path === '/' ? '' : path);
                break;
            case 'rename':
                const isFile = window.fileSystem.readFile(path) !== undefined;
                this.renameItem(path, isFile ? 'file' : 'folder');
                break;
            case 'delete':
                this.deleteItem(path);
                break;
            case 'duplicate':
                this.duplicateFile(path);
                break;
            case 'upload':
                this.uploadFiles();
                break;
            case 'refresh':
                this.renderFileTree();
                break;
        }
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    createNewFile(parentPath = '') {
        const fileName = prompt('Enter file name:', 'new-file.html');
        if (!fileName) return;

        const fullPath = parentPath ? `${parentPath}/${fileName}` : `/${fileName}`;

        // Check if file already exists
        if (window.fileSystem.readFile(fullPath)) {
            alert('A file with this name already exists.');
            return;
        }

        const file = window.fileSystem.createFile(fullPath, '');
        this.renderFileTree();

        // Open the new file in editor
        if (window.codeEditor) {
            window.codeEditor.openFile(file);
        }
    }

    createNewFolder(parentPath = '') {
        const folderName = prompt('Enter folder name:', 'new-folder');
        if (!folderName) return;

        const fullPath = parentPath ? `${parentPath}/${folderName}` : `/${folderName}`;

        // Check if folder already exists
        if (window.fileSystem.getAllFolders().find(f => f.path === fullPath)) {
            alert('A folder with this name already exists.');
            return;
        }

        window.fileSystem.createFolder(fullPath);
        this.expandedFolders.add(parentPath || '/');
        this.renderFileTree();
    }

    renameItem(path, type) {
        const currentName = path.split('/').pop();
        const newName = prompt(`Rename ${type}:`, currentName);
        if (!newName || newName === currentName) return;

        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
        const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

        if (type === 'file') {
            // Check if new file name already exists
            if (window.fileSystem.readFile(newPath)) {
                alert('A file with this name already exists.');
                return;
            }

            window.fileSystem.renameFile(path, newPath);
        } else {
            // Check if new folder name already exists
            if (window.fileSystem.getAllFolders().find(f => f.path === newPath)) {
                alert('A folder with this name already exists.');
                return;
            }

            // Rename folder and all its contents
            const oldFolder = window.fileSystem.getAllFolders().find(f => f.path === path);
            if (oldFolder) {
                window.fileSystem.deleteFolder(path);
                window.fileSystem.createFolder(newPath);

                // Move all files and subfolders
                window.fileSystem.getAllFiles().forEach(file => {
                    if (file.path.startsWith(path + '/')) {
                        const relativePath = file.path.substring(path.length);
                        window.fileSystem.createFile(newPath + relativePath, file.content);
                        window.fileSystem.deleteFile(file.path);
                    }
                });

                window.fileSystem.getAllFolders().forEach(folder => {
                    if (folder.path.startsWith(path + '/')) {
                        const relativePath = folder.path.substring(path.length);
                        window.fileSystem.createFolder(newPath + relativePath);
                        window.fileSystem.deleteFolder(folder.path);
                    }
                });
            }
        }

        this.renderFileTree();
    }

    deleteItem(path) {
        const isFile = window.fileSystem.readFile(path) !== undefined;
        const itemName = path.split('/').pop();

        if (!confirm(`Are you sure you want to delete ${isFile ? 'file' : 'folder'} "${itemName}"?`)) {
            return;
        }

        if (isFile) {
            window.fileSystem.deleteFile(path);

            // Close tab if file is open in editor
            if (window.codeEditor && window.codeEditor.tabs.has(path)) {
                window.codeEditor.closeTab(path);
            }
        } else {
            window.fileSystem.deleteFolder(path);

            // Close tabs for all files in the folder
            if (window.codeEditor) {
                window.fileSystem.getAllFiles().forEach(file => {
                    if (file.path.startsWith(path + '/') && window.codeEditor.tabs.has(file.path)) {
                        window.codeEditor.closeTab(file.path);
                    }
                });
            }
        }

        this.renderFileTree();
    }

    duplicateFile(path) {
        const file = window.fileSystem.readFile(path);
        if (!file) return;

        const fileName = path.split('/').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const extension = fileName.substring(fileName.lastIndexOf('.')) || '';
        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';

        let counter = 1;
        let newName, newPath;

        do {
            newName = `${nameWithoutExt}_copy${counter}${extension}`;
            newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
            counter++;
        } while (window.fileSystem.readFile(newPath));

        window.fileSystem.createFile(newPath, file.content);
        this.renderFileTree();
    }

    importFiles(targetPath = '') {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*'; // Accept all file types

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            await this.importFilesToFolder(files, targetPath);
        };

        input.click();
    }

    async importFilesToFolder(files, targetPath = '') {
        if (files.length === 0) return;

        // Show loading modal
        this.showLoadingModal(`Importing ${files.length} file(s)...`, files.length);

        const importPromises = files.map((file, index) =>
            this.importSingleFile(file, targetPath, index + 1, files.length)
        );

        try {
            await Promise.all(importPromises);
            this.renderFileTree();

            // Expand target folder if not root
            if (targetPath && targetPath !== '/') {
                this.expandedFolders.add(targetPath);
                this.renderFileTree();
            }

            this.hideLoadingModal();
            this.showNotification(`Successfully imported ${files.length} file(s)`, 'success');
        } catch (error) {
            console.error('Import failed:', error);
            this.hideLoadingModal();
            this.showNotification('Some files failed to import', 'error');
        }
    }

    async importSingleFile(file, targetPath = '', currentIndex = 1, totalFiles = 1) {
        return new Promise((resolve, reject) => {
            // Update loading modal with current file
            this.updateLoadingModal(`Importing "${file.name}" (${currentIndex}/${totalFiles})`, currentIndex, totalFiles);

            const baseName = file.name;
            let filePath = targetPath ? `${targetPath}/${baseName}` : `/${baseName}`;

            // Handle duplicate names
            let counter = 1;
            while (window.fileSystem.readFile(filePath)) {
                const nameWithoutExt = baseName.substring(0, baseName.lastIndexOf('.')) || baseName;
                const extension = baseName.substring(baseName.lastIndexOf('.')) || '';
                const newName = `${nameWithoutExt}_${counter}${extension}`;
                filePath = targetPath ? `${targetPath}/${newName}` : `/${newName}`;
                counter++;
            }

            // Check if it's a binary file
            if (window.fileSystem.isBinaryFile(filePath)) {
                // Read as data URL for binary files
                const reader = new FileReader();

                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        this.updateLoadingModal(
                            `Reading "${file.name}" (${currentIndex}/${totalFiles}) - ${Math.round(percentComplete)}%`,
                            currentIndex,
                            totalFiles,
                            percentComplete
                        );
                    }
                };

                reader.onload = (event) => {
                    const content = event.target.result; // This is a data URL
                    window.fileSystem.createFile(filePath, content);
                    resolve();
                };

                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsDataURL(file);
            } else {
                // Read as text for text files
                const reader = new FileReader();

                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        this.updateLoadingModal(
                            `Reading "${file.name}" (${currentIndex}/${totalFiles}) - ${Math.round(percentComplete)}%`,
                            currentIndex,
                            totalFiles,
                            percentComplete
                        );
                    }
                };

                reader.onload = (event) => {
                    const content = event.target.result;
                    window.fileSystem.createFile(filePath, content);
                    resolve();
                };

                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsText(file);
            }
        });
    }

    uploadFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*'; // Accept all file types

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);

            // Show loading modal
            this.showLoadingModal(`Uploading ${files.length} file(s)...`, files.length);

            const uploadPromises = files.map((file, index) =>
                this.uploadSingleFile(file, index + 1, files.length)
            );

            try {
                await Promise.all(uploadPromises);
                this.renderFileTree();
                this.hideLoadingModal();
                this.showNotification(`Successfully uploaded ${files.length} file(s)`, 'success');
            } catch (error) {
                console.error('Upload failed:', error);
                this.hideLoadingModal();
                this.showNotification('Some files failed to upload', 'error');
            }
        };

        input.click();
    }

    async uploadSingleFile(file, currentIndex = 1, totalFiles = 1) {
        return new Promise((resolve, reject) => {
            // Update loading modal with current file
            this.updateLoadingModal(`Uploading "${file.name}" (${currentIndex}/${totalFiles})`, currentIndex, totalFiles);

            let filePath = `/${file.name}`;

            // Handle duplicate names
            let counter = 1;
            while (window.fileSystem.readFile(filePath)) {
                const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const extension = file.name.substring(file.name.lastIndexOf('.')) || '';
                filePath = `/${nameWithoutExt}_${counter}${extension}`;
                counter++;
            }

            // Check if it's a binary file
            if (window.fileSystem.isBinaryFile(filePath)) {
                // Read as data URL for binary files
                const reader = new FileReader();

                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        this.updateLoadingModal(
                            `Reading "${file.name}" (${currentIndex}/${totalFiles}) - ${Math.round(percentComplete)}%`,
                            currentIndex,
                            totalFiles,
                            percentComplete
                        );
                    }
                };

                reader.onload = (event) => {
                    const content = event.target.result; // This is a data URL
                    window.fileSystem.createFile(filePath, content);
                    resolve();
                };

                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsDataURL(file);
            } else {
                // Read as text for text files
                const reader = new FileReader();

                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        this.updateLoadingModal(
                            `Reading "${file.name}" (${currentIndex}/${totalFiles}) - ${Math.round(percentComplete)}%`,
                            currentIndex,
                            totalFiles,
                            percentComplete
                        );
                    }
                };

                reader.onload = (event) => {
                    const content = event.target.result;
                    window.fileSystem.createFile(filePath, content);
                    resolve();
                };

                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsText(file);
            }
        });
    }

    isMediaFile(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];
        const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
        const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv'];

        return {
            isImage: imageExtensions.includes(extension),
            isAudio: audioExtensions.includes(extension),
            isVideo: videoExtensions.includes(extension),
            isMedia: [...imageExtensions, ...audioExtensions, ...videoExtensions].includes(extension)
        };
    }

    handleMediaFileOpen(file) {
        const mediaInfo = this.isMediaFile(file.path);

        if (mediaInfo.isMedia) {
            // Hide the welcome screen and code editor
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('editorWrapper').style.display = 'none';

            // Show media viewer
            this.showMediaViewer(file, mediaInfo);

            // Update the tab in code editor for consistency
            if (window.codeEditor) {
                window.codeEditor.openFile(file);
            }

            return true; // Indicate that we handled this file
        }

        return false; // Let the regular editor handle it
    }

    showMediaViewer(file, mediaInfo) {
        // Remove existing media viewer
        const existingViewer = document.getElementById('mediaViewer');
        if (existingViewer) {
            existingViewer.remove();
        }

        // Create media viewer container
        const mediaViewer = document.createElement('div');
        mediaViewer.id = 'mediaViewer';
        mediaViewer.className = 'media-viewer';

        if (mediaInfo.isImage) {
            mediaViewer.innerHTML = this.createImageViewer(file);
        } else if (mediaInfo.isAudio) {
            mediaViewer.innerHTML = this.createAudioPlayer(file);
        } else if (mediaInfo.isVideo) {
            mediaViewer.innerHTML = this.createVideoPlayer(file);
        }

        // Insert after the editor wrapper
        const editorContainer = document.querySelector('.editor-container .editor-area');
        editorContainer.appendChild(mediaViewer);

        // Setup media viewer event listeners
        this.setupMediaViewerEvents(mediaViewer, mediaInfo);
    }

    createImageViewer(file) {
        return `
        <div class="image-viewer">
            <div class="image-viewer-header">
                <div class="image-info">
                    <h3><i class="fas fa-image"></i> ${file.name}</h3>
                    <span class="file-path">${file.path}</span>
                </div>
                <div class="image-controls">
                    <button class="btn-icon" id="zoomOut" title="Zoom Out">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <span class="zoom-level">100%</span>
                    <button class="btn-icon" id="zoomIn" title="Zoom In">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn-icon" id="resetZoom" title="Reset Zoom">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </button>
                    <button class="btn-icon" id="fullscreenImage" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            <div class="image-container">
                <img src="${file.content}" alt="${file.name}" class="preview-image" draggable="false">
            </div>
            <div class="image-viewer-footer">
                <div class="image-details">
                    <span class="detail-item">Size: <span id="imageSize">Loading...</span></span>
                    <span class="detail-item">Type: ${file.path.split('.').pop()?.toUpperCase()}</span>
                </div>
            </div>
        </div>
    `;
    }

    createAudioPlayer(file) {
        return `
        <div class="audio-player">
            <div class="audio-player-header">
                <div class="audio-info">
                    <h3><i class="fas fa-music"></i> ${file.name}</h3>
                    <span class="file-path">${file.path}</span>
                </div>
            </div>
            <div class="audio-container">
                <audio controls class="audio-element">
                    <source src="${file.content}" type="audio/${file.path.split('.').pop()}">
                    Your browser does not support the audio element.
                </audio>
                <div class="audio-visualizer">
                    <div class="audio-cover">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="audio-details">
                        <div class="track-name">${file.name}</div>
                        <div class="track-info">Audio File</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    createVideoPlayer(file) {
        return `
        <div class="video-player">
            <div class="video-player-header">
                <div class="video-info">
                    <h3><i class="fas fa-video"></i> ${file.name}</h3>
                    <span class="file-path">${file.path}</span>
                </div>
                <div class="video-controls">
                    <button class="btn-icon" id="fullscreenVideo" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            <div class="video-container">
                <video controls class="video-element">
                    <source src="${file.content}" type="video/${file.path.split('.').pop()}">
                    Your browser does not support the video element.
                </video>
            </div>
            <div class="video-player-footer">
                <div class="video-details">
                    <span class="detail-item">Type: ${file.path.split('.').pop()?.toUpperCase()}</span>
                    <span class="detail-item">Duration: <span id="videoDuration">--:--</span></span>
                </div>
            </div>
        </div>
    `;
    }

    setupMediaViewerEvents(mediaViewer, mediaInfo) {
        if (mediaInfo.isImage) {
            this.setupImageViewerEvents(mediaViewer);
        } else if (mediaInfo.isVideo) {
            this.setupVideoPlayerEvents(mediaViewer);
        }
    }

    setupImageViewerEvents(mediaViewer) {
        const image = mediaViewer.querySelector('.preview-image');
        const zoomInBtn = mediaViewer.querySelector('#zoomIn');
        const zoomOutBtn = mediaViewer.querySelector('#zoomOut');
        const resetZoomBtn = mediaViewer.querySelector('#resetZoom');
        const fullscreenBtn = mediaViewer.querySelector('#fullscreenImage');
        const zoomLevelSpan = mediaViewer.querySelector('.zoom-level');

        let zoomLevel = 1;
        const zoomStep = 0.25;
        const maxZoom = 5;
        const minZoom = 0.1;

        const updateZoom = () => {
            image.style.transform = `scale(${zoomLevel})`;
            zoomLevelSpan.textContent = `${Math.round(zoomLevel * 100)}%`;
        };

        // Get image dimensions
        image.onload = () => {
            const imageSizeSpan = mediaViewer.querySelector('#imageSize');
            if (imageSizeSpan) {
                imageSizeSpan.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
            }
        };

        zoomInBtn.addEventListener('click', () => {
            if (zoomLevel < maxZoom) {
                zoomLevel += zoomStep;
                updateZoom();
            }
        });

        zoomOutBtn.addEventListener('click', () => {
            if (zoomLevel > minZoom) {
                zoomLevel -= zoomStep;
                updateZoom();
            }
        });

        resetZoomBtn.addEventListener('click', () => {
            zoomLevel = 1;
            updateZoom();
        });

        fullscreenBtn.addEventListener('click', () => {
            if (image.requestFullscreen) {
                image.requestFullscreen();
            }
        });

        // Mouse wheel zoom
        const imageContainer = mediaViewer.querySelector('.image-container');
        imageContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
            const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
            if (newZoom !== zoomLevel) {
                zoomLevel = newZoom;
                updateZoom();
            }
        });
    }

    setupVideoPlayerEvents(mediaViewer) {
        const video = mediaViewer.querySelector('.video-element');
        const fullscreenBtn = mediaViewer.querySelector('#fullscreenVideo');
        const durationSpan = mediaViewer.querySelector('#videoDuration');

        video.addEventListener('loadedmetadata', () => {
            if (durationSpan) {
                const duration = video.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        });

        fullscreenBtn.addEventListener('click', () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            }
        });
    }

    showLoadingModal(message, totalFiles = 1) {
        // Remove existing modal if any
        this.hideLoadingModal();

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'import-loading-overlay';

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'import-loading-modal';

        modal.innerHTML = `
            <div class="import-loading-header">
                <i class="fas fa-file-import import-loading-icon"></i>
                <h3>File Import</h3>
            </div>
            <div class="import-loading-body">
                <div class="import-loading-message">${message}</div>
                <div class="import-progress-container">
                    <div class="import-progress-bar">
                        <div class="import-progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="import-progress-text">0%</div>
                </div>
                <div class="import-file-progress">
                    <div class="import-current-file"></div>
                    <div class="import-file-counter">0 / ${totalFiles}</div>
                </div>
            </div>
            <div class="import-loading-footer">
                <button class="btn-secondary import-cancel-btn">Cancel</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        this.loadingModal = {
            overlay,
            modal,
            cancelled: false
        };

        // Add cancel functionality
        const cancelBtn = modal.querySelector('.import-cancel-btn');
        cancelBtn.addEventListener('click', () => {
            this.loadingModal.cancelled = true;
            this.hideLoadingModal();
        });

        // Prevent clicking outside to close during import
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Don't close automatically, require explicit cancel
                const modal = overlay.querySelector('.import-loading-modal');
                modal.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    if (modal) modal.style.animation = '';
                }, 500);
            }
        });

        // Add entrance animation
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.9) translateY(-20px)';

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1) translateY(0)';
        });
    }

    updateLoadingModal(message, currentFile = 1, totalFiles = 1, fileProgress = 0) {
        if (!this.loadingModal) return;

        const modal = this.loadingModal.modal;
        const messageEl = modal.querySelector('.import-loading-message');
        const progressFill = modal.querySelector('.import-progress-fill');
        const progressText = modal.querySelector('.import-progress-text');
        const fileCounter = modal.querySelector('.import-file-counter');
        const currentFileEl = modal.querySelector('.import-current-file');

        if (messageEl) messageEl.textContent = message;

        // Update overall progress (based on file count)
        const overallProgress = ((currentFile - 1) / totalFiles) * 100 + (fileProgress / totalFiles);
        if (progressFill) progressFill.style.width = `${Math.min(overallProgress, 100)}%`;
        if (progressText) progressText.textContent = `${Math.round(overallProgress)}%`;

        // Update file counter
        if (fileCounter) fileCounter.textContent = `${currentFile} / ${totalFiles}`;

        // Update current file name
        if (currentFileEl) {
            const fileName = message.match(/"([^"]+)"/);
            if (fileName) {
                currentFileEl.textContent = `Current: ${fileName[1]}`;
            }
        }

        // Animate progress bar
        if (progressFill) {
            progressFill.style.transition = 'width 0.3s ease-in-out';
        }
    }

    hideLoadingModal() {
        if (this.loadingModal) {
            const { overlay, modal } = this.loadingModal;

            // Add exit animation
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9) translateY(-20px)';

            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);

            this.loadingModal = null;
        }
    }

    handleFileSystemEvent(event, data) {
        switch (event) {
            case 'file-created':
            case 'file-deleted':
            case 'file-renamed':
            case 'folder-created':
            case 'folder-deleted':
            case 'project-imported':
            case 'initialized':
                this.renderFileTree();
                break;
        }
    }

    deleteSelectedItem() {
        if (this.selectedItem) {
            this.deleteItem(this.selectedItem);
        }
    }

    renameSelectedItem() {
        if (this.selectedItem) {
            const isFile = fileSystem.readFile(this.selectedItem) !== undefined;
            this.renameItem(this.selectedItem, isFile ? 'file' : 'folder');
        }
    }

    showNotification(message, type = 'info') {
        // Use the existing notification system from the main app
        if (window.webDevStudio && window.webDevStudio.showNotification) {
            window.webDevStudio.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Add CSS for drag and drop functionality
const dragDropCSS = `
    .context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        transition: var(--transition);
    }
    
    .context-menu-item:hover {
        background: var(--hover-bg);
    }
    
    .context-menu-item i {
        width: 16px;
        color: var(--text-secondary);
    }
    
    .file-item[draggable="true"],
    .folder-item[draggable="true"] {
        cursor: grab;
    }
    
    .file-item.dragging,
    .folder-item.dragging {
        opacity: 0.5;
        cursor: grabbing;
        transform: rotate(2deg);
    }
    
    .folder-item.drop-target {
        background: var(--accent-color) !important;
        color: white !important;
        box-shadow: 0 0 8px rgba(var(--accent-color-rgb), 0.5);
    }
    
    .folder-item.drop-target .folder-name,
    .folder-item.drop-target i {
        color: white !important;
    }
    
    #fileTree {
        position: relative;
    }
    
    #fileTree.drag-over {
        background: rgba(var(--accent-color-rgb), 0.1);
        border: 2px dashed var(--accent-color);
        border-radius: var(--border-radius);
    }
    
    .import-btn {
        margin-right: var(--spacing-xs);
        color: var(--success-color);
    }
    
    .import-btn:hover {
        background: rgba(76, 175, 80, 0.1);
        color: var(--success-color);
    }
    
    /* Touch drag and drop visual feedback */
    @media (hover: none) {
        .file-item.dragging,
        .folder-item.dragging {
            transform: scale(1.05) rotate(5deg);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
        }
        
        .folder-item.drop-target::before {
            content: '📁 Drop here';
            position: absolute;
            right: var(--spacing-sm);
            font-size: var(--font-size-xs);
            background: rgba(255, 255, 255, 0.9);
            color: var(--accent-color);
            padding: 2px 6px;
            border-radius: 12px;
            font-weight: 600;
        }
    }
    
    /* Improved file tree drop zone */
    .file-tree-drop-zone {
        min-height: 200px;
        border: 2px dashed transparent;
        border-radius: var(--border-radius);
        transition: var(--transition);
        position: relative;
    }
    
    .file-tree-drop-zone.drag-over {
        border-color: var(--accent-color);
        background: rgba(var(--accent-color-rgb), 0.05);
    }
    
    .file-tree-drop-zone.drag-over::after {
        content: '📁 Drop files here to import';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--accent-color);
        font-size: var(--font-size-md);
        font-weight: 600;
        pointer-events: none;
        text-align: center;
        white-space: nowrap;
    }
    
    /* Animation for successful operations */
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .file-item.success,
    .folder-item.success {
        animation: successPulse 0.6s ease-in-out;
        background: rgba(76, 175, 80, 0.2);
    }
`;

const loadingModalCSS = `
    .import-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        backdrop-filter: blur(2px);
        transition: opacity 0.3s ease-in-out;
    }
    
    .import-loading-modal {
        background: var(--secondary-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        min-width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transition: transform 0.3s ease-in-out;
    }
    
    .import-loading-header {
        padding: var(--spacing-lg);
        background: var(--tertiary-bg);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .import-loading-icon {
        font-size: 1.5rem;
        color: var(--accent-color);
        animation: pulse 2s infinite;
    }
    
    .import-loading-header h3 {
        margin: 0;
        font-size: var(--font-size-lg);
        color: var(--text-primary);
    }
    
    .import-loading-body {
        padding: var(--spacing-lg);
    }
    
    .import-loading-message {
        font-size: var(--font-size-md);
        color: var(--text-primary);
        margin-bottom: var(--spacing-md);
        text-align: center;
    }
    
    .import-progress-container {
        margin-bottom: var(--spacing-md);
    }
    
    .import-progress-bar {
        width: 100%;
        height: 8px;
        background: var(--tertiary-bg);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--spacing-xs);
    }
    
    .import-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-color), var(--success-color));
        border-radius: 4px;
        transition: width 0.3s ease-in-out;
        position: relative;
    }
    
    .import-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
    }
    
    .import-progress-text {
        text-align: center;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: 600;
    }
    
    .import-file-progress {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        background: var(--tertiary-bg);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-md);
    }
    
    .import-current-file {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: var(--spacing-md);
    }
    
    .import-file-counter {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: 600;
        min-width: 60px;
        text-align: right;
    }
    
    .import-loading-footer {
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--tertiary-bg);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
    }
    
    .import-cancel-btn {
        padding: var(--spacing-sm) var(--spacing-lg);
        background: var(--danger-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: var(--transition);
    }
    
    .import-cancel-btn:hover {
        background: var(--danger-hover);
        transform: translateY(-1px);
    }
    
    /* Animations */
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    /* Mobile responsive */
    @media (max-width: 480px) {
        .import-loading-modal {
            min-width: 320px;
            margin: var(--spacing-md);
        }
        
        .import-loading-header,
        .import-loading-body,
        .import-loading-footer {
            padding: var(--spacing-md);
        }
        
        .import-file-progress {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
        }
        
        .import-current-file {
            margin-right: 0;
        }
        
        .import-file-counter {
            min-width: auto;
            text-align: left;
        }
    }
    
    /* Dark theme adjustments */
    @media (prefers-color-scheme: dark) {
        .import-loading-overlay {
            background: rgba(0, 0, 0, 0.8);
        }
    }
    
    /* High contrast mode */
    @media (prefers-contrast: high) {
        .import-progress-fill {
            background: var(--accent-color);
        }
        
        .import-loading-modal {
            border: 2px solid var(--border-color);
        }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .import-loading-icon,
        .import-progress-fill::after {
            animation: none;
        }
        
        .import-loading-modal,
        .import-loading-overlay {
            transition: none;
        }
    }

    /* File Explorer Action Buttons */
    .file-explorer-actions {
        display: flex;
        gap: var(--spacing-xs);
        margin-right: var(--spacing-sm);
    }

    .new-file-btn {
        color: var(--primary-color);
    }

    .new-file-btn:hover {
        background: rgba(var(--primary-color-rgb), 0.1);
        color: var(--primary-color);
    }

    .new-folder-btn {
        color: var(--warning-color);
    }

    .new-folder-btn:hover {
        background: rgba(var(--warning-color-rgb), 0.1);
        color: var(--warning-color);
    }

    /* Enhanced File Tree Drag and Drop */
    #fileTree.drag-over {
        background: rgba(var(--accent-color-rgb), 0.1);
        border: 2px dashed var(--accent-color);
        border-radius: var(--border-radius);
        position: relative;
    }

    #fileTree.drag-over::after {
        content: '📁 Drop files anywhere to import';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--accent-color);
        font-size: var(--font-size-md);
        font-weight: 600;
        pointer-events: none;
        text-align: center;
        white-space: nowrap;
        background: var(--secondary-bg);
        padding: var(--spacing-md);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        z-index: 10;
    }

    #fileTree.root-drop-target {
        background: rgba(var(--success-color-rgb), 0.1);
        border: 2px dashed var(--success-color);
        border-radius: var(--border-radius);
    }

    #fileTree.root-drop-target::after {
        content: '📁 Drop to move to workspace root';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--success-color);
        font-size: var(--font-size-sm);
        font-weight: 600;
        pointer-events: none;
        text-align: center;
        white-space: nowrap;
        background: var(--secondary-bg);
        padding: var(--spacing-sm);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-sm);
        z-index: 10;
    }

    /* Empty State Styles */
    .file-tree-empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        padding: var(--spacing-xl);
        text-align: center;
    }

    .empty-state-content {
        max-width: 280px;
    }

    .empty-state-icon {
        font-size: 3rem;
        color: var(--text-tertiary);
        margin-bottom: var(--spacing-lg);
        opacity: 0.6;
    }

    .empty-state-message {
        font-size: var(--font-size-lg);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-lg);
        font-weight: 500;
    }

    .empty-state-actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
    }

    .empty-state-actions button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        border: 1px solid var(--border-color);
        background: var(--tertiary-bg);
        color: var(--text-primary);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-size: var(--font-size-sm);
    }

    .empty-state-actions button:hover {
        background: var(--hover-bg);
        border-color: var(--accent-color);
        transform: translateY(-1px);
    }

    .empty-state-actions button i {
        font-size: var(--font-size-md);
    }

    .empty-state-tip {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        font-style: italic;
    }

    .empty-state-tip i {
        color: var(--warning-color);
    }

    /* Context Menu Enhancements */
    .context-menu {
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        padding: var(--spacing-xs) 0;
        min-width: 180px;
        z-index: 10000;
        backdrop-filter: blur(8px);
    }

    .context-menu-item {
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        transition: var(--transition);
        border: none;
        background: none;
        width: 100%;
        text-align: left;
    }

    .context-menu-item:hover {
        background: var(--hover-bg);
        color: var(--accent-color);
    }

    .context-menu-item i {
        width: 16px;
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .context-menu-item:hover i {
        color: var(--accent-color);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .file-explorer-actions {
            gap: 2px;
        }
        
        .file-explorer-actions .btn-icon {
            padding: var(--spacing-xs);
            font-size: var(--font-size-sm);
        }
        
        .empty-state-actions {
            gap: var(--spacing-xs);
        }
        
        .empty-state-actions button {
            padding: var(--spacing-sm);
            font-size: var(--font-size-xs);
        }
        
        #fileTree.drag-over::after,
        #fileTree.root-drop-target::after {
            font-size: var(--font-size-sm);
            padding: var(--spacing-sm);
        }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
        .context-menu {
            border-width: 2px;
        }
        
        .context-menu-item:hover {
            background: var(--accent-color);
            color: white;
        }
        
        #fileTree.drag-over,
        #fileTree.root-drop-target {
            border-width: 3px;
        }
    }

    /* Dark theme adjustments */
    [data-theme="dark"] .empty-state-actions button {
        background: var(--primary-bg);
        border-color: var(--border-color);
    }

    [data-theme="dark"] .empty-state-actions button:hover {
        background: var(--secondary-bg);
        border-color: var(--accent-color);
    }

    /* Animation for button interactions */
    @keyframes buttonPress {
        0% { transform: scale(1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
    }

    .file-explorer-actions button:active,
    .empty-state-actions button:active {
        animation: buttonPress 0.1s ease-in-out;
    }

    /* Media Viewer Styles */
    .media-viewer {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--primary-bg);
    }

    /* Image Viewer */
    .image-viewer {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .image-viewer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
    }

    .image-info h3 {
        margin: 0;
        font-size: var(--font-size-md);
        color: var(--text-primary);
    }

    .file-path {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
    }

    .image-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .zoom-level {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        min-width: 50px;
        text-align: center;
    }

    .image-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        background: var(--tertiary-bg);
        position: relative;
    }

    .preview-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.2s ease;
        cursor: grab;
    }

    .preview-image:active {
        cursor: grabbing;
    }

    .image-viewer-footer {
        padding: var(--spacing-md);
        background: var(--secondary-bg);
        border-top: 1px solid var(--border-color);
    }

    .image-details {
        display: flex;
        gap: var(--spacing-lg);
    }

    .detail-item {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
    }

    /* Audio Player */
    .audio-player {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .audio-player-header {
        padding: var(--spacing-md);
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
    }

    .audio-info h3 {
        margin: 0;
        font-size: var(--font-size-md);
        color: var(--text-primary);
    }

    .audio-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-xl);
        background: var(--primary-bg);
    }

    .audio-element {
        width: 100%;
        max-width: 600px;
        margin-bottom: var(--spacing-lg);
    }

    .audio-visualizer {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .audio-cover {
        width: 200px;
        height: 200px;
        background: var(--accent-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--spacing-lg);
        box-shadow: var(--shadow-lg);
    }

    .audio-cover i {
        font-size: 4rem;
        color: white;
    }

    .track-name {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--spacing-xs);
    }

    .track-info {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
    }

    /* Video Player */
    .video-player {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .video-player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
    }

    .video-info h3 {
        margin: 0;
        font-size: var(--font-size-md);
        color: var(--text-primary);
    }

    .video-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--tertiary-bg);
        padding: var(--spacing-md);
    }

    .video-element {
        width: 100%;
        height: 100%;
        max-height: 80vh;
        object-fit: contain;
    }

    .video-player-footer {
        padding: var(--spacing-md);
        background: var(--secondary-bg);
        border-top: 1px solid var(--border-color);
    }

    .video-details {
        display: flex;
        gap: var(--spacing-lg);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .image-controls {
            gap: var(--spacing-xs);
        }
        
        .audio-cover {
            width: 150px;
            height: 150px;
        }
        
        .audio-cover i {
            font-size: 3rem;
        }
        
        .image-container,
        .video-container {
            padding: var(--spacing-sm);
        }
    }
`;

const fileExplorerStyle = document.createElement('style');
fileExplorerStyle.textContent = dragDropCSS;
document.head.appendChild(fileExplorerStyle);

const existingStyle = document.querySelector('style[data-file-explorer]');
if (existingStyle) {
    existingStyle.textContent += '\n' + loadingModalCSS;
} else {
    const fileExplorerStyle = document.createElement('style');
    fileExplorerStyle.setAttribute('data-file-explorer', 'true');
    fileExplorerStyle.textContent = dragDropCSS + '\n' + loadingModalCSS;
    document.head.appendChild(fileExplorerStyle);
}

// Create global file explorer instance
window.fileExplorer = new FileExplorer();