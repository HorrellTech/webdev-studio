// Google Drive Integration for WebDev Studio

class GoogleDriveManager {
    constructor() {
        this.isSignedIn = false;
        this.clientId = '';
        this.apiKey = '';
        this.autoLogin = true;
        this.defaultFolder = 'WebDev Studio Projects';
        this.currentFolderId = 'root';
        this.accessToken = '';
        this.refreshToken = '';
        this.breadcrumb = [{ id: 'root', name: 'My Drive' }];
        
        // Google API configuration
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Google Drive Manager...');
        
        // Load settings
        this.loadSettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize Google APIs when settings are available
        if (this.clientId && this.apiKey) {
            await this.initializeGoogleAPIs();
        }
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('webdev-studio-drive-settings') || '{}');
        this.clientId = settings.clientId || '';
        this.apiKey = settings.apiKey || '';
        this.autoLogin = settings.autoLogin !== false;
        this.defaultFolder = settings.defaultFolder || 'WebDev Studio Projects';
        
        // Load stored tokens
        this.accessToken = settings.accessToken || '';
        this.refreshToken = settings.refreshToken || '';
        
        console.log('Google Drive settings loaded:', { 
            hasClientId: !!this.clientId, 
            hasApiKey: !!this.apiKey, 
            autoLogin: this.autoLogin 
        });
    }
    
    saveSettings() {
        const settings = {
            clientId: this.clientId,
            apiKey: this.apiKey,
            autoLogin: this.autoLogin,
            defaultFolder: this.defaultFolder,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken
        };
        localStorage.setItem('webdev-studio-drive-settings', JSON.stringify(settings));
    }
    
    setupEventListeners() {
        // Google Drive button
        document.getElementById('googleDriveBtn').addEventListener('click', () => {
            this.openDriveModal();
        });
        
        // Modal close
        document.getElementById('closeGoogleDriveBtn').addEventListener('click', () => {
            this.closeDriveModal();
        });
        
        // Sign in/out buttons
        document.getElementById('driveSignInBtn').addEventListener('click', () => {
            this.signIn();
        });
        
        document.getElementById('driveSignOutBtn').addEventListener('click', () => {
            this.signOut();
        });
        
        // Auto-login checkbox
        document.getElementById('autoLoginDrive').addEventListener('change', (e) => {
            this.autoLogin = e.target.checked;
            this.saveSettings();
        });
        
        // Action buttons
        document.getElementById('saveToGoogleDriveBtn').addEventListener('click', () => {
            this.saveCurrentProject();
        });
        
        document.getElementById('createFolderBtn').addEventListener('click', () => {
            this.createFolder();
        });
        
        document.getElementById('refreshDriveBtn').addEventListener('click', () => {
            this.refreshFileList();
        });

        // New: Open Drive Settings button
        document.getElementById('openDriveSettingsBtn').addEventListener('click', () => {
            this.openDriveSettings();
        });
        
        // Modal backdrop click
        document.getElementById('googleDriveModal').addEventListener('click', (e) => {
            if (e.target.id === 'googleDriveModal') {
                this.closeDriveModal();
            }
        });
        
        // Breadcrumb navigation
        document.querySelector('.drive-breadcrumb').addEventListener('click', (e) => {
            const breadcrumbItem = e.target.closest('.breadcrumb-item');
            if (breadcrumbItem) {
                const folderId = breadcrumbItem.dataset.folderId;
                this.navigateToFolder(folderId);
            }
        });
    }

    openDriveSettings() {
        // Close the Drive modal
        this.closeDriveModal();
        
        // Open settings modal and navigate to Google Drive tab
        if (window.webDevStudio) {
            window.webDevStudio.openSettings('drive');
        } else {
            // Fallback: directly open settings modal
            document.getElementById('settingsModal').classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Switch to Drive settings tab
            document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
            
            document.querySelector('[data-tab="drive"]').classList.add('active');
            document.getElementById('driveSettings').classList.add('active');
        }
    }
    
    async initializeGoogleAPIs() {
        try {
            console.log('Initializing Google APIs...');
            
            await new Promise((resolve) => {
                gapi.load('auth2:client', resolve);
            });
            
            await gapi.client.init({
                apiKey: this.apiKey,
                clientId: this.clientId,
                discoveryDocs: [this.DISCOVERY_DOC],
                scope: this.SCOPES
            });
            
            // Check if user is already signed in
            const authInstance = gapi.auth2.getAuthInstance();
            this.isSignedIn = authInstance.isSignedIn.get();
            
            if (this.isSignedIn) {
                this.onSignInSuccess();
            } else if (this.autoLogin && this.accessToken) {
                // Try to restore session with stored token
                await this.restoreSession();
            }
            
            // Listen for sign-in state changes
            authInstance.isSignedIn.listen((isSignedIn) => {
                this.isSignedIn = isSignedIn;
                if (isSignedIn) {
                    this.onSignInSuccess();
                } else {
                    this.onSignOut();
                }
            });
            
            console.log('Google APIs initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Google APIs:', error);
            this.showNotification('Failed to initialize Google Drive. Please check your API credentials.', 'error');
        }
    }
    
    async restoreSession() {
        try {
            if (this.accessToken) {
                gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
                this.isSignedIn = true;
                this.onSignInSuccess();
            }
        } catch (error) {
            console.warn('Failed to restore Google Drive session:', error);
            this.accessToken = '';
            this.refreshToken = '';
            this.saveSettings();
        }
    }
    
    async signIn() {
        try {
            if (!this.clientId || !this.apiKey) {
                this.showNotification('Please configure Google Drive credentials in Settings first.', 'warning');
                return;
            }
            
            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            
            // Store tokens
            const authResponse = user.getAuthResponse();
            this.accessToken = authResponse.access_token;
            this.refreshToken = authResponse.refresh_token || this.refreshToken;
            this.saveSettings();
            
            this.onSignInSuccess();
            
        } catch (error) {
            console.error('Sign in failed:', error);
            this.showNotification('Failed to sign in to Google Drive.', 'error');
        }
    }
    
    async signOut() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            
            // Clear stored tokens
            this.accessToken = '';
            this.refreshToken = '';
            this.saveSettings();
            
            this.onSignOut();
            
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    }
    
    onSignInSuccess() {
        console.log('Google Drive sign in successful');
        this.isSignedIn = true;
        this.updateAuthUI();
        this.loadFileList();
        
        // Get user info
        const user = gapi.auth2.getAuthInstance().currentUser.get();
        const profile = user.getBasicProfile();
        document.getElementById('driveUserInfo').textContent = `Connected as ${profile.getName()}`;
    }
    
    onSignOut() {
        console.log('Google Drive signed out');
        this.isSignedIn = false;
        this.updateAuthUI();
        this.clearFileList();
    }
    
    updateAuthUI() {
        const authStatus = document.getElementById('driveAuthStatus');
        const disconnected = authStatus.querySelector('.auth-disconnected');
        const connected = authStatus.querySelector('.auth-connected');
        const actionButtons = document.querySelectorAll('#saveToGoogleDriveBtn, #createFolderBtn');
        
        if (this.isSignedIn) {
            disconnected.style.display = 'none';
            connected.style.display = 'block';
            actionButtons.forEach(btn => btn.disabled = false);
        } else {
            disconnected.style.display = 'block';
            connected.style.display = 'none';
            actionButtons.forEach(btn => btn.disabled = true);
        }
        
        // Update auto-login checkbox
        document.getElementById('autoLoginDrive').checked = this.autoLogin;
    }
    
    async loadFileList(folderId = 'root') {
        if (!this.isSignedIn) return;
        
        try {
            this.showLoading('Loading files...');
            
            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                orderBy: 'folder,name',
                fields: 'files(id,name,mimeType,modifiedTime,size,parents)',
                pageSize: 100
            });
            
            const files = response.result.files || [];
            this.displayFiles(files);
            this.currentFolderId = folderId;
            
        } catch (error) {
            console.error('Failed to load files:', error);
            this.showNotification('Failed to load Google Drive files.', 'error');
            this.clearFileList();
        }
    }
    
    displayFiles(files) {
        const container = document.getElementById('driveFilesList');
        
        if (files.length === 0) {
            container.innerHTML = `
                <div class="drive-loading">
                    <i class="fas fa-folder-open"></i>
                    <p>This folder is empty</p>
                </div>
            `;
            return;
        }
        
        const fileItems = files.map(file => {
            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
            const isProject = file.name.endsWith('.webdev-project.json');
            const icon = isFolder ? 'fas fa-folder' : 
                       isProject ? 'fas fa-project-diagram' : 'fas fa-file';
            
            const modifiedDate = new Date(file.modifiedTime).toLocaleDateString();
            const size = file.size ? this.formatFileSize(parseInt(file.size)) : '';
            
            return `
                <div class="drive-file-item" data-file-id="${file.id}" data-file-type="${file.mimeType}">
                    <div class="drive-file-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="drive-file-details">
                        <div class="drive-file-name">${this.escapeHtml(file.name)}</div>
                        <div class="drive-file-meta">${modifiedDate} ${size ? '• ' + size : ''}</div>
                    </div>
                    <div class="drive-file-actions">
                        ${isProject ? `<button class="btn-load" title="Load Project" data-action="load">
                            <i class="fas fa-download"></i>
                        </button>` : ''}
                        ${isFolder ? `<button class="btn-open" title="Open Folder" data-action="open">
                            <i class="fas fa-folder-open"></i>
                        </button>` : ''}
                        <button class="btn-danger" title="Delete" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = fileItems;
        
        // Add event listeners to file items
        container.querySelectorAll('.drive-file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.drive-file-actions')) return;
                
                const fileType = item.dataset.fileType;
                const fileId = item.dataset.fileId;
                
                if (fileType === 'application/vnd.google-apps.folder') {
                    this.navigateToFolder(fileId);
                }
            });
            
            // Action buttons
            item.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const fileId = item.dataset.fileId;
                    const fileName = item.querySelector('.drive-file-name').textContent;
                    
                    switch (action) {
                        case 'load':
                            this.loadProject(fileId, fileName);
                            break;
                        case 'open':
                            this.navigateToFolder(fileId);
                            break;
                        case 'delete':
                            this.deleteFile(fileId, fileName);
                            break;
                    }
                });
            });
        });
    }
    
    async navigateToFolder(folderId) {
        try {
            // Update breadcrumb
            if (folderId === 'root') {
                this.breadcrumb = [{ id: 'root', name: 'My Drive' }];
            } else {
                // Get folder info
                const response = await gapi.client.drive.files.get({
                    fileId: folderId,
                    fields: 'id,name,parents'
                });
                
                const folder = response.result;
                
                // Find the position in breadcrumb or add new
                const existingIndex = this.breadcrumb.findIndex(item => item.id === folderId);
                if (existingIndex >= 0) {
                    // Truncate breadcrumb to this folder
                    this.breadcrumb = this.breadcrumb.slice(0, existingIndex + 1);
                } else {
                    // Add new folder to breadcrumb
                    this.breadcrumb.push({ id: folderId, name: folder.name });
                }
            }
            
            this.updateBreadcrumb();
            await this.loadFileList(folderId);
            
        } catch (error) {
            console.error('Failed to navigate to folder:', error);
            this.showNotification('Failed to open folder.', 'error');
        }
    }
    
    updateBreadcrumb() {
        const container = document.querySelector('.drive-breadcrumb');
        const items = this.breadcrumb.map((item, index) => {
            const isActive = index === this.breadcrumb.length - 1;
            return `
                <span class="breadcrumb-item ${isActive ? 'active' : ''}" data-folder-id="${item.id}">
                    ${index === 0 ? '<i class="fas fa-home"></i>' : ''}
                    ${this.escapeHtml(item.name)}
                </span>
            `;
        }).join('');
        
        container.innerHTML = items;
    }
    
    async saveCurrentProject() {
        if (!this.isSignedIn) {
            this.showNotification('Please sign in to Google Drive first.', 'warning');
            return;
        }
        
        try {
            // Get current project data
            const projectData = window.fileSystem.exportProject();
            if (!projectData) {
                this.showNotification('No project data to save.', 'warning');
                return;
            }
            
            // Get project name
            const projectName = prompt('Enter project name:', 'My WebDev Project');
            if (!projectName) return;
            
            const fileName = `${projectName}.webdev-project.json`;
            
            // Ensure we're in the right folder
            await this.ensureProjectFolder();
            
            // Save to Google Drive
            const fileMetadata = {
                name: fileName,
                parents: [this.currentFolderId]
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
            form.append('file', new Blob([projectData], {type: 'application/json'}));
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                }),
                body: form
            });
            
            if (response.ok) {
                this.showNotification(`Project "${projectName}" saved to Google Drive successfully!`, 'success');
                this.refreshFileList();
            } else {
                throw new Error('Failed to save project');
            }
            
        } catch (error) {
            console.error('Failed to save project:', error);
            this.showNotification('Failed to save project to Google Drive.', 'error');
        }
    }
    
    async loadProject(fileId, fileName) {
        try {
            this.showLoading('Loading project...');
            
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            
            const projectData = response.body;
            const success = window.fileSystem.importProject(projectData);
            
            if (success) {
                // Close all open tabs
                if (window.codeEditor) {
                    Array.from(window.codeEditor.tabs.keys()).forEach(path => {
                        window.codeEditor.closeTab(path);
                    });
                }
                
                this.showNotification(`Project "${fileName}" loaded successfully!`, 'success');
                this.closeDriveModal();
            } else {
                throw new Error('Invalid project file format');
            }
            
        } catch (error) {
            console.error('Failed to load project:', error);
            this.showNotification('Failed to load project from Google Drive.', 'error');
        }
    }
    
    async deleteFile(fileId, fileName) {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }
        
        try {
            await gapi.client.drive.files.delete({
                fileId: fileId
            });
            
            this.showNotification(`"${fileName}" deleted successfully.`, 'success');
            this.refreshFileList();
            
        } catch (error) {
            console.error('Failed to delete file:', error);
            this.showNotification('Failed to delete file.', 'error');
        }
    }
    
    async createFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;
        
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [this.currentFolderId]
            };
            
            await gapi.client.drive.files.create({
                resource: fileMetadata
            });
            
            this.showNotification(`Folder "${folderName}" created successfully!`, 'success');
            this.refreshFileList();
            
        } catch (error) {
            console.error('Failed to create folder:', error);
            this.showNotification('Failed to create folder.', 'error');
        }
    }
    
    async ensureProjectFolder() {
        if (this.currentFolderId !== 'root' || !this.defaultFolder) {
            return;
        }
        
        try {
            // Check if default folder exists
            const response = await gapi.client.drive.files.list({
                q: `name='${this.defaultFolder}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`,
                fields: 'files(id,name)'
            });
            
            if (response.result.files.length > 0) {
                // Folder exists, navigate to it
                const folderId = response.result.files[0].id;
                await this.navigateToFolder(folderId);
            } else {
                // Create the folder
                const fileMetadata = {
                    name: this.defaultFolder,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: ['root']
                };
                
                const createResponse = await gapi.client.drive.files.create({
                    resource: fileMetadata
                });
                
                const folderId = createResponse.result.id;
                await this.navigateToFolder(folderId);
                this.showNotification(`Created folder "${this.defaultFolder}"`, 'info');
            }
            
        } catch (error) {
            console.error('Failed to ensure project folder:', error);
        }
    }
    
    refreshFileList() {
        this.loadFileList(this.currentFolderId);
    }
    
    showLoading(message) {
        const container = document.getElementById('driveFilesList');
        container.innerHTML = `
            <div class="drive-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    clearFileList() {
        const container = document.getElementById('driveFilesList');
        container.innerHTML = `
            <div class="drive-loading">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Please sign in to view your Google Drive files</p>
            </div>
        `;
    }
    
    openDriveModal() {
        document.getElementById('googleDriveModal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Initialize if not done yet
        if (!this.isSignedIn && this.clientId && this.apiKey && !gapi.client) {
            this.initializeGoogleAPIs();
        }
    }
    
    closeDriveModal() {
        document.getElementById('googleDriveModal').classList.remove('show');
        document.body.style.overflow = '';
    }
    
    updateSettings(newSettings) {
        if (newSettings.clientId !== undefined) {
            this.clientId = newSettings.clientId;
        }
        if (newSettings.apiKey !== undefined) {
            this.apiKey = newSettings.apiKey;
        }
        if (newSettings.autoLogin !== undefined) {
            this.autoLogin = newSettings.autoLogin;
        }
        if (newSettings.defaultFolder !== undefined) {
            this.defaultFolder = newSettings.defaultFolder;
        }
        
        this.saveSettings();
        
        // Reinitialize if credentials are now available
        if (this.clientId && this.apiKey && !gapi.client) {
            this.initializeGoogleAPIs();
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message, type = 'info') {
        // Use the existing notification system
        if (window.webDevStudio) {
            window.webDevStudio.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize Google Drive Manager
window.googleDriveManager = new GoogleDriveManager();
