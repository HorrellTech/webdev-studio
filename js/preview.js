// Preview functionality for HTML files

class PreviewManager {
    constructor() {
        this.previewWindow = null;
        this.previewFrame = null;
        this.isPreviewOpen = false;
        this.autoRefresh = true;
        this.refreshDelay = 1000; // 1 second delay for auto-refresh
        this.refreshTimer = null;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.previewFrame = document.getElementById('previewFrame');
        
        // Listen for file system changes
        fileSystem.watch((event, data) => {
            if (this.autoRefresh && this.isPreviewOpen) {
                this.scheduleRefresh();
            }
        });
        
        // Listen for editor changes
        if (window.codeEditor) {
            // We'll set this up after the editor is initialized
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEditorIntegration();
            });
        }
    }
    
    setupEventListeners() {
        // Preview button
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.openPreview();
        });
        
        // Run button (alias for preview)
        document.getElementById('runBtn').addEventListener('click', () => {
            this.openPreview();
        });
        
        // Close preview button
        document.getElementById('closePreviewBtn').addEventListener('click', () => {
            this.closePreview();
        });
        
        // Refresh preview button
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.refreshPreview();
        });
        
        // Open in new tab button
        document.getElementById('openInNewTab').addEventListener('click', () => {
            this.openInNewTab();
        });
        
        // Modal backdrop click
        document.getElementById('previewModal').addEventListener('click', (e) => {
            if (e.target.id === 'previewModal') {
                this.closePreview();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPreviewOpen) {
                this.closePreview();
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.openPreview();
            }
        });
    }
    
    setupEditorIntegration() {
        if (window.codeEditor && window.codeEditor.editor) {
            // Listen for editor changes
            window.codeEditor.editor.on('change', () => {
                if (this.autoRefresh && this.isPreviewOpen) {
                    this.scheduleRefresh();
                }
            });
        }
    }
    
    openPreview() {
        const htmlFile = this.findPreviewableFile();
        
        if (!htmlFile) {
            this.showNotification('No HTML file found to preview. Create an index.html file or open an HTML file.', 'warning');
            return;
        }
        
        this.isPreviewOpen = true;
        document.getElementById('previewModal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        this.loadPreview(htmlFile);
    }
    
    closePreview() {
        this.isPreviewOpen = false;
        document.getElementById('previewModal').classList.remove('show');
        document.body.style.overflow = '';
        
        // Clear the iframe
        if (this.previewFrame) {
            this.previewFrame.src = 'about:blank';
        }
        
        // Clear refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    findPreviewableFile() {
        // Priority order for preview:
        // 1. Currently open HTML file
        // 2. index.html in root
        // 3. First HTML file found
        
        const currentFile = window.codeEditor?.currentFile;
        if (currentFile && this.isHTMLFile(currentFile.path)) {
            return currentFile;
        }
        
        // Look for index.html
        const indexFile = fileSystem.readFile('/index.html');
        if (indexFile) {
            return indexFile;
        }
        
        // Find any HTML file
        const htmlFiles = fileSystem.getFilesByExtension('html');
        if (htmlFiles.length > 0) {
            return htmlFiles[0];
        }
        
        return null;
    }
    
    isHTMLFile(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        return extension === 'html' || extension === 'htm';
    }
    
    loadPreview(htmlFile) {
        if (!htmlFile) return;
        
        try {
            // Get the HTML content
            let htmlContent = htmlFile.content;
            
            // Process the HTML to resolve relative paths
            htmlContent = this.processHTMLContent(htmlContent, htmlFile.path);
            
            // Create a blob URL for the HTML
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Load in iframe
            this.previewFrame.src = url;
            
            // Clean up the blob URL after a short delay
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            this.showNotification(`Previewing: ${htmlFile.path}`, 'success');
            
        } catch (error) {
            console.error('Preview error:', error);
            this.showNotification('Failed to load preview: ' + error.message, 'error');
        }
    }
    
    processHTMLContent(htmlContent, htmlFilePath) {
        // Get the directory of the HTML file
        const htmlDir = htmlFilePath.substring(0, htmlFilePath.lastIndexOf('/')) || '/';
        
        // Process CSS links
        htmlContent = htmlContent.replace(
            /<link([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
            (match, before, href, after) => {
                if (href.startsWith('http') || href.startsWith('//') || href.startsWith('data:')) {
                    return match; // External or data URLs
                }
                
                const resolvedPath = this.resolvePath(htmlDir, href);
                const cssFile = fileSystem.readFile(resolvedPath);
                
                if (cssFile) {
                    // Process CSS content
                    const processedCSS = this.processCSSContent(cssFile.content, resolvedPath);
                    const cssBlob = new Blob([processedCSS], { type: 'text/css' });
                    const cssUrl = URL.createObjectURL(cssBlob);
                    return `<link${before}href="${cssUrl}"${after}>`;
                }
                
                return match;
            }
        );
        
        // Process script tags
        htmlContent = htmlContent.replace(
            /<script([^>]*?)src=["']([^"']+)["']([^>]*?)><\/script>/gi,
            (match, before, src, after) => {
                if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) {
                    return match; // External or data URLs
                }
                
                const resolvedPath = this.resolvePath(htmlDir, src);
                const jsFile = fileSystem.readFile(resolvedPath);
                
                if (jsFile) {
                    const jsBlob = new Blob([jsFile.content], { type: 'application/javascript' });
                    const jsUrl = URL.createObjectURL(jsBlob);
                    return `<script${before}src="${jsUrl}"${after}></script>`;
                }
                
                return match;
            }
        );
        
        // Process image tags
        htmlContent = htmlContent.replace(
            /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
            (match, before, src, after) => {
                if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) {
                    return match; // External or data URLs
                }
                
                const resolvedPath = this.resolvePath(htmlDir, src);
                const imageFile = fileSystem.readFile(resolvedPath);
                
                if (imageFile) {
                    // For images, we'll use a data URL
                    const extension = resolvedPath.split('.').pop()?.toLowerCase();
                    const mimeType = this.getMimeType(extension);
                    const dataUrl = `data:${mimeType};base64,${btoa(imageFile.content)}`;
                    return `<img${before}src="${dataUrl}"${after}>`;
                }
                
                return match;
            }
        );
        
        // Add base tag to help with relative URLs
        if (!htmlContent.includes('<base')) {
            htmlContent = htmlContent.replace(
                /<head([^>]*)>/i,
                `<head$1>\\n    <base href="${window.location.origin}/">`
            );
        }
        
        // Add console capture script for debugging
        const consoleScript = `
            <script>
                (function() {
                    const originalLog = console.log;
                    const originalError = console.error;
                    const originalWarn = console.warn;
                    
                    function postMessage(type, args) {
                        try {
                            window.parent.postMessage({
                                type: 'console',
                                level: type,
                                message: Array.from(args).map(arg => 
                                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                ).join(' ')
                            }, '*');
                        } catch (e) {}
                    }
                    
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        postMessage('log', args);
                    };
                    
                    console.error = function(...args) {
                        originalError.apply(console, args);
                        postMessage('error', args);
                    };
                    
                    console.warn = function(...args) {
                        originalWarn.apply(console, args);
                        postMessage('warn', args);
                    };
                    
                    window.addEventListener('error', function(e) {
                        postMessage('error', [e.message + ' at ' + e.filename + ':' + e.lineno]);
                    });
                })();
            </script>
        `;
        
        htmlContent = htmlContent.replace('</head>', consoleScript + '\\n</head>');
        
        return htmlContent;
    }
    
    processCSSContent(cssContent, cssFilePath) {
        const cssDir = cssFilePath.substring(0, cssFilePath.lastIndexOf('/')) || '/';
        
        // Process @import statements
        cssContent = cssContent.replace(
            /@import\\s+["']([^"']+)["'];?/gi,
            (match, href) => {
                if (href.startsWith('http') || href.startsWith('//')) {
                    return match; // External URLs
                }
                
                const resolvedPath = this.resolvePath(cssDir, href);
                const importedCSS = fileSystem.readFile(resolvedPath);
                
                if (importedCSS) {
                    return this.processCSSContent(importedCSS.content, resolvedPath);
                }
                
                return '/* Imported file not found: ' + href + ' */';
            }
        );
        
        // Process url() references
        cssContent = cssContent.replace(
            /url\\(["']?([^"')]+)["']?\\)/gi,
            (match, url) => {
                if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
                    return match; // External or data URLs
                }
                
                const resolvedPath = this.resolvePath(cssDir, url);
                const assetFile = fileSystem.readFile(resolvedPath);
                
                if (assetFile) {
                    const extension = resolvedPath.split('.').pop()?.toLowerCase();
                    const mimeType = this.getMimeType(extension);
                    const dataUrl = `data:${mimeType};base64,${btoa(assetFile.content)}`;
                    return `url("${dataUrl}")`;
                }
                
                return match;
            }
        );
        
        return cssContent;
    }
    
    resolvePath(basePath, relativePath) {
        // Simple path resolution
        if (relativePath.startsWith('/')) {
            return relativePath;
        }
        
        const base = basePath === '/' ? '' : basePath;
        const resolved = base + '/' + relativePath;
        
        // Normalize the path (remove ./ and ../)
        const parts = resolved.split('/');
        const normalizedParts = [];
        
        for (const part of parts) {
            if (part === '.' || part === '') {
                continue;
            } else if (part === '..') {
                normalizedParts.pop();
            } else {
                normalizedParts.push(part);
            }
        }
        
        return '/' + normalizedParts.join('/');
    }
    
    getMimeType(extension) {
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'eot': 'application/vnd.ms-fontobject'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }
    
    refreshPreview() {
        if (this.isPreviewOpen) {
            const htmlFile = this.findPreviewableFile();
            if (htmlFile) {
                // Save current file content to virtual file system
                if (window.codeEditor && window.codeEditor.currentFile) {
                    const content = window.codeEditor.getValue();
                    fileSystem.writeFile(window.codeEditor.currentFile.path, content);
                    window.codeEditor.currentFile.content = content;
                }
                
                this.loadPreview(htmlFile);
            }
        }
    }
    
    scheduleRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        
        this.refreshTimer = setTimeout(() => {
            this.refreshPreview();
        }, this.refreshDelay);
    }
    
    openInNewTab() {
        const htmlFile = this.findPreviewableFile();
        if (!htmlFile) {
            this.showNotification('No HTML file to open', 'warning');
            return;
        }
        
        try {
            const htmlContent = this.processHTMLContent(htmlFile.content, htmlFile.path);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const newWindow = window.open(url, '_blank');
            
            // Clean up the blob URL after the window loads
            if (newWindow) {
                newWindow.addEventListener('load', () => {
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                });
            }
            
        } catch (error) {
            console.error('Failed to open in new tab:', error);
            this.showNotification('Failed to open in new tab', 'error');
        }
    }
    
    toggleAutoRefresh() {
        this.autoRefresh = !this.autoRefresh;
        this.showNotification(
            `Auto-refresh ${this.autoRefresh ? 'enabled' : 'disabled'}`, 
            'info'
        );
    }
    
    setRefreshDelay(delay) {
        this.refreshDelay = Math.max(100, delay); // Minimum 100ms
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `preview-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">×</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--info-color)'};
            color: white;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
            z-index: 15000;
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
}

// Listen for console messages from the preview iframe
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'console') {
        const { level, message } = event.data;
        console.log(`[Preview ${level}]:`, message);
        
        // You could also display these in a console panel if desired
        if (level === 'error') {
            window.previewManager?.showNotification(`Console Error: ${message}`, 'error');
        }
    }
});

// Create global preview manager instance
window.previewManager = new PreviewManager();
