# EduPulse 📧 

![Version](https://img.shields.io/badge/version-1.0.0-green)

## Machine Learning-Driven Targeted Email Marketing Model for the Sri Lankan Education Sector

EduPulse is a web-based platform that revolutionizes email marketing for the Sri Lankan education sector by implementing machine learning-driven audience segmentation. Unlike traditional bulk email solutions that focus primarily on send-time optimization, EduPulse uses advanced clustering techniques to target the most relevant audience, resulting in higher engagement metrics and improved campaign performance.

![EduPulse Dashboard]([https://ibb.co/7Jpc5pW3])

## 🚀 Key Features

- **Advanced ML Clustering Pipeline**
  - Two-stage approach with K-modes for categorical data segmentation
  - Hierarchical clustering with Gower distance for refined grouping
  - Cluster optimization using silhouette score, Calinski-Harabasz index, and Davies-Bouldin index

- **Automated Email Collection**
  - Selenium-based headless Chrome scraper
  - Keyword-based email extraction from web sources
  - Automatic filtering of invalid and duplicate addresses
  - GDPR-compliant data collection

- **Campaign Management**
  - HTML and text-based email composition with WYSIWYG editor
  - File attachment support (PDF, DOCX, ZIP)
  - Target audience selection via ML-generated clusters
  - Campaign status tracking (ongoing, completed, cancelled)

- **Advanced Delivery System**
  - SendGrid API integration
  - Redis Bull queuing for efficient batch processing
  - Rate limiting to prevent spam triggers
  - Verified sender domain authentication

- **Real-time Analytics**
  - Open rate tracking via pixel technology
  - Click-through rate (CTR) monitoring
  - Conversion metric visualization
  - Performance analytics dashboard

## 🛠️ Tech Stack

### Frontend
- React with Vite
- TypeScript (TSX)
- Tailwind CSS
- Recharts for data visualization

### Backend
- Node.js with Express
- TypeScript
- JWT and OAuth 2.0 authentication
- RESTful API architecture

### ML Microservice
- Python with FastAPI
- K-modes clustering algorithm
- Hierarchical clustering with Gower distance
- pandas, numpy, scikit-learn, matplotlib

### Infrastructure
- MongoDB Atlas (document database)
- SendGrid API (email service provider)
- Redis Bull (queue handling)
- Selenium & Chrome WebDriver (email scraping)

## 🔧 Installation

### Prerequisites
- Node.js v20.x or later
- Python 3.9 or later
- MongoDB Atlas account
- SendGrid API key
- Redis server
- Google Chrome (for email scraping)

### Step 1: Clone the repository
```bash
git clone https://github.com/username/EduPulse-Email-Marketing-Model.git
cd EduPulse-Email-Marketing-Model
```

### Step 2: Set up Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Set up Backend
```bash
cd backend
npm install
# Create a .env file with the required environment variables
npm run dev
```

### Step 4: Set up ML Microservice
```bash
cd clustering_service
pip install -r requirements.txt
python main.py
```

### Step 5: Set up Redis (Windows)
- Download Redis from https://redis.io/downloads/
- Extract and run redis-server.exe
- Set up environment variables

## 📋 Usage Guide

### Admin Actions
1. **Email Extraction**:
   - Navigate to the Email Extractor tab
   - Enter keywords related to the education sector
   - Download the extracted email dataset

2. **Clustering**:
   - Upload email dataset
   - Run the clustering pipeline
   - View cluster visualizations and performance metrics

3. **User Management**:
   - Manage user accounts
   - View all campaigns

### User Actions
1. **Campaign Creation**:
   - Create a new campaign with a subject and content
   - Select a target cluster
   - Schedule and send the campaign

2. **Analytics**:
   - View open rates, CTR, and conversions
   - Track campaign performance over time
   - Export analytics data

## 💡 Results

- **Improved Engagement**: Higher open and click-through rates compared to traditional bulk email campaigns
- **Efficient Segmentation**: Effective audience grouping based on domain characteristics and keyword relevance
- **System Performance**: Consistent throughput and cross-browser responsiveness
- **Educational Market Solution**: Successfully addresses the targeted marketing needs of the Sri Lankan education sector

## 🔒 Privacy and Compliance

EduPulse is designed to comply with global data protection regulations:
- Only collects publicly available email addresses
- Includes unsubscribe options in all emails
- Maintains data transparency in tracking methods
- Uses secure, verified sender domains

## 🧪 Testing

The system has undergone rigorous testing, including:
- Unit testing for frontend, backend, and ML components
- Integration testing for system components
- Performance testing for email delivery
- User acceptance testing

## 👨‍💻 Contributors

- Kumarage Kumararatne - Full-Stack Developer (owner)

