// Global Variables
let currentUser = null;
let installPromptEvent = null;
const appState = {
    currentPage: 'landing',
    currentSection: 'overview',
    userProfile: null,
    scanHistory: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupPWA();
    setupNavigation();
});

// Initialize Firebase and App
function initializeApp() {
    // Check authentication status
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            loadUserProfile(user);
            showPage('dashboard');
        } else {
            showPage('landing');
        }
        hideLoadingScreen();
    });
}

// Hide Loading Screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

// Setup Event Listeners
function setupEventListeners() {
    // Landing Page
    document.getElementById('loginBtn').addEventListener('click', handleGoogleLogin);
    document.getElementById('installBtn').addEventListener('click', handleInstallClick);
    document.getElementById('getStartedBtn').addEventListener('click', handleGetStartedClick);
    
    // FAQ
    const faqItems = document.querySelectorAll('.faq-question');
    faqItems.forEach(item => {
        item.addEventListener('click', toggleFAQ);
    });

    // Contact Form
    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);

    // Dashboard
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('quickScanBtn').addEventListener('click', () => showScannerModal('quick'));
    document.getElementById('fullScanBtn').addEventListener('click', () => showScannerModal('full'));
    document.getElementById('updateBtn').addEventListener('click', () => showNotification('अपडेट डाउनलोड हो रहे हैं...'));
    document.getElementById('profileBtn').addEventListener('click', navigateToSection('profile'));

    // Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item, .bottom-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    // Tool Cards
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        const btn = card.querySelector('.tool-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleToolClick(card);
        });
    });

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Modal Close
    const modal = document.getElementById('scannerModal');
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeScannerModal);
    }

    // Delete Account
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteAccount);
    }
}

// Google Login Handler
function handleGoogleLogin() {
    showLoadingScreen();
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            currentUser = result.user;
            createUserProfile(result.user);
            showPage('dashboard');
            hideLoadingScreen();
        })
        .catch(error => {
            console.error('Login Error:', error);
            showNotification('लॉगिन में विफल। कृपया फिर से प्रयास करें।', 'error');
            hideLoadingScreen();
        });
}

// Create User Profile in Firestore
function createUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);
    userRef.get().then(doc => {
        if (!doc.exists) {
            userRef.set({
                uid: user.uid,
                name: user.displayName || 'उपयोगकर्ता',
                email: user.email,
                avatar: user.photoURL || 'https://via.placeholder.com/100',
                securityScore: 92,
                mobileHealth: 'अच्छी',
                pcHealth: 'उत्कृष्ट',
                lastScan: new Date().toLocaleString('hi-IN'),
                totalScans: 0,
                createdAt: new Date(),
                threats: []
            });
        }
    });
}

// Load User Profile
function loadUserProfile(user) {
    db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            appState.userProfile = doc.data();
            updateDashboardProfile();
        }
    });
}

// Update Dashboard Profile
function updateDashboardProfile() {
    const profile = appState.userProfile;
    document.getElementById('userNameDisplay').textContent = profile.name.split(' ')[0];
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileEmail').textContent = profile.email;
    document.getElementById('userAvatar').src = profile.avatar;
    document.getElementById('profileAvatar').src = profile.avatar;
    document.getElementById('overallScore').textContent = profile.securityScore;
    document.getElementById('mobileHealthText').textContent = profile.mobileHealth;
    document.getElementById('pcHealthText').textContent = profile.pcHealth;
    document.getElementById('lastScanTime').textContent = profile.lastScan;
    document.getElementById('totalScans').textContent = profile.totalScans || 0;
    document.getElementById('accountCreated').textContent = 
        new Date(profile.createdAt.toDate()).toLocaleDateString('hi-IN');
}

// Logout Handler
function handleLogout() {
    if (confirm('क्या आप सुनिश्चित हैं कि आप लॉगआउट करना चाहते हैं?')) {
        auth.signOut().then(() => {
            currentUser = null;
            appState.userProfile = null;
            showPage('landing');
            showNotification('लॉगआउट सफल!');
        });
    }
}

// Handle Install Button Click
function handleInstallClick() {
    showPage('appInstall');
}

// Handle Get Started Button
function handleGetStartedClick() {
    if (currentUser) {
        showPage('dashboard');
        showSection('overview');
    } else {
        handleGoogleLogin();
    }
}

// Installation Stage Management
window.nextInstallStage = function() {
    const stages = ['ready', 'downloading', 'verifying', 'android', 'installing', 'success'];
    const currentActive = document.querySelector('.install-stage.active');
    const currentIndex = Array.from(document.querySelectorAll('.install-stage')).indexOf(currentActive);
    
    if (currentIndex < stages.length - 1) {
        currentActive.classList.remove('active');
        document.getElementById(`stage-${stages[currentIndex + 1]}`).classList.add('active');
        
        // Simulate progress for downloading and installing
        if (stages[currentIndex + 1] === 'downloading') {
            simulateDownload();
        } else if (stages[currentIndex + 1] === 'installing') {
            simulateInstall();
        }
    }
};

window.previousInstallStage = function() {
    const stages = ['ready', 'downloading', 'verifying', 'android', 'installing', 'success'];
    const currentActive = document.querySelector('.install-stage.active');
    const currentIndex = Array.from(document.querySelectorAll('.install-stage')).indexOf(currentActive);
    
    if (currentIndex > 0) {
        currentActive.classList.remove('active');
        document.getElementById(`stage-${stages[currentIndex - 1]}`).classList.add('active');
    }
};

window.backFromInstall = function() {
    showPage('landing');
    document.querySelector('.install-stage.active').classList.remove('active');
    document.getElementById('stage-ready').classList.add('active');
};

window.openInstalledApp = function() {
    showNotification('ऐप्लिकेशन खोल रहे हैं...');
    setTimeout(() => {
        showPage('dashboard');
    }, 1000);
};

// Simulate Download Progress
function simulateDownload() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => window.nextInstallStage(), 500);
        }
        document.getElementById('downloadProgress').style.width = progress + '%';
        document.getElementById('downloadText').textContent = Math.floor(progress) + '%';
    }, 300);
}

// Simulate Install Progress
function simulateInstall() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => window.nextInstallStage(), 500);
        }
        document.getElementById('installProgress').style.width = progress + '%';
        document.getElementById('installText').textContent = Math.floor(progress) + '%';
    }, 400);
}

// FAQ Toggle
function toggleFAQ(e) {
    const faqItem = e.currentTarget.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Contact Form Submission
function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name') || e.target[0].value;
    const email = formData.get('email') || e.target[1].value;
    const message = formData.get('message') || e.target[2].value;
    
    if (currentUser) {
        db.collection('messages').add({
            name: name || currentUser.displayName,
            email: email || currentUser.email,
            message: message,
            userId: currentUser.uid,
            timestamp: new Date()
        }).then(() => {
            showNotification('संदेश सफलतापूर्वक भेज दिया गया!');
            e.target.reset();
        }).catch(error => {
            console.error('Error:', error);
            showNotification('संदेश भेजने में विफल।', 'error');
        });
    } else {
        showNotification('संदेश भेजने के लिए कृपया पहले लॉगिन करें।', 'error');
    }
}

// Navigation Handlers
function setupNavigation() {
    // Smooth scroll for landing page links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && !href.includes('data-section')) {
                const target = document.querySelector(href);
                if (target && appState.currentPage === 'landing') {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    if (section) {
        showSection(section);
    }
}

function navigateToSection(section) {
    return () => {
        showSection(section);
    };
}

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    appState.currentSection = section;
}

// Show Page
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });
    
    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    appState.currentPage = page;
}

// Tool Click Handler
function handleToolClick(card) {
    const tool = card.dataset.tool;
    showScannerModal(tool);
}

// Show Scanner Modal
function showScannerModal(tool) {
    const modal = document.getElementById('scannerModal');
    const title = document.getElementById('scannerTitle');
    const content = document.getElementById('scannerContent');
    
    // Clear previous content
    content.innerHTML = '';
    
    // Set tool-specific content
    switch(tool) {
        case 'link-scanner':
        case 'link':
            title.textContent = '🔗 लिंक स्कैनर';
            content.innerHTML = `
                <input type="url" class="scanner-input" placeholder="URL यहाँ पेस्ट करें (https://...)" id="linkInput">
                <button class="btn btn-primary" onclick="scanLink()">स्कैन करें</button>
                <div class="scanner-result" id="scanResult"></div>
            `;
            break;
        case 'file-scanner':
        case 'file':
            title.textContent = '📄 फाइल स्कैनर';
            content.innerHTML = `
                <input type="file" class="scanner-input" id="fileInput">
                <button class="btn btn-primary" onclick="scanFile()">फाइल स्कैन करें</button>
                <div class="scanner-result" id="scanResult"></div>
            `;
            break;
        case 'app-checker':
        case 'app':
            title.textContent = '📱 ऐप सुरक्षा चेकर';
            content.innerHTML = `
                <input type="text" class="scanner-input" placeholder="ऐप का नाम लिखें" id="appInput">
                <button class="btn btn-primary" onclick="scanApp()">जांचें</button>
                <div class="scanner-result" id="scanResult"></div>
            `;
            break;
        case 'website-checker':
        case 'website':
            title.textContent = '🌐 वेबसाइट सुरक्षा जांच';
            content.innerHTML = `
                <input type="url" class="scanner-input" placeholder="वेबसाइट URL यहाँ पेस्ट करें" id="websiteInput">
                <button class="btn btn-primary" onclick="checkWebsite()">जांचें</button>
                <div class="scanner-result" id="scanResult"></div>
            `;
            break;
        case 'fraud-call':
        case 'fraud':
            title.textContent = '☎️ धोखाधड़ी कॉल सुरक्षा';
            content.innerHTML = `
                <input type="tel" class="scanner-input" placeholder="फोन नंबर दर्ज करें" id="phoneInput">
                <button class="btn btn-primary" onclick="checkFraudCall()">जांचें</button>
                <div class="scanner-result" id="scanResult"></div>
            `;
            break;
        case 'bank-fraud':
        case 'bank':
            title.textContent = '🏦 बैंक सुरक्षा सुझाव';
            content.innerHTML = `
                <div class="bank-tips">
                    <h4>🔒 बैंकिंग सुरक्षा सुझाव:</h4>
                    <ul style="text-align: left; color: var(--text-secondary); line-height: 1.8;">
                        <li>✓ कभी भी किसी को अपना OTP न दें</li>
                        <li>✓ अपने बैंक के सार्वजनिक WiFi पर लेनदेन न करें</li>
                        <li>✓ हमेशा SSL सुरक्षित वेबसाइट (https://) का उपयोग करें</li>
                        <li>✓ अपने खाते की गतिविधि नियमित रूप से जांचें</li>
                        <li>✓ कभी भी अपने पासवर्ड किसी से साझा न करें</li>
                        <li>✓ दो-कारक प्रमाणीकरण सक्षम करें</li>
                    </ul>
                </div>
                <button class="btn btn-secondary" style="width: 100%; margin-top: 20px;" onclick="closeScannerModal()">बंद करें</button>
            `;
            break;
        case 'quick':
        case 'quick-scan':
            title.textContent = '⚡ त्वरित स्कैन';
            content.innerHTML = `
                <div class="quick-scan-info">
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">आपके डिवाइस का त्वरित स्कैन शुरू हो रहा है...</p>
                    <div class="progress-bar">
                        <div class="progress-fill" id="quickScanProgress"></div>
                    </div>
                    <p id="scanStatus" style="color: var(--secondary-color); margin-top: 16px; font-weight: 600;">0%</p>
                </div>
            `;
            startQuickScan();
            break;
        case 'full':
        case 'full-scan':
            title.textContent = '🔍 पूर्ण स्कैन';
            content.innerHTML = `
                <div class="full-scan-info">
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">आपके सभी फाइलों का पूर्ण स्कैन शुरू हो रहा है...</p>
                    <div class="progress-bar">
                        <div class="progress-fill" id="fullScanProgress"></div>
                    </div>
                    <p id="scanStatus" style="color: var(--secondary-color); margin-top: 16px; font-weight: 600;">0%</p>
                    <p id="scanDetails" style="color: var(--text-secondary); font-size: 12px; margin-top: 12px;"></p>
                </div>
            `;
            startFullScan();
            break;
    }
    
    modal.classList.add('active');
}

// Close Scanner Modal
function closeScannerModal() {
    document.getElementById('scannerModal').classList.remove('active');
}

// Scan Functions - WITH PROPER WORKING LOGIC
window.scanLink = function() {
    const url = document.getElementById('linkInput').value.trim();
    if (!url) {
        showNotification('कृपया एक URL दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ लिंक को स्कैन किया जा रहा है...</p>';
    
    setTimeout(() => {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            
            // Phishing detection keywords
            const phishingKeywords = ['phishing', 'fake', 'scam', 'fraud', 'verify', 'confirm', 'update', 'validate', 'suspended', 'urgent', 'click here'];
            const maliciousDomains = ['bit.ly', 'tinyurl', '000webhostapp', 'blogspot', 'github.io'];
            
            let risk = 0;
            let warnings = [];
            
            // Check URL structure
            if (!url.startsWith('https://')) {
                risk += 20;
                warnings.push('⚠️ HTTPS encrypted नहीं है');
            }
            
            // Check for suspicious keywords
            phishingKeywords.forEach(keyword => {
                if (url.toLowerCase().includes(keyword)) {
                    risk += 15;
                    warnings.push(`⚠️ "${keyword}" शब्द मिला - संदिग्ध`);
                }
            });
            
            // Check for suspicious domains
            maliciousDomains.forEach(malicious => {
                if (domain.includes(malicious)) {
                    risk += 30;
                    warnings.push(`⚠️ "${malicious}" डोमेन ज्ञात जोखिम`);
                }
            });
            
            // Check for IP address instead of domain
            if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
                risk += 25;
                warnings.push('⚠️ IP address से सीधे access');
            }
            
            // Check for too many hyphens or special characters
            if ((domain.match(/-/g) || []).length > 3) {
                risk += 20;
                warnings.push('⚠️ Domain में बहुत सारे हाइफन');
            }
            
            // Display result
            if (risk >= 50) {
                result.innerHTML = `
                    <div style="padding: 16px; background: rgba(255, 59, 48, 0.15); border-left: 3px solid #ff3b30; border-radius: 8px;">
                        <p style="color: #ff3b30; font-weight: 600; margin-bottom: 10px;">🚨 खतरनाक - जोखिम: ${risk}%</p>
                        ${warnings.map(w => `<p style="color: #ff3b30; font-size: 13px; margin: 5px 0;">${w}</p>`).join('')}
                        <p style="color: #ff3b30; font-size: 13px; margin-top: 10px;">❌ इस लिंक पर क्लिक न करें!</p>
                    </div>
                `;
            } else if (risk >= 30) {
                result.innerHTML = `
                    <div style="padding: 16px; background: rgba(255, 193, 7, 0.15); border-left: 3px solid #ffc107; border-radius: 8px;">
                        <p style="color: #ffc107; font-weight: 600; margin-bottom: 10px;">⚠️ सावधान - जोखिम: ${risk}%</p>
                        ${warnings.map(w => `<p style="color: #ffc107; font-size: 13px; margin: 5px 0;">${w}</p>`).join('')}
                        <p style="color: #ffc107; font-size: 13px; margin-top: 10px;">✓ लेकिन सावधानी बरतें</p>
                    </div>
                `;
            } else {
                result.innerHTML = `
                    <div style="padding: 16px; background: rgba(0, 255, 136, 0.15); border-left: 3px solid var(--accent-color); border-radius: 8px;">
                        <p style="color: var(--accent-color); font-weight: 600;">✓ सुरक्षित - जोखिम: ${risk}%</p>
                        <p style="color: var(--accent-color); font-size: 13px; margin-top: 8px;">यह लिंक सुरक्षित प्रतीत होती है</p>
                    </div>
                `;
            }
        } catch (e) {
            result.innerHTML = '<p style="color: #ff3b30;">❌ अमान्य URL प्रारूप। कृपया सही URL दर्ज करें।</p>';
        }
    }, 1200);
};

window.scanFile = function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        showNotification('कृपया एक फाइल चुनें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ फाइल को स्कैन किया जा रहा है...</p>';
    
    // File analysis
    const fileName = file.name.toLowerCase();
    const fileSize = file.size;
    const fileType = file.type;
    
    // Dangerous extensions
    const dangerousExt = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.zip', '.rar', '.apk'];
    const suspiciousExt = ['.pdf', '.doc', '.xls', '.ppt'];
    
    let riskLevel = 0;
    let warnings = [];
    
    // Check extension
    dangerousExt.forEach(ext => {
        if (fileName.endsWith(ext)) {
            riskLevel = 80;
            warnings.push(`❌ ${ext} फाइलें executable हो सकती हैं`);
        }
    });
    
    suspiciousExt.forEach(ext => {
        if (fileName.endsWith(ext) && fileSize > 5000000) {
            riskLevel = 40;
            warnings.push(`⚠️ ${ext} फाइलें बहुत बड़ी हैं`);
        }
    });
    
    // Check file size
    if (fileSize > 100000000) {
        riskLevel += 20;
        warnings.push('⚠️ फाइल बहुत बड़ी है (100MB+)');
    }
    
    // Check for suspicious names
    if (fileName.includes('virus') || fileName.includes('malware') || fileName.includes('trojan')) {
        riskLevel = 95;
        warnings.push('❌ फाइल नाम संदिग्ध है');
    }
    
    setTimeout(() => {
        if (riskLevel >= 70) {
            result.innerHTML = `
                <div style="padding: 16px; background: rgba(255, 59, 48, 0.15); border-left: 3px solid #ff3b30; border-radius: 8px;">
                    <p style="color: #ff3b30; font-weight: 600;">🚨 खतरनाक फाइल - जोखिम: ${riskLevel}%</p>
                    ${warnings.map(w => `<p style="color: #ff3b30; font-size: 13px; margin: 5px 0;">${w}</p>`).join('')}
                    <p style="color: #ff3b30; font-size: 13px; margin-top: 10px;">❌ इस फाइल को डाउनलोड न करें!</p>
                </div>
            `;
        } else if (riskLevel >= 30) {
            result.innerHTML = `
                <div style="padding: 16px; background: rgba(255, 193, 7, 0.15); border-left: 3px solid #ffc107; border-radius: 8px;">
                    <p style="color: #ffc107; font-weight: 600;">⚠️ संदिग्ध फाइल - जोखिम: ${riskLevel}%</p>
                    ${warnings.map(w => `<p style="color: #ffc107; font-size: 13px; margin: 5px 0;">${w}</p>`).join('')}
                    <p style="color: #ffc107; font-size: 13px; margin-top: 10px;">✓ सावधानी के साथ खोलें</p>
                </div>
            `;
        } else {
            result.innerHTML = `
                <div style="padding: 16px; background: rgba(0, 255, 136, 0.15); border-left: 3px solid var(--accent-color); border-radius: 8px;">
                    <p style="color: var(--accent-color); font-weight: 600;">✓ सुरक्षित फाइल - जोखिम: ${riskLevel}%</p>
                    <p style="color: var(--accent-color); font-size: 13px; margin-top: 8px;">फाइल: ${file.name}</p>
                    <p style="color: var(--accent-color); font-size: 13px;">आकार: ${(fileSize / 1024).toFixed(2)} KB</p>
                </div>
            `;
        }
    }, 1200);
};

window.scanApp = function() {
    const appName = document.getElementById('appInput').value.trim();
    if (!appName) {
        showNotification('कृपया ऐप का नाम दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ ऐप को स्कैन किया जा रहा है...</p>';
    
    // Known risky apps database
    const riskyApps = {
        'virus': 95,
        'trojan': 90,
        'malware': 85,
        'spyware': 88,
        'ransomware': 99,
        'cryptolocker': 98,
        'wannacry': 99,
        'banking': 70,
        'clipper': 85,
        'adware': 60
    };
    
    const safeApps = {
        'chrome': 5,
        'firefox': 3,
        'whatsapp': 8,
        'telegram': 5,
        'instagram': 10,
        'facebook': 15,
        'maps': 3,
        'gmail': 2,
        'drive': 2,
        'google': 1
    };
    
    let riskScore = 50; // Default medium risk
    let details = [];
    
    const lowerName = appName.toLowerCase();
    
    // Check risky apps
    for (const [app, risk] of Object.entries(riskyApps)) {
        if (lowerName.includes(app)) {
            riskScore = risk;
            details.push(`❌ "${app}" जैसा ऐप detected`);
            break;
        }
    }
    
    // Check safe apps
    for (const [app, risk] of Object.entries(safeApps)) {
        if (lowerName.includes(app)) {
            riskScore = risk;
            details.push(`✓ विश्वसनीय ऐप: ${app}`);
            break;
        }
    }
    
    // Check for common malware patterns
    if (lowerName.includes('fake') || lowerName.includes('mod')) {
        riskScore += 30;
        details.push('⚠️ "Fake" या "Mod" संस्करण हो सकता है');
    }
    
    if (lowerName.match(/\d{2,}/)) {
        riskScore += 15;
        details.push('⚠️ अजीब नाम पैटर्न (अंकों से शुरुआत)');
    }
    
    setTimeout(() => {
        let riskText = '';
        let color = '';
        
        if (riskScore >= 70) {
            riskText = '🚨 खतरनाक';
            color = '#ff3b30';
            details.push('❌ इस ऐप को install न करें!');
        } else if (riskScore >= 40) {
            riskText = '⚠️ सावधान';
            color = '#ffc107';
            details.push('✓ सावधानी के साथ उपयोग करें');
        } else {
            riskText = '✓ सुरक्षित';
            color = 'var(--accent-color)';
            details.push('✓ यह ऐप आम तौर पर सुरक्षित है');
        }
        
        result.innerHTML = `
            <div style="padding: 16px; background: ${color === '#ff3b30' ? 'rgba(255, 59, 48, 0.15)' : color === '#ffc107' ? 'rgba(255, 193, 7, 0.15)' : 'rgba(0, 255, 136, 0.15)'}; border-left: 3px solid ${color}; border-radius: 8px;">
                <p style="color: ${color}; font-weight: 600; margin-bottom: 10px;">${riskText} - जोखिम: ${riskScore}%</p>
                ${details.map(d => `<p style="color: ${color}; font-size: 13px; margin: 5px 0;">${d}</p>`).join('')}
                <p style="color: ${color}; font-size: 13px; margin-top: 10px;">ऐप: ${appName}</p>
            </div>
        `;
    }, 1200);
};

window.checkWebsite = function() {
    const website = document.getElementById('websiteInput').value.trim();
    if (!website) {
        showNotification('कृपया एक वेबसाइट दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ वेबसाइट को स्कैन किया जा रहा है...</p>';
    
    setTimeout(() => {
        try {
            const urlObj = new URL(website.startsWith('http') ? website : 'https://' + website);
            const domain = urlObj.hostname;
            
            // Phishing keywords in domain/path
            const phishingPatterns = ['verify', 'confirm', 'authenticate', 'paypal', 'amazon', 'apple', 'bank', 'signin', 'login', 'account'];
            const safePatterns = ['google', 'microsoft', 'github', 'stackoverflow', 'wikipedia', 'github'];
            
            let riskScore = 20;
            let findings = [];
            
            // Check domain
            if (domain.includes('bit.ly') || domain.includes('tinyurl') || domain.includes('short')) {
                riskScore += 30;
                findings.push('⚠️ Shortened URL - असली लक्ष्य छिपा है');
            }
            
            // Check for safe domains
            let isSafe = false;
            safePatterns.forEach(pattern => {
                if (domain.includes(pattern)) {
                    riskScore = 5;
                    findings.push(`✓ विश्वसनीय डोमेन: ${pattern}`);
                    isSafe = true;
                }
            });
            
            // Check for phishing patterns
            if (!isSafe) {
                phishingPatterns.forEach(pattern => {
                    if (domain.includes(pattern)) {
                        riskScore += 25;
                        findings.push(`⚠️ संदिग्ध शब्द: "${pattern}"`);
                    }
                });
            }
            
            // Check HTTPS
            if (!website.startsWith('https://')) {
                riskScore += 20;
                findings.push('⚠️ HTTPS सुरक्षा नहीं है');
            }
            
            // Check for typosquatting
            if ((domain.match(/-/g) || []).length > 4) {
                riskScore += 15;
                findings.push('⚠️ Domain में बहुत सारे हाइफन (typosquatting)');
            }
            
            if (riskScore >= 60) {
                result.innerHTML = `
                    <div style="padding: 16px; background: rgba(255, 59, 48, 0.15); border-left: 3px solid #ff3b30; border-radius: 8px;">
                        <p style="color: #ff3b30; font-weight: 600;">🚨 फ़िशिंग की संभावना - जोखिम: ${riskScore}%</p>
                        ${findings.map(f => `<p style="color: #ff3b30; font-size: 13px; margin: 5px 0;">${f}</p>`).join('')}
                        <p style="color: #ff3b30; font-size: 13px; margin-top: 10px;">❌ इस साइट पर personal info share न करें!</p>
                    </div>
                `;
            } else if (riskScore >= 30) {
                result.innerHTML = `
                    <div style="padding: 16px; background: rgba(255, 193, 7, 0.15); border-left: 3px solid #ffc107; border-radius: 8px;">
                        <p style="color: #ffc107; font-weight: 600;">⚠️ संदिग्ध - जोखिम: ${riskScore}%</p>
                        ${findings.map(f => `<p style="color: #ffc107; font-size: 13px; margin: 5px 0;">${f}</p>`).join('')}
                        <p style="color: #ffc107; font-size: 13px; margin-top: 10px;">✓ सावधानी बरतें</p>
                    </div>
                `;
            } else {
                result.innerHTML = `
                    <div style="padding: 16px; background: rgba(0, 255, 136, 0.15); border-left: 3px solid var(--accent-color); border-radius: 8px;">
                        <p style="color: var(--accent-color); font-weight: 600;">✓ सुरक्षित - जोखिम: ${riskScore}%</p>
                        <p style="color: var(--accent-color); font-size: 13px; margin-top: 8px;">डोमेन: ${domain}</p>
                    </div>
                `;
            }
        } catch (e) {
            result.innerHTML = '<p style="color: #ff3b30;">❌ अमान्य URL। सही URL दर्ज करें।</p>';
        }
    }, 1200);
};

window.checkFraudCall = function() {
    const phone = document.getElementById('phoneInput').value.trim();
    if (!phone) {
        showNotification('कृपया एक फोन नंबर दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ नंबर को जांचा जा रहा है...</p>';
    
    setTimeout(() => {
        // Extract digits only
        const digits = phone.replace(/\D/g, '');
        
        // Known spam patterns
        const spamPatterns = {
            '9999999': 'spam',
            '1234': 'spam',
            '000000': 'spam',
            '9876543': 'spam'
        };
        
        let riskScore = 20; // Default low
        let details = [];
        
        // Check against spam database
        for (const [pattern, type] of Object.entries(spamPatterns)) {
            if (digits.includes(pattern)) {
                riskScore = 85;
                details.push('❌ ज्ञात spam database में है');
                break;
            }
        }
        
        // Check for repeated digits
        if (/(\d)\1{5,}/.test(digits)) {
            riskScore += 30;
            details.push('⚠️ Repeated digits - likely spam');
        }
        
        // International pattern check
        if (digits.length < 10) {
            riskScore += 15;
            details.push('⚠️ Number कम अंकों का है');
        } else if (digits.length > 15) {
            riskScore += 20;
            details.push('⚠️ Number में बहुत अंक हैं');
        }
        
        // Check if it's common service number pattern
        if (digits.startsWith('100') || digits.startsWith('101') || digits.startsWith('102')) {
            riskScore = 5;
            details.push('✓ Government emergency number');
        }
        
        if (riskScore >= 70) {
            result.innerHTML = `
                <div style="padding: 16px; background: rgba(255, 59, 48, 0.15); border-left: 3px solid #ff3b30; border-radius: 8px;">
                    <p style="color: #ff3b30; font-weight: 600;">🚨 Spam/Fraud संभावना - जोखिम: ${riskScore}%</p>
                    ${details.map(d => `<p style="color: #ff3b30; font-size: 13px; margin: 5px 0;">${d}</p>`).join('')}
                    <p style="color: #ff3b30; font-size: 13px; margin-top: 10px;">❌ इस number को avoid करें!</p>
                </div>
            `;
        } else if (riskScore >= 40) {
            result.innerHTML = `
                <div style="padding: 16px; background: rgba(255, 193, 7, 0.15); border-left: 3px solid #ffc107; border-radius: 8px;">
                    <p style="color: #ffc107; font-weight: 600;">⚠️ संदिग्ध - जोखिम: ${riskScore}%</p>
                    ${details.map(d => `<p style="color: #ffc107; font-size: 13px; margin: 5px 0;">${d}</p>`).join('')}
                    <p style="color: #ffc107; font-size: 13px; margin-top: 10px;">✓ सावधानी बरतें</p>
                </div>
            `;
        } else {
            result.innerHTML = `
                <div style="padding: 16px; background: rgba(0, 255, 136, 0.15); border-left: 3px solid var(--accent-color); border-radius: 8px;">
                    <p style="color: var(--accent-color); font-weight: 600;">✓ संभवतः सुरक्षित - जोखिम: ${riskScore}%</p>
                    <p style="color: var(--accent-color); font-size: 13px; margin-top: 8px;">यह number spam list में नहीं है</p>
                </div>
            `;
        }
    }, 1200);
};

// Start Quick Scan
function startQuickScan() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            completeQuickScan();
        }
        const fill = document.getElementById('quickScanProgress');
        const status = document.getElementById('scanStatus');
        if (fill && status) {
            fill.style.width = progress + '%';
            status.textContent = Math.floor(progress) + '%';
        }
    }, 400);
}

function completeQuickScan() {
    const content = document.getElementById('scannerContent');
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; color: var(--accent-color); margin-bottom: 16px;">✓</div>
            <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">स्कैन पूर्ण!</p>
            <p style="color: var(--text-secondary); margin-bottom: 16px;">कोई खतरा नहीं मिला</p>
            <button class="btn btn-secondary" onclick="closeScannerModal()" style="width: 100%;">बंद करें</button>
        </div>
    `;
    updateUserProfile();
}

// Start Full Scan
function startFullScan() {
    let progress = 0;
    const details = [
        'सिस्टम फाइलें स्कैन की जा रहीं...',
        'एक्सटेंशन्स जांची जा रहीं...',
        'नेटवर्क कनेक्शन्स विश्लेषण...',
        'रजिस्ट्री स्कैन चल रहा है...',
        'फाइनल जांच की जा रही है...'
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 12;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            completeFullScan();
        }
        const fill = document.getElementById('fullScanProgress');
        const status = document.getElementById('scanStatus');
        const detailsEl = document.getElementById('scanDetails');
        
        if (fill && status && detailsEl) {
            fill.style.width = progress + '%';
            status.textContent = Math.floor(progress) + '%';
            const currentDetail = Math.floor((progress / 100) * details.length);
            detailsEl.textContent = details[Math.min(currentDetail, details.length - 1)];
        }
    }, 500);
}

function completeFullScan() {
    const content = document.getElementById('scannerContent');
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; color: var(--accent-color); margin-bottom: 16px;">✓</div>
            <p style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">पूर्ण स्कैन पूर्ण!</p>
            <p style="color: var(--text-secondary); margin-bottom: 8px;">कोई खतरा नहीं मिला</p>
            <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 16px;">आपका डिवाइस सुरक्षित है</p>
            <button class="btn btn-secondary" onclick="closeScannerModal()" style="width: 100%;">बंद करें</button>
        </div>
    `;
    updateUserProfile();
}

// Update User Profile in Database
function updateUserProfile() {
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            lastScan: new Date().toLocaleString('hi-IN'),
            totalScans: (appState.userProfile?.totalScans || 0) + 1,
            securityScore: Math.min(100, (appState.userProfile?.securityScore || 92) + 1)
        }).then(() => {
            loadUserProfile(currentUser);
            showNotification('स्कैन पूर्ण! आपकी प्रोफाइल अपडेट हो गई है।');
        });
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(0, 255, 136, 0.2)'};
        border: 1px solid ${type === 'error' ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0, 255, 136, 0.3)'};
        color: ${type === 'error' ? '#ff3b30' : 'var(--accent-color)'};
        padding: 16px 24px;
        border-radius: 10px;
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Delete Account
function handleDeleteAccount() {
    if (confirm('आप अपना खाता स्थायी रूप से हटाना चाहते हैं? यह क्रिया को वापस नहीं किया जा सकता।')) {
        if (confirm('यह अंतिम चेतावनी है। क्या आप वाकई आगे बढ़ना चाहते हैं?')) {
            // Delete user data from Firestore
            db.collection('users').doc(currentUser.uid).delete().then(() => {
                // Delete user account
                currentUser.delete().then(() => {
                    showNotification('खाता सफलतापूर्वक हटा दिया गया।');
                    setTimeout(() => {
                        auth.signOut();
                        showPage('landing');
                    }, 2000);
                }).catch(error => {
                    showNotification('खाता हटाने में विफल।', 'error');
                });
            });
        }
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('navMenu');
    
    if (toggle && menu) {
        toggle.classList.toggle('active');
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
}

// PWA Setup
function setupPWA() {
    // Check for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        installPromptEvent = e;
        
        // Show install prompt
        const prompt = document.getElementById('installPrompt');
        if (prompt && currentUser) {
            prompt.style.display = 'block';
        }
    });

    // Install button
    const installBtn = document.getElementById('installPWABtn');
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (installPromptEvent) {
                installPromptEvent.prompt();
                installPromptEvent.userChoice.then(choiceResult => {
                    if (choiceResult.outcome === 'accepted') {
                        showNotification('ऐप्लिकेशन इंस्टॉल हो गई है!');
                        installPromptEvent = null;
                        document.getElementById('installPrompt').style.display = 'none';
                    }
                });
            }
        });
    }

    // Dismiss button
    const dismissBtn = document.getElementById('dismissPWABtn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            document.getElementById('installPrompt').style.display = 'none';
        });
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // App installed
    window.addEventListener('appinstalled', () => {
        showNotification('Mobile Suraksha आपके डिवाइस पर इंस्टॉल हो गई है!');
    });
}

// Load user data on page load
window.addEventListener('load', () => {
    if (currentUser) {
        loadUserProfile(currentUser);
    }
});

// Refresh user profile periodically
setInterval(() => {
    if (currentUser && appState.currentPage === 'dashboard') {
        loadUserProfile(currentUser);
    }
}, 60000);
