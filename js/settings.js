// Settings Management

class SettingsManager {
    constructor() {
        this.settings = {
            general: {
                autoSave: true,
                showWelcome: true
            },
            editor: {
                fontSize: 14,
                tabSize: 2,
                wordWrap: false,
                lineNumbers: true
            },
            theme: {
                colorTheme: 'dark',
                customCSS: ''
            },
            ai: {
                openaiApiKey: '',
                model: 'gpt-3.5-turbo',
                maxTokens: 2000
            },
            drive: {
                clientId: '',
                apiKey: '',
                autoLogin: true,
                defaultFolder: 'WebDev Studio Projects'
            },
            shortcuts: {
                // Keyboard shortcuts will be handled separately
            }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.applySettings();
    }
    
    setupEventListeners() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        // Close settings button
        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        // Theme toggle button
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchSettingsTab(tab.dataset.tab);
            });
        });
        
        // Settings form inputs
        this.setupSettingsInputs();
        
        // Modal backdrop click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettingsModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettingsModal();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                this.openSettingsModal();
            }
        });
    }
    
    setupSettingsInputs() {
        // General settings
        document.getElementById('autoSave').addEventListener('change', (e) => {
            this.updateSetting('general', 'autoSave', e.target.checked);
        });

        document.getElementById('showWelcome').addEventListener('change', (e) => {
            this.updateSetting('general', 'showWelcome', e.target.checked);
        });

        // Editor settings
        document.getElementById('fontSize').addEventListener('change', (e) => {
            this.updateSetting('editor', 'fontSize', parseInt(e.target.value));
            this.applyEditorSettings();
        });

        document.getElementById('tabSize').addEventListener('change', (e) => {
            this.updateSetting('editor', 'tabSize', parseInt(e.target.value));
            this.applyEditorSettings();
        });

        document.getElementById('wordWrap').addEventListener('change', (e) => {
            this.updateSetting('editor', 'wordWrap', e.target.checked);
            this.applyEditorSettings();
        });

        document.getElementById('lineNumbers').addEventListener('change', (e) => {
            this.updateSetting('editor', 'lineNumbers', e.target.checked);
            this.applyEditorSettings();
        });

        // Theme settings
        document.getElementById('colorTheme').addEventListener('change', (e) => {
            this.updateSetting('theme', 'colorTheme', e.target.value);
            this.applyTheme();
        });

        document.getElementById('customCSS').addEventListener('input', (e) => {
            this.updateSetting('theme', 'customCSS', e.target.value);
            this.applyCustomCSS();
        });

        // AI settings
        document.getElementById('openaiApiKey').addEventListener('change', (e) => {
            this.updateSetting('ai', 'openaiApiKey', e.target.value);
            this.applyAISettings();
        });

        document.getElementById('aiModel').addEventListener('change', (e) => {
            this.updateSetting('ai', 'model', e.target.value);
            this.applyAISettings();
        });

        document.getElementById('maxTokens').addEventListener('change', (e) => {
            this.updateSetting('ai', 'maxTokens', parseInt(e.target.value));
            this.applyAISettings();
        });

        // Google Drive settings
        document.getElementById('googleClientId').addEventListener('change', (e) => {
            this.updateSetting('drive', 'clientId', e.target.value);
            this.applyDriveSettings();
        });

        document.getElementById('googleApiKey').addEventListener('change', (e) => {
            this.updateSetting('drive', 'apiKey', e.target.value);
            this.applyDriveSettings();
        });

        document.getElementById('googleDriveAutoLogin').addEventListener('change', (e) => {
            this.updateSetting('drive', 'autoLogin', e.target.checked);
            this.applyDriveSettings();
        });

        document.getElementById('googleDriveFolder').addEventListener('change', (e) => {
            this.updateSetting('drive', 'defaultFolder', e.target.value);
            this.applyDriveSettings();
        });
    }
    
    loadSettings() {
        const saved = localStorage.getItem('webdev-studio-settings');
        if (saved) {
            try {
                const parsedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsedSettings };
            } catch (error) {
                console.warn('Failed to load settings:', error);
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('webdev-studio-settings', JSON.stringify(this.settings));
    }
    
    updateSetting(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        this.settings[category][key] = value;
        this.saveSettings();
    }
    
    getSetting(category, key, defaultValue = null) {
        return this.settings[category]?.[key] ?? defaultValue;
    }
    
    updateUI() {
        // General settings
        document.getElementById('autoSave').checked = this.getSetting('general', 'autoSave', true);
        document.getElementById('showWelcome').checked = this.getSetting('general', 'showWelcome', true);

        // Editor settings
        document.getElementById('fontSize').value = this.getSetting('editor', 'fontSize', 14);
        document.getElementById('tabSize').value = this.getSetting('editor', 'tabSize', 2);
        document.getElementById('wordWrap').checked = this.getSetting('editor', 'wordWrap', false);
        document.getElementById('lineNumbers').checked = this.getSetting('editor', 'lineNumbers', true);

        // Theme settings
        document.getElementById('colorTheme').value = this.getSetting('theme', 'colorTheme', 'dark');
        document.getElementById('customCSS').value = this.getSetting('theme', 'customCSS', '');

        // AI settings
        document.getElementById('openaiApiKey').value = this.getSetting('ai', 'openaiApiKey', '');
        document.getElementById('aiModel').value = this.getSetting('ai', 'model', 'gpt-3.5-turbo');
        document.getElementById('maxTokens').value = this.getSetting('ai', 'maxTokens', 2000);

        // Google Drive settings
        document.getElementById('googleClientId').value = this.getSetting('drive', 'clientId', '');
        document.getElementById('googleApiKey').value = this.getSetting('drive', 'apiKey', '');
        document.getElementById('googleDriveAutoLogin').checked = this.getSetting('drive', 'autoLogin', true);
        document.getElementById('googleDriveFolder').value = this.getSetting('drive', 'defaultFolder', 'WebDev Studio Projects');
    }
    
    applySettings() {
        this.applyTheme();
        this.applyEditorSettings();
        this.applyAISettings();
        this.applyDriveSettings();
        this.applyCustomCSS();
    }
    
    applyTheme() {
        const theme = this.getSetting('theme', 'colorTheme', 'dark');
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update CodeMirror theme
        if (window.codeEditor && window.codeEditor.editor) {
            const cmTheme = theme === 'light' ? 'default' : 'material-darker';
            window.codeEditor.editor.setOption('theme', cmTheme);
        }
    }
    
    applyEditorSettings() {
        if (window.codeEditor) {
            const editorSettings = {
                fontSize: this.getSetting('editor', 'fontSize', 14),
                tabSize: this.getSetting('editor', 'tabSize', 2),
                wordWrap: this.getSetting('editor', 'wordWrap', false),
                lineNumbers: this.getSetting('editor', 'lineNumbers', true)
            };
            
            window.codeEditor.updateSettings(editorSettings);
        }
    }
    
    applyAISettings() {
        if (window.chatGPT) {
            const aiSettings = {
                apiKey: this.getSetting('ai', 'openaiApiKey', ''),
                model: this.getSetting('ai', 'model', 'gpt-3.5-turbo'),
                maxTokens: this.getSetting('ai', 'maxTokens', 2000)
            };
            
            window.chatGPT.updateSettings(aiSettings);
        }
    }
    
    applyDriveSettings() {
        if (window.googleDriveManager) {
            const driveSettings = {
                clientId: this.getSetting('drive', 'clientId', ''),
                apiKey: this.getSetting('drive', 'apiKey', ''),
                autoLogin: this.getSetting('drive', 'autoLogin', true),
                defaultFolder: this.getSetting('drive', 'defaultFolder', 'WebDev Studio Projects')
            };
            
            window.googleDriveManager.updateSettings(driveSettings);
        }
    }
    
    applyCustomCSS() {
        const customCSS = this.getSetting('theme', 'customCSS', '');
        
        // Remove existing custom CSS
        const existingStyle = document.getElementById('custom-css');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Apply new custom CSS
        if (customCSS.trim()) {
            const style = document.createElement('style');
            style.id = 'custom-css';
            style.textContent = customCSS;
            document.head.appendChild(style);
        }
    }
    
    openSettingsModal() {
        document.getElementById('settingsModal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = document.querySelector('.settings-panel.active input, .settings-panel.active select, .settings-panel.active textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
        document.body.style.overflow = '';
    }
    
    switchSettingsTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Settings`).classList.add('active');
    }
    
    toggleTheme() {
        const currentTheme = this.getSetting('theme', 'colorTheme', 'dark');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.updateSetting('theme', 'colorTheme', newTheme);
        document.getElementById('colorTheme').value = newTheme;
        this.applyTheme();
        
        // Show notification
        this.showNotification(`Switched to ${newTheme} theme`, 'info');
    }
    
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
            localStorage.removeItem('webdev-studio-settings');
            localStorage.removeItem('webdev-studio-ai-settings');
            localStorage.removeItem('webdev-studio-drive-settings');
            
            // Reset to defaults
            this.settings = {
                general: {
                    autoSave: true,
                    showWelcome: true
                },
                editor: {
                    fontSize: 14,
                    tabSize: 2,
                    wordWrap: false,
                    lineNumbers: true
                },
                theme: {
                    colorTheme: 'dark',
                    customCSS: ''
                },
                ai: {
                    openaiApiKey: '',
                    model: 'gpt-3.5-turbo',
                    maxTokens: 2000
                },
                drive: {
                    clientId: '',
                    apiKey: '',
                    autoLogin: true,
                    defaultFolder: 'WebDev Studio Projects'
                }
            };
            
            this.updateUI();
            this.applySettings();
            this.showNotification('Settings reset to default', 'success');
        }
    }
    
    exportSettings() {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            settings: this.settings
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `webdev-studio-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Settings exported', 'success');
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                        this.saveSettings();
                        this.updateUI();
                        this.applySettings();
                        this.showNotification('Settings imported successfully', 'success');
                    } else {
                        throw new Error('Invalid settings file format');
                    }
                } catch (error) {
                    this.showNotification('Failed to import settings: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">×</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
            color: white;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
            z-index: 20000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    // Keyboard shortcuts handling
    setupKeyboardShortcuts() {
        const shortcuts = {
            'Ctrl+N': () => window.codeEditor?.createNewFile(),
            'Ctrl+O': () => window.codeEditor?.openFileDialog(),
            'Ctrl+S': () => window.codeEditor?.saveCurrentFile(),
            'Ctrl+Shift+E': () => this.togglePanel('left'),
            'Ctrl+Shift+A': () => this.togglePanel('right'),
            'F11': () => window.codeEditor?.toggleFullscreen(),
            'Ctrl+,': () => this.openSettingsModal()
        };
        
        document.addEventListener('keydown', (e) => {
            const key = (e.ctrlKey ? 'Ctrl+' : '') + 
                       (e.shiftKey ? 'Shift+' : '') + 
                       (e.altKey ? 'Alt+' : '') + 
                       e.key;
            
            if (shortcuts[key]) {
                e.preventDefault();
                shortcuts[key]();
            }
        });
    }
    
    togglePanel(side) {
        const panel = document.getElementById(side === 'left' ? 'leftPanel' : 'rightPanel');
        panel.classList.toggle('collapsed');
        
        // Save panel state
        this.updateSetting('ui', `${side}PanelCollapsed`, panel.classList.contains('collapsed'));
    }
}

// Add settings export/import buttons to the settings modal
document.addEventListener('DOMContentLoaded', () => {
    const generalSettings = document.getElementById('generalSettings');
    if (generalSettings) {
        const exportImportSection = document.createElement('div');
        exportImportSection.innerHTML = `
            <div class="setting-group">
                <label>Settings Management</label>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="btn-secondary" onclick="settingsManager.exportSettings()">Export Settings</button>
                    <button class="btn-secondary" onclick="settingsManager.importSettings()">Import Settings</button>
                    <button class="btn-secondary" onclick="settingsManager.resetSettings()" style="color: var(--error-color);">Reset to Default</button>
                </div>
            </div>
        `;
        generalSettings.appendChild(exportImportSection);
    }
});

// Create global settings manager instance
window.settingsManager = new SettingsManager();
