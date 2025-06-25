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

        this.initialize();
    }

    initialize() {
        // Load settings from localStorage
        this.loadSettings();

        // Setup event listeners
        this.setupEventListeners();

        // Update UI based on API key availability
        this.updateUI();

        // Add welcome message
        this.addSystemMessage('Hello! I\'m your AI assistant. Configure your OpenAI API key in settings to get started.');
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

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get current context
            const context = this.getCurrentContext();

            // Prepare messages for API
            const apiMessages = [
                {
                    role: 'system',
                    content: `You are an AI assistant helping with web development in WebDev Studio. Current context: ${context}`
                },
                ...this.messages.slice(-10), // Keep last 10 messages for context
                {
                    role: 'user',
                    content: message
                }
            ];

            // Call OpenAI API
            const response = await this.callOpenAI(apiMessages);

            // Add assistant response
            this.addAssistantMessage(response);

        } catch (error) {
            console.error('Chat error:', error);
            this.addErrorMessage('Sorry, I encountered an error. Please check your API key and try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }

    async callOpenAI(messages) {
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
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
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
                context.push(`Current file content:\\n${snippet}`);
            }
        }

        // Add project structure
        const files = fileSystem.getAllFiles();
        if (files.length > 0) {
            const fileList = files.map(f => f.path).join(', ');
            context.push(`Project files: ${fileList}`);
        }

        return context.join('\\n');
    }

    addUserMessage(message) {
        this.messages.push({ role: 'user', content: message });
        this.renderMessage('user', message);
    }

    addAssistantMessage(message) {
        this.messages.push({ role: 'assistant', content: message });
        this.renderMessage('assistant', message);
    }

    addSystemMessage(message) {
        this.renderMessage('system', message);
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
        } else {
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
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
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

            if (code) {
                const message = `Can you explain this code?\\n\\n\`\`\`\\n${code}\\n\`\`\``;
                document.getElementById('chatInput').value = message;
                this.sendMessage();
            }
        }
    }

    fixCode() {
        if (window.codeEditor && window.codeEditor.currentFile) {
            const code = window.codeEditor.getValue();

            if (code) {
                const message = `I'm having issues with this code. Can you help me identify and fix any problems?\\n\\n\`\`\`\\n${code}\\n\`\`\``;
                document.getElementById('chatInput').value = message;
                this.sendMessage();
            }
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
        padding: 8px 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        font-size: 0.85em;
    }
    
    .code-language {
        font-weight: 600;
        color: #495057;
        text-transform: uppercase;
        font-size: 0.75em;
        letter-spacing: 0.5px;
    }
    
    .code-actions {
        display: flex;
        gap: 6px;
        align-items: center;
    }
    
    /* Base button styling for all code action buttons */
    .code-actions button {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 0.75em;
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
        box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
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
        box-shadow: 0 2px 4px rgba(253, 126, 20, 0.3);
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
        box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
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
        box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
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
            gap: 4px;
        }
        
        .code-actions button {
            padding: 4px 6px;
            font-size: 0.7em;
        }
        
        .code-actions button span {
            display: none;
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
            <button class="quick-action-btn" onclick="chatGPT.explainCode()">Explain Code</button>
            <button class="quick-action-btn" onclick="chatGPT.fixCode()">Fix Code</button>
            <button class="quick-action-btn" onclick="chatGPT.optimizeCode()">Optimize</button>
            <button class="quick-action-btn" onclick="chatGPT.clearChat()">Clear Chat</button>
            <button class="quick-action-btn" onclick="chatGPT.clearHistory()">Clear History</button>
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
