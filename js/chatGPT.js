// ChatGPT AI Assistant Integration

class ChatGPTAssistant {
    constructor() {
        this.apiKey = '';
        this.model = 'gpt-3.5-turbo';
        this.maxTokens = 2000;
        this.messages = [];
        this.isTyping = false;

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

        // Auto-resize input
        chatInput.addEventListener('input', () => {
            this.autoResizeInput(chatInput);
        });
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('webdev-studio-ai-settings') || '{}');
        this.apiKey = settings.apiKey || '';
        this.model = settings.model || 'gpt-3.5-turbo';
        this.maxTokens = settings.maxTokens || 2000;
    }

    saveSettings() {
        const settings = {
            apiKey: this.apiKey,
            model: this.model,
            maxTokens: this.maxTokens
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

        // Add user message to chat
        this.addUserMessage(message);
        chatInput.value = '';

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

                // Store the original unescaped code for copying
                const originalCode = code.trim();

                // Escape for display
                const escapedCode = originalCode
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');

                const codeId = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

                return `
                <div class="code-block-container">
                    <div class="code-block-header">
                        <span class="code-language">${lang}</span>
                        <button class="copy-code-btn" onclick="chatGPT.copyCode('${codeId}', this)" title="Copy code">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                        </button>
                    </div>
                    <pre class="code-block ${lang}"><code id="${codeId}" data-original="${btoa(originalCode)}">${escapedCode}</code></pre>
                </div>
            `;
            })
            // Inline code - escape HTML entities
            .replace(/`([^`]+)`/g, (match, code) => {
                const escapedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<code class="inline-code">${escapedCode}</code>`;
            })
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return formatted;
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
        this.addSystemMessage('Chat cleared. How can I help you?');
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
    
    .copy-code-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #6c757d;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75em;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .copy-code-btn:hover {
        background: #5a6268;
        transform: translateY(-1px);
    }
    
    .copy-code-btn.copied {
        background: #28a745;
    }
    
    .code-block {
        background: #2d3748;
        color: #e2e8f0;
        padding: 16px;
        margin: 0;
        overflow-x: auto;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
        line-height: 1.5;
        white-space: pre;
        tab-size: 2;
    }
    
    .code-block code {
        background: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
        border: none;
    }
    
    /* Syntax highlighting for different languages */
    .code-block.html,
    .code-block.xml {
        color: #e2e8f0;
    }
    
    .code-block.css {
        color: #81c784;
    }
    
    .code-block.javascript,
    .code-block.js {
        color: #ffeb3b;
    }
    
    .code-block.python {
        color: #4fc3f7;
    }
    
    .code-block.json {
        color: #ff9800;
    }
    
    /* Basic syntax highlighting patterns */
    .code-block.html code,
    .code-block.xml code {
        background: linear-gradient(90deg, 
            #2d3748 0%, 
            #2d3748 100%
        );
    }
    
    /* Custom scrollbar for code blocks */
    .code-block::-webkit-scrollbar {
        height: 8px;
    }
    
    .code-block::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
    }
    
    .code-block::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
    }
    
    .code-block::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.5);
    }
    
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
    
    #chatInput {
        resize: none;
        min-height: 36px;
        max-height: 120px;
        overflow-y: auto;
    }
    
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
        `;

        // Insert before chat input container
        const chatContainer = document.querySelector('.chat-container');
        const inputContainer = document.querySelector('.chat-input-container');
        chatContainer.insertBefore(quickActions, inputContainer);
    }
});

// Create global ChatGPT assistant instance
window.chatGPT = new ChatGPTAssistant();
