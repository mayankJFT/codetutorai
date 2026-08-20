# Repocourseai

An intelligent AI-powered platform that generates comprehensive tutorials from any codebase. Transform your code repositories into interactive learning materials with professional PDF exports, AI-driven analysis, and engaging educational content.

## 🚀 Features

### 🤖 AI-Powered Code Analysis
- **Smart Code Understanding**: Automatically analyzes project structure and architecture patterns
- **Language Detection**: Supports 20+ programming languages including Python, JavaScript, Java, C++, Go, Rust
- **Architecture Recognition**: Identifies MVC, microservices, REST APIs, and other design patterns
- **Dependency Mapping**: Creates visual representations of code relationships and dependencies

### 📚 Interactive Tutorial Generation
- **Chapter-based Learning**: Automatically structures content into logical learning sequences
- **Code Playground**: Live code execution environment for hands-on practice
- **Interactive Quizzes**: AI-generated questions to test understanding
- **Progress Tracking**: Visual progress indicators and learning milestones
- **Difficulty Progression**: Adaptive content that scales from beginner to advanced

### 📄 Professional Export Options
- **High-Quality PDFs**: Syntax-highlighted code blocks with professional formatting
- **Interactive HTML**: Self-contained web tutorials with all features
- **Multiple Formats**: Export to PDF, HTML, Markdown, or structured JSON
- **Custom Branding**: Personalized styling and themes

### 🎯 Advanced Learning Features
- **Real-time Code Analysis**: Instant feedback and suggestions
- **Best Practices**: Automated code quality recommendations
- **Documentation Generation**: AI-created explanations for complex functions
- **Visual Diagrams**: Flowcharts and architecture diagrams

## 🛠 Tech Stack

**Backend**
- FastAPI (Python web framework)
- SQLite (local database, zero setup)
- OpenAI GPT-4 (AI analysis engine)
- ReportLab (PDF generation)
- Asyncio (concurrent processing)

**Frontend**
- Next.js 14 (React framework)
- TypeScript (type-safe development)
- Tailwind CSS (styling framework)
- Framer Motion (animations)
- React Query (data fetching)

**AI & Processing**
- OpenAI API integration
- Custom code parsing algorithms
- Syntax highlighting with PrismJS
- Node.js microservice for PDF generation

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/mynkchaudhry/Repocourseai.git
cd Repocourseai
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Add your Groq API key (SQLite DB is created automatically)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Start Services
```bash
# Terminal 1: Backend API
python backend.py

# Terminal 2: Frontend development server
cd frontend && npm run dev

# Terminal 3: PDF generation service
node pdf-server.js
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PDF Service: http://localhost:3001

## 🔧 Configuration

### Environment Variables
```bash
# .env file
GROQ_API_KEY=your_groq_api_key
# Model + budgets. Groq free tier allows 8000 tokens/min (input+output), so keep these small:
GROQ_MODEL=openai/gpt-oss-120b
GROQ_MAX_TOKENS=2500
PREVIOUS_CHAPTERS_MAX_CHARS=4000
SECRET_KEY=your_jwt_secret
# Optional: Node PDF service URL (default http://localhost:3001/generate-pdf)
PDF_SERVICE_URL=http://localhost:3001/generate-pdf
# Optional: where the SQLite file lives (default: ./codetutorai.db)
SQLITE_PATH=./codetutorai.db
BACKEND_URL=http://localhost:8000
```

### Database
The backend uses a local SQLite file (`codetutorai.db` by default, override with `SQLITE_PATH`).
It is created automatically on first start — no external database service is required.
To reset all data, stop the backend and delete the `.db` file.

### OpenAI Setup
1. Sign up at OpenAI Platform
2. Generate API key
3. Add to .env file
4. Ensure sufficient credits for API calls

## 📖 Usage Guide

### Creating Your First Tutorial

1. **Upload Codebase**
   - Upload ZIP file or connect GitHub repository
   - System automatically detects project structure

2. **AI Analysis**
   - Advanced algorithms analyze code patterns
   - Identifies key components and relationships
   - Generates learning objectives

3. **Tutorial Generation**
   - Creates structured chapter-based content
   - Adds code examples and explanations
   - Includes interactive elements

4. **Customization**
   - Adjust difficulty levels
   - Select specific topics to cover
   - Configure export preferences

5. **Export & Share**
   - Download as professional PDF
   - Share interactive HTML version
   - Export structured data

### Advanced Features

**Settings Configuration**
```javascript
{
  "max_abstractions": 10,
  "difficulty_level": "intermediate",
  "include_tests": true,
  "generate_quizzes": true,
  "export_format": "pdf"
}
```

**Supported Project Types**
- Web applications (React, Vue, Angular)
- Backend APIs (Express, Django, FastAPI)
- Mobile apps (React Native, Flutter)
- Desktop applications (Electron, PyQt)
- Data science projects (Jupyter, Pandas)
- Machine learning models (TensorFlow, PyTorch)

## 🏗 Project Structure

```
Repocourseai/
├── backend.py              # Main FastAPI server
├── flow.py                 # Tutorial generation workflow
├── nodes.py                # Processing node definitions
├── requirements.txt        # Python dependencies
├── frontend/
│   ├── app/               # Next.js pages and routing
│   ├── components/        # Reusable React components
│   ├── lib/              # Utility functions
│   └── package.json      # Node.js dependencies
├── utils/
│   ├── call_llm.py           # OpenAI API interface
│   └── crawl_local_files.py  # File system utilities
└── pdf-server.js         # PDF generation microservice
```

## 🔌 API Endpoints

### Core Endpoints
```http
POST /generate_tutorial    # Generate tutorial from codebase
GET  /projects            # List user projects
POST /upload              # Upload code files
GET  /projects/{id}/download/pdf  # Download PDF tutorial
```

### User Management
```http
POST /auth/login          # User authentication
POST /auth/register       # User registration
GET  /settings            # Get user preferences
PUT  /settings            # Update user preferences
```

### Analysis
```http
POST /analyze             # Analyze code structure
GET  /progress/{job_id}   # Check processing status
GET  /tutorials/{id}      # Get tutorial content
```

## 🎨 Customization

### Themes
- Light/Dark mode support
- Custom color schemes
- Professional branding options

### Export Templates
- Academic paper format
- Corporate training materials
- Developer documentation
- Interactive presentations

## 🔍 Troubleshooting

### Common Issues

**Database Errors / Reset**
```bash
# The SQLite database lives at ./codetutorai.db (or $SQLITE_PATH).
# To start fresh, stop the backend and remove it:
rm codetutorai.db codetutorai.db-wal codetutorai.db-shm
```

**OpenAI API Limits**
```bash
# Check API usage in OpenAI dashboard
# Upgrade plan if needed for higher limits
```

**PDF Generation Issues**
```bash
# Restart PDF service
pkill -f pdf-server.js
node pdf-server.js
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard  
- [ ] Multi-language UI support
- [ ] Integration with popular IDEs
- [ ] Advanced AI models (GPT-4, Claude)
- [ ] Video tutorial generation
- [ ] Community sharing platform

## 📞 Support

- **Documentation**: [Wiki Pages](https://github.com/mynkchaudhry/Repocourseai/wiki)
- **Issues**: [GitHub Issues](https://github.com/mynkchaudhry/Repocourseai/issues)
- **Email**: support@repocourseai.com

## ⭐ Acknowledgments

Built with cutting-edge AI technology to revolutionize code education and make programming knowledge more accessible to developers worldwide.

---

**Made with ❤️ by [Mayank Chaudhary](https://github.com/mynkchaudhry)**