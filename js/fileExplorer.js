// File Explorer functionality

class FileExplorer {
    constructor() {
        this.expandedFolders = new Set();
        this.selectedItem = null;
        this.contextMenu = null;
        
        this.initialize();
    }
    
    initialize() {
        console.log('FileExplorer initialize() called');
        console.log('FileSystem available:', !!window.fileSystem);
        
        this.renderFileTree();
        this.setupEventListeners();
        
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
        
        // Click event for file tree
        fileTree.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            const folderItem = e.target.closest('.folder-item');
            const folderIcon = e.target.closest('.folder-icon');
            
            if (folderIcon && folderItem) {
                // Toggle folder expansion
                e.stopPropagation();
                this.toggleFolder(folderItem.dataset.path);
            } else if (fileItem) {                // Open file
                this.selectFile(fileItem.dataset.path);
                const file = window.fileSystem.readFile(fileItem.dataset.path);
                if (file && window.codeEditor) {
                    window.codeEditor.openFile(file);
                }
            } else if (folderItem) {
                // Select folder
                this.selectFolder(folderItem.dataset.path);
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
                }
            }
        });
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
        
        fileTree.innerHTML = renderedHTML;
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
                { action: 'rename', label: 'Rename', icon: 'fas fa-edit' },
                { action: 'delete', label: 'Delete', icon: 'fas fa-trash' }
            );
        } else if (type === 'workspace') {
            options.push(
                { action: 'new-file', label: 'New File', icon: 'fas fa-file' },
                { action: 'new-folder', label: 'New Folder', icon: 'fas fa-folder' },
                { action: 'upload', label: 'Upload Files', icon: 'fas fa-upload' },
                { action: 'refresh', label: 'Refresh', icon: 'fas fa-sync' }
            );
        }
        
        return options;
    }
    
    handleContextMenuAction(action, path) {        switch (action) {
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
                break;            case 'rename':
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
            const oldFolder = window.fileSystem.getAllFolders().find(f => f.path === path);            if (oldFolder) {
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
    
    uploadFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        
        input.onchange = (e) => {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    let filePath = `/${file.name}`;
                      // Handle duplicate names
                    let counter = 1;
                    while (window.fileSystem.readFile(filePath)) {
                        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                        const extension = file.name.substring(file.name.lastIndexOf('.')) || '';
                        filePath = `/${nameWithoutExt}_${counter}${extension}`;
                        counter++;
                    }
                    
                    window.fileSystem.createFile(filePath, content);
                    this.renderFileTree();
                };
                reader.readAsText(file);
            });
        };
        
        input.click();
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
}

// Add CSS for context menu
const contextMenuCSS = `
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
`;

const fileExplorerStyle = document.createElement('style');
fileExplorerStyle.textContent = contextMenuCSS;
document.head.appendChild(fileExplorerStyle);

// Create global file explorer instance
window.fileExplorer = new FileExplorer();
