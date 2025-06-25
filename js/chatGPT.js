// ChatGPT AI Assistant Integration

class ChatGPTAssistant {
    constructor() {
        this.apiKey = '';
        this.model = 'gpt-3.5-turbo';
        this.maxTokens = 2000;
        this.messages = [];
        this.isTyping = false;

        // Add message history tracking
        this.messageHistory = [];
        this.historyIndex = -1;
        this.currentDraft = '';

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

        // Setup event listeners
        this.setupEventListeners();

        // Update UI based on API key availability
        this.updateUI();
        
        // Update settings dropdown with available models
        if (window.settingsManager) {
            window.settingsManager.updateModelDropdown();
        }

        // Show appropriate welcome message
        if (!this.apiKey || this.apiKey.length === 0) {
            this.addSystemMessage('Welcome to WebDev Studio AI Assistant! 🤖');
            setTimeout(() => {
                this.showSetupInstructions();
            }, 500);
        } else {
            this.addSystemMessage('Hello! I\'m your AI assistant. How can I help you with your code today?');
        }
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

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('webdev-studio-ai-settings') || '{}');
        this.apiKey = settings.apiKey || '';
        this.model = settings.model || 'gpt-3.5-turbo';
        this.maxTokens = settings.maxTokens || 2000;

        // Load message history
        this.messageHistory = settings.messageHistory || [];
        // Limit history to last 50 messages to prevent excessive storage
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(-50);
        }
    }

    saveSettings() {
        const settings = {
            apiKey: this.apiKey,
            model: this.model,
            maxTokens: this.maxTokens,
            messageHistory: this.messageHistory
        };
        localStorage.setItem('webdev-studio-ai-settings', JSON.stringify(settings));
    }

    updateSettings(newSettings) {
        if (newSettings.apiKey !== undefined) {
            this.apiKey = newSettings.apiKey;
        }
        if (newSettings.model !== undefined) {
            this.model = newSettings.model;
        }
        if (newSettings.maxTokens !== undefined) {
            this.maxTokens = newSettings.maxTokens;
        }

        this.saveSettings();
        this.updateUI();
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
        const hasApiKey = this.apiKey && this.apiKey.length > 0;

        chatInput.disabled = !hasApiKey;
        sendBtn.disabled = !hasApiKey;

        if (hasApiKey) {
            chatInput.placeholder = 'Ask me anything about your code...';
        } else {
            chatInput.placeholder = 'Configure API key in settings to enable AI assistance';
        }

        // Update model info if available
        this.updateModelInfo();
    }

    // New method to update model information display
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
            const modelData = this.availableModels.find(m => m.id === this.model);
            const modelName = modelData ? modelData.name : this.model;
            const isConfigured = this.apiKey && this.apiKey.length > 0;
            
            modelInfoElement.innerHTML = `
                <div class="model-status ${isConfigured ? 'configured' : 'not-configured'}">
                    <div class="model-info">
                        <span class="model-name">${modelName}</span>
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

        if (!message || !this.apiKey || this.isTyping) return;

        // Add message to history (avoid duplicates)
        if (this.messageHistory.length === 0 || this.messageHistory[this.messageHistory.length - 1] !== message) {
            this.messageHistory.push(message);

            // Limit history to 50 messages
            if (this.messageHistory.length > 50) {
                this.messageHistory.shift();
            }

            // Save to localStorage
            this.saveSettings();
        }

        // Reset history navigation
        this.historyIndex = -1;
        this.currentDraft = '';

        // Add user message to chat
        this.addUserMessage(message);
        chatInput.value = '';
        this.autoResizeInput(chatInput);

        // Show typing indicator with stop button
        this.showTypingIndicator();

        // Create AbortController for canceling request
        this.abortController = new AbortController();

        try {
            // Generate enhanced system prompt based on query type
            const systemPrompt = this.generateSystemPrompt(message);

            // Prepare messages for API
            const apiMessages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...this.messages.slice(-10), // Keep last 10 messages for context
                {
                    role: 'user',
                    content: message
                }
            ];

            // Call OpenAI API with abort signal
            const response = await this.callOpenAI(apiMessages, this.abortController.signal);

            // Add assistant response
            this.addAssistantMessage(response);

        } catch (error) {
            console.error('Chat error:', error);
            
            if (error.name === 'AbortError' || error.message.includes('aborted')) {
                this.addSystemMessage('Request canceled by user.');
            } else {
                this.addErrorMessage('Sorry, I encountered an error. Please check your API key and try again.');
            }
        } finally {
            this.hideTypingIndicator();
            this.abortController = null;
        }
    }

    async callOpenAI(messages, signal = null) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                max_tokens: this.maxTokens,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            }),
            signal: signal // Add abort signal
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
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

    optimizeCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const code = window.codeEditor.getValue();

            if (code && code.trim()) {
                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();
                const message = `Can you suggest optimizations for this ${fileExtension} code?\n\n\`\`\`${fileExtension}\n${code}\n\`\`\``;
                document.getElementById('chatInput').value = message;
                this.sendMessage();
            } else {
                this.addSystemMessage('⚠️ No code found to optimize. Please add some code to your file first.');
            }
        } else {
            this.addSystemMessage('⚠️ Please open a file first to optimize code.');
        }
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
        const instructionsHTML = `
            <div class="setup-instructions">
                <h3>🤖 Setting up AI Assistant</h3>
                
                <div class="setup-step">
                    <h4>Step 1: Get your OpenAI API Key</h4>
                    <ol>
                        <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI API Keys page</a></li>
                        <li>Sign in or create an account</li>
                        <li>Click "Create new secret key"</li>
                        <li>Copy the key (it starts with "sk-")</li>
                    </ol>
                </div>

                <div class="setup-step">
                    <h4>Step 2: Add billing information</h4>
                    <p>Go to <a href="https://platform.openai.com/account/billing" target="_blank">OpenAI Billing</a> and add a payment method. New accounts get free credits to start!</p>
                </div>

                <div class="setup-step">
                    <h4>Step 3: Configure in WebDev Studio</h4>
                    <ol>
                        <li>Open Settings (⚙️ icon)</li>
                        <li>Go to "AI Assistant" tab</li>
                        <li>Paste your API key</li>
                        <li>Choose your preferred model</li>
                        <li>Click "Save Settings"</li>
                    </ol>
                </div>

                <div class="setup-note">
                    <strong>💡 Model Recommendations for Coding:</strong>
                    <ul>
                        <li><strong>GPT-4o Mini:</strong> ⭐ Best overall choice - fast, capable, and affordable</li>
                        <li><strong>GPT-3.5 Turbo:</strong> Most cost-effective for simple coding tasks</li>
                        <li><strong>GPT-4 Turbo:</strong> Best for complex architecture and debugging</li>
                        <li><strong>GPT-4o:</strong> Great for projects involving images or complex reasoning</li>
                        <li><strong>Code Davinci 002:</strong> Specialized for pure code generation</li>
                    </ul>
                </div>

                <div class="setup-note">
                    <strong>🔍 Quick Model Comparison:</strong>
                    <ul>
                        <li><strong>Speed:</strong> GPT-3.5 Turbo > GPT-4o Mini > GPT-4 Turbo > GPT-4</li>
                        <li><strong>Cost:</strong> GPT-3.5 Turbo < GPT-4o Mini < GPT-4 Turbo < GPT-4</li>
                        <li><strong>Capability:</strong> GPT-4 > GPT-4 Turbo > GPT-4o > GPT-4o Mini > GPT-3.5</li>
                    </ul>
                </div>

                <button class="setup-action-btn" onclick="chatGPT.openSettings()">Open Settings</button>
            </div>
        `;
        
        // Use HTML rendering for system messages
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
        this.messages = [];
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        // Reset history navigation but keep message history
        this.historyIndex = -1;
        this.currentDraft = '';

        this.addSystemMessage('Hello there! How can I help you?');
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

    // Quick action methods
    explainCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const selection = window.codeEditor.editor.getSelection();
            const code = selection || window.codeEditor.getValue();

            if (code && code.trim()) {
                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();
                const message = `Can you explain this ${fileExtension} code?\n\n\`\`\`${fileExtension}\n${code}\n\`\`\``;
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
            const code = window.codeEditor.getValue();

            if (code && code.trim()) {
                const fileExtension = window.codeEditor.currentFile.path.split('.').pop();
                const message = `I'm having issues with this ${fileExtension} code. Can you help me identify and fix any problems?\n\n\`\`\`${fileExtension}\n${code}\n\`\`\``;
                document.getElementById('chatInput').value = message;
                this.sendMessage();
            } else {
                this.addSystemMessage('⚠️ No code found to fix. Please add some code to your file first.');
            }
        } else {
            this.addSystemMessage('⚠️ Please open a file first to fix code.');
        }
    }

    optimizeCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const code = window.codeEditor.getValue();

            if (code) {
                const message = `Can you suggest optimizations for this code?\\n\\n\`\`\`\\n${code}\\n\`\`\``;
                document.getElementById('chatInput').value = message;
                this.sendMessage();
            }
        }
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
`;

const chatGPTStyle = document.createElement('style');
chatGPTStyle.textContent = chatCSS;
document.head.appendChild(chatGPTStyle);

// Add quick actions to chat panel
document.addEventListener('DOMContentLoaded', () => {
    const rightPanel = document.querySelector('.right-panel .panel-content');
    if (rightPanel) {
        const quickActions = document.createElement('div');
        quickActions.className = 'chat-quick-actions';
        quickActions.innerHTML = `
            <div class="quick-actions-left">
                <button class="quick-action-btn" onclick="chatGPT.explainCode()">Explain Code</button>
                <button class="quick-action-btn" onclick="chatGPT.fixCode()">Fix Code</button>
                <button class="quick-action-btn" onclick="chatGPT.optimizeCode()">Optimize</button>
            </div>
            <div class="quick-actions-right">
                <button class="quick-action-btn" onclick="chatGPT.showModelComparison()">Compare Models</button>
                <button class="quick-action-btn" onclick="chatGPT.showSetupInstructions()">Setup Help</button>
                <button class="quick-action-btn" onclick="chatGPT.clearChat()">Clear Chat</button>
            </div>
        `;

        // Insert before chat input container
        const chatContainer = document.querySelector('.chat-container');
        const inputContainer = document.querySelector('.chat-input-container');

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
});

// Create global ChatGPT assistant instance
window.chatGPT = new ChatGPTAssistant();
