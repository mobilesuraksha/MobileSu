# 🛡️ Mobile Suraksha - Premium Cybersecurity Application

## विवरण (Description)

Mobile Suraksha एक प्रीमियम साइबर सुरक्षा वेब एप्लिकेशन है जो मोबाइल, टैबलेट और PC पर पूरी तरह से प्रतिक्रियाशील है। यह Firebase के साथ एकीकृत है और PWA (Progressive Web App) के रूप में काम करता है।

**Mobile Suraksha** is a premium cybersecurity web application that is fully responsive on mobile, tablet, and PC. It is integrated with Firebase and works as a PWA (Progressive Web App).

## ✨ विशेषताएं (Features)

- ✅ Google Firebase Authentication के साथ सुरक्षित लॉगिन
- ✅ Firestore डेटाबेस में उपयोगकर्ता प्रोफाइल प्रबंधन
- ✅ रीयल-टाइम सुरक्षा डैशबोर्ड
- ✅ लिंक स्कैनर - संदिग्ध लिंक की तुरंत जांच
- ✅ फाइल स्कैनर - अपलोड की गई फाइलों को स्कैन करें
- ✅ ऐप सुरक्षा चेकर - इंस्टॉल किए गए ऐप्स की सुरक्षा जांचें
- ✅ वेबसाइट सुरक्षा - फ़िशिंग और जाली वेबसाइटों से सुरक्षा
- ✅ धोखाधड़ी कॉल सुरक्षा - स्पैम कॉल की पहचान
- ✅ बैंक सुरक्षा सुझाव - बैंकिंग सुरक्षा शिक्षा
- ✅ PWA समर्थन - होम स्क्रीन पर इंस्टॉल करें
- ✅ Offline समर्थन - Service Worker के साथ
- ✅ मोबाइल-पहली डिजाइन
- ✅ Glassmorphism डिजाइन पैटर्न
- ✅ Hinglish यूजर इंटरफेस
- ✅ Dark Theme
- ✅ त्वरित और पूर्ण स्कैन

## 🚀 शुरुआत (Getting Started)

### आवश्यकताएं (Prerequisites)

- Node.js (Firebase CLI के लिए)
- npm या yarn
- Firebase account
- Modern web browser

### इंस्टॉलेशन (Installation)

1. **सभी फाइलें डाउनलोड करें**
```bash
# सभी फाइलें एक फोल्डर में रखें:
- index.html
- style.css
- app.js
- firebase.js
- manifest.json
- service-worker.js
- firebase.json
- README.md
```

2. **Firebase CLI इंस्टॉल करें**
```bash
npm install -g firebase-tools
```

3. **Firebase में लॉगिन करें**
```bash
firebase login
```

4. **अपनी Firebase परियोजना से कनेक्ट करें**
```bash
firebase init
```

5. **Firebase Configuration अपडेट करें**
   - `firebase.js` में अपनी Firebase config से credentials अपडेट करें
   - या `firebaseConfig` को अपनी project से replace करें

6. **locally परीक्षण करें**
```bash
firebase serve
# या
python -m http.server 8000
```

7. **Firebase Hosting पर deploy करें**
```bash
firebase deploy
```

## 📁 फाइल संरचना (File Structure)

```
Mobile-Suraksha/
├── index.html           # Main HTML file
├── style.css            # All styling
├── app.js               # Application logic
├── firebase.js          # Firebase configuration
├── manifest.json        # PWA manifest
├── service-worker.js    # Service Worker
├── firebase.json        # Firebase config
└── README.md            # This file
```

## 🔐 Firebase सेटअप (Firebase Setup)

### 1. Firebase Project बनाएं

```
Firebase Console → Create Project → Mobile Suraksha
```

### 2. Authentication सक्षम करें

```
Firebase Console → Authentication → Sign-in method → Google → Enable
```

### 3. Firestore Database सेटअप करें

```
Firebase Console → Firestore Database → Create Database → Start in test mode
```

### 4. Collections बनाएं

**Collection: users**
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "avatar": "string",
  "securityScore": "number",
  "mobileHealth": "string",
  "pcHealth": "string",
  "lastScan": "string",
  "totalScans": "number",
  "createdAt": "timestamp",
  "threats": "array"
}
```

**Collection: messages**
```json
{
  "name": "string",
  "email": "string",
  "message": "string",
  "userId": "string",
  "timestamp": "timestamp"
}
```

### 5. Firestore Rules सेट करें

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, update, delete: if request.auth.uid == uid;
      allow create: if request.auth.uid != null;
    }
    match /messages/{document=**} {
      allow create: if request.auth.uid != null;
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📱 PWA इंस्टॉलेशन (PWA Installation)

### Desktop (Chrome/Edge)
1. App खोलें
2. Address bar में "इंस्टॉल" बटन पर क्लिक करें
3. "इंस्टॉल" पर क्लिक करें

### Mobile (Android)
1. Chrome में खोलें
2. मेनू → "ऐप्लिकेशन इंस्टॉल करें"
3. "इंस्टॉल" पर क्लिक करें

### Mobile (iOS)
1. Safari में खोलें
2. Share → "होम स्क्रीन पर जोड़ें"
3. "जोड़ें" पर क्लिक करें

## 🔧 कॉन्फ़िगरेशन (Configuration)

### Firebase Config अपडेट करना

`firebase.js` में निम्न को अपनी config से replace करें:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Theme अनुकूलन

`style.css` में CSS variables अपडेट करें:

```css
:root {
    --primary-color: #0a5aff;
    --secondary-color: #00d4ff;
    --accent-color: #00ff88;
    --dark-bg: #0f1419;
    /* अन्य रंग... */
}
```

## 📊 डैशबोर्ड उपयोग (Dashboard Usage)

### उपलब्ध स्कैनिंग उपकरण

1. **🔗 Link Scanner**
   - किसी भी लिंक को पेस्ट करें
   - तुरंत सुरक्षा स्थिति पाएं

2. **📄 File Scanner**
   - फाइलें अपलोड करें
   - मैलवेयर के लिए स्कैन करें

3. **📱 App Checker**
   - ऐप का नाम दर्ज करें
   - सुरक्षा स्कोर देखें

4. **🌐 Website Checker**
   - वेबसाइट URL दर्ज करें
   - फ़िशिंग से सुरक्षा पाएं

5. **☎️ Fraud Call Checker**
   - फोन नंबर दर्ज करें
   - स्पैम स्थिति जांचें

6. **🏦 Bank Security**
   - बैंकिंग सुरक्षा सुझाव
   - OTP सुरक्षा जानकारी

## 🌐 Deployment (Firebase Hosting)

### Step 1: Project Initialize करें
```bash
firebase init
```

### Step 2: Deploy करें
```bash
firebase deploy
```

### Step 3: Live URL प्राप्त करें
```bash
firebase open hosting:site
```

## 🔐 सुरक्षा विशेषताएं (Security Features)

✅ Firebase Authentication - सुरक्षित लॉगिन
✅ Firestore Security Rules - डेटा सुरक्षा
✅ HTTPS - सभी प्रोटेक्शन
✅ Service Worker - Offline सुरक्षा
✅ Content Security Policy - XSS सुरक्षा
✅ एन्क्रिप्टेड डेटा - Firestore में

## 📱 ब्राउज़र समर्थन (Browser Support)

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12.1+
- ✅ Edge 79+
- ✅ Mobile Chrome (Latest)
- ✅ Mobile Safari (Latest)
- ✅ Samsung Internet 8+

## ⚡ परफॉर्मेंस (Performance)

- Lighthouse Score: 95+
- Load Time: < 2 seconds
- Service Worker: Offline support
- Caching Strategy: Cache-First for assets
- Network Strategy: Network-First for API

## 🐛 समस्या निवारण (Troubleshooting)

### Service Worker काम नहीं कर रहा
```javascript
// DevTools में यह चलाएं:
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
});
```

### Firebase Connection विफल
- Firebase project ID सही है?
- Authentication सक्षम है?
- Firestore Database सक्षम है?

### PWA इंस्टॉल नहीं हो रहा
- HTTPS सक्षम है?
- manifest.json सही है?
- Service Worker registered है?

## 🤝 योगदान (Contributing)

1. कोड को fork करें
2. Feature branch बनाएं
3. Changes commit करें
4. Push करें
5. Pull Request खोलें

## 📜 लाइसेंस (License)

MIT License - आप इसे स्वतंत्रता से उपयोग कर सकते हैं

## 📧 संपर्क (Contact)

- Email: support@mobilesuraksha.com
- Website: https://mobilesuraksha.web.app
- GitHub: [Project Link]

## 🔄 अपडेट्स (Updates)

### Version 1.0.0 (Current)
- Initial release
- All scanning tools
- Dashboard
- PWA support
- Firebase integration

### Upcoming Features
- Real-time threat detection
- Multi-device sync
- Advanced analytics
- Community threat database
- AI-powered scanning

## ⚠️ महत्वपूर्ण सूचना (Important Notice)

यह एक **शैक्षिक और डेमो उद्देश्य** के लिए बनाया गया है। यह:
- ❌ कोई असली डेटा नहीं चोरी करता
- ❌ कोई छिपा हुआ monitoring नहीं है
- ❌ कोई फाइल बिना अनुमति के access नहीं करता
- ✅ सभी स्कैन user permission के साथ होते हैं
- ✅ पूर्ण पारदर्शिता के साथ काम करता है

## 🙏 धन्यवाद (Credits)

- Firebase by Google
- Icons from Emoji
- Design inspired by modern antivirus apps

---

**Happy Securing! 🛡️**

*Made with ❤️ for cybersecurity awareness in India*
