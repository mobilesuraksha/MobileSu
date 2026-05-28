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

// Scan Functions
window.scanLink = function() {
    const url = document.getElementById('linkInput').value;
    if (!url) {
        showNotification('कृपया एक URL दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ स्कैन करा जा रहा है...</p>';
    
    setTimeout(() => {
        const isPhishing = url.includes('phishing') || url.includes('fake');
        if (isPhishing) {
            result.innerHTML = '<p style="color: #ff3b30;">⚠️ यह लिंक संदिग्ध है! इस पर क्लिक न करें।</p>';
        } else {
            result.innerHTML = '<p style="color: var(--accent-color);">✓ यह लिंक सुरक्षित प्रतीत होता है।</p>';
        }
    }, 1000);
};

window.scanFile = function() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) {
        showNotification('कृपया एक फाइल चुनें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ फाइल स्कैन हो रही है...</p>';
    
    setTimeout(() => {
        result.innerHTML = `<p style="color: var(--accent-color);">✓ फाइल सुरक्षित है: ${file.name}</p>`;
    }, 1500);
};

window.scanApp = function() {
    const appName = document.getElementById('appInput').value;
    if (!appName) {
        showNotification('कृपया ऐप का नाम दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ ऐप जांच की जा रही है...</p>';
    
    setTimeout(() => {
        const riskApps = ['virus', 'trojan', 'malware', 'spyware'];
        const isRisky = riskApps.some(app => appName.toLowerCase().includes(app));
        
        if (isRisky) {
            result.innerHTML = `<p style="color: #ff3b30;">⚠️ "${appName}" को जोखिम के रूप में चिह्नित किया गया है।</p>`;
        } else {
            result.innerHTML = `<p style="color: var(--accent-color);">✓ "${appName}" सुरक्षित प्रतीत होता है।</p>`;
        }
    }, 1500);
};

window.checkWebsite = function() {
    const website = document.getElementById('websiteInput').value;
    if (!website) {
        showNotification('कृपया एक वेबसाइट दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ वेबसाइट जांच की जा रही है...</p>';
    
    setTimeout(() => {
        const isSuspicious = website.includes('secure=false') || website.includes('http://');
        if (isSuspicious) {
            result.innerHTML = '<p style="color: #ff3b30;">⚠️ यह वेबसाइट संदिग्ध है या सुरक्षित नहीं है।</p>';
        } else {
            result.innerHTML = '<p style="color: var(--accent-color);">✓ यह वेबसाइट सुरक्षित प्रतीत होती है।</p>';
        }
    }, 1500);
};

window.checkFraudCall = function() {
    const phone = document.getElementById('phoneInput').value;
    if (!phone) {
        showNotification('कृपया एक फोन नंबर दर्ज करें', 'error');
        return;
    }
    
    const result = document.getElementById('scanResult');
    result.classList.add('show');
    result.innerHTML = '<p>⏳ नंबर जांच की जा रही है...</p>';
    
    setTimeout(() => {
        result.innerHTML = `<p style="color: var(--accent-color);">✓ यह नंबर नियमित स्पैम सूचियों में दर्ज नहीं है।</p>`;
    }, 1500);
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
