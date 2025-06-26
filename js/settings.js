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
        
        // Apply settings with a delay to ensure all components are loaded
        setTimeout(() => {
            this.applySettings();
        }, 500);
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
            this.updateModelInfoDisplay(e.target.value);
            
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ model: e.target.value });
            }
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

    updateModelInfoDisplay(modelId) {
        const modelInfoDisplay = document.getElementById('modelInfoDisplay');
        if (!modelInfoDisplay) return;

        // Comprehensive model information database
        const modelInfo = {
            // GPT-3.5 Models
            'gpt-3.5-turbo': {
                name: 'GPT-3.5 Turbo',
                description: 'Fast and cost-effective for most coding tasks',
                inputCost: '$0.0015 / 1K tokens',
                outputCost: '$0.002 / 1K tokens',
                contextWindow: '4K tokens',
                strengths: ['Fast responses', 'Low cost', 'Good for simple coding', 'General purpose']
            },
            'gpt-3.5-turbo-16k': {
                name: 'GPT-3.5 Turbo 16K',
                description: 'Extended context window for longer conversations',
                inputCost: '$0.003 / 1K tokens',
                outputCost: '$0.004 / 1K tokens',
                contextWindow: '16K tokens',
                strengths: ['Large context window', 'Handle long files', 'Complex conversations', 'Cost effective']
            },
            'gpt-3.5-turbo-1106': {
                name: 'GPT-3.5 Turbo 1106',
                description: 'Improved instruction following and JSON mode',
                inputCost: '$0.001 / 1K tokens',
                outputCost: '$0.002 / 1K tokens',
                contextWindow: '16K tokens',
                strengths: ['Better instruction following', 'JSON mode support', 'Function calling', 'Improved accuracy']
            },
            'gpt-3.5-turbo-0125': {
                name: 'GPT-3.5 Turbo 0125',
                description: 'Latest GPT-3.5 with reduced costs and improvements',
                inputCost: '$0.0005 / 1K tokens',
                outputCost: '$0.0015 / 1K tokens',
                contextWindow: '16K tokens',
                strengths: ['Lowest cost', 'Latest improvements', 'Reduced hallucination', 'Better reasoning']
            },

            // GPT-4 Models
            'gpt-4': {
                name: 'GPT-4',
                description: 'Most capable model for complex reasoning and analysis',
                inputCost: '$0.03 / 1K tokens',
                outputCost: '$0.06 / 1K tokens',
                contextWindow: '8K tokens',
                strengths: ['Superior reasoning', 'Complex problem solving', 'Code architecture', 'Best quality']
            },
            'gpt-4-32k': {
                name: 'GPT-4 32K',
                description: 'GPT-4 with extended context for large codebases',
                inputCost: '$0.06 / 1K tokens',
                outputCost: '$0.12 / 1K tokens',
                contextWindow: '32K tokens',
                strengths: ['Massive context window', 'Entire file analysis', 'Complex architectures', 'Premium quality']
            },
            'gpt-4-turbo': {
                name: 'GPT-4 Turbo',
                description: 'Faster GPT-4 with 128K context window',
                inputCost: '$0.01 / 1K tokens',
                outputCost: '$0.03 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Huge context window', 'Faster than GPT-4', 'Best for debugging', 'Multi-file analysis']
            },
            'gpt-4-turbo-preview': {
                name: 'GPT-4 Turbo Preview',
                description: 'Preview version of the latest GPT-4 Turbo',
                inputCost: '$0.01 / 1K tokens',
                outputCost: '$0.03 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Latest features', 'Cutting-edge capabilities', 'Preview access', 'Enhanced reasoning']
            },
            'gpt-4-1106-preview': {
                name: 'GPT-4 Turbo 1106',
                description: 'GPT-4 Turbo with JSON mode and function calling',
                inputCost: '$0.01 / 1K tokens',
                outputCost: '$0.03 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['JSON mode', 'Function calling', 'Tool integration', 'Structured outputs']
            },
            'gpt-4-0125-preview': {
                name: 'GPT-4 Turbo 0125',
                description: 'Latest GPT-4 Turbo with improved performance',
                inputCost: '$0.01 / 1K tokens',
                outputCost: '$0.03 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Latest improvements', 'Reduced lazy responses', 'Better task completion', 'Enhanced accuracy']
            },

            // GPT-4o Models (Omni)
            'gpt-4o': {
                name: 'GPT-4o',
                description: 'Multimodal model with vision and audio capabilities',
                inputCost: '$0.005 / 1K tokens',
                outputCost: '$0.015 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Vision capabilities', 'Multimodal', 'Screenshot analysis', 'UI design help'],
                recommended: true
            },
            'gpt-4o-mini': {
                name: 'GPT-4o Mini',
                description: 'Perfect balance of performance and cost - Our top recommendation!',
                inputCost: '$0.00015 / 1K tokens',
                outputCost: '$0.0006 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Excellent value', 'Fast responses', 'Great for coding', 'Large context', 'Best overall choice'],
                recommended: true,
                topChoice: true
            },
            'gpt-4o-2024-05-13': {
                name: 'GPT-4o (May 2024)',
                description: 'Specific GPT-4o version from May 2024',
                inputCost: '$0.005 / 1K tokens',
                outputCost: '$0.015 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Stable version', 'Reliable performance', 'Multimodal features', 'Proven track record']
            },
            'gpt-4o-2024-08-06': {
                name: 'GPT-4o (Aug 2024)',
                description: 'Latest GPT-4o version with performance improvements',
                inputCost: '$0.0025 / 1K tokens',
                outputCost: '$0.01 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Latest improvements', 'Better reasoning', 'Enhanced multimodal', 'Cutting-edge features']
            },

            // Specialized Models
            'gpt-4-vision-preview': {
                name: 'GPT-4 Vision',
                description: 'GPT-4 with advanced image understanding capabilities',
                inputCost: '$0.01 / 1K tokens',
                outputCost: '$0.03 / 1K tokens',
                contextWindow: '128K tokens',
                strengths: ['Advanced vision', 'Image analysis', 'UI mockup understanding', 'Visual debugging']
            },
            'gpt-4-code-interpreter': {
                name: 'GPT-4 Code Interpreter',
                description: 'GPT-4 optimized for code analysis and generation',
                inputCost: '$0.03 / 1K tokens',
                outputCost: '$0.06 / 1K tokens',
                contextWindow: '8K tokens',
                strengths: ['Code optimization', 'Algorithm design', 'Performance analysis', 'Code review']
            },
            'code-davinci-002': {
                name: 'Code Davinci 002',
                description: 'Specialized model for code understanding and generation',
                inputCost: '$0.02 / 1K tokens',
                outputCost: '$0.02 / 1K tokens',
                contextWindow: '8K tokens',
                strengths: ['Pure code generation', 'Syntax accuracy', 'Language translation', 'Code completion']
            },

            // Legacy Models
            'text-davinci-003': {
                name: 'Text Davinci 003',
                description: 'Legacy but powerful text completion model',
                inputCost: '$0.02 / 1K tokens',
                outputCost: '$0.02 / 1K tokens',
                contextWindow: '4K tokens',
                strengths: ['Text completion', 'Creative writing', 'Legacy support', 'Stable performance']
            },
            'gpt-4.1': {
                name: 'GPT-4.1',
                description: 'Latest GPT-4 version with enhanced capabilities',
                inputCost: '$0.03 / 1K tokens',
                outputCost: '$0.06 / 1K tokens',
                contextWindow: '32K tokens',
                strengths: ['Latest features', 'Enhanced reasoning', 'Improved accuracy', 'Future-ready']
            }
        };

        const info = modelInfo[modelId];
        if (info) {
            const badges = [];
            if (info.topChoice) badges.push('<span class="top-choice-badge">🏆 Top Choice</span>');
            if (info.recommended) badges.push('<span class="recommended-badge">⭐ Recommended</span>');

            modelInfoDisplay.innerHTML = `
            <div class="model-details">
                <div class="model-stat">
                    <span><strong>Model:</strong> ${info.name}</span>
                    <div class="model-badges">${badges.join('')}</div>
                </div>
                <div class="model-description">
                    <p><em>${info.description}</em></p>
                </div>
                <div class="model-pricing">
                    <div class="pricing-row">
                        <span><strong>Input Cost:</strong></span>
                        <span class="price">${info.inputCost}</span>
                    </div>
                    <div class="pricing-row">
                        <span><strong>Output Cost:</strong></span>
                        <span class="price">${info.outputCost}</span>
                    </div>
                    <div class="pricing-row">
                        <span><strong>Context Window:</strong></span>
                        <span class="context">${info.contextWindow}</span>
                    </div>
                </div>
                <div class="model-strengths">
                    <strong>Best for:</strong>
                    <div class="strengths-grid">
                        ${info.strengths.map(strength => `<span class="strength-tag">${strength}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
        } else {
            modelInfoDisplay.innerHTML = `
            <div class="model-placeholder">
                <p>Select a model to see pricing and capability information</p>
                <div class="model-recommendations">
                    <h4>💡 Quick Recommendations:</h4>
                    <ul>
                        <li><strong>GPT-4o Mini:</strong> Best overall choice for coding</li>
                        <li><strong>GPT-3.5 Turbo 0125:</strong> Most affordable option</li>
                        <li><strong>GPT-4 Turbo:</strong> Best for complex debugging</li>
                        <li><strong>GPT-4o:</strong> For projects with images</li>
                    </ul>
                </div>
            </div>
        `;
        }
    }

    updateModelDropdown() {
        const modelSelect = document.getElementById('aiModel');
        if (!modelSelect) return;

        // Clear existing options
        modelSelect.innerHTML = '';

        // Define model groups with their options
        const modelGroups = {
            'GPT-4o Models (Recommended)': [
                { value: 'gpt-4o-mini', text: 'GPT-4o Mini (🏆 Best Overall Choice)', selected: true },
                { value: 'gpt-4o', text: 'GPT-4o (Multimodal)' },
                { value: 'gpt-4o-2024-08-06', text: 'GPT-4o (Aug 2024)' },
                { value: 'gpt-4o-2024-05-13', text: 'GPT-4o (May 2024)' }
            ],
            'GPT-4 Turbo Models': [
                { value: 'gpt-4-turbo', text: 'GPT-4 Turbo (128K Context)' },
                { value: 'gpt-4-turbo-preview', text: 'GPT-4 Turbo Preview' },
                { value: 'gpt-4-1106-preview', text: 'GPT-4 Turbo 1106' },
                { value: 'gpt-4-0125-preview', text: 'GPT-4 Turbo 0125' }
            ],
            'GPT-4 Standard Models': [
                { value: 'gpt-4', text: 'GPT-4 (8K Context)' },
                { value: 'gpt-4-32k', text: 'GPT-4 32K' },
                { value: 'gpt-4-vision-preview', text: 'GPT-4 Vision' }
            ],
            'GPT-3.5 Models (Budget Friendly)': [
                { value: 'gpt-3.5-turbo-0125', text: 'GPT-3.5 Turbo 0125 (Cheapest)' },
                { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' },
                { value: 'gpt-3.5-turbo-16k', text: 'GPT-3.5 Turbo 16K' },
                { value: 'gpt-3.5-turbo-1106', text: 'GPT-3.5 Turbo 1106' }
            ],
            'Specialized Models': [
                { value: 'gpt-4-code-interpreter', text: 'GPT-4 Code Interpreter' },
                { value: 'code-davinci-002', text: 'Code Davinci 002' }
            ],
            'Legacy Models': [
                { value: 'text-davinci-003', text: 'Text Davinci 003' }
            ]
        };

        // Get current model selection
        const currentModel = this.getSetting('ai', 'model', 'gpt-4o-mini');

        // Create optgroups and options
        Object.entries(modelGroups).forEach(([groupName, models]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;

            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.text;
                
                // Set selected based on current settings
                if (model.value === currentModel) {
                    option.selected = true;
                }
                
                optgroup.appendChild(option);
            });

            modelSelect.appendChild(optgroup);
        });

        // Update model info display for current selection
        this.updateModelInfoDisplay(currentModel);
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
        if (window.codeEditor && typeof window.codeEditor.updateSettings === 'function') {
            const editorSettings = {
                fontSize: this.getSetting('editor', 'fontSize', 14),
                tabSize: this.getSetting('editor', 'tabSize', 2),
                wordWrap: this.getSetting('editor', 'wordWrap', false),
                lineNumbers: this.getSetting('editor', 'lineNumbers', true)
            };

            try {
                window.codeEditor.updateSettings(editorSettings);
            } catch (error) {
                console.warn('Failed to apply editor settings:', error);
            }
        } else {
            console.warn('CodeEditor updateSettings method not available');
        }
    }

    applyAISettings() {
        if (window.chatGPT) {
            const aiSettings = {
                apiKey: this.getSetting('ai', 'openaiApiKey', ''),
                model: this.getSetting('ai', 'model', 'gpt-4o-mini'),
                maxTokens: this.getSetting('ai', 'maxTokens', 2000)
            };

            try {
                window.chatGPT.updateSettings(aiSettings);
            } catch (error) {
                console.warn('Failed to update ChatGPT settings:', error);
            }
        }

        // Update the model dropdown with all available models
        try {
            this.updateModelDropdown();
        } catch (error) {
            console.warn('Failed to update model dropdown:', error);
            // Fallback: just update the select value
            const modelSelect = document.getElementById('aiModel');
            if (modelSelect) {
                modelSelect.value = this.getSetting('ai', 'model', 'gpt-4o-mini');
            }
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

    saveAISettings() {
        const formData = {
            apiKey: document.getElementById('ai-api-key').value,
            model: document.getElementById('ai-model-select').value,
            maxTokens: parseInt(document.getElementById('ai-max-tokens').value)
        };
        
        // Update the ChatGPT instance
        if (window.chatGPT) {
            window.chatGPT.updateSettings(formData);
        }
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
