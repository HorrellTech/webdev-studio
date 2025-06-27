// ChatGPT AI Assistant Integration

class ChatGPTAssistant {
    constructor() {
        this.apiKey = '';
        this.model = 'gpt-3.5-turbo';
        this.maxTokens = 6000;
        this.messages = [];
        this.isTyping = false;

        // Add message history tracking
        this.messageHistory = [];
        this.historyIndex = -1;
        this.currentDraft = '';

        // Gemini-specific properties
        this.geminiApiKey = '';
        this.geminiModel = 'gemini-2.0-flash';

        // Add file references tracking
        this.referencedFiles = new Set();

        // Add model-specific token limits
        this.modelLimits = {
            'gpt-3.5-turbo': { context: 4096, maxTokens: 4000 },
            'gpt-3.5-turbo-16k': { context: 16384, maxTokens: 8000 },
            'gpt-3.5-turbo-1106': { context: 4096, maxTokens: 4000 },
            'gpt-3.5-turbo-0125': { context: 4096, maxTokens: 4000 },
            'gpt-4': { context: 8192, maxTokens: 4000 },
            'gpt-4-32k': { context: 32768, maxTokens: 8000 },
            'gpt-4-turbo': { context: 128000, maxTokens: 4000 },
            'gpt-4-turbo-preview': { context: 128000, maxTokens: 4000 },
            'gpt-4-1106-preview': { context: 128000, maxTokens: 4000 },
            'gpt-4-0125-preview': { context: 128000, maxTokens: 4000 },
            'gpt-4o': { context: 128000, maxTokens: 4000 },
            'gpt-4o-mini': { context: 128000, maxTokens: 16000 },
            'gpt-4o-2024-05-13': { context: 128000, maxTokens: 4000 },
            'gpt-4o-2024-08-06': { context: 128000, maxTokens: 4000 },
            'gpt-4-vision-preview': { context: 128000, maxTokens: 4000 },
            'gpt-4-code-interpreter': { context: 8192, maxTokens: 4000 },
            'text-davinci-003': { context: 4096, maxTokens: 4000 },
            'code-davinci-002': { context: 8192, maxTokens: 4000 },
            'gpt-4.1': { context: 32768, maxTokens: 4000 }
        };

        // Add available models list
        this.availableModels = [
            // GPT-3.5 Models
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective for most tasks' },
            { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', description: 'Longer context window (16K tokens)' },
            { id: 'gpt-3.5-turbo-1106', name: 'GPT-3.5 Turbo 1106', description: 'Updated GPT-3.5 with improved instruction following' },
            { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo 0125', description: 'Latest GPT-3.5 with reduced costs' },

            // GPT-4 Models
            { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model for complex reasoning' },
            { id: 'gpt-4-32k', name: 'GPT-4 32K', description: 'GPT-4 with extended context (32K tokens)' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Faster GPT-4 with 128K context window' },
            { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', description: 'Preview of latest GPT-4 Turbo' },
            { id: 'gpt-4-1106-preview', name: 'GPT-4 Turbo 1106', description: 'GPT-4 Turbo with JSON mode and function calling' },
            { id: 'gpt-4-0125-preview', name: 'GPT-4 Turbo 0125', description: 'Latest GPT-4 Turbo with improved performance' },

            // GPT-4o Models (Omni)
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal model with vision and audio capabilities' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Smaller, faster GPT-4o - great balance of cost and performance' },
            { id: 'gpt-4o-2024-05-13', name: 'GPT-4o (May 2024)', description: 'Specific GPT-4o version from May 2024' },
            { id: 'gpt-4o-2024-08-06', name: 'GPT-4o (Aug 2024)', description: 'Latest GPT-4o version with improvements' },

            // Experimental/Specialized Models
            { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision', description: 'GPT-4 with image understanding capabilities' },
            { id: 'gpt-4-code-interpreter', name: 'GPT-4 Code Interpreter', description: 'GPT-4 optimized for code analysis and generation' },

            // Legacy but still useful models
            { id: 'text-davinci-003', name: 'Text Davinci 003', description: 'Legacy but powerful text completion model' },
            { id: 'code-davinci-002', name: 'Code Davinci 002', description: 'Specialized for code understanding and generation' },
            { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Latest version with improved performance' }
        ];

        this.initialize();
    }

    initialize() {
        // Load settings from localStorage
        this.loadSettings();

        // Initialize Gemini API if available
        if (window.GeminiAPI) {
            this.geminiAPI = new window.GeminiAPI();
            if (this.geminiApiKey) {
                this.geminiAPI.setApiKey(this.geminiApiKey);
                this.geminiAPI.setModel(this.geminiModel);
            }
        }

        // Setup event listeners
        this.setupEventListeners();

        // Setup API event listeners (delayed to ensure DOM is ready)
        setTimeout(() => {
            this.setupAPIEventListeners();
        }, 100);

        // Update model dropdown with error handling
        try {
            if (window.settingsManager && typeof window.settingsManager.updateModelDropdown === 'function') {
                window.settingsManager.updateModelDropdown();
            }
        } catch (error) {
            console.warn('Failed to update model dropdown from ChatGPT:', error);
        }

        // Update UI based on API key availability
        this.updateUI();

        // Update file references UI
        this.updateFileReferencesUI();

        // IMPORTANT: Load settings into form after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.loadSettingsIntoForm();
        }, 100);

        // Update settings dropdown with available models
        if (window.settingsManager) {
            window.settingsManager.updateModelDropdown();
        }

        // Show appropriate welcome message
        if (!this.getCurrentApiKey() || this.getCurrentApiKey().length === 0) {
            this.addSystemMessage(`Welcome to WebDev Studio AI Assistant! 🤖`);
            setTimeout(() => {
                this.showSetupInstructions();
            }, 500);
        } else {
            this.addSystemMessage(`${this.getProviderName()} Assistant is ready! Ask me anything about your code.`);
            this.updateModelInfo();
        }

        this.clearChat();
    }

    setupEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');

        // Send message on button click
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Add arrow key navigation for message history
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            } else if (e.key === 'Escape') {
                // Clear current input and reset history navigation
                this.resetHistoryNavigation();
            }
        });

        // Track current draft when user starts typing
        chatInput.addEventListener('input', (e) => {
            if (this.historyIndex === -1) {
                this.currentDraft = e.target.value;
            }
            this.autoResizeInput(chatInput);
        });
    }

    navigateHistory(direction) {
        const chatInput = document.getElementById('chatInput');
        const indicator = document.getElementById('historyIndicator');

        if (this.messageHistory.length === 0) return;

        if (direction === 'up') {
            if (this.historyIndex === -1) {
                // First time pressing up - save current draft and go to most recent
                this.currentDraft = chatInput.value;
                this.historyIndex = this.messageHistory.length - 1;
            } else if (this.historyIndex > 0) {
                // Go to previous message
                this.historyIndex--;
            }

            chatInput.value = this.messageHistory[this.historyIndex];
        } else if (direction === 'down') {
            if (this.historyIndex === -1) return; // Already at current draft

            if (this.historyIndex < this.messageHistory.length - 1) {
                // Go to next message
                this.historyIndex++;
                chatInput.value = this.messageHistory[this.historyIndex];
            } else {
                // Return to current draft
                this.historyIndex = -1;
                chatInput.value = this.currentDraft;
            }
        }

        // Update visual indicator
        this.updateHistoryIndicator();

        // Auto-resize input and move cursor to end
        this.autoResizeInput(chatInput);
        chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
    }

    updateHistoryIndicator() {
        const indicator = document.getElementById('historyIndicator');
        if (!indicator) return;

        if (this.historyIndex === -1) {
            indicator.classList.remove('show');
        } else {
            const position = this.messageHistory.length - this.historyIndex;
            const total = this.messageHistory.length;
            indicator.textContent = `${position}/${total}`;
            indicator.classList.add('show');
        }
    }

    resetHistoryNavigation() {
        const chatInput = document.getElementById('chatInput');
        const indicator = document.getElementById('historyIndicator');

        this.historyIndex = -1;
        this.currentDraft = '';
        chatInput.value = '';
        this.autoResizeInput(chatInput);

        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    loadSettingsIntoForm() {
        // Load settings into form elements
        const elements = {
            aiProvider: document.getElementById('aiProvider'),
            geminiApiKey: document.getElementById('geminiApiKey'),
            geminiModel: document.getElementById('geminiModel'),
            openaiApiKey: document.getElementById('openaiApiKey'),
            aiModel: document.getElementById('aiModel')
        };

        if (elements.aiProvider) elements.aiProvider.value = this.aiProvider || 'gemini';
        if (elements.geminiApiKey) elements.geminiApiKey.value = this.geminiApiKey || '';
        if (elements.geminiModel) elements.geminiModel.value = this.geminiModel || 'gemini-2.0-flash';
        if (elements.openaiApiKey) elements.openaiApiKey.value = this.apiKey || '';
        if (elements.aiModel) elements.aiModel.value = this.model || 'gpt-3.5-turbo';
    }

    setupAPIEventListeners() {
        // Gemini settings handlers - FIXED VERSION
        const geminiApiKeyInput = document.getElementById('geminiApiKey');
        const geminiModelSelect = document.getElementById('geminiModel');

        if(geminiApiKeyInput) {
            // Use both 'input' and 'change' events for immediate feedback
            geminiApiKeyInput.addEventListener('input', function () {
                if (window.chatGPT) {
                    window.chatGPT.updateSettings({ geminiApiKey: this.value });
                    console.log('🔑 Gemini API key updated:', this.value ? '***' + this.value.slice(-4) : 'empty');
                }
            });

            geminiApiKeyInput.addEventListener('change', function () {
                if (window.chatGPT) {
                    window.chatGPT.updateSettings({ geminiApiKey: this.value });
                }
            });
        }

        if(geminiModelSelect) {
            geminiModelSelect.addEventListener('change', function () {
                if (window.chatGPT) {
                    window.chatGPT.updateSettings({ geminiModel: this.value });
                    console.log('🤖 Gemini model updated:', this.value);
                }
            });
        }

        // Also handle OpenAI settings for completeness
        const openaiApiKeyInput = document.getElementById('openaiApiKey');
        const openaiModelSelect = document.getElementById('aiModel');

        if(openaiApiKeyInput) {
            openaiApiKeyInput.addEventListener('input', function () {
                if (window.chatGPT) {
                    window.chatGPT.updateSettings({ apiKey: this.value });
                }
            });
        }

        if(openaiModelSelect) {
            openaiModelSelect.addEventListener('change', function () {
                if (window.chatGPT) {
                    window.chatGPT.updateSettings({ model: this.value });
                }
            });
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('webdev-studio-ai-settings');
        console.log('📖 Loading AI settings from localStorage:', saved ? 'found' : 'not found');

        if (saved) {
            try {
                const settings = JSON.parse(saved);
                console.log('📖 Parsed settings:', {
                    provider: settings.aiProvider,
                    geminiKey: settings.geminiApiKey ? '***' + settings.geminiApiKey.slice(-4) : 'none',
                    geminiModel: settings.geminiModel,
                    openaiKey: settings.apiKey ? '***' + settings.apiKey.slice(-4) : 'none',
                    openaiModel: settings.model
                });

                // Load provider settings
                this.aiProvider = settings.aiProvider || 'gemini';

                // Load OpenAI settings
                if (settings.apiKey) this.apiKey = settings.apiKey;
                if (settings.model) this.model = settings.model;
                if (settings.maxTokens) this.maxTokens = settings.maxTokens;

                // Load Gemini settings
                if (settings.geminiApiKey) this.geminiApiKey = settings.geminiApiKey;
                if (settings.geminiModel) this.geminiModel = settings.geminiModel;

                // Load other settings
                if (settings.messageHistory) this.messageHistory = settings.messageHistory;
                if (settings.referencedFiles) this.referencedFiles = new Set(settings.referencedFiles);

                console.log('✅ AI settings loaded successfully:', {
                    provider: this.aiProvider,
                    model: this.getCurrentModel(),
                    hasApiKey: !!this.getCurrentApiKey()
                });
            } catch (error) {
                console.error('❌ Error loading AI settings:', error);
            }
        } else {
            console.log('📝 No saved AI settings found, using defaults');
        }
    }

    getCurrentApiKey() {
        return this.aiProvider === 'gemini' ? this.geminiApiKey : this.apiKey;
    }

    getCurrentModel() {
        return this.aiProvider === 'gemini' ? this.geminiModel : this.model;
    }

    getProviderName() {
        return this.aiProvider === 'gemini' ? 'Gemini' : 'ChatGPT';
    }


    debugSettings() {
        console.log('🔍 Current ChatGPT Settings:', {
            apiKey: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'Not set',
            model: this.model,
            maxTokens: this.maxTokens,
            localStorage: JSON.parse(localStorage.getItem('webdev-studio-ai-settings') || '{}')
        });
    }

    saveSettings() {
        const settings = {
            aiProvider: this.aiProvider,
            // OpenAI settings
            apiKey: this.apiKey,
            model: this.model,
            maxTokens: this.maxTokens,
            // Gemini settings
            geminiApiKey: this.geminiApiKey,
            geminiModel: this.geminiModel,
            // Common settings
            messageHistory: this.messageHistory,
            referencedFiles: Array.from(this.referencedFiles)
        };

        try {
            localStorage.setItem('webdev-studio-ai-settings', JSON.stringify(settings));
            console.log('💾 AI settings saved successfully:', {
                provider: settings.aiProvider,
                geminiKey: settings.geminiApiKey ? '***' + settings.geminiApiKey.slice(-4) : 'none',
                geminiModel: settings.geminiModel,
                openaiKey: settings.apiKey ? '***' + settings.apiKey.slice(-4) : 'none',
                openaiModel: settings.model
            });
        } catch (error) {
            console.error('❌ Failed to save AI settings:', error);
        }
    }

    updateSettings(newSettings) {
        console.log('🔄 Updating AI settings:', newSettings);

        // Update provider
        if (newSettings.aiProvider !== undefined) {
            this.aiProvider = newSettings.aiProvider;
            this.updatePanelTitle();
        }

        // Update OpenAI settings
        if (newSettings.apiKey !== undefined) {
            this.apiKey = newSettings.apiKey;
        }
        if (newSettings.model !== undefined) {
            this.model = newSettings.model;
        }
        if (newSettings.maxTokens !== undefined) {
            this.maxTokens = newSettings.maxTokens;
        }

        // Update Gemini settings
        if (newSettings.geminiApiKey !== undefined) {
            this.geminiApiKey = newSettings.geminiApiKey;
            if (this.geminiAPI) {
                this.geminiAPI.setApiKey(this.geminiApiKey);
            }
        }
        if (newSettings.geminiModel !== undefined) {
            this.geminiModel = newSettings.geminiModel;
            if (this.geminiAPI) {
                this.geminiAPI.setModel(this.geminiModel);
            }
        }

        // IMPORTANT: Save settings immediately after updating
        this.saveSettings();
        this.updateUI();

        console.log('✅ AI settings updated. Current provider:', this.aiProvider, 'Model:', this.getCurrentModel());

        // Also save to the global settings system if it exists
        if (window.settingsManager && typeof window.settingsManager.saveSettings === 'function') {
            window.settingsManager.saveSettings();
        }
    }

    openSettings() {
        // Try to trigger settings modal if it exists
        if (window.webDevStudio && window.webDevStudio.openSettings) {
            window.webDevStudio.openSettings('ai');
        } else if (document.querySelector('[data-tab="settings"]')) {
            document.querySelector('[data-tab="settings"]').click();
        } else {
            this.showNotification('Please open Settings manually to configure your API key', 'info');
        }
    }

    updateUI() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        const hasApiKey = this.getCurrentApiKey() && this.getCurrentApiKey().length > 0;

        chatInput.disabled = !hasApiKey;
        sendBtn.disabled = !hasApiKey;

        if (hasApiKey) {
            chatInput.placeholder = `Ask ${this.getProviderName()} anything about your code...`;
        } else {
            chatInput.placeholder = `Configure ${this.getProviderName()} API key in settings to enable AI assistance`;
        }

        // Update panel title
        this.updatePanelTitle();

        // Update model info if available
        this.updateModelInfo();
    }

    updatePanelTitle() {
        const panelTitle = document.getElementById('aiPanelTitle');
        if (panelTitle) {
            panelTitle.textContent = `${this.getProviderName()} Assistant`;
        }
    }

    getModelDisplayName(modelId) {
        if (this.aiProvider === 'gemini' && this.geminiAPI) {
            const geminiModels = this.geminiAPI.getAvailableModels();
            const model = geminiModels.find(m => m.id === modelId);
            return model ? model.name : modelId;
        } else {
            const model = this.availableModels.find(m => m.id === modelId);
            return model ? model.name : modelId;
        }
    }

    updateModelInfo() {
        let modelInfoElement = document.getElementById('current-model-info');

        if (!modelInfoElement) {
            // Create model info element if it doesn't exist
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
                modelInfoElement = document.createElement('div');
                modelInfoElement.id = 'current-model-info';
                modelInfoElement.className = 'current-model-info';
                chatContainer.insertBefore(modelInfoElement, chatContainer.firstChild);
            }
        }

        if (modelInfoElement) {
            const currentModel = this.getCurrentModel();
            const modelName = this.getModelDisplayName(currentModel);
            const isConfigured = this.getCurrentApiKey() && this.getCurrentApiKey().length > 0;

            modelInfoElement.innerHTML = `
                <div class="model-status ${isConfigured ? 'configured' : 'not-configured'}">
                    <div class="model-info">
                        <span class="model-name">${this.getProviderName()} - ${modelName}</span>
                        <span class="model-status-text">${isConfigured ? 'Ready' : 'Not Configured'}</span>
                    </div>
                    <div class="model-actions">
                        ${!isConfigured ?
                    '<button class="setup-btn" onclick="chatGPT.showSetupInstructions()">Setup Guide</button>' :
                    '<button class="settings-btn" onclick="chatGPT.openSettings()">⚙️</button>'
                }
                    </div>
                </div>
            `;
        }
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message || this.isTyping) return;

        const hasApiKey = this.getCurrentApiKey() && this.getCurrentApiKey().length > 0;
        if (!hasApiKey) {
            this.addErrorMessage(`Please configure your ${this.getProviderName()} API key in settings first.`);
            return;
        }

        // Add to message history
        this.messageHistory.push(message);
        this.resetHistoryNavigation();

        // Show user message
        this.renderMessage('user', message);
        chatInput.value = '';
        this.autoResizeInput(chatInput);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get context and enhance message
            const context = this.getAutoContext();
            const enhancedMessage = this.enhanceMessageWithContext(message, context);

            let response;
            if (this.aiProvider === 'gemini' && this.geminiAPI) {
                // Use Gemini API
                response = await this.geminiAPI.generateContent(enhancedMessage);
            } else {
                // Use OpenAI API (existing implementation)
                response = await this.callOpenAI(enhancedMessage);
            }

            this.hideTypingIndicator();
            this.renderMessage('assistant', response);
            this.saveSettings();

        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();

            if (error.name === 'AbortError' || error.message.includes('aborted')) {
                this.addSystemMessage('Request canceled by user.');
            } else {
                // Enhanced error handling with detailed toast notifications
                this.handleAIError(error);
            }
        }
    }

    handleAIError(error) {
        let errorTitle = `${this.getProviderName()} Error`;
        let errorMessage = 'An unexpected error occurred. Please try again.';
        let errorType = 'error';
        let actionButton = null;

        // Parse different types of errors
        if (this.aiProvider === 'gemini') {
            const errorInfo = this.parseGeminiError(error);
            errorTitle = errorInfo.title;
            errorMessage = errorInfo.message;
            errorType = errorInfo.type;
            actionButton = errorInfo.action;
        } else {
            const errorInfo = this.parseOpenAIError(error);
            errorTitle = errorInfo.title;
            errorMessage = errorInfo.message;
            errorType = errorInfo.type;
            actionButton = errorInfo.action;
        }

        // Show detailed toast notification
        this.showDetailedNotification(errorTitle, errorMessage, errorType, actionButton);

        // Also add a simplified error message to chat
        this.addErrorMessage(`${errorTitle}: ${errorMessage}`);
    }

    parseOpenAIError(error) {
        const errorData = error.message || error.toString();
        
        // Check for specific OpenAI error patterns
        if (error.status === 401 || errorData.includes('401') || errorData.includes('Unauthorized')) {
            return {
                title: '🔑 Authentication Error',
                message: 'Your OpenAI API key is invalid or missing. Please check your API key in settings.',
                type: 'error',
                action: {
                    text: 'Open Settings',
                    callback: () => this.openSettings()
                }
            };
        }

        if (error.status === 402 || errorData.includes('402') || errorData.includes('insufficient_quota')) {
            return {
                title: '💳 Insufficient Credits',
                message: 'You have exceeded your OpenAI usage quota. Please add credits to your OpenAI account or upgrade your plan.',
                type: 'warning',
                action: {
                    text: 'Check Billing',
                    callback: () => window.open('https://platform.openai.com/account/billing', '_blank')
                }
            };
        }

        if (error.status === 429 || errorData.includes('429') || errorData.includes('rate_limit')) {
            return {
                title: '⏱️ Rate Limited',
                message: 'Too many requests. Please wait a moment and try again. Consider upgrading your OpenAI plan for higher limits.',
                type: 'warning',
                action: {
                    text: 'View Limits',
                    callback: () => window.open('https://platform.openai.com/account/limits', '_blank')
                }
            };
        }

        if (error.status === 400 || errorData.includes('400') || errorData.includes('Bad Request')) {
            return {
                title: '📝 Invalid Request',
                message: 'The request was malformed. This might be due to unsupported model or invalid parameters.',
                type: 'error',
                action: {
                    text: 'Check Model',
                    callback: () => this.openSettings()
                }
            };
        }

        if (error.status === 500 || errorData.includes('500') || errorData.includes('Internal Server Error')) {
            return {
                title: '🔧 Server Error',
                message: 'OpenAI servers are experiencing issues. Please try again in a few minutes.',
                type: 'error',
                action: {
                    text: 'Check Status',
                    callback: () => window.open('https://status.openai.com/', '_blank')
                }
            };
        }

        if (error.status === 503 || errorData.includes('503') || errorData.includes('Service Unavailable')) {
            return {
                title: '🚫 Service Unavailable',
                message: 'OpenAI service is temporarily unavailable. Please try again later.',
                type: 'error',
                action: {
                    text: 'Check Status',
                    callback: () => window.open('https://status.openai.com/', '_blank')
                }
            };
        }

        if (errorData.includes('context_length_exceeded')) {
            return {
                title: '📏 Message Too Long',
                message: 'Your message exceeds the model\'s context limit. Try shortening your message or selecting less code.',
                type: 'warning',
                action: {
                    text: 'View Tips',
                    callback: () => this.showCostInfo()
                }
            };
        }

        if (errorData.includes('model_not_found')) {
            return {
                title: '🤖 Model Not Found',
                message: 'The selected AI model is not available. Please choose a different model in settings.',
                type: 'error',
                action: {
                    text: 'Change Model',
                    callback: () => this.openSettings()
                }
            };
        }

        if (errorData.includes('network') || errorData.includes('fetch')) {
            return {
                title: '🌐 Network Error',
                message: 'Unable to connect to OpenAI. Please check your internet connection and try again.',
                type: 'error',
                action: null
            };
        }

        // Generic error
        return {
            title: '❌ Unknown Error',
            message: `An unexpected error occurred: ${errorData.substring(0, 100)}...`,
            type: 'error',
            action: {
                text: 'Contact Support',
                callback: () => window.open('https://help.openai.com/', '_blank')
            }
        };
    }

    parseGeminiError(error) {
        const errorData = error.message || error.toString();
        
        // Check for specific Gemini error patterns
        if (error.status === 401 || errorData.includes('401') || errorData.includes('API_KEY_INVALID')) {
            return {
                title: '🔑 Invalid API Key',
                message: 'Your Gemini API key is invalid or missing. Please check your API key in settings.',
                type: 'error',
                action: {
                    text: 'Open Settings',
                    callback: () => this.openSettings()
                }
            };
        }

        if (error.status === 429 || errorData.includes('429') || errorData.includes('RATE_LIMIT_EXCEEDED')) {
            return {
                title: '⏱️ Rate Limited',
                message: 'Too many requests to Gemini API. Please wait a moment and try again.',
                type: 'warning',
                action: {
                    text: 'View Quotas',
                    callback: () => window.open('https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas', '_blank')
                }
            };
        }

        if (error.status === 400 || errorData.includes('INVALID_ARGUMENT')) {
            return {
                title: '📝 Invalid Request',
                message: 'The request was invalid. This might be due to unsupported content or model parameters.',
                type: 'error',
                action: {
                    text: 'Check Model',
                    callback: () => this.openSettings()
                }
            };
        }

        if (errorData.includes('SAFETY')) {
            return {
                title: '🛡️ Content Blocked',
                message: 'Your message was blocked by Gemini\'s safety filters. Please rephrase your request.',
                type: 'warning',
                action: {
                    text: 'Safety Guidelines',
                    callback: () => window.open('https://ai.google.dev/docs/safety_guidance', '_blank')
                }
            };
        }

        if (error.status === 500 || errorData.includes('INTERNAL')) {
            return {
                title: '🔧 Server Error',
                message: 'Gemini servers are experiencing issues. Please try again in a few minutes.',
                type: 'error',
                action: {
                    text: 'Check Status',
                    callback: () => window.open('https://status.cloud.google.com/', '_blank')
                }
            };
        }

        if (errorData.includes('QUOTA_EXCEEDED')) {
            return {
                title: '💳 Quota Exceeded',
                message: 'You have exceeded your Gemini API quota. Please check your Google Cloud billing or wait for quota reset.',
                type: 'warning',
                action: {
                    text: 'Check Billing',
                    callback: () => window.open('https://console.cloud.google.com/billing', '_blank')
                }
            };
        }

        if (errorData.includes('network') || errorData.includes('fetch')) {
            return {
                title: '🌐 Network Error',
                message: 'Unable to connect to Gemini API. Please check your internet connection and try again.',
                type: 'error',
                action: null
            };
        }

        // Generic error
        return {
            title: '❌ Unknown Error',
            message: `An unexpected error occurred: ${errorData.substring(0, 100)}...`,
            type: 'error',
            action: {
                text: 'Help Center',
                callback: () => window.open('https://ai.google.dev/support', '_blank')
            }
        };
    }

    showDetailedNotification(title, message, type = 'error', actionButton = null) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `detailed-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="notification-title">${title}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-message">${message}</div>
            ${actionButton ? `
                <div class="notification-actions">
                    <button class="notification-action-btn" onclick="(${actionButton.callback.toString()})(); this.parentElement.parentElement.remove();">
                        ${actionButton.text}
                    </button>
                </div>
            ` : ''}
        `;

        // Add to notification container or create one
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove after 10 seconds (longer for errors)
        const autoRemoveDelay = type === 'error' ? 15000 : 8000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, autoRemoveDelay);
    }

    getNotificationIcon(type) {
        const icons = {
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            success: '<i class="fas fa-check-circle"></i>'
        };
        return icons[type] || icons.error;
    }

    getAutoContext() {
        const context = {
            selectedText: null,
            currentFile: null,
            referencedFiles: this.getReferencedFiles()
        };

        // Get selected text if available
        if (window.codeEditor && window.codeEditor.editor) {
            const selection = window.codeEditor.editor.getSelection();
            if (selection && selection.trim()) {
                context.selectedText = {
                    content: selection,
                    file: window.codeEditor.currentFile,
                    lineStart: window.codeEditor.editor.getCursor('start').line + 1,
                    lineEnd: window.codeEditor.editor.getCursor('end').line + 1
                };
            }
        }

        // Get current file if no selection
        if (!context.selectedText && window.codeEditor && window.codeEditor.currentFile) {
            const content = window.codeEditor.getValue();
            if (content && content.trim()) {
                context.currentFile = {
                    path: window.codeEditor.currentFile.path,
                    content: content,
                    language: this.getFileLanguage(window.codeEditor.currentFile.path)
                };
            }
        }

        return context;
    }

    estimateTokens(text) {
        // Rough estimation: ~4 characters = 1 token for English text
        // Code tends to be more token-dense, so we use 3 characters = 1 token
        return Math.ceil(text.length / 3);
    }

    truncateContent(content, maxTokens, label = "content") {
        const estimatedTokens = this.estimateTokens(content);

        if (estimatedTokens <= maxTokens) {
            return content;
        }

        // Calculate how much content we can keep
        const maxChars = maxTokens * 3;
        const truncatedContent = content.substring(0, maxChars);

        return `${truncatedContent}\n\n... (${label} truncated - showing first ${maxTokens} tokens of ${estimatedTokens} total tokens)`;
    }

    enhanceMessageWithContext(message, context) {
        let enhancedMessage = message;
        const contextParts = [];

        // Get current model limits
        const modelLimit = this.modelLimits[this.model] || this.modelLimits['gpt-3.5-turbo'];
        const maxContextTokens = Math.floor(modelLimit.context * 0.7); // Use 70% of context for input

        // Estimate tokens for the base message
        let totalTokens = this.estimateTokens(message);
        const remainingTokens = maxContextTokens - totalTokens - 500; // Reserve 500 tokens for system prompt and overhead

        console.log(`📊 Token Budget: ${maxContextTokens} max, ${totalTokens} used by message, ${remainingTokens} available for context`);

        if (remainingTokens <= 0) {
            console.warn('⚠️ Message too long, no room for context');
            return enhancedMessage;
        }

        // Distribute tokens among context sources
        let tokensPerSource = remainingTokens;
        let sourceCount = 0;

        // Count sources
        if (context.selectedText) sourceCount = 1;
        else if (context.currentFile) sourceCount = 1;
        if (context.referencedFiles?.length > 0) sourceCount += context.referencedFiles.length;

        if (sourceCount > 0) {
            tokensPerSource = Math.floor(remainingTokens / sourceCount);
        }

        console.log(`📊 Token allocation: ${tokensPerSource} tokens per source (${sourceCount} sources)`);

        // Add selected text context
        if (context.selectedText) {
            const { content, file, lineStart, lineEnd } = context.selectedText;
            const language = this.getFileLanguage(file.path);
            const truncatedContent = this.truncateContent(content, tokensPerSource, `selected code from ${file.path}`);

            contextParts.push(`**Selected code from ${file.path} (lines ${lineStart}-${lineEnd}):**\n\`\`\`${language}\n${truncatedContent}\n\`\`\``);
        }
        // Add current file context if no selection
        else if (context.currentFile) {
            const { path, content, language } = context.currentFile;
            const truncatedContent = this.truncateContent(content, tokensPerSource, `current file ${path}`);

            contextParts.push(`**Current file: ${path}**\n\`\`\`${language}\n${truncatedContent}\n\`\`\``);
        }

        // Add referenced files with smart truncation
        if (context.referencedFiles && context.referencedFiles.length > 0) {
            context.referencedFiles.forEach(ref => {
                const truncatedContent = this.truncateContent(ref.content, tokensPerSource, `referenced file ${ref.path}`);

                contextParts.push(`**Referenced file: ${ref.path}**\n\`\`\`${ref.language}\n${truncatedContent}\n\`\`\``);
            });
        }

        // Combine message with context
        if (contextParts.length > 0) {
            const contextText = contextParts.join('\n\n');
            const finalTokenCount = this.estimateTokens(message + contextText);

            console.log(`📊 Final message: ${finalTokenCount} tokens (limit: ${maxContextTokens})`);

            if (finalTokenCount > maxContextTokens) {
                console.warn('⚠️ Final message still too long, truncating context further');
                // Emergency truncation - reduce each context part
                const emergencyTokens = Math.floor(tokensPerSource * 0.5);
                const truncatedParts = contextParts.map(part => {
                    return this.truncateContent(part, emergencyTokens, "context (emergency truncation)");
                });
                enhancedMessage = `${message}\n\n--- Context Information (Truncated) ---\n\n${truncatedParts.join('\n\n')}`;
            } else {
                enhancedMessage = `${message}\n\n--- Context Information ---\n\n${contextText}`;
            }
        }

        return enhancedMessage;
    }

    getFileLanguage(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown',
            'py': 'python',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'sh': 'bash',
            'ps1': 'powershell',
            'sql': 'sql',
            'yml': 'yaml',
            'yaml': 'yaml'
        };

        return languageMap[extension] || 'text';
    }

    async callOpenAI(message) {
        // Existing OpenAI implementation
        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: this.generateSystemPrompt(message)
                },
                {
                    role: "user",
                    content: message
                }
            ],
            max_tokens: this.maxTokens,
            temperature: 0.7
        };

        this.abortController = new AbortController();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    cancelRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.showNotification('Request canceled', 'info');
        }
    }

    generateSystemPrompt(userMessage) {
        const context = this.getCurrentContext();
        let systemPrompt = `You are an AI assistant helping with web development in WebDev Studio.`;

        // Add context if available
        if (context) {
            systemPrompt += ` Current context: ${context}`;
        }

        // Detect the type of query and adjust prompt accordingly
        if (this.isCodeExplanationQuery(userMessage)) {
            systemPrompt += `\n\nThe user is asking for code explanation. Please provide clear, detailed explanations with examples where helpful.`;
        } else if (this.isCodeGenerationQuery(userMessage)) {
            systemPrompt += `\n\nThe user is requesting code generation. Please provide complete, working code with proper syntax highlighting and explanations.`;
        } else if (this.isDebuggingQuery(userMessage)) {
            systemPrompt += `\n\nThe user needs help debugging code. Please identify issues and provide corrected code with explanations.`;
        } else if (this.isOptimizationQuery(userMessage)) {
            systemPrompt += `\n\nThe user wants code optimization suggestions. Please provide improved code with performance explanations.`;
        }

        return systemPrompt;
    }

    getCurrentContext() {
        const context = [];

        // Add current file information
        if (window.codeEditor && window.codeEditor.currentFile) {
            const file = window.codeEditor.currentFile;
            const extension = file.path.split('.').pop();
            context.push(`Currently editing: ${file.path} (${extension} file)`);

            // Add snippet of current file content
            const content = window.codeEditor.getValue();
            if (content && content.length > 0) {
                const snippet = content.length > 500 ? content.substring(0, 500) + '...' : content;
                context.push(`Current file content:\n${snippet}`);
            }
        }

        // Add project structure
        if (typeof fileSystem !== 'undefined' && fileSystem.getAllFiles) {
            const files = fileSystem.getAllFiles();
            if (files.length > 0) {
                const fileList = files.map(f => f.path).join(', ');
                context.push(`Project files: ${fileList}`);
            }
        }

        return context.join('\n');
    }

    // Enhanced code generation with context awareness
    generateCode(prompt) {
        let contextualPrompt = prompt;

        // Add context if a file is open
        if (window.codeEditor && window.codeEditor.currentFile) {
            const fileExtension = window.codeEditor.currentFile.path.split('.').pop();
            const currentCode = window.codeEditor.getValue();

            contextualPrompt = `Generate ${fileExtension} code for: ${prompt}`;

            if (currentCode && currentCode.trim()) {
                contextualPrompt += `\n\nCurrent file context:\n\`\`\`${fileExtension}\n${currentCode}\n\`\`\``;
            }
        }

        document.getElementById('chatInput').value = contextualPrompt;
        this.sendMessage();
    }

    // Add a method to detect if AI response contains code
    containsCode(message) {
        // Check for code blocks
        if (/```[\s\S]*?```/.test(message)) return true;

        // Check for inline code
        if (/`[^`]+`/.test(message)) return true;

        // Check for common code patterns
        const codePatterns = [
            /function\s+\w+\s*\(/,
            /class\s+\w+/,
            /import\s+.*from/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /<\w+.*>/,
            /\{\s*[\w\s:,]+\s*\}/,
            /\(\s*\)\s*=>/
        ];

        return codePatterns.some(pattern => pattern.test(message));
    }

    addUserMessage(message) {
        this.messages.push({ role: 'user', content: message });
        this.renderMessage('user', message);
    }

    addAssistantMessage(message) {
        this.messages.push({ role: 'assistant', content: message });
        this.renderMessage('assistant', message);
    }

    addSystemMessage(message, isHTML = false) {
        if (isHTML || this.isHTMLContent(message)) {
            this.renderMessage('system', message);
        } else {
            this.renderMessage('system', message);
        }
    }

    showSetupInstructions() {
        const providerName = this.getProviderName();
        const isGemini = this.aiProvider === 'gemini';

        const instructionsHTML = `
            <div class="setup-instructions">
                <h3>🚀 Setup ${providerName} AI Assistant</h3>

                <div class="setup-step">
                    <h4>Step 1: Get Your API Key</h4>
                    <ol>
                        <li>Go to <a href="${isGemini ? 'https://makersuite.google.com/app/apikey' : 'https://platform.openai.com/api-keys'}" target="_blank">${isGemini ? 'Google AI Studio' : 'OpenAI API Keys'}</a></li>
                        <li>${isGemini ? 'Sign in with your Google account' : 'Sign up or log into your OpenAI account'}</li>
                        <li>Create a new API key</li>
                        <li>Copy the API key (it starts with "${isGemini ? 'AI...' : 'sk-...'}")</li>
                    </ol>
                </div>

                <div class="setup-step">
                    <h4>Step 2: Configure in WebDev Studio</h4>
                    <ol>
                        <li>Open Settings (⚙️ icon)</li>
                        <li>Go to "AI Assistant" tab</li>
                        <li>Select "${providerName}" as your provider</li>
                        <li>Paste your API key</li>
                        <li>Choose your preferred model</li>
                        <li>Click "Save Settings"</li>
                    </ol>
                </div>

                <div class="setup-note">
                    <strong>💡 ${providerName} Model Recommendations:</strong>
                    <ul>
                        ${isGemini ?
                '<li><strong>Gemini 2.0 Flash:</strong> ⭐ Latest and most advanced</li><li><strong>Gemini 1.5 Pro:</strong> Best for complex coding tasks</li><li><strong>Gemini 1.5 Flash:</strong> Good balance of speed and capability</li>' :
                '<li><strong>GPT-4o Mini:</strong> ⭐ Best overall choice for coding</li><li><strong>GPT-3.5 Turbo:</strong> Most affordable for simple tasks</li><li><strong>GPT-4 Turbo:</strong> Best for complex debugging</li>'
            }
                    </ul>
                </div>

                <button class="setup-action-btn" onclick="chatGPT.openSettings()">Open Settings</button>
            </div>
        `;

        this.renderMessage('system', instructionsHTML);
    }

    getModelRecommendation(task = 'general') {
        const recommendations = {
            general: 'gpt-4o-mini',
            coding: 'gpt-4o-mini',
            debugging: 'gpt-4-turbo',
            architecture: 'gpt-4-turbo',
            simple: 'gpt-3.5-turbo',
            complex: 'gpt-4',
            vision: 'gpt-4o',
            cost_effective: 'gpt-3.5-turbo',
            specialized_code: 'code-davinci-002'
        };

        return recommendations[task] || recommendations.general;
    }

    showModelComparison() {
        const comparisonHTML = `
            <div class="model-comparison">
                <h3>🔄 Model Comparison Guide</h3>
                
                <div class="comparison-grid">
                    <div class="model-card recommended">
                        <h4>GPT-4o Mini ⭐</h4>
                        <div class="model-stats">
                            <span class="stat speed">Speed: Fast</span>
                            <span class="stat cost">Cost: Low</span>
                            <span class="stat capability">Quality: High</span>
                        </div>
                        <p>Perfect balance for most coding tasks. Our recommended choice!</p>
                    </div>
                    
                    <div class="model-card">
                        <h4>GPT-3.5 Turbo</h4>
                        <div class="model-stats">
                            <span class="stat speed">Speed: Very Fast</span>
                            <span class="stat cost">Cost: Very Low</span>
                            <span class="stat capability">Quality: Good</span>
                        </div>
                        <p>Most affordable option, great for simple coding questions.</p>
                    </div>
                    
                    <div class="model-card">
                        <h4>GPT-4 Turbo</h4>
                        <div class="model-stats">
                            <span class="stat speed">Speed: Medium</span>
                            <span class="stat cost">Cost: Medium</span>
                            <span class="stat capability">Quality: Very High</span>
                        </div>
                        <p>Best for complex debugging and architecture decisions.</p>
                    </div>
                    
                    <div class="model-card">
                        <h4>GPT-4o</h4>
                        <div class="model-stats">
                            <span class="stat speed">Speed: Medium</span>
                            <span class="stat cost">Cost: Medium</span>
                            <span class="stat capability">Quality: Very High</span>
                        </div>
                        <p>Multimodal capabilities - can analyze images and screenshots.</p>
                    </div>
                </div>
                
                <div class="usage-tips">
                    <h4>💡 Usage Tips:</h4>
                    <ul>
                        <li><strong>Start with GPT-4o Mini</strong> - it handles 90% of coding tasks perfectly</li>
                        <li><strong>Upgrade to GPT-4 Turbo</strong> for complex architecture or when you need the best reasoning</li>
                        <li><strong>Use GPT-3.5 Turbo</strong> for simple syntax questions to save costs</li>
                        <li><strong>Try GPT-4o</strong> when you need to analyze UI screenshots or diagrams</li>
                    </ul>
                </div>
            </div>
        `;

        // Use HTML rendering for system messages
        this.renderMessage('system', comparisonHTML);
    }

    addErrorMessage(message) {
        this.renderMessage('error', message);
    }

    renderMessage(type, content) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (type === 'assistant') {
            // Process markdown-like formatting
            messageContent.innerHTML = this.formatMessage(content);

            // Apply syntax highlighting after DOM insertion
            setTimeout(() => {
                messageContent.querySelectorAll('pre code').forEach((block) => {
                    if (window.Prism) {
                        Prism.highlightElement(block);
                    }
                });
            }, 0);
        } else if (type === 'system' && this.isHTMLContent(content)) {
            // System messages can contain HTML content (like setup instructions)
            messageContent.innerHTML = content;
        } else {
            // Plain text content
            messageContent.textContent = content;
        }

        messageDiv.appendChild(messageContent);

        // Add timestamp for user and assistant messages
        if (type === 'user' || type === 'assistant') {
            const timestamp = document.createElement('div');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString();
            messageDiv.appendChild(timestamp);
        }

        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add animation
        messageDiv.style.animation = 'fadeInUp 0.3s ease';
    }

    isHTMLContent(content) {
        // Check if content contains HTML tags
        return /<[^>]*>/g.test(content);
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        let formatted = content
            // Code blocks with language detection and copy button
            .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
                const lang = language || 'text';
                const originalCode = code.trim();

                // Escape for display
                const escapedCode = originalCode
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');

                const codeId = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                // Map common language aliases to Prism language classes
                const languageMap = {
                    'js': 'javascript',
                    'ts': 'typescript',
                    'py': 'python',
                    'rb': 'ruby',
                    'php': 'php',
                    'java': 'java',
                    'c': 'c',
                    'cpp': 'cpp',
                    'cs': 'csharp',
                    'go': 'go',
                    'rust': 'rust',
                    'swift': 'swift',
                    'kotlin': 'kotlin',
                    'dart': 'dart',
                    'r': 'r',
                    'sql': 'sql',
                    'bash': 'bash',
                    'sh': 'bash',
                    'powershell': 'powershell',
                    'json': 'json',
                    'xml': 'xml',
                    'yaml': 'yaml',
                    'yml': 'yaml',
                    'toml': 'toml',
                    'ini': 'ini',
                    'dockerfile': 'docker',
                    'makefile': 'makefile'
                };

                const prismLang = languageMap[lang.toLowerCase()] || lang.toLowerCase();

                return `
            <div class="code-block-container">
                <div class="code-block-header">
                    <span class="code-language">${lang}</span>
                    <div class="code-actions">
                        <button class="apply-code-btn" onclick="chatGPT.applyCodeToFile('${codeId}')" title="Apply to current file">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17,21 17,13 7,13 7,21"></polyline>
                                <polyline points="7,3 7,8 15,8"></polyline>
                            </svg>
                            Apply
                        </button>
                        <button class="insert-code-btn" onclick="chatGPT.insertCodeAtCursor('${codeId}')" title="Insert at cursor">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            Insert
                        </button>
                        <button class="toggle-wrap-btn" onclick="chatGPT.toggleCodeWrap('${codeId}')" title="Toggle line wrap">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"></path>
                                <path d="M3 12h15l-3-3"></path>
                                <path d="M3 12l3 3"></path>
                                <path d="M3 18h18"></path>
                            </svg>
                            Wrap
                        </button>
                        <button class="copy-code-btn" onclick="chatGPT.copyCode('${codeId}', this)" title="Copy code">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                        </button>
                    </div>
                </div>
                <pre class="code-block language-${prismLang}" data-wrapped="false"><code id="${codeId}" data-original="${btoa(originalCode)}" class="language-${prismLang}">${escapedCode}</code></pre>
            </div>
        `;
            })
            // ...rest of your existing formatting code...
            .replace(/`([^`]+)`/g, (match, code) => {
                const escapedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<code class="inline-code">${escapedCode}</code>`;
            })
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        return formatted;
    }

    applyCodeToFile(codeId) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;

        // Check if there's a current file open
        if (!window.codeEditor || !window.codeEditor.currentFile) {
            this.showNotification('No file is currently open', 'warning');
            return;
        }

        // Get the original code from data attribute (base64 encoded)
        const originalCode = codeElement.getAttribute('data-original');
        let codeText;

        if (originalCode) {
            // Decode the original code
            try {
                codeText = atob(originalCode);
            } catch (e) {
                // Fallback to textContent if decoding fails
                codeText = codeElement.textContent;
            }
        } else {
            codeText = codeElement.textContent;
        }

        // Show confirmation dialog
        const currentFileName = window.codeEditor.currentFile.path.split('/').pop();
        const confirmed = confirm(`Apply this code to ${currentFileName}?\n\nThis will replace the current file content.`);

        if (!confirmed) return;

        try {
            // Apply the code to the current file
            window.codeEditor.setValue(codeText);

            // Mark the file as modified
            window.codeEditor.markTabAsModified(window.codeEditor.currentFile.path);

            // Update status bar
            window.codeEditor.updateStatusBar();

            // Show success notification
            this.showNotification(`Code applied to ${currentFileName}`, 'success');

            // Focus the editor
            window.codeEditor.focus();

        } catch (error) {
            console.error('Error applying code:', error);
            this.showNotification('Failed to apply code to file', 'error');
        }
    }

    insertCodeAtCursor(codeId) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;

        // Check if there's a current file open
        if (!window.codeEditor || !window.codeEditor.currentFile) {
            this.showNotification('No file is currently open', 'warning');
            return;
        }

        // Get the original code
        const originalCode = codeElement.getAttribute('data-original');
        let codeText;

        if (originalCode) {
            try {
                codeText = atob(originalCode);
            } catch (e) {
                codeText = codeElement.textContent;
            }
        } else {
            codeText = codeElement.textContent;
        }

        try {
            // Get current cursor position
            const cursor = window.codeEditor.editor.getCursor();

            // Insert code at cursor position
            window.codeEditor.editor.replaceRange(codeText, cursor);

            // Mark the file as modified
            window.codeEditor.markTabAsModified(window.codeEditor.currentFile.path);

            // Update status bar
            window.codeEditor.updateStatusBar();

            // Show success notification
            this.showNotification('Code inserted at cursor position', 'success');

            // Focus the editor
            window.codeEditor.focus();

        } catch (error) {
            console.error('Error inserting code:', error);
            this.showNotification('Failed to insert code', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Use the existing notification system from the main app
        if (window.webDevStudio && window.webDevStudio.showNotification) {
            window.webDevStudio.showNotification(message, type);
        } else {
            // Fallback to console or simple alert
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    getReferencedFiles() {
        const files = [];

        this.referencedFiles.forEach(filePath => {
            const file = window.fileSystem.readFile(filePath);
            if (file) {
                files.push({
                    path: filePath,
                    content: file.content,
                    language: this.getFileLanguage(filePath)
                });
            }
        });

        return files;
    }

    addFileReference(filePath) {
        if (window.fileSystem.readFile(filePath)) {
            this.referencedFiles.add(filePath);
            this.updateFileReferencesUI();
            this.saveSettings();
        }
    }

    removeFileReference(filePath) {
        this.referencedFiles.delete(filePath);
        this.updateFileReferencesUI();
        this.saveSettings();
    }

    clearFileReferences() {
        this.referencedFiles.clear();
        this.updateFileReferencesUI();
        this.saveSettings();
    }

    updateFileReferencesUI() {
        const container = document.getElementById('fileReferences');
        if (!container) return;

        if (this.referencedFiles.size === 0) {
            container.innerHTML = '<div class="no-references">No files referenced</div>';
            return;
        }

        const html = Array.from(this.referencedFiles).map(filePath => {
            const fileName = filePath.split('/').pop();
            return `
            <div class="reference-item" data-path="${filePath}">
                <span class="reference-name" title="${filePath}">
                    <i class="fas fa-file-code"></i>
                    ${fileName}
                </span>
                <button class="reference-remove" onclick="chatGPT.removeFileReference('${filePath}')" title="Remove reference">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        }).join('');

        container.innerHTML = html;
    }

    toggleCodeWrap(codeId) {
        const codeElement = document.getElementById(codeId);
        const preElement = codeElement?.closest('pre');
        const toggleBtn = preElement?.closest('.code-block-container')?.querySelector('.toggle-wrap-btn');

        if (!preElement || !toggleBtn) return;

        const isWrapped = preElement.getAttribute('data-wrapped') === 'true';

        if (isWrapped) {
            // Switch to no-wrap (single line with scroll)
            preElement.setAttribute('data-wrapped', 'false');
            preElement.style.whiteSpace = 'pre';
            preElement.style.wordWrap = 'normal';
            preElement.style.overflowX = 'auto';
            toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M3 12h15l-3-3"></path>
                <path d="M3 12l3 3"></path>
                <path d="M3 18h18"></path>
            </svg>
            Wrap
        `;
            toggleBtn.title = 'Enable line wrap';
        } else {
            // Switch to wrap (multi-line)
            preElement.setAttribute('data-wrapped', 'true');
            preElement.style.whiteSpace = 'pre-wrap';
            preElement.style.wordWrap = 'break-word';
            preElement.style.overflowX = 'visible';
            toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M3 12h18"></path>
                <path d="M3 18h18"></path>
            </svg>
            No Wrap
        `;
            toggleBtn.title = 'Disable line wrap';
        }
    }

    copyCode(codeId, button) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;

        // Get the original code from data attribute (base64 encoded)
        const originalCode = codeElement.getAttribute('data-original');
        let codeText;

        if (originalCode) {
            // Decode the original code
            try {
                codeText = atob(originalCode);
            } catch (e) {
                // Fallback to textContent if decoding fails
                codeText = codeElement.textContent;
            }
        } else {
            codeText = codeElement.textContent;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(codeText).then(() => {
            // Show success feedback
            const originalText = button.innerHTML;
            button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            Copied!
        `;
            button.classList.add('copied');

            // Reset after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = codeText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            button.textContent = 'Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        });
    }

    showTypingIndicator() {
        this.isTyping = true;
        const chatMessages = document.getElementById('chatMessages');

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message assistant typing-indicator';
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-header">
                    <div class="typing-animation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <button class="stop-btn" onclick="chatGPT.cancelRequest()" title="Stop generation">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                        </svg>
                        Stop
                    </button>
                </div>
                <div class="typing-status">Generating response...</div>
            </div>
        `;

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    autoResizeInput(input) {
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
    }

    clearChat() {
        // Clear all conversation data
        this.messages = [];
        this.messageHistory = [];
        this.historyIndex = -1;
        this.currentDraft = '';

        // Clear all file references
        this.referencedFiles.clear();

        // Clear the chat UI
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        // Clear the input field
        const chatInput = document.getElementById('chatInput');
        chatInput.value = '';
        this.autoResizeInput(chatInput);

        // Update file references UI
        this.updateFileReferencesUI();

        // Save cleared state
        this.saveSettings();

        // Hide history indicator
        const indicator = document.getElementById('historyIndicator');
        if (indicator) {
            indicator.classList.remove('show');
        }

        // Show fresh start message
        this.addSystemMessage('🔄 Chat cleared! Starting fresh. How can I help you today?');
    }

    resetAssistant() {
        const confirmed = confirm(
            'This will permanently clear:\n' +
            '• All conversation history\n' +
            '• All file references\n' +
            '• Message history navigation\n\n' +
            'Are you sure you want to start completely fresh?'
        );

        if (!confirmed) return;

        // Perform complete reset
        this.clearChat();

        // Show confirmation
        this.showNotification('AI Assistant reset successfully - starting fresh!', 'success');
    }

    clearHistory() {
        this.messageHistory = [];
        this.historyIndex = -1;
        this.currentDraft = '';
        this.saveSettings();

        // Clear input
        const chatInput = document.getElementById('chatInput');
        chatInput.value = '';
        this.autoResizeInput(chatInput);

        this.addSystemMessage('Message history cleared.');
    }

    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            messages: this.messages
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    showFileSelector() {
        const modal = document.createElement('div');
        modal.className = 'modal file-selector-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add File Reference</h2>
                    <button class="btn-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="file-selector-content">
                        <div class="selector-search">
                            <input type="text" id="fileSelectorSearch" placeholder="Search files..." />
                        </div>
                        <div class="selector-files" id="selectorFiles">
                            ${this.renderFileSelector()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        // Add search functionality
        const searchInput = modal.querySelector('#fileSelectorSearch');
        searchInput.addEventListener('input', (e) => {
            this.filterFileSelector(e.target.value);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    renderFileSelector() {
        const files = window.fileSystem.getAllFiles();

        return files.map(file => {
            const isReferenced = this.referencedFiles.has(file.path);
            const fileName = file.path.split('/').pop();
            const fileIcon = this.getFileIcon(fileName);

            return `
                <div class="selector-file-item ${isReferenced ? 'referenced' : ''}" data-path="${file.path}">
                    <div class="selector-file-info">
                        <i class="${fileIcon}"></i>
                        <span class="selector-file-name">${fileName}</span>
                        <span class="selector-file-path">${file.path}</span>
                    </div>
                    <button class="selector-file-action" onclick="chatGPT.toggleFileReference('${file.path}')">
                        ${isReferenced ? '<i class="fas fa-minus"></i>' : '<i class="fas fa-plus"></i>'}
                    </button>
                </div>
            `;
        }).join('');
    }

    toggleFileReference(filePath) {
        if (this.referencedFiles.has(filePath)) {
            this.removeFileReference(filePath);
        } else {
            this.addFileReference(filePath);
        }

        // Update the file selector display
        const modal = document.querySelector('.file-selector-modal');
        if (modal) {
            const filesContainer = modal.querySelector('#selectorFiles');
            filesContainer.innerHTML = this.renderFileSelector();
        }
    }

    filterFileSelector(searchTerm) {
        const modal = document.querySelector('.file-selector-modal');
        if (!modal) return;

        const items = modal.querySelectorAll('.selector-file-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const fileName = item.querySelector('.selector-file-name').textContent.toLowerCase();
            const filePath = item.querySelector('.selector-file-path').textContent.toLowerCase();

            if (fileName.includes(term) || filePath.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    getFileIcon(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const iconMap = {
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'js': 'fab fa-js-square',
            'json': 'fas fa-code',
            'md': 'fab fa-markdown',
            'txt': 'fas fa-file-alt',
            'xml': 'fas fa-code',
            'svg': 'fas fa-image'
        };

        return iconMap[extension] || 'fas fa-file-code';
    }

    // Quick action methods
    explainCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const selection = window.codeEditor.editor.getSelection();
            const code = selection || window.codeEditor.getValue();

            if (code && code.trim()) {
                // Show cost warning confirmation
                const codeLength = code.length;
                const estimatedCost = this.estimateCost(codeLength);
                const fileName = window.codeEditor.currentFile.path.split('/').pop();
                const analysisType = selection ? 'selected code' : 'entire file';

                const confirmed = confirm(
                    `🤖 Code Explanation Request\n\n` +
                    `File: ${fileName}\n` +
                    `Analysis: ${analysisType} (${codeLength} characters)\n` +
                    `Estimated cost: ${estimatedCost}\n\n` +
                    `This will send your code to OpenAI for analysis.\n` +
                    `Continue?`
                );

                if (!confirmed) return;

                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();

                const message = `Please explain this ${fileExtension} code from "${fileName}":

**What I'd like to understand:**
- What does this code do?
- How does it work step by step?
- What are the key concepts used?
- Are there any important patterns or techniques?
- What could be improved or done differently?

\`\`\`${fileExtension}
${code}
\`\`\`

${selection ? `*(Explaining selected code only)*` : `*(Explaining entire file)*`}`;

                document.getElementById('chatInput').value = message;
                this.sendMessage();
            } else {
                this.addSystemMessage('⚠️ No code found to explain. Please open a file or select some code first.');
            }
        } else {
            this.addSystemMessage('⚠️ Please open a file first to explain code.');
        }
    }

    fixCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const selection = window.codeEditor.editor.getSelection();
            const code = selection || window.codeEditor.getValue();

            if (code && code.trim()) {
                // Show cost warning confirmation
                const codeLength = code.length;
                const estimatedCost = this.estimateCost(codeLength, 'analysis');
                const fileName = window.codeEditor.currentFile.path.split('/').pop();
                const analysisType = selection ? 'selected code' : 'entire file';

                const confirmed = confirm(
                    `🔍 Code Analysis & Bug Fix Request\n\n` +
                    `File: ${fileName}\n` +
                    `Analysis: ${analysisType} (${codeLength} characters)\n` +
                    `Estimated cost: ${estimatedCost}\n\n` +
                    `This will perform comprehensive code analysis including:\n` +
                    `• Bug detection and fixes\n` +
                    `• Security vulnerability checks\n` +
                    `• Performance optimization suggestions\n\n` +
                    `Continue with analysis?`
                );

                if (!confirmed) return;

                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();

                // Create a comprehensive prompt for code analysis
                const message = `Please analyze this ${fileExtension} code from "${fileName}" for potential issues and bugs:
                
**Please provide:**
1. **Issues Found:** List all problems discovered with explanations
2. **Severity:** Rate each issue (Critical, High, Medium, Low)
3. **Fixed Code:** Provide corrected version with improvements
4. **Explanation:** Explain what was wrong and why the fix works

\`\`\`${fileExtension}
${code}
\`\`\`

${selection ? `*(Analyzing selected code only)*` : `*(Analyzing entire file)*`}`;

                document.getElementById('chatInput').value = message;
                this.sendMessage();
            } else {
                this.addSystemMessage('⚠️ No code found to analyze. Please add some code to your file first.');
            }
        } else {
            this.addSystemMessage('⚠️ Please open a file first to analyze code for issues.');
        }
    }

    optimizeCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const selection = window.codeEditor.editor.getSelection();
            const code = selection || window.codeEditor.getValue();

            if (code && code.trim()) {
                // Show cost warning confirmation
                const codeLength = code.length;
                const estimatedCost = this.estimateCost(codeLength, 'optimization');
                const fileName = window.codeEditor.currentFile.path.split('/').pop();
                const analysisType = selection ? 'selected code' : 'entire file';

                const confirmed = confirm(
                    `🚀 Code Optimization Request\n\n` +
                    `File: ${fileName}\n` +
                    `Analysis: ${analysisType} (${codeLength} characters)\n` +
                    `Estimated cost: ${estimatedCost}\n\n` +
                    `This will analyze and optimize your code for:\n` +
                    `• Performance improvements\n` +
                    `• Memory efficiency\n` +
                    `• Best practices implementation\n` +
                    `• Code readability enhancements\n\n` +
                    `Continue with optimization?`
                );

                if (!confirmed) return;

                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();

                const message = `Please analyze and optimize this ${fileExtension} code from "${fileName}":

**Optimization Goals:**
- Improve performance and efficiency
- Reduce code complexity and improve readability
- Follow best practices and modern standards
- Minimize memory usage and resource consumption
- Enhance maintainability

**Please provide:**
1. **Current Issues:** What can be improved?
2. **Optimized Code:** Rewritten version with improvements
3. **Performance Impact:** Expected benefits of the changes
4. **Explanation:** Why these optimizations work

\`\`\`${fileExtension}
${code}
\`\`\`

${selection ? `*(Optimizing selected code only)*` : `*(Optimizing entire file)*`}`;

                document.getElementById('chatInput').value = message;
                this.sendMessage();
            } else {
                this.addSystemMessage('⚠️ No code found to optimize. Please add some code to your file first.');
            }
        } else {
            this.addSystemMessage('⚠️ Please open a file first to optimize code.');
        }
    }

    reviewCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const selection = window.codeEditor.editor.getSelection();
            const code = selection || window.codeEditor.getValue();

            if (code && code.trim()) {
                // Show cost warning confirmation
                const codeLength = code.length;
                const estimatedCost = this.estimateCost(codeLength, 'review');
                const fileName = window.codeEditor.currentFile.path.split('/').pop();
                const analysisType = selection ? 'selected code' : 'entire file';

                const confirmed = confirm(
                    `📝 Comprehensive Code Review Request\n\n` +
                    `File: ${fileName}\n` +
                    `Analysis: ${analysisType} (${codeLength} characters)\n` +
                    `Estimated cost: ${estimatedCost}\n\n` +
                    `This will perform a detailed code review including:\n` +
                    `• Code quality assessment\n` +
                    `• Security analysis\n` +
                    `• Best practices evaluation\n` +
                    `• Performance review\n` +
                    `• Maintainability analysis\n\n` +
                    `Continue with comprehensive review?`
                );

                if (!confirmed) return;

                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();

                const message = `Please conduct a comprehensive code review of this ${fileExtension} code from "${fileName}":

**Review Checklist:**
- **Code Quality:** Readability, maintainability, structure
- **Best Practices:** Following language/framework conventions
- **Security:** Potential vulnerabilities and security issues
- **Performance:** Efficiency and optimization opportunities
- **Testing:** Testability and potential edge cases
- **Documentation:** Code comments and self-documentation

**Review Format:**
1. **Overall Assessment:** General code quality rating
2. **Strengths:** What's done well
3. **Issues & Improvements:** Detailed feedback with examples
4. **Recommendations:** Specific actionable suggestions
5. **Refactored Code:** Improved version (if significant changes needed)

\`\`\`${fileExtension}
${code}
\`\`\`

${selection ? `*(Reviewing selected code only)*` : `*(Reviewing entire file)*`}`;

                document.getElementById('chatInput').value = message;
                this.sendMessage();
            } else {
                this.addSystemMessage('⚠️ No code found to review. Please add some code to your file first.');
            }
        } else {
            this.addSystemMessage('⚠️ Please open a file first to review code.');
        }
    }

    estimateCost(codeLength, analysisType = 'basic') {
        // Rough estimation based on token count and model pricing
        const tokensPerChar = 0.25; // Approximate tokens per character
        const inputTokens = codeLength * tokensPerChar;

        // Add estimated output tokens based on analysis type
        const outputTokenMultiplier = {
            'basic': 1.5,
            'analysis': 2.0,
            'optimization': 2.5,
            'review': 3.0
        };

        const outputTokens = inputTokens * (outputTokenMultiplier[analysisType] || 1.5);
        const totalTokens = inputTokens + outputTokens;

        // Get model pricing (approximate costs per 1K tokens)
        const modelPricing = this.getModelPricing(this.model);
        const estimatedCost = (totalTokens / 1000) * modelPricing;

        // Format cost display
        if (estimatedCost < 0.01) {
            return 'Less than $0.01';
        } else if (estimatedCost < 0.10) {
            return `~$${estimatedCost.toFixed(3)}`;
        } else {
            return `~$${estimatedCost.toFixed(2)}`;
        }
    }

    getModelPricing(modelId) {
        const pricing = {
            // GPT-3.5 models (input/output combined average)
            'gpt-3.5-turbo': 0.0015,
            'gpt-3.5-turbo-16k': 0.003,
            'gpt-3.5-turbo-1106': 0.0015,
            'gpt-3.5-turbo-0125': 0.001,

            // GPT-4 models
            'gpt-4': 0.045,
            'gpt-4-32k': 0.09,
            'gpt-4-turbo': 0.02,
            'gpt-4-turbo-preview': 0.02,
            'gpt-4-1106-preview': 0.02,
            'gpt-4-0125-preview': 0.02,

            // GPT-4o models
            'gpt-4o': 0.0075,
            'gpt-4o-mini': 0.0003,
            'gpt-4o-2024-05-13': 0.0075,
            'gpt-4o-2024-08-06': 0.0075,

            // Legacy models
            'text-davinci-003': 0.02,
            'code-davinci-002': 0.02
        };

        return pricing[modelId] || 0.02; // Default to moderate pricing
    }

    showCostInfo() {
        const costInfoHTML = `
            <div class="cost-info">
                <h3>💰 AI Usage Costs</h3>
                
                <div class="cost-section">
                    <h4>Current Model: ${this.getModelName()}</h4>
                    <p>Approximate cost per 1K tokens: <strong>$${this.getModelPricing(this.model).toFixed(4)}</strong></p>
                </div>

                <div class="cost-section">
                    <h4>💡 Cost-Saving Tips:</h4>
                    <ul>
                        <li><strong>Select specific code:</strong> Analyze only the code you need help with</li>
                        <li><strong>Use GPT-3.5 Turbo:</strong> For simple questions, it's 20x cheaper than GPT-4</li>
                        <li><strong>Try GPT-4o Mini:</strong> Great balance of capability and cost</li>
                        <li><strong>Be specific:</strong> Clear questions get better answers with fewer follow-ups</li>
                        <li><strong>Review before sending:</strong> Make sure your question is complete</li>
                    </ul>
                </div>

                <div class="cost-section">
                    <h4>📊 Typical Costs:</h4>
                    <ul>
                        <li><strong>Small function (50 lines):</strong> $0.001 - $0.01</li>
                        <li><strong>Medium file (200 lines):</strong> $0.005 - $0.05</li>
                        <li><strong>Large file (500+ lines):</strong> $0.02 - $0.20</li>
                    </ul>
                </div>

                <div class="cost-note">
                    <p><strong>Note:</strong> These are estimates. Actual costs depend on your OpenAI plan and usage.</p>
                </div>
            </div>
        `;

        this.renderMessage('system', costInfoHTML);
    }

    // Helper method to get model display name
    getModelName() {
        const modelData = this.availableModels.find(m => m.id === this.model);
        return modelData ? modelData.name : this.model;
    }

    generateCode(prompt) {
        const message = `Can you generate code for: ${prompt}`;
        document.getElementById('chatInput').value = message;
        this.sendMessage();
    }

    // Query type detection methods
    isCodeExplanationQuery(message) {
        const patterns = [
            /explain.*code/i,
            /what.*does.*this.*do/i,
            /how.*does.*this.*work/i,
            /what.*is.*this/i,
            /understand.*code/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    isCodeGenerationQuery(message) {
        const patterns = [
            /generate.*code/i,
            /create.*function/i,
            /write.*code/i,
            /build.*component/i,
            /make.*function/i,
            /can.*you.*code/i,
            /show.*me.*how.*to/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    isDebuggingQuery(message) {
        const patterns = [
            /fix.*code/i,
            /debug/i,
            /error/i,
            /not.*working/i,
            /issue.*with/i,
            /problem.*with/i,
            /broken/i,
            /bug/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }

    isOptimizationQuery(message) {
        const patterns = [
            /optimize/i,
            /improve.*performance/i,
            /better.*way/i,
            /more.*efficient/i,
            /faster/i,
            /cleaner.*code/i,
            /best.*practice/i
        ];
        return patterns.some(pattern => pattern.test(message));
    }
}

// Add CSS for chat styling
const chatCSS = `
    .message-timestamp {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-top: var(--spacing-xs);
        text-align: right;
    }
    
    .chat-message.user .message-timestamp {
        text-align: left;
    }
    
    .chat-message.error {
        align-self: center;
        background: var(--error-color);
        color: white;
        text-align: center;
    }
    
    /* Enhanced code styling */
    .inline-code {
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        color: #e74c3c;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .code-block-container {
        margin: 12px 0;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.1);
        background: #f8f9fa;
    }
    
    .code-block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #e9ecef;
        padding: 6px 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        font-size: 0.8em;
    }
    
    .code-language {
        font-weight: 600;
        color: #495057;
        text-transform: uppercase;
        font-size: 0.7em;
        letter-spacing: 0.5px;
    }
    
    .code-actions {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    /* Base button styling for all code action buttons - Made smaller */
    .code-actions button {
        display: flex;
        align-items: center;
        gap: 2px;
        border: none;
        padding: 4px 6px;
        border-radius: 3px;
        font-size: 0.65em;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;
        text-decoration: none;
        font-family: inherit;
        line-height: 1;
        white-space: nowrap;
    }
    
    .code-actions button:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
    }
    
    .code-actions button:active {
        transform: translateY(1px);
    }
    
    .code-actions button svg {
        flex-shrink: 0;
        width: 12px;
        height: 12px;
    }
    
    /* Apply button styling */
    .apply-code-btn {
        background: #28a745;
        border: 1px solid #1e7e34;
    }
    
    .apply-code-btn:hover {
        background: #218838;
        border-color: #1e7e34;
        transform: translateY(-1px);
        box-shadow: 0 1px 3px rgba(40, 167, 69, 0.3);
    }
    
    .apply-code-btn:disabled {
        background: #6c757d;
        border-color: #5a6268;
        cursor: not-allowed;
        opacity: 0.65;
    }
    
    .apply-code-btn:disabled:hover {
        transform: none;
        box-shadow: none;
    }
    
    /* Insert button styling */
    .insert-code-btn {
        background: #fd7e14;
        border: 1px solid #dc6502;
    }
    
    .insert-code-btn:hover {
        background: #e66a00;
        border-color: #dc6502;
        transform: translateY(-1px);
        box-shadow: 0 1px 3px rgba(253, 126, 20, 0.3);
    }
    
    .insert-code-btn:disabled {
        background: #6c757d;
        border-color: #5a6268;
        cursor: not-allowed;
        opacity: 0.65;
    }
    
    .insert-code-btn:disabled:hover {
        transform: none;
        box-shadow: none;
    }
    
    /* Toggle wrap button styling */
    .toggle-wrap-btn {
        background: #17a2b8;
        border: 1px solid #138496;
    }
    
    .toggle-wrap-btn:hover {
        background: #138496;
        border-color: #117a8b;
        transform: translateY(-1px);
        box-shadow: 0 1px 3px rgba(23, 162, 184, 0.3);
    }
    
    /* Copy button styling */
    .copy-code-btn {
        background: #6c757d;
        border: 1px solid #5a6268;
    }
    
    .copy-code-btn:hover {
        background: #5a6268;
        border-color: #545b62;
        transform: translateY(-1px);
        box-shadow: 0 1px 3px rgba(108, 117, 125, 0.3);
    }
    
    .copy-code-btn.copied {
        background: #28a745;
        border-color: #1e7e34;
    }
    
    /* Code block styling - Default: No wrap (single line with scroll) */
    .code-block {
        background: #2d3748 !important;
        color: #e2e8f0 !important;
        padding: 16px !important;
        margin: 0 !important;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        font-size: 0.9em !important;
        line-height: 1.5 !important;
        tab-size: 2 !important;
        border-radius: 0 !important;
        
        /* Default: No wrap mode */
        white-space: pre !important;
        word-wrap: normal !important;
        word-break: normal !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
    }
    
    /* Wrapped mode - when data-wrapped="true" */
    .code-block[data-wrapped="true"] {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        word-break: break-all !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
    }
    
    .code-block code {
        background: none !important;
        padding: 0 !important;
        color: inherit !important;
        font-size: inherit !important;
        border: none !important;
        display: block !important;
        font-family: inherit !important;
    }
    
    /* Inherit white-space from parent pre */
    .code-block code {
        white-space: inherit !important;
        word-wrap: inherit !important;
        word-break: inherit !important;
    }
    
    /* Ensure Prism.js syntax highlighting works */
    .code-block .token.comment,
    .code-block .token.prolog,
    .code-block .token.doctype,
    .code-block .token.cdata {
        color: #8892b0;
    }
    
    .code-block .token.punctuation {
        color: #f8f8f2;
    }
    
    .code-block .token.property,
    .code-block .token.tag,
    .code-block .token.constant,
    .code-block .token.symbol,
    .code-block .token.deleted {
        color: #ff5555;
    }
    
    .code-block .token.boolean,
    .code-block .token.number {
        color: #bd93f9;
    }
    
    .code-block .token.selector,
    .code-block .token.attr-name,
    .code-block .token.string,
    .code-block .token.char,
    .code-block .token.builtin,
    .code-block .token.inserted {
        color: #50fa7b;
    }
    
    .code-block .token.operator,
    .code-block .token.entity,
    .code-block .token.url,
    .code-block .language-css .token.string,
    .code-block .style .token.string,
    .code-block .token.variable {
        color: #f8f8f2;
    }
    
    .code-block .token.atrule,
    .code-block .token.attr-value,
    .code-block .token.function,
    .code-block .token.class-name {
        color: #f1fa8c;
    }
    
    .code-block .token.keyword {
        color: #8be9fd;
    }
    
    .code-block .token.regex,
    .code-block .token.important {
        color: #ffb86c;
    }
    
    /* Custom scrollbar for code blocks (only in no-wrap mode) */
    .code-block:not([data-wrapped="true"])::-webkit-scrollbar {
        height: 8px;
    }
    
    .code-block:not([data-wrapped="true"])::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
    
    .code-block:not([data-wrapped="true"])::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    }
    
    .code-block:not([data-wrapped="true"])::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
    
    /* Typing indicator styles */
    .typing-indicator .message-content {
        padding: var(--spacing-sm);
    }
    
    .typing-animation {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-animation span {
        width: 6px;
        height: 6px;
        background: var(--text-secondary);
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-animation span:nth-child(1) {
        animation-delay: -0.32s;
    }
    
    .typing-animation span:nth-child(2) {
        animation-delay: -0.16s;
    }
    
    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Chat input styling */
    #chatInput {
        resize: none;
        min-height: 36px;
        max-height: 120px;
        overflow-y: auto;
    }
    
    /* Quick actions styling */
    .chat-quick-actions {
        display: flex;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
    }
    
    .quick-action-btn {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--tertiary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        color: var(--text-primary);
        font-size: var(--font-size-xs);
        cursor: pointer;
        transition: var(--transition);
    }
    
    .quick-action-btn:hover {
        background: var(--hover-bg);
    }
    
    /* Dark theme adjustments */
    @media (prefers-color-scheme: dark) {
        .code-block-container {
            background: #1a202c;
            border-color: #4a5568;
        }
        
        .code-block-header {
            background: #2d3748;
            border-color: #4a5568;
        }
        
        .code-language {
            color: #e2e8f0;
        }
        
        .inline-code {
            background: rgba(255, 255, 255, 0.1);
            color: #ffd700;
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Dark theme button adjustments */
        .code-actions button {
            border-width: 1px;
        }
        
        .apply-code-btn {
            background: #22c55e;
            border-color: #16a34a;
        }
        
        .apply-code-btn:hover {
            background: #16a34a;
            border-color: #15803d;
        }
        
        .insert-code-btn {
            background: #f97316;
            border-color: #ea580c;
        }
        
        .insert-code-btn:hover {
            background: #ea580c;
            border-color: #c2410c;
        }
        
        .toggle-wrap-btn {
            background: #0891b2;
            border-color: #0e7490;
        }
        
        .toggle-wrap-btn:hover {
            background: #0e7490;
            border-color: #155e75;
        }
        
        .copy-code-btn {
            background: #64748b;
            border-color: #475569;
        }
        
        .copy-code-btn:hover {
            background: #475569;
            border-color: #334155;
        }
    }

    /* History navigation indicator */
    .chat-input-container {
        position: relative;
    }
    
    .history-indicator {
        position: absolute;
        top: -25px;
        right: 8px;
        background: var(--primary-color);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7em;
        font-weight: 500;
        pointer-events: none;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.2s ease;
        z-index: 10;
    }
    
    .history-indicator.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Input hint styling */
    .chat-input-hint {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        text-align: center;
        padding: var(--spacing-xs);
        border-top: 1px solid var(--border-color);
        background: var(--secondary-bg);
    }
    
    .chat-input-hint code {
        background: rgba(0, 0, 0, 0.1);
        padding: 1px 4px;
        border-radius: 2px;
        font-size: 0.85em;
    }
    
    /* Responsive adjustments for smaller screens */
    @media (max-width: 768px) {
        .code-actions {
            gap: 3px;
        }
        
        .code-actions button {
            padding: 3px 5px;
            font-size: 0.6em;
        }
        
        .code-actions button svg {
            width: 10px;
            height: 10px;
        }
        
        .code-actions button span {
            display: none;
        }
    }

    /* Model status styling */
    .current-model-info {
        padding: var(--spacing-sm);
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
        font-size: var(--font-size-sm);
    }
    
    .model-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .model-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .model-name {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .model-status-text {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
    }
    
    .model-status.configured .model-status-text {
        color: var(--success-color);
    }
    
    .model-status.not-configured .model-status-text {
        color: var(--warning-color);
    }
    
    .setup-btn, .settings-btn {
        padding: 4px 8px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: var(--font-size-xs);
        cursor: pointer;
        transition: var(--transition);
    }
    
    .setup-btn:hover, .settings-btn:hover {
        background: var(--primary-hover);
    }
    
    /* Setup instructions styling */
    .setup-instructions {
        padding: var(--spacing-lg);
        background: var(--tertiary-bg);
        border-radius: var(--border-radius);
        margin: var(--spacing-sm) 0;
        border-left: 4px solid var(--primary-color);
    }
    
    .setup-instructions h3 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-primary);
        font-size: var(--font-size-lg);
    }
    
    .setup-step {
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
    }
    
    .setup-step:last-of-type {
        border-bottom: none;
        margin-bottom: var(--spacing-sm);
    }
    
    .setup-step h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
        font-size: var(--font-size-md);
    }
    
    .setup-step ol, .setup-step ul {
        margin: var(--spacing-xs) 0;
        padding-left: var(--spacing-lg);
    }
    
    .setup-step li {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
    }
    
    .setup-step a {
        color: var(--primary-color);
        text-decoration: none;
    }
    
    .setup-step a:hover {
        text-decoration: underline;
    }
    
    .setup-note {
        background: rgba(var(--primary-color-rgb), 0.1);
        padding: var(--spacing-md);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-md);
    }
    
    .setup-note strong {
        color: var(--text-primary);
    }
    
    .setup-note ul {
        margin-top: var(--spacing-xs);
        padding-left: var(--spacing-lg);
    }
    
    .setup-note li {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
    }
    
    .setup-action-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        margin-top: var(--spacing-sm);
    }
    
    .setup-action-btn:hover {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }
    
    /* Enhanced quick actions */
    .chat-quick-actions {
        display: flex;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
        flex-wrap: wrap;
        justify-content: space-between;
    }
    
    .quick-actions-left, .quick-actions-right {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
    }

    /* Model comparison styling */
    .model-comparison {
        padding: var(--spacing-lg);
        background: var(--tertiary-bg);
        border-radius: var(--border-radius);
        margin: var(--spacing-sm) 0;
        border-left: 4px solid var(--primary-color);
    }
    
    .model-comparison h3 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-primary);
        font-size: var(--font-size-lg);
    }
    
    .comparison-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }
    
    .model-card {
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        transition: var(--transition);
    }
    
    .model-card.recommended {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.2);
    }
    
    .model-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .model-card h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
        font-size: var(--font-size-md);
    }
    
    .model-stats {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-sm);
    }
    
    .stat {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: var(--font-size-xs);
        font-weight: 500;
        text-align: center;
    }
    
    .stat.speed {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    .stat.cost {
        background: #f3e5f5;
        color: #7b1fa2;
    }
    
    .stat.capability {
        background: #e8f5e8;
        color: #388e3c;
    }
    
    .model-card p {
        margin: 0;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        line-height: 1.4;
    }
    
    .usage-tips {
        background: rgba(var(--primary-color-rgb), 0.1);
        padding: var(--spacing-md);
        border-radius: var(--border-radius);
    }
    
    .usage-tips h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
        font-size: var(--font-size-md);
    }
    
    .usage-tips ul {
        margin: 0;
        padding-left: var(--spacing-lg);
    }
    
    .usage-tips li {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
        line-height: 1.4;
    }
    
    /* Dark theme adjustments */
    @media (prefers-color-scheme: dark) {
        .stat.speed {
            background: rgba(25, 118, 210, 0.2);
            color: #64b5f6;
        }
        
        .stat.cost {
            background: rgba(123, 31, 162, 0.2);
            color: #ba68c8;
        }
        
        .stat.capability {
            background: rgba(56, 142, 60, 0.2);
            color: #81c784;
        }
    }

    /* File References Section */
    .file-references-section {
        border-bottom: 1px solid var(--border-color);
        padding: var(--spacing-sm);
        background: var(--tertiary-bg);
    }

    .references-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-xs);
    }

    .references-header h4 {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        font-weight: 600;
    }

    .references-actions {
        display: flex;
        gap: var(--spacing-xs);
    }

    .btn-reference-add,
    .btn-reference-clear {
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: var(--border-radius);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
    }

    .btn-reference-add:hover {
        background: var(--success-color);
        color: white;
    }

    .btn-reference-clear:hover {
        background: var(--error-color);
        color: white;
    }

    .file-references {
        max-height: 150px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .no-references {
        text-align: center;
        color: var(--text-muted);
        font-size: var(--font-size-xs);
        font-style: italic;
        padding: var(--spacing-sm);
    }

    .reference-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-xs);
        background: var(--secondary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: var(--font-size-xs);
        transition: var(--transition);
    }

    .reference-item:hover {
        background: var(--hover-bg);
    }

    .reference-name {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        flex: 1;
        overflow: hidden;
        color: var(--text-primary);
    }

    .reference-name i {
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .reference-remove {
        width: 16px;
        height: 16px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
    }

    .reference-remove:hover {
        background: var(--error-color);
        color: white;
    }

    /* File Selector Modal */
    .file-selector-modal .modal-content {
        width: 600px;
        height: 500px;
    }

    .file-selector-content {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .selector-search {
        margin-bottom: var(--spacing-md);
    }

    .selector-search input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--primary-bg);
        color: var(--text-primary);
        font-size: var(--font-size-sm);
    }

    .selector-files {
        flex: 1;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--primary-bg);
    }

    .selector-file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
        transition: var(--transition);
    }

    .selector-file-item:hover {
        background: var(--hover-bg);
    }

    .selector-file-item.referenced {
        background: rgba(var(--success-color-rgb), 0.1);
        border-left: 3px solid var(--success-color);
    }

    .selector-file-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        flex: 1;
        overflow: hidden;
    }

    .selector-file-info i {
        color: var(--text-secondary);
        width: 16px;
        text-align: center;
    }

    .selector-file-name {
        font-weight: 500;
        color: var(--text-primary);
    }

    .selector-file-path {
        color: var(--text-secondary);
        font-size: var(--font-size-xs);
        margin-left: auto;
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
    }

    .selector-file-action {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: var(--border-radius);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
    }

    .selector-file-action:hover {
        background: var(--primary-color);
        color: white;
    }

    .selector-file-item.referenced .selector-file-action:hover {
        background: var(--error-color);
    }

    /* Context indicators in chat input */
    .chat-input-context {
        position: absolute;
        top: -30px;
        left: 0;
        right: 0;
        background: rgba(var(--primary-color-rgb), 0.1);
        border: 1px solid rgba(var(--primary-color-rgb), 0.3);
        border-radius: var(--border-radius);
        padding: var(--spacing-xs);
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
        display: none;
    }

    .chat-input-context.show {
        display: block;
    }

    .context-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .context-indicator i {
        color: var(--primary-color);
    }

    /* Add this to the existing chatCSS variable */
    .clear-btn {
        background: var(--error-color) !important;
        color: white !important;
    }

    .clear-btn:hover {
        background: var(--error-hover, #d32f2f) !important;
        transform: translateY(-1px);
    }

    .export-btn {
        background: var(--info-color, #1976d2) !important;
        color: white !important;
    }

    .export-btn:hover {
        background: var(--info-hover, #1565c0) !important;
        transform: translateY(-1px);
    }

    .settings-btn {
        background: var(--warning-color, #f57c00) !important;
        color: white !important;
    }

    .settings-btn:hover {
        background: var(--warning-hover, #ef6c00) !important;
        transform: translateY(-1px);
    }

    /* Quick actions right alignment */
    .quick-actions-right {
        margin-left: auto;
    }

    .quick-actions-right .quick-action-btn {
        font-weight: 500;
    }

    /* Cost info styling */
    .cost-info {
        padding: var(--spacing-lg);
        background: var(--tertiary-bg);
        border-radius: var(--border-radius);
        margin: var(--spacing-sm) 0;
        border-left: 4px solid #f39c12;
    }
    
    .cost-info h3 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-primary);
        font-size: var(--font-size-lg);
    }
    
    .cost-section {
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
    }
    
    .cost-section:last-of-type {
        border-bottom: none;
        margin-bottom: 0;
    }
    
    .cost-section h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
        font-size: var(--font-size-md);
    }
    
    .cost-section ul {
        margin: var(--spacing-xs) 0;
        padding-left: var(--spacing-lg);
    }
    
    .cost-section li {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
        line-height: 1.4;
    }
    
    .cost-section strong {
        color: var(--text-primary);
    }
    
    .cost-note {
        background: rgba(243, 156, 18, 0.1);
        padding: var(--spacing-sm);
        border-radius: var(--border-radius);
        font-size: var(--font-size-sm);
        font-style: italic;
    }
    
    .cost-note p {
        margin: 0;
        color: var(--text-secondary);
    }

    /* Enhanced quick action button styling for cost awareness */
    .quick-action-btn[onclick*="Code()"] {
        position: relative;
    }
    
    .quick-action-btn[onclick*="Code()"]::after {
        content: "💰";
        position: absolute;
        top: -2px;
        right: -2px;
        font-size: 0.6em;
        opacity: 0.7;
    }

    /* Typing indicator styles */
    .typing-indicator .message-content {
        padding: var(--spacing-sm);
    }
    
    .typing-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-xs);
    }
    
    .typing-animation {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-animation span {
        width: 6px;
        height: 6px;
        background: var(--text-secondary);
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-animation span:nth-child(1) {
        animation-delay: -0.32s;
    }
    
    .typing-animation span:nth-child(2) {
        animation-delay: -0.16s;
    }
    
    /* Stop button styling */
    .stop-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--error-color, #dc3545);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: var(--font-size-xs);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(220, 53, 69, 0.3);
    }
    
    .stop-btn:hover {
        background: var(--error-hover, #c82333);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
    }
    
    .stop-btn:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(220, 53, 69, 0.3);
    }
    
    .stop-btn:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.5);
    }
    
    .stop-btn svg {
        flex-shrink: 0;
    }
    
    .typing-status {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
        font-style: italic;
    }
    
    /* Pulse animation for the typing indicator */
    .typing-indicator {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
        100% {
            opacity: 1;
        }
    }
    
    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    /* Dark theme adjustments for stop button */
    @media (prefers-color-scheme: dark) {
        .stop-btn {
            background: #e74c3c;
            border: 1px solid #c0392b;
        }
        
        .stop-btn:hover {
            background: #c0392b;
            border-color: #a93226;
        }
        
        .stop-btn:focus {
            box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.5);
        }
    }
    
    /* Responsive adjustments for stop button */
    @media (max-width: 768px) {
        .stop-btn {
            padding: 3px 6px;
            font-size: 0.65em;
        }
        
        .stop-btn svg {
            width: 10px;
            height: 10px;
        }
        
        .typing-header {
            gap: var(--spacing-xs);
        }
    }

    /* Detailed Notification Styles */
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
        pointer-events: none;
    }

    .detailed-notification {
        background: var(--primary-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        transform: translateX(100%);
        transition: all 0.3s ease;
        pointer-events: auto;
        max-width: 100%;
        min-width: 320px;
    }

    .detailed-notification.show {
        transform: translateX(0);
    }

    .detailed-notification.error {
        border-left: 4px solid var(--error-color, #dc3545);
    }

    .detailed-notification.warning {
        border-left: 4px solid var(--warning-color, #ffc107);
    }

    .detailed-notification.info {
        border-left: 4px solid var(--info-color, #17a2b8);
    }

    .detailed-notification.success {
        border-left: 4px solid var(--success-color, #28a745);
    }

    .notification-header {
        display: flex;
        align-items: center;
        padding: 12px 16px 8px 16px;
        background: var(--secondary-bg);
        border-bottom: 1px solid var(--border-color);
    }

    .notification-icon {
        margin-right: 8px;
        font-size: 18px;
    }

    .detailed-notification.error .notification-icon {
        color: var(--error-color, #dc3545);
    }

    .detailed-notification.warning .notification-icon {
        color: var(--warning-color, #ffc107);
    }

    .detailed-notification.info .notification-icon {
        color: var(--info-color, #17a2b8);
    }

    .detailed-notification.success .notification-icon {
        color: var(--success-color, #28a745);
    }

    .notification-title {
        flex: 1;
        font-weight: 600;
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        line-height: 1.3;
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: var(--transition);
    }

    .notification-close:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
    }

    .notification-message {
        padding: 8px 16px 12px 16px;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        line-height: 1.4;
    }

    .notification-actions {
        padding: 0 16px 12px 16px;
        display: flex;
        justify-content: flex-end;
    }

    .notification-action-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: var(--font-size-xs);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
    }

    .notification-action-btn:hover {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    .detailed-notification.error .notification-action-btn {
        background: var(--error-color, #dc3545);
    }

    .detailed-notification.error .notification-action-btn:hover {
        background: var(--error-hover, #c82333);
    }

    .detailed-notification.warning .notification-action-btn {
        background: var(--warning-color, #ffc107);
        color: #000;
    }

    .detailed-notification.warning .notification-action-btn:hover {
        background: var(--warning-hover, #e0a800);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .notification-container {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }

        .detailed-notification {
            min-width: auto;
        }

        .notification-header {
            padding: 10px 12px 6px 12px;
        }

        .notification-message {
            padding: 6px 12px 10px 12px;
        }

        .notification-actions {
            padding: 0 12px 10px 12px;
        }
    }

    /* Dark theme adjustments */
    @media (prefers-color-scheme: dark) {
        .detailed-notification {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
    }

    /* Animation for notification container */
    .notification-container:empty {
        display: none;
    }
`;

const chatGPTStyle = document.createElement('style');
chatGPTStyle.textContent = chatCSS;
document.head.appendChild(chatGPTStyle);

// Add quick actions to chat panel
document.addEventListener('DOMContentLoaded', () => {
    const rightPanel = document.querySelector('.right-panel .panel-content');
    if (rightPanel) {
        // Add file references section before existing quick actions
        const fileReferencesSection = document.createElement('div');
        fileReferencesSection.className = 'file-references-section';
        fileReferencesSection.innerHTML = `
            <div class="references-header">
                <h4>Referenced Files</h4>
                <div class="references-actions">
                    <button class="btn-reference-add" onclick="chatGPT.showFileSelector()" title="Add file reference">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-reference-clear" onclick="chatGPT.clearFileReferences()" title="Clear all references">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div id="fileReferences" class="file-references">
                <div class="no-references">No files referenced</div>
            </div>
        `;

        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.insertBefore(fileReferencesSection, chatContainer.firstChild);
        }

        // Enhanced quick actions with cost awareness
        const quickActions = document.createElement('div');
        quickActions.className = 'chat-quick-actions';
        quickActions.innerHTML = `
            <div class="quick-actions-left">
                <button class="quick-action-btn" onclick="chatGPT.explainCode()" title="Explain code (cost confirmation included)">
                    <i class="fas fa-question-circle"></i> Explain
                </button>
                <button class="quick-action-btn" onclick="chatGPT.fixCode()" title="Analyze and fix code issues (cost confirmation included)">
                    <i class="fas fa-bug"></i> Fix Issues
                </button>
                <button class="quick-action-btn" onclick="chatGPT.reviewCode()" title="Comprehensive code review (cost confirmation included)">
                    <i class="fas fa-search"></i> Review
                </button>
                <button class="quick-action-btn" onclick="chatGPT.optimizeCode()" title="Optimize code performance (cost confirmation included)">
                    <i class="fas fa-rocket"></i> Optimize
                </button>
                <button class="quick-action-btn" onclick="chatGPT.showCostInfo()" title="View AI usage costs and tips">
                    <i class="fas fa-dollar-sign"></i> Costs
                </button>
            </div>
            <div class="quick-actions-right">
                <button class="quick-action-btn export-btn" onclick="chatGPT.exportChat()" title="Export chat history">
                    <i class="fas fa-download"></i> Export
                </button>
                <button class="quick-action-btn clear-btn" onclick="chatGPT.resetAssistant()" title="Clear all conversations and file references">
                    <i class="fas fa-broom"></i> Clear All
                </button>
                <button class="quick-action-btn settings-btn" onclick="chatGPT.openSettings()" title="Open AI settings">
                    <i class="fas fa-cog"></i> Settings
                </button>
            </div>
        `;

        const inputContainer = document.querySelector('.chat-input-container');
        if (inputContainer) {
            // Add history indicator
            const historyIndicator = document.createElement('div');
            historyIndicator.className = 'history-indicator';
            historyIndicator.id = 'historyIndicator';
            inputContainer.appendChild(historyIndicator);

            // Add input hint
            const inputHint = document.createElement('div');
            inputHint.className = 'chat-input-hint';
            inputHint.innerHTML = 'Use <code>↑</code> and <code>↓</code> arrows to navigate message history • <code>Esc</code> to clear';

            chatContainer.insertBefore(quickActions, inputContainer);
            chatContainer.appendChild(inputHint);
        }
    }

    // AI Provider change handler
    const aiProviderSelect = document.getElementById('aiProvider');
    if (aiProviderSelect) {
        aiProviderSelect.addEventListener('change', function () {
            const selectedProvider = this.value;

            // Show/hide appropriate settings sections
            const geminiSettings = document.getElementById('geminiSettings');
            const openaiSettings = document.getElementById('openaiSettings');

            if (selectedProvider === 'gemini') {
                if (geminiSettings) geminiSettings.style.display = 'block';
                if (openaiSettings) openaiSettings.style.display = 'none';
            } else {
                if (geminiSettings) geminiSettings.style.display = 'none';
                if (openaiSettings) openaiSettings.style.display = 'block';
            }

            // Update the AI assistant immediately
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ aiProvider: selectedProvider });
            }
        });

        // Trigger initial setup
        aiProviderSelect.dispatchEvent(new Event('change'));
    }

    // Gemini settings handlers
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const geminiModelSelect = document.getElementById('geminiModel');
    
    if (geminiApiKeyInput) {
        geminiApiKeyInput.addEventListener('input', function() {
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ geminiApiKey: this.value });
                console.log('🔑 Gemini API key updated:', this.value ? '***' + this.value.slice(-4) : 'empty');
            }
        });
        
        geminiApiKeyInput.addEventListener('change', function() {
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ geminiApiKey: this.value });
            }
        });
    }
    
    if (geminiModelSelect) {
        geminiModelSelect.addEventListener('change', function() {
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ geminiModel: this.value });
                console.log('🤖 Gemini model updated:', this.value);
            }
        });
    }
    
    // OpenAI settings handlers
    const openaiApiKeyInput = document.getElementById('openaiApiKey');
    const openaiModelSelect = document.getElementById('aiModel');
    
    if (openaiApiKeyInput) {
        openaiApiKeyInput.addEventListener('input', function() {
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ apiKey: this.value });
            }
        });
    }
    
    if (openaiModelSelect) {
        openaiModelSelect.addEventListener('change', function() {
            if (window.chatGPT) {
                window.chatGPT.updateSettings({ model: this.value });
            }
        });
    }
});


// Create global ChatGPT assistant instance
window.chatGPT = new ChatGPTAssistant();
