// Virtual File System for WebDev Studio

class FileSystem {
    constructor() {
        this.files = new Map();
        this.folders = new Map();
        this.currentPath = '/';
        this.watchers = [];
        
        // Initialize with default project structure
        this.initializeDefaultProject();
    }
    
    initializeDefaultProject() {
        // Create default folders
        this.createFolder('/css');
        this.createFolder('/js');
        this.createFolder('/assets');
        this.createFolder('/assets/images');
        
        // Create default files - using the new enhanced project structure
        const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Project</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <nav class="navbar">
                <div class="nav-brand">
                    <h1>My Website</h1>
                </div>
                <ul class="nav-links">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <button class="mobile-menu-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav>
        </header>

        <main class="main-content">
            <section id="home" class="hero">
                <div class="hero-content">
                    <h2>Welcome to My Website</h2>
                    <p>This is a modern, responsive website built with HTML, CSS, and JavaScript.</p>
                    <button class="btn btn-primary" onclick="showMessage()">Get Started</button>
                </div>
            </section>

            <section id="about" class="section">
                <div class="section-content">
                    <h2>About Us</h2>
                    <p>We create amazing web experiences using modern technologies and best practices.</p>
                </div>
            </section>

            <section id="services" class="section">
                <div class="section-content">
                    <h2>Our Services</h2>
                    <div class="services-grid">
                        <div class="service-card">
                            <h3>Web Design</h3>
                            <p>Beautiful, responsive designs that work on all devices.</p>
                        </div>
                        <div class="service-card">
                            <h3>Development</h3>
                            <p>Modern web applications built with the latest technologies.</p>
                        </div>
                        <div class="service-card">
                            <h3>SEO</h3>
                            <p>Optimize your website for search engines and better visibility.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="contact" class="section">
                <div class="section-content">
                    <h2>Contact Us</h2>
                    <form class="contact-form">
                        <input type="text" placeholder="Your Name" required>
                        <input type="email" placeholder="Your Email" required>
                        <textarea placeholder="Your Message" required></textarea>
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
            </section>
        </main>

        <footer class="footer">
            <p>&copy; 2025 My Website. All rights reserved.</p>
        </footer>
    </div>

    <script src="app.js"></script>
</body>
</html>`;

        const defaultCSS = `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
}

.container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Header and Navigation */
.header {
    background: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.nav-brand h1 {
    color: #2c3e50;
    font-size: 1.5rem;
    font-weight: 600;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: #555;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-links a:hover {
    color: #3498db;
}

/* Main Content */
.main-content {
    flex: 1;
    margin-top: 80px;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 6rem 2rem;
    text-align: center;
}

.hero-content h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: 700;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* Sections */
.section {
    padding: 5rem 2rem;
}

.section:nth-child(even) {
    background: #f8f9fa;
}

.section-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.section-content h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #2c3e50;
}

/* Services Grid */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.service-card:hover {
    transform: translateY(-5px);
}

/* Contact Form */
.contact-form {
    max-width: 500px;
    margin: 2rem auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 12px;
    border: 2px solid #e1e1e1;
    border-radius: 6px;
    font-size: 1rem;
}

.contact-form input:focus,
.contact-form textarea:focus {
    outline: none;
    border-color: #3498db;
}

/* Footer */
.footer {
    background: #2c3e50;
    color: white;
    text-align: center;
    padding: 2rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .nav-links {
        display: none;
    }
    
    .hero-content h2 {
        font-size: 2rem;
    }
    
    .services-grid {
        grid-template-columns: 1fr;
    }
}`;        const defaultJS = `// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
    
    // Initialize all functionality
    initMobileMenu();
    initSmoothScrolling();
    initFormHandling();
    initAnimations();
    initInteractiveElements();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Animate hamburger menu
            this.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form Handling
function initFormHandling() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // Basic validation
            if (!name || !email || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Simulate form submission
            showNotification('Message sent successfully!', 'success');
            this.reset();
        });
    }
}

// Initialize Scroll Animations
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections
    const sections = document.querySelectorAll('.section, .service-card');
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Interactive Elements
function initInteractiveElements() {
    // Add hover effects to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });
    
    // Add click effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 600);
        });
    });
}

// Show Message Function (called by Get Started button)
function showMessage() {
    showNotification('Welcome! This is your interactive website.', 'info');
    
    // Scroll to about section
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = aboutSection.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.innerHTML = \`
        <span>\${message}</span>
        <button class="notification-close">&times;</button>
    \`;
    
    // Style the notification
    notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        color: white;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
    \`;
    
    // Set background color based on type
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    notification.style.background = colors[type] || colors.info;
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = \`
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    \`;
    
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Scroll event for header background
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
});

// Add CSS animations
const animationCSS = \`
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .fade-in {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.6s ease forwards;
    }

    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .pulse {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }
\`;

// Inject animation CSS
const style = document.createElement('style');
style.textContent = animationCSS;
document.head.appendChild(style);`;

        // Create the files
        this.createFile('/index.html', defaultHTML);
        this.createFile('/css/styles.css', defaultCSS);
        this.createFile('/js/app.js', defaultJS);
        
        // Create a README file
        const readmeContent = `# My Website Project

Welcome to your new website project! This is a starter template with modern HTML, CSS, and JavaScript.

## Project Structure

- \`index.html\` - Main HTML file
- \`css/styles.css\` - Stylesheet with modern design
- \`js/app.js\` - JavaScript functionality
- \`assets/\` - Folder for images and other assets

## Features

- Responsive design that works on all devices
- Smooth scrolling navigation
- Interactive contact form
- Modern CSS animations
- Cross-browser compatibility

## Getting Started

1. Edit the HTML content in \`index.html\`
2. Customize the styles in \`css/styles.css\`
3. Add your JavaScript functionality in \`js/app.js\`
4. Use the preview feature to see your changes live

Happy coding!`;

        this.createFile('/README.md', readmeContent);
        
        this.notifyWatchers('initialized');
    }
    
    createFile(path, content = '', type = 'file') {
        const normalizedPath = this.normalizePath(path);
        const file = {
            path: normalizedPath,
            content: content,
            type: type,
            created: new Date(),
            modified: new Date(),
            size: content.length
        };
        
        this.files.set(normalizedPath, file);
        this.notifyWatchers('file-created', file);
        return file;
    }
    
    createFolder(path) {
        const normalizedPath = this.normalizePath(path);
        const folder = {
            path: normalizedPath,
            type: 'folder',
            created: new Date(),
            children: new Set()
        };
        
        this.folders.set(normalizedPath, folder);
        this.notifyWatchers('folder-created', folder);
        return folder;
    }
    
    readFile(path) {
        const normalizedPath = this.normalizePath(path);
        return this.files.get(normalizedPath);
    }
    
    writeFile(path, content) {
        const normalizedPath = this.normalizePath(path);
        let file = this.files.get(normalizedPath);
        
        if (file) {
            file.content = content;
            file.modified = new Date();
            file.size = content.length;
            this.notifyWatchers('file-modified', file);
        } else {
            file = this.createFile(normalizedPath, content);
        }
        
        return file;
    }
    
    deleteFile(path) {
        const normalizedPath = this.normalizePath(path);
        const file = this.files.get(normalizedPath);
        
        if (file) {
            this.files.delete(normalizedPath);
            this.notifyWatchers('file-deleted', file);
            return true;
        }
        
        return false;
    }
    
    deleteFolder(path) {
        const normalizedPath = this.normalizePath(path);
        const folder = this.folders.get(normalizedPath);
        
        if (folder) {
            // Delete all files and subfolders in this folder
            this.getAllFiles().forEach(file => {
                if (file.path.startsWith(normalizedPath + '/')) {
                    this.files.delete(file.path);
                }
            });
            
            this.getAllFolders().forEach(subfolder => {
                if (subfolder.path.startsWith(normalizedPath + '/')) {
                    this.folders.delete(subfolder.path);
                }
            });
            
            this.folders.delete(normalizedPath);
            this.notifyWatchers('folder-deleted', folder);
            return true;
        }
        
        return false;
    }
    
    renameFile(oldPath, newPath) {
        const oldNormalizedPath = this.normalizePath(oldPath);
        const newNormalizedPath = this.normalizePath(newPath);
        const file = this.files.get(oldNormalizedPath);
        
        if (file) {
            file.path = newNormalizedPath;
            file.modified = new Date();
            this.files.delete(oldNormalizedPath);
            this.files.set(newNormalizedPath, file);
            this.notifyWatchers('file-renamed', { oldPath: oldNormalizedPath, newPath: newNormalizedPath, file });
            return true;
        }
        
        return false;
    }
    
    getAllFiles() {
        return Array.from(this.files.values());
    }
    
    getAllFolders() {
        return Array.from(this.folders.values());
    }
    
    getFilesByExtension(extension) {
        return this.getAllFiles().filter(file => 
            file.path.toLowerCase().endsWith('.' + extension.toLowerCase())
        );
    }
    
    getFilesInFolder(folderPath) {
        const normalizedPath = this.normalizePath(folderPath);
        return this.getAllFiles().filter(file => {
            const fileDir = this.getDirectoryPath(file.path);
            return fileDir === normalizedPath;
        });
    }
    
    getFoldersInFolder(folderPath) {
        const normalizedPath = this.normalizePath(folderPath);
        return this.getAllFolders().filter(folder => {
            const folderDir = this.getDirectoryPath(folder.path);
            return folderDir === normalizedPath;
        });
    }
    
    getFileTree() {
        const tree = { name: 'root', type: 'folder', path: '/', children: [] };
        const pathMap = new Map();
        pathMap.set('/', tree);
        
        // Add folders first
        this.getAllFolders().forEach(folder => {
            const parts = folder.path.split('/').filter(part => part);
            let currentPath = '';
            let currentNode = tree;
            
            parts.forEach((part, index) => {
                currentPath += '/' + part;
                
                if (!pathMap.has(currentPath)) {
                    const node = {
                        name: part,
                        type: 'folder',
                        path: currentPath,
                        children: []
                    };
                    
                    currentNode.children.push(node);
                    pathMap.set(currentPath, node);
                    currentNode = node;
                } else {
                    currentNode = pathMap.get(currentPath);
                }
            });
        });
        
        // Add files
        this.getAllFiles().forEach(file => {
            const directory = this.getDirectoryPath(file.path);
            const fileName = this.getFileName(file.path);
            const parentNode = pathMap.get(directory) || tree;
            
            parentNode.children.push({
                name: fileName,
                type: 'file',
                path: file.path,
                content: file.content,
                size: file.size,
                modified: file.modified
            });
        });
        
        // Sort children (folders first, then files, both alphabetically)
        function sortChildren(node) {
            node.children.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            
            node.children.forEach(child => {
                if (child.type === 'folder') {
                    sortChildren(child);
                }
            });
        }
        
        sortChildren(tree);
        return tree;
    }
    
    normalizePath(path) {
        // Normalize path to always start with / and remove double slashes
        let normalized = path.replace(/\\/g, '/');
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }
        return normalized.replace(/\/+/g, '/');
    }
    
    getDirectoryPath(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        const lastSlash = normalizedPath.lastIndexOf('/');
        return lastSlash > 0 ? normalizedPath.substring(0, lastSlash) : '/';
    }
    
    getFileName(filePath) {
        const normalizedPath = this.normalizePath(filePath);
        const lastSlash = normalizedPath.lastIndexOf('/');
        return normalizedPath.substring(lastSlash + 1);
    }
    
    getFileExtension(filePath) {
        const fileName = this.getFileName(filePath);
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1) : '';
    }
    
    watch(callback) {
        this.watchers.push(callback);
        return () => {
            const index = this.watchers.indexOf(callback);
            if (index > -1) {
                this.watchers.splice(index, 1);
            }
        };
    }
    
    notifyWatchers(event, data) {
        this.watchers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('File system watcher error:', error);
            }
        });
    }
    
    async exportProjectAsZip() {
        try {
            // Dynamically import JSZip
            const JSZip = await this.loadJSZip();
            const zip = new JSZip();
            
            // Add all files to zip
            this.getAllFiles().forEach(file => {
                // Remove leading slash for zip paths
                const zipPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
                
                // Handle different file types
                if (this.isBinaryFile(file.path)) {
                    // For binary files, convert from base64 if needed
                    if (file.content.startsWith('data:')) {
                        // Extract base64 data from data URL
                        const base64Data = file.content.split(',')[1];
                        zip.file(zipPath, base64Data, { base64: true });
                    } else {
                        // Assume it's already base64 encoded
                        zip.file(zipPath, file.content, { base64: true });
                    }
                } else {
                    // For text files, add as string
                    zip.file(zipPath, file.content);
                }
            });
            
            // Generate zip file
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            return zipBlob;
        } catch (error) {
            console.error('Failed to export project as ZIP:', error);
            throw error;
        }
    }

    async importProjectFromZip(zipFile) {
        try {
            // Dynamically import JSZip
            const JSZip = await this.loadJSZip();
            const zip = await JSZip.loadAsync(zipFile);
            
            // Clear existing files and folders
            this.files.clear();
            this.folders.clear();
            
            // Track folders to create
            const foldersToCreate = new Set();
            
            // Process each file in the zip
            const filePromises = [];
            
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    // Add leading slash for our file system
                    const filePath = '/' + relativePath;
                    
                    // Track parent folders
                    const parentPath = this.getDirectoryPath(filePath);
                    if (parentPath !== '/') {
                        const pathParts = parentPath.split('/').filter(part => part);
                        let currentPath = '';
                        pathParts.forEach(part => {
                            currentPath += '/' + part;
                            foldersToCreate.add(currentPath);
                        });
                    }
                    
                    // Process file based on type
                    if (this.isBinaryFile(filePath)) {
                        // Handle binary files
                        filePromises.push(
                            zipEntry.async('base64').then(content => {
                                // Create data URL for binary files
                                const mimeType = this.getMimeType(filePath);
                                const dataUrl = `data:${mimeType};base64,${content}`;
                                this.createFile(filePath, dataUrl);
                            })
                        );
                    } else {
                        // Handle text files
                        filePromises.push(
                            zipEntry.async('string').then(content => {
                                this.createFile(filePath, content);
                            })
                        );
                    }
                }
            });
            
            // Create folders first
            foldersToCreate.forEach(folderPath => {
                this.createFolder(folderPath);
            });
            
            // Wait for all files to be processed
            await Promise.all(filePromises);
            
            this.notifyWatchers('project-imported', { type: 'zip', fileCount: filePromises.length });
            return true;
        } catch (error) {
            console.error('Failed to import project from ZIP:', error);
            return false;
        }
    }

    async loadJSZip() {
        // Check if JSZip is already loaded
        if (window.JSZip) {
            return window.JSZip;
        }
        
        // Dynamically load JSZip
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => {
                if (window.JSZip) {
                    resolve(window.JSZip);
                } else {
                    reject(new Error('Failed to load JSZip'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
    }

    isBinaryFile(filePath) {
        const binaryExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp',
            '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.avi', '.mov',
            '.pdf', '.zip', '.rar', '.tar', '.gz', '.7z',
            '.exe', '.dll', '.so', '.dylib',
            '.ttf', '.otf', '.woff', '.woff2', '.eot',
            '.psd', '.ai', '.sketch', '.fig'
        ];
        
        const extension = this.getFileExtension(filePath).toLowerCase();
        return binaryExtensions.includes('.' + extension);
    }

    getMimeType(filePath) {
        const extension = this.getFileExtension(filePath).toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon',
            'webp': 'image/webp',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'webm': 'video/webm',
            'pdf': 'application/pdf',
            'zip': 'application/zip',
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'woff': 'font/woff',
            'woff2': 'font/woff2'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }

    // Update existing exportProject method to use ZIP by default
    exportProject() {
        return this.exportProjectAsZip();
    }

    // Update existing importProject method to handle both ZIP and JSON
    async importProject(data) {
        if (data instanceof File || data instanceof Blob) {
            // It's a ZIP file
            return await this.importProjectFromZip(data);
        } else {
            // It's JSON string (legacy format)
            return this.importProjectFromJSON(data);
        }
    }

    importProjectFromJSON(projectData) {
        try {
            const project = JSON.parse(projectData);
            
            // Clear existing files and folders
            this.files.clear();
            this.folders.clear();
            
            // Import folders
            if (project.folders) {
                project.folders.forEach(folder => {
                    this.folders.set(folder.path, folder);
                });
            }
            
            // Import files
            if (project.files) {
                project.files.forEach(file => {
                    this.files.set(file.path, file);
                });
            }
            
            this.notifyWatchers('project-imported', project);
            return true;
        } catch (error) {
            console.error('Failed to import project from JSON:', error);
            return false;
        }
    }
}

// Create global file system instance
window.fileSystem = new FileSystem();
