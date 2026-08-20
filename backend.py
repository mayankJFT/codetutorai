"""
Enhanced FastAPI backend for CodeTutorAI Tutorial Generator with SQLite persistence and Authentication
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import json
import uuid
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor
import bcrypt
from jose import JWTError, jwt
import requests
import markdown
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, Color
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.platypus.flowables import Flowable
import io
import tempfile
import base64
import html

# Local SQLite document store
from database import SQLiteStore

# Import the flow creation function
from flow import create_tutorial_flow

app = FastAPI(title="CodeTutor AI API", version="2.0.0")

# Configure CORS
# Allowed browser origins; add the deployed frontend via FRONTEND_ORIGIN
_cors_origins = ["http://localhost:3000", "http://localhost:3001"]
if os.getenv("FRONTEND_ORIGIN"):
    _cors_origins.extend(o.strip() for o in os.getenv("FRONTEND_ORIGIN").split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    import secrets as _secrets
    SECRET_KEY = _secrets.token_hex(32)
    print("⚠️  SECRET_KEY not set - generated a random one for this run. "
          "Sessions will not survive restarts, and with WEB_CONCURRENCY > 1 each "
          "worker gets a DIFFERENT key (random login failures). Set SECRET_KEY.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # default 24h, matches frontend cookie lifetime

# Storage: MongoDB when MONGODB_URL is set (survives redeploys on
# ephemeral hosts like Render's free tier); local SQLite otherwise.
MONGODB_URL = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "codetutorai")
SQLITE_PATH = os.getenv("SQLITE_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "codetutorai.db"))

if MONGODB_URL:
    from pymongo import MongoClient

    _mongo_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=15000, tz_aware=True)
    _mongo_client.admin.command("ping")
    db = _mongo_client[DATABASE_NAME]
    STORAGE_BACKEND = "mongodb"
    print(f"✅ Using MongoDB database '{DATABASE_NAME}'")
else:
    db = SQLiteStore(SQLITE_PATH)
    STORAGE_BACKEND = "sqlite"
    print(f"✅ Using SQLite database at {SQLITE_PATH}")
    if os.getenv("RENDER"):
        print("⚠️  WARNING: running on Render without MONGODB_URL - SQLite is EPHEMERAL here; "
              "all users, tutorials, and the LLM response cache are wiped on every "
              "deploy/restart. Set MONGODB_URL.")

users_collection = db["users"]
projects_collection = db["projects"]
jobs_collection = db["jobs"]
tutorials_collection = db["tutorials"]

# Node.js PDF service (frontend/pdf-server.js); falls back to ReportLab if unreachable
PDF_SERVICE_URL = os.getenv("PDF_SERVICE_URL", "http://localhost:3001/generate-pdf")

# Bounded pool for tutorial-generation jobs. Extra jobs queue as "pending"
# until a worker frees up, so concurrent users can't trample the shared
# Groq rate limit or exhaust the machine.
GENERATION_WORKERS = int(os.getenv("GENERATION_WORKERS", "2"))
executor = ThreadPoolExecutor(max_workers=GENERATION_WORKERS)

# Security
security = HTTPBearer()

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectConfig(BaseModel):
    repo_url: Optional[str] = None
    local_dir: Optional[str] = None
    project_name: Optional[str] = None
    github_token: Optional[str] = None
    include_patterns: Optional[List[str]] = None
    exclude_patterns: Optional[List[str]] = None
    max_file_size: Optional[int] = 100000
    language: Optional[str] = "english"
    use_cache: Optional[bool] = True
    max_abstractions: Optional[int] = 10

class GitHubRepoSearch(BaseModel):
    query: str
    language: Optional[str] = None
    sort: Optional[str] = "stars"
    order: Optional[str] = "desc"
    per_page: Optional[int] = 10

class TutorialChapter(BaseModel):
    title: str
    content: str
    order: int

class Tutorial(BaseModel):
    id: str
    user_id: str
    project_id: str
    title: str
    description: str
    chapters: List[TutorialChapter]
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# Helper Functions
from backend_auth_helpers import hash_password, normalize_email, verify_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class CodeBlock(Flowable):
    """Custom flowable for code blocks with syntax highlighting"""
    def __init__(self, code_text, width, height=None):
        Flowable.__init__(self)
        self.code_text = code_text
        self.width = width
        self.height = height or 100
        
    def draw(self):
        # Draw background
        self.canv.setFillColor(HexColor('#f8f9fa'))
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        
        # Draw border
        self.canv.setStrokeColor(HexColor('#e9ecef'))
        self.canv.setLineWidth(1)
        self.canv.rect(0, 0, self.width, self.height, fill=0, stroke=1)
        
        # Draw text
        self.canv.setFillColor(HexColor('#212529'))
        self.canv.setFont("Courier", 10)
        
        lines = self.code_text.split('\n')
        y_pos = self.height - 15
        for line in lines:
            if y_pos < 15:
                break
            self.canv.drawString(10, y_pos, line[:80])  # Limit line length
            y_pos -= 12

class ProjectLogo(Flowable):
    """Custom flowable for project logo"""
    def __init__(self, width, height):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        
    def draw(self):
        # Create a simple geometric logo
        # Background circle
        self.canv.setFillColor(HexColor('#4F46E5'))
        self.canv.circle(self.width/2, self.height/2, min(self.width, self.height)/2 - 5, fill=1, stroke=0)
        
        # Inner design
        self.canv.setFillColor(colors.white)
        self.canv.setFont("Helvetica-Bold", 16)
        self.canv.drawCentredString(self.width/2, self.height/2 - 5, "CT")
        
        # Add small accent
        self.canv.setFillColor(HexColor('#F59E0B'))
        self.canv.circle(self.width/2 + 15, self.height/2 + 10, 4, fill=1, stroke=0)

def create_professional_table(data, col_widths=None):
    """Create a professional-looking table"""
    if not data:
        return None
        
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        # Header styling
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Data styling
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), HexColor('#374151')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        
        # Grid styling
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#E5E7EB')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#F9FAFB')]),
    ]))
    return table

def generate_simple_text_pdf(content: str, title: str) -> bytes:
    """Generate a simple text-based PDF when HTML processing fails"""
    try:
        print(f"Generating simple text PDF for '{title}'")
        
        # Create PDF buffer
        pdf_buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=1*inch
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        story = []
        
        # Add title
        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip() or "Tutorial"
        story.append(Paragraph(clean_title, styles['Title']))
        story.append(Spacer(1, 12))
        
        # Clean content - remove all HTML tags and just use plain text
        clean_content = re.sub(r'<[^>]+>', '', content)
        clean_content = html.unescape(clean_content)
        
        # Split into paragraphs and add to story
        paragraphs = clean_content.split('\n\n')
        for para in paragraphs:
            para = para.strip()
            if para:
                # Handle headers
                if para.startswith('# '):
                    story.append(Paragraph(para[2:], styles['Heading1']))
                elif para.startswith('## '):
                    story.append(Paragraph(para[3:], styles['Heading2']))
                elif para.startswith('### '):
                    story.append(Paragraph(para[4:], styles['Heading3']))
                else:
                    # Regular paragraph
                    try:
                        story.append(Paragraph(para, styles['Normal']))
                    except:
                        # If even this fails, add as plain text
                        story.append(Paragraph(para.encode('ascii', 'ignore').decode(), styles['Normal']))
                story.append(Spacer(1, 6))
        
        # Build PDF
        doc.build(story)
        return pdf_buffer.getvalue()
        
    except Exception as e:
        print(f"Error in simple PDF generation: {e}")
        raise ValueError(f"Failed to generate simple PDF: {e}")

def generate_pdf_from_markdown(markdown_content: str, title: str) -> bytes:
    """Generate PDF from markdown content using ReportLab with enhanced formatting"""
    try:
        print(f"Generating PDF for '{title}' with {len(markdown_content)} characters of content")
        
        # Ensure we have content
        if not markdown_content or not markdown_content.strip():
            raise ValueError("No content provided for PDF generation")
        
        # Clean and sanitize the title
        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip() or "Tutorial"
        print(f"Using clean title: '{clean_title}'")
        
        # Create PDF buffer
        pdf_buffer = io.BytesIO()
        
        # Create PDF document with better margins
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=A4,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=1*inch
        )
        
        # Get styles and create custom ones
        styles = getSampleStyleSheet()
        
        # Enhanced custom styles
        title_style = ParagraphStyle(
            'EnhancedTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            spaceBefore=20,
            textColor=HexColor('#1a202c'),
            alignment=1,  # Center alignment
            fontName='Helvetica-Bold'
        )
        
        heading1_style = ParagraphStyle(
            'EnhancedHeading1',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=16,
            spaceBefore=24,
            textColor=HexColor('#2d3748'),
            fontName='Helvetica-Bold',
            borderWidth=1,
            borderColor=HexColor('#e2e8f0'),
            borderPadding=8,
            backColor=HexColor('#f7fafc')
        )
        
        heading2_style = ParagraphStyle(
            'EnhancedHeading2',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=18,
            textColor=HexColor('#2d3748'),
            fontName='Helvetica-Bold',
            leftIndent=0
        )
        
        heading3_style = ParagraphStyle(
            'EnhancedHeading3',
            parent=styles['Heading3'],
            fontSize=14,
            spaceAfter=10,
            spaceBefore=14,
            textColor=HexColor('#4a5568'),
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'EnhancedBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=14,  # More space after paragraphs
            spaceBefore=2,  # Small space before paragraphs
            leading=18,     # Better line spacing
            textColor=HexColor('#2d3748'),
            fontName='Helvetica',
            alignment=0,    # Left alignment
            firstLineIndent=0  # No first line indent for cleaner look
        )
        
        code_style = ParagraphStyle(
            'EnhancedCode',
            parent=styles['Code'],
            fontSize=10,
            spaceAfter=16,      # More space after code blocks
            spaceBefore=12,     # More space before code blocks
            backColor=HexColor('#f8f9fc'),  # Slightly lighter background
            borderWidth=1,
            borderColor=HexColor('#e2e8f0'),  # Lighter border
            borderPadding=16,   # More padding inside code blocks
            fontName='Courier-Bold',  # Make code slightly bolder
            leading=15,         # Better line spacing in code
            leftIndent=24,      # More left indent
            rightIndent=24,     # More right indent
            textColor=HexColor('#1a202c')  # Darker text for better contrast
        )
        
        # Enhanced bullet styles
        bullet_style = ParagraphStyle(
            'EnhancedBullet',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            spaceBefore=2,
            leftIndent=25,
            bulletIndent=15,
            fontName='Helvetica',
            textColor=HexColor('#374151'),
            leading=16
        )
        
        bullet_level2_style = ParagraphStyle(
            'EnhancedBulletLevel2',
            parent=bullet_style,
            leftIndent=45,
            bulletIndent=35,
            fontSize=10,
            textColor=HexColor('#6B7280')
        )
        
        # Enhanced table style for markdown tables
        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            alignment=1
        )
        
        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica',
            textColor=HexColor('#374151')
        )
        
        # Story (content) list
        story = []
        
        # Add logo and header
        story.append(ProjectLogo(60, 60))
        story.append(Spacer(1, 20))
        
        # Add title with enhanced styling
        story.append(Paragraph(html.escape(clean_title), title_style))
        story.append(Spacer(1, 20))
        
        # Add professional generation info
        info_style = ParagraphStyle(
            'InfoStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=HexColor('#6B7280'),
            alignment=1,  # Center
            spaceBefore=5,
            spaceAfter=5
        )
        
        story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", info_style))
        story.append(Paragraph("CodeTutor AI - Advanced Code Learning Platform", info_style))
        story.append(Spacer(1, 30))
        
        # Add table of contents if multiple headings
        toc_data = []
        heading_count = markdown_content.count('\n# ') + markdown_content.count('\n## ')
        if heading_count > 2:
            story.append(Paragraph("Table of Contents", heading2_style))
            story.append(Spacer(1, 10))
            
            # Extract headings for TOC
            lines = markdown_content.split('\n')
            toc_items = []
            page_num = 1
            for line in lines:
                if line.startswith('# '):
                    toc_items.append([html.escape(line[2:].strip()), str(page_num)])
                    page_num += 1
                elif line.startswith('## '):
                    toc_items.append([f"    {html.escape(line[3:].strip())}", str(page_num)])
            
            if toc_items:
                toc_table = create_professional_table([["Section", "Page"]] + toc_items, [4*inch, 1*inch])
                story.append(toc_table)
                story.append(Spacer(1, 30))
        
        # Process markdown content line by line with better parsing
        lines = markdown_content.split('\n')
        current_paragraph = ""
        in_code_block = False
        code_block_content = ""
        
        for line in lines:
            line_stripped = line.strip()
            
            # Handle code blocks
            if line_stripped.startswith('```'):
                if in_code_block:
                    # End of code block - use custom CodeBlock flowable
                    if code_block_content.strip():
                        clean_code = code_block_content.strip()
                        # Calculate height based on number of lines
                        line_count = len(clean_code.split('\n'))
                        block_height = max(60, min(300, line_count * 15 + 30))
                        
                        code_block = CodeBlock(clean_code, 5.5*inch, block_height)
                        story.append(Spacer(1, 10))
                        story.append(code_block)
                        story.append(Spacer(1, 10))
                    code_block_content = ""
                    in_code_block = False
                else:
                    # Start of code block
                    if current_paragraph.strip():
                        story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                        current_paragraph = ""
                    in_code_block = True
                continue
            
            if in_code_block:
                code_block_content += line + "\n"
                continue
            
            # Handle different markdown elements
            if not line_stripped:
                # Empty line - process accumulated paragraph
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    story.append(Spacer(1, 6))
                    current_paragraph = ""
                continue
            
            # Handle headers with improved spacing and formatting
            if line_stripped.startswith('# '):
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                header_text = html.escape(line_stripped[2:].strip())
                story.append(Spacer(1, 18))  # More space before H1
                story.append(Paragraph(header_text, heading1_style))
                story.append(Spacer(1, 12))  # More space after H1
                
            elif line_stripped.startswith('## '):
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                header_text = html.escape(line_stripped[3:].strip())
                story.append(Spacer(1, 14))  # More space before H2
                story.append(Paragraph(header_text, heading2_style))
                story.append(Spacer(1, 8))   # More space after H2
                
            elif line_stripped.startswith('### '):
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                header_text = html.escape(line_stripped[4:].strip())
                story.append(Spacer(1, 12))  # More space before H3
                story.append(Paragraph(header_text, heading3_style))
                story.append(Spacer(1, 6))   # More space after H3
                
            # Handle H4 headings
            elif line_stripped.startswith('#### '):
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                header_text = html.escape(line_stripped[5:].strip())
                story.append(Spacer(1, 10))
                story.append(Paragraph(f"<b>{header_text}</b>", body_style))
                story.append(Spacer(1, 4))
                
            # Handle bullet points with multiple levels
            elif line_stripped.startswith('- ') or line_stripped.startswith('* '):
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                bullet_text = html.escape(line_stripped[2:].strip())
                
                # Check for nested bullets
                if line.startswith('  - ') or line.startswith('    - '):
                    story.append(Paragraph(f"◦ {bullet_text}", bullet_level2_style))
                else:
                    story.append(Paragraph(f"• {bullet_text}", bullet_style))
            
            # Handle numbered lists
            elif re.match(r'^\d+\.\s', line_stripped):
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                # Extract number and text
                match = re.match(r'^(\d+)\.\s(.+)', line_stripped)
                if match:
                    num, text = match.groups()
                    story.append(Paragraph(f"{num}. {html.escape(text)}", bullet_style))
            
            # Handle markdown tables
            elif '|' in line_stripped and line_stripped.count('|') >= 2:
                if current_paragraph.strip():
                    story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
                    current_paragraph = ""
                
                # Collect table rows
                table_rows = [line_stripped]
                table_index = lines.index(line) + 1
                
                # Look ahead for more table rows
                while table_index < len(lines):
                    next_line = lines[table_index].strip()
                    if '|' in next_line and next_line.count('|') >= 2:
                        # Skip separator rows (like |---|---|)
                        if not re.match(r'^[\s\|\-:]+$', next_line):
                            table_rows.append(next_line)
                        table_index += 1
                    else:
                        break
                
                # Create table data
                if len(table_rows) > 1:
                    table_data = []
                    for row_text in table_rows:
                        cells = [cell.strip() for cell in row_text.split('|')[1:-1]]  # Remove empty first/last
                        if cells:
                            table_data.append(cells)
                    
                    if table_data:
                        # Format table with professional styling
                        formatted_table = create_professional_table(table_data)
                        if formatted_table:
                            story.append(Spacer(1, 10))
                            story.append(formatted_table)
                            story.append(Spacer(1, 10))
                        
                        # Skip processed lines
                        continue
                
            # Handle inline code
            elif '`' in line_stripped:
                # Process inline code - improved formatting
                processed_line = line_stripped
                # Simple inline code processing with better styling
                processed_line = re.sub(r'`([^`]+)`', r'<font name="Courier" color="#d63384" backColor="#f8f9fa">\1</font>', processed_line)
                current_paragraph += " " + processed_line if current_paragraph else processed_line
                
            else:
                # Regular text line
                current_paragraph += " " + line_stripped if current_paragraph else line_stripped
        
        # Add any remaining paragraph
        if current_paragraph.strip():
            story.append(Paragraph(html.escape(current_paragraph.strip()), body_style))
        
        # Add any remaining code block
        if in_code_block and code_block_content.strip():
            clean_code = html.escape(code_block_content.strip())
            story.append(Paragraph(clean_code, code_style))
        
        # Add professional footer
        story.append(Spacer(1, 40))
        
        # Footer divider
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=HexColor('#9CA3AF'),
            alignment=1,  # Center
            spaceBefore=10,
            spaceAfter=5
        )
        
        story.append(Paragraph("━" * 80, footer_style))
        story.append(Spacer(1, 15))
        
        # Professional attribution
        attribution_style = ParagraphStyle(
            'AttributionStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=HexColor('#4B5563'),
            alignment=1,  # Center
            spaceBefore=5,
            spaceAfter=3,
            fontName='Helvetica-Bold'
        )
        
        story.append(Paragraph("Generated with CodeTutor AI", attribution_style))
        story.append(Paragraph("Advanced Code Learning Platform", footer_style))
        story.append(Spacer(1, 8))
        
        # Build info
        build_info = f"Document created on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
        story.append(Paragraph(build_info, footer_style))
        
        # Professional builder attribution
        story.append(Spacer(1, 15))
        builder_style = ParagraphStyle(
            'BuilderStyle',
            parent=styles['Normal'],
            fontSize=8,
            textColor=HexColor('#6B7280'),
            alignment=1,  # Center
            fontName='Helvetica'
        )
        # Footer will be added by new PDF service
        
        # Build PDF
        print(f"Building PDF with {len(story)} story elements")
        doc.build(story)
        pdf_bytes = pdf_buffer.getvalue()
        print(f"Successfully generated enhanced PDF: {len(pdf_bytes)} bytes")
        return pdf_bytes
        
    except Exception as e:
        print(f"Error in enhanced PDF generation: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to simple PDF generation
        try:
            return generate_simple_text_pdf(markdown_content, title)
        except:
            # Final fallback
            pdf_buffer = io.BytesIO()
            doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            story.append(Paragraph("Tutorial Document", styles['Title']))
            story.append(Paragraph("PDF generation encountered an issue. Please try downloading in markdown format.", styles['Normal']))
            doc.build(story)
            return pdf_buffer.getvalue()

def generate_pdf_with_nodejs_service(content: str, title: str, user_email: str = None) -> bytes:
    """Generate PDF using the Node.js PDF service with better formatting"""
    try:
        print(f"Generating PDF via Node.js service for '{title}' with user: {user_email or 'Anonymous'}")
        
        # Prepare request payload
        payload = {
            'content': content,
            'title': title,
            'userEmail': user_email
        }
        
        # Call the PDF service
        response = requests.post(
            PDF_SERVICE_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        if response.status_code == 200:
            print(f"Successfully generated PDF: {len(response.content)} bytes")
            return response.content
        else:
            error_msg = f"PDF service returned status {response.status_code}: {response.text}"
            print(error_msg)
            raise ValueError(error_msg)
            
    except requests.exceptions.RequestException as e:
        print(f"Error calling PDF service: {e}")
        # Fallback to old PDF generation if service is unavailable
        print("Falling back to ReportLab PDF generation...")
        return generate_pdf_from_markdown(content, title)
    except Exception as e:
        print(f"Unexpected error in PDF generation: {e}")
        raise ValueError(f"PDF generation failed: {e}")

def save_tutorial_to_db(project_id: str, user_id: str, tutorial_content: str, title: str, chapters: List[Dict[str, Any]]) -> str:
    """Save tutorial content to the database"""
    if tutorials_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    tutorial_id = str(uuid.uuid4())
    tutorial_doc = {
        "_id": tutorial_id,
        "user_id": user_id,
        "project_id": project_id,
        "title": title,
        "description": f"Tutorial for {title}",
        "content": tutorial_content,
        "chapters": chapters,
        "metadata": {
            "word_count": len(tutorial_content.split()),
            "chapter_count": len(chapters),
            "generated_with": "CodeTutor AI"
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    tutorials_collection.insert_one(tutorial_doc)
    return tutorial_id

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if users_collection is not None:
        user = users_collection.find_one({"email": email})
        if user is None:
            raise credentials_exception
        return user
    else:
        raise HTTPException(status_code=500, detail="Database not available")

def run_tutorial_flow(job_id: str, config: ProjectConfig, user_id: str):
    """Run the tutorial generation flow in a background thread"""
    try:
        # Update job status
        if jobs_collection is not None:
            jobs_collection.update_one(
                {"_id": job_id},
                {"$set": {"status": "processing", "progress": 0, "updated_at": datetime.now(timezone.utc)}}
            )
        
        # Prepare shared dictionary with progress callback
        def update_progress(step: str, progress: int, log_message: str = None):
            timestamp = datetime.now(timezone.utc)
            if jobs_collection is not None:
                update_data = {
                    "current_step": step, 
                    "progress": progress, 
                    "updated_at": timestamp
                }
                
                # Add log entry if provided
                if log_message:
                    log_entry = {
                        "timestamp": timestamp,
                        "level": "INFO",
                        "message": log_message,
                        "step": step,
                        "progress": progress
                    }
                    jobs_collection.update_one(
                        {"_id": job_id},
                        {
                            "$set": update_data,
                            "$push": {"logs": log_entry}
                        }
                    )
                else:
                    jobs_collection.update_one(
                        {"_id": job_id},
                        {"$set": update_data}
                    )
                
                print(f"Job {job_id}: {step} - {progress}% {f'- {log_message}' if log_message else ''}")
        
        shared = {
            "repo_url": config.repo_url,
            "local_dir": config.local_dir,
            "project_name": config.project_name,
            "github_token": config.github_token,
            "output_dir": "output",
            "include_patterns": set(config.include_patterns) if config.include_patterns else None,
            "exclude_patterns": set(config.exclude_patterns) if config.exclude_patterns else None,
            "max_file_size": config.max_file_size,
            "language": config.language,
            "use_cache": config.use_cache,
            "max_abstraction_num": config.max_abstractions,
            "update_progress": update_progress,  # Pass the progress callback to the flow
        }
        
        # Create and run the flow with proper progress tracking
        update_progress("Fetching repository", 5, f"Starting repository fetch: {config.repo_url or config.local_dir}")
        tutorial_flow = create_tutorial_flow()
        
        # Run the flow - the nodes will call update_progress internally
        print(f"Starting tutorial generation flow for job {job_id}")
        tutorial_flow.run(shared)
        print(f"Tutorial generation flow completed for job {job_id}")
        
        update_progress("Processing results", 90, "Processing and saving tutorial results")
        
        # Store the result
        result = {
            "abstractions": shared.get("abstractions", []),
            "relationships": shared.get("relationships", {}),
            "chapters": shared.get("chapters", []),
            "output_dir": shared.get("final_output_dir", ""),
        }
        
        # Generate tutorial content and save to the database
        try:
            tutorial_content = ""
            chapters_list = []
            
            # Get chapters content directly from the shared dictionary
            chapters_content = shared.get("chapters", [])
            
            if chapters_content:
                update_progress("Processing results", 92, f"Found {len(chapters_content)} chapters to process")
                
                # The chapters are already markdown content strings, not file paths
                for i, chapter_content in enumerate(chapters_content):
                    if chapter_content and chapter_content.strip():
                        tutorial_content += f"\n\n{chapter_content}\n\n"
                        chapters_list.append({
                            "title": f"Chapter {i+1}",
                            "content": chapter_content,
                            "order": i+1
                        })
                        update_progress("Processing results", 92 + (i * 2), f"Processed chapter {i+1}: {len(chapter_content)} characters")
                
                # Also try to get the written files from the output directory for backup
                output_dir = shared.get("final_output_dir", "")
                if output_dir and os.path.exists(output_dir):
                    result["output_dir"] = output_dir
                    result["chapter_files"] = []
                    
                    # Find all markdown files in the output directory
                    for filename in os.listdir(output_dir):
                        if filename.endswith('.md'):
                            file_path = os.path.join(output_dir, filename)
                            result["chapter_files"].append(file_path)
                    
                    update_progress("Processing results", 95, f"Found output files in: {output_dir}")
            
            # Save tutorial to the database if content exists
            if tutorial_content.strip():
                update_progress("Saving tutorial", 98, f"Saving tutorial to database ({len(tutorial_content)} characters total)")
                tutorial_id = save_tutorial_to_db(
                    project_id=job_id,
                    user_id=user_id,
                    tutorial_content=tutorial_content,
                    title=config.project_name or "Generated Tutorial",
                    chapters=chapters_list
                )
                result["tutorial_id"] = tutorial_id
                update_progress("Saving tutorial", 99, f"Successfully saved tutorial with ID: {tutorial_id}")
            else:
                update_progress("Processing results", 95, "Warning: No tutorial content found to save")
                
        except Exception as e:
            error_msg = f"Failed to save tutorial to database: {e}"
            update_progress("Processing results", 95, f"Error: {error_msg}")
            print(f"Warning: {error_msg}")
            # Continue execution even if database save fails
        
        # Final completion update with log
        update_progress("Completed", 100, f"Tutorial generation completed successfully! Generated {len(chapters_list)} chapters.")
        
        if jobs_collection is not None:
            jobs_collection.update_one(
                {"_id": job_id},
                {"$set": {
                    "status": "completed",
                    "progress": 100,
                    "result": result,
                    "completed_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
        
        # Create project record with better name extraction
        if projects_collection is not None:
            # Try to get a better project name
            project_name = config.project_name
            if not project_name and config.repo_url:
                # Extract repo name from GitHub URL
                try:
                    repo_name = config.repo_url.split('/')[-1].replace('.git', '')
                    project_name = repo_name
                except:
                    project_name = "GitHub Repository"
            elif not project_name and config.local_dir:
                # Extract directory name from local path
                try:
                    project_name = os.path.basename(config.local_dir.rstrip('/'))
                except:
                    project_name = "Local Project"
            
            if not project_name:
                project_name = "Unnamed Project"
            
            stored_config = config.model_dump()
            stored_config.pop("github_token", None)  # never persist or echo user PATs
            project = {
                "_id": job_id,  # matches tutorials.project_id (saved with job_id above)
                "user_id": user_id,
                "job_id": job_id,
                "name": project_name,
                "type": "github" if config.repo_url else "local",
                "source": config.repo_url or config.local_dir,
                "status": "completed",
                "progress": 100,
                "created_at": datetime.now(timezone.utc),
                "completed_at": datetime.now(timezone.utc),
                "output_dir": result["output_dir"],
                "config": stored_config,
                "result": result,
            }
            projects_collection.insert_one(project)
            print(f"Created project record: {project_name} (ID: {project['_id']})")
        
    except Exception as e:
        if jobs_collection is not None:
            current = jobs_collection.find_one({"_id": job_id}) or {}
            if current.get("status") == "completed":
                # Generation succeeded; only bookkeeping failed. Keep the success.
                print(f"Post-completion bookkeeping failed for job {job_id}: {e}")
            else:
                jobs_collection.update_one(
                    {"_id": job_id},
                    {"$set": {
                        "status": "failed",
                        "error": str(e),
                        "progress": 0,
                        "updated_at": datetime.now(timezone.utc)
                    }}
                )

# API Routes

@app.get("/")
def root():
    return {
        "message": "CodeTutor AI - Advanced Code Learning Platform",
        "version": "2.0.0",
        "storage": STORAGE_BACKEND,
        "features": ["Authentication", "GitHub Search", "PDF Generation"],
    }

# Authentication Routes
@app.post("/auth/register", response_model=Token)
def register(user: UserCreate):
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Check if user exists
    user.email = normalize_email(user.email)
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user.password)
    user_doc = {
        "_id": str(uuid.uuid4()),
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
    }
    
    users_collection.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
def login(user: UserLogin):
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Verify user
    user.email = normalize_email(user.email)
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=User)
def read_users_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return User(
        id=current_user["_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"],
        is_active=current_user["is_active"]
    )

# GitHub Search Routes
@app.post("/github/search")
def search_github_repos(search: GitHubRepoSearch, _current_user: Dict[str, Any] = Depends(get_current_user)):
    """Search GitHub repositories"""
    try:
        url = "https://api.github.com/search/repositories"
        params = {
            "q": search.query,
            "sort": search.sort,
            "order": search.order,
            "per_page": search.per_page,
        }
        
        if search.language:
            params["q"] += f" language:{search.language}"
        
        headers = {"Accept": "application/vnd.github.v3+json"}
        github_token = (_current_user.get("settings") or {}).get("github_token") or os.getenv("GITHUB_TOKEN")
        if github_token:
            headers["Authorization"] = f"token {github_token}"
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Format the results
        repos = []
        for repo in data.get("items", []):
            repos.append({
                "id": repo["id"],
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo["description"],
                "html_url": repo["html_url"],
                "clone_url": repo["clone_url"],
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "language": repo["language"],
                "updated_at": repo["updated_at"],
                "size": repo["size"],
            })
        
        return {
            "total_count": data.get("total_count", 0),
            "repositories": repos
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

# Tutorial Generation Routes
@app.post("/generate")
def generate_tutorial(config: ProjectConfig, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Start a new tutorial generation job"""
    job_id = str(uuid.uuid4())
    
    # Initialize job tracking
    if config.local_dir and os.getenv("ALLOW_LOCAL_DIRS", "").lower() != "true":
        raise HTTPException(status_code=400, detail="Local directory sources are disabled on this server. Use a GitHub repository URL.")

    if not config.github_token:
        saved_token = (current_user.get("settings") or {}).get("github_token")
        if saved_token:
            config.github_token = saved_token

    job_doc = {
        "_id": job_id,
        "user_id": current_user["_id"],
        "status": "pending",
        "progress": 0,
        "current_step": None,
        "result": None,
        "error": None,
        "logs": [{
            "timestamp": datetime.now(timezone.utc),
            "level": "INFO",
            "message": f"Job created for repository: {config.repo_url or config.local_dir}",
            "step": "Initializing",
            "progress": 0
        }],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "name": config.project_name or (config.repo_url or config.local_dir or "").rstrip("/").split("/")[-1] or "Untitled project",
        "source": config.repo_url or config.local_dir,
        "type": "github" if config.repo_url else "local",
    }
    
    if jobs_collection is not None:
        jobs_collection.insert_one(job_doc)
    
    # Submit the flow to run in background
    executor.submit(run_tutorial_flow, job_id, config, current_user["_id"])
    
    return {"job_id": job_id}

@app.get("/status/{job_id}")
def get_job_status(job_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get the status of a tutorial generation job"""
    if jobs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    job = jobs_collection.find_one({"_id": job_id, "user_id": current_user["_id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job["_id"],
        "name": job.get("name"),
        "source": job.get("source"),
        "type": job.get("type"),
        "created_at": job["created_at"].isoformat() if job.get("created_at") else None,
        "status": job["status"],
        "progress": job["progress"],
        "current_step": job.get("current_step"),
        "result": job.get("result"),
        "error": job.get("error"),
        "logs": job.get("logs", [])
    }

@app.get("/status/{job_id}/stream")
async def stream_job_status(job_id: str, token: str):
    """Stream real-time job status updates using Server-Sent Events"""
    if jobs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    # Authenticate user from token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await asyncio.to_thread(users_collection.find_one, {"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Verify job exists and belongs to user
    job = await asyncio.to_thread(jobs_collection.find_one, {"_id": job_id, "user_id": user["_id"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    async def generate_updates():
        import asyncio
        last_update_time = None
        
        while True:
            try:
                # Get current job status (in a thread — never block the event loop)
                current_job = await asyncio.to_thread(
                    jobs_collection.find_one, {"_id": job_id, "user_id": user["_id"]}
                )
                if not current_job:
                    break
                
                # Check if there's been an update
                current_update_time = current_job.get("updated_at")
                if last_update_time != current_update_time:
                    last_update_time = current_update_time
                    
                    # Format the data for SSE
                    data = {
                        "id": current_job["_id"],
                        "status": current_job["status"],
                        "progress": current_job["progress"],
                        "current_step": current_job.get("current_step"),
                        "result": current_job.get("result"),
                        "error": current_job.get("error"),
                        "logs": current_job.get("logs", [])
                    }
                    
                    yield f"data: {json.dumps(data, default=lambda o: o.isoformat() if isinstance(o, datetime) else str(o))}\n\n"
                
                # Stop streaming if job is complete or failed
                if current_job["status"] in ["completed", "failed"]:
                    break
                    
                # Wait before next check
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"SSE Error: {e}")
                break
    
    return StreamingResponse(
        generate_updates(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.get("/dashboard/stats")
def get_dashboard_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get real-time dashboard statistics"""
    if projects_collection is None or jobs_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    user_id = current_user["_id"]
    
    # Get all projects for the user
    projects = list(projects_collection.find({"user_id": user_id}))
    
    # Calculate statistics
    total_projects = len(projects)
    completed_projects = len([p for p in projects if p.get("status") == "completed"])
    processing_projects = len([p for p in projects if p.get("status") in ["processing", "pending"]])
    failed_projects = len([p for p in projects if p.get("status") == "failed"])
    
    # Calculate success rate
    success_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
    
    # Get active jobs
    active_jobs = list(jobs_collection.find({
        "user_id": user_id, 
        "status": {"$in": ["processing", "pending"]}
    }).sort("created_at", -1).limit(10))
    
    # Get recent activity (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_projects = list(projects_collection.find({
        "user_id": user_id,
        "created_at": {"$gte": seven_days_ago}
    }).sort("created_at", -1))
    
    # Calculate trends (compare with previous period)
    fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
    previous_period_projects = list(projects_collection.find({
        "user_id": user_id,
        "created_at": {"$gte": fourteen_days_ago, "$lt": seven_days_ago}
    }))
    
    # Calculate trends
    current_week_count = len(recent_projects)
    previous_week_count = len(previous_period_projects)
    
    total_change = ((current_week_count - previous_week_count) / previous_week_count * 100) if previous_week_count > 0 else 0
    
    # Get completion trend
    recent_completed = len([p for p in recent_projects if p.get("status") == "completed"])
    previous_completed = len([p for p in previous_period_projects if p.get("status") == "completed"])
    completed_change = ((recent_completed - previous_completed) / previous_completed * 100) if previous_completed > 0 else 0
    
    return {
        "stats": {
            "total_projects": {
                "value": total_projects,
                "change": f"{total_change:+.0f}%" if total_change != 0 else "0%",
                "trend": "up" if total_change > 0 else "down" if total_change < 0 else "neutral"
            },
            "completed_projects": {
                "value": completed_projects,
                "change": f"{completed_change:+.0f}%" if completed_change != 0 else "0%",
                "trend": "up" if completed_change > 0 else "down" if completed_change < 0 else "neutral"
            },
            "processing_projects": {
                "value": processing_projects,
                "change": f"{processing_projects}" if processing_projects > 0 else "0",
                "trend": "neutral"
            },
            "success_rate": {
                "value": f"{success_rate:.0f}%",
                "change": f"{success_rate:.0f}%",
                "trend": "up" if success_rate >= 80 else "down" if success_rate < 60 else "neutral"
            }
        },
        "active_jobs": [
            {
                "id": str(job["_id"]),
                "name": job.get("name"),
                "source": job.get("source"),
                "type": job.get("type"),
                "status": job["status"],
                "progress": job.get("progress", 0),
                "current_step": job.get("current_step"),
                "created_at": job["created_at"].isoformat(),
                "updated_at": job.get("updated_at", job["created_at"]).isoformat()
            }
            for job in active_jobs
        ],
        "recent_activity": [
            {
                "id": str(project["_id"]),
                "name": project["name"],
                "status": project.get("status", "unknown"),
                "created_at": project["created_at"].isoformat(),
                "completed_at": project.get("completed_at").isoformat() if project.get("completed_at") else None
            }
            for project in recent_projects[:5]  # Last 5 recent projects
        ]
    }

@app.get("/projects")
def get_projects(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all projects for the current user"""
    if projects_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    projects = list(projects_collection.find({"user_id": current_user["_id"]}))
    
    # Normalize ids for JSON serialization
    for project in projects:
        project["id"] = project["_id"]
        del project["_id"]
        if isinstance(project.get("config"), dict):
            project["config"].pop("github_token", None)
        if "created_at" in project:
            project["created_at"] = project["created_at"].isoformat()
        if "completed_at" in project:
            project["completed_at"] = project["completed_at"].isoformat()
    
    return projects

@app.get("/projects/{project_id}")
def get_project(project_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get a specific project"""
    if projects_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    project = projects_collection.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get("config"), dict):
        project["config"].pop("github_token", None)
    project["id"] = project["_id"]
    del project["_id"]
    if "created_at" in project:
        project["created_at"] = project["created_at"].isoformat()
    if "completed_at" in project:
        project["completed_at"] = project["completed_at"].isoformat()
    
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a project"""
    if projects_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    project = projects_collection.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete output files only when safely inside the output base directory
    output_dir = project.get("output_dir")
    if output_dir and os.path.exists(output_dir):
        base = os.path.realpath("output")
        target = os.path.realpath(output_dir)
        if target != base and target.startswith(base + os.sep):
            import shutil
            shutil.rmtree(target)
        else:
            print(f"Refusing to delete suspicious output path: {output_dir!r}")
    
    # Delete from database
    projects_collection.delete_one({"_id": project_id, "user_id": current_user["_id"]})
    
    return {"message": "Project deleted successfully"}

@app.get("/settings")
def get_settings(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get application settings"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Get user with settings from database
        users_collection = db.users
        user_doc = users_collection.find_one({"_id": current_user["_id"]})
        
        # Extract settings or use defaults
        user_settings = user_doc.get("settings", {}) if user_doc else {}
        
        return {
            "default_language": user_settings.get("default_language", "english"),
            "max_file_size": user_settings.get("max_file_size", 100000),
            "cache_enabled": user_settings.get("cache_enabled", True),
            "max_abstractions": user_settings.get("max_abstractions", 10),
            "auto_save": user_settings.get("auto_save", True),
            "theme": user_settings.get("theme", "system"),
            "notifications": user_settings.get("notifications", True),
            "github_token_configured": bool(user_settings.get("github_token") or os.getenv("GITHUB_TOKEN")),
            "user": {
                "id": current_user["_id"],
                "email": current_user["email"],
                "full_name": current_user["full_name"]
            }
        }
    
    except Exception as e:
        print(f"Error getting settings: {e}")
        # Return defaults if database error
        return {
            "default_language": "english",
            "max_file_size": 100000,
            "cache_enabled": True,
            "max_abstractions": 10,
            "auto_save": True,
            "theme": "system", 
            "notifications": True,
            "github_token_configured": bool(os.getenv("GITHUB_TOKEN")),
            "user": {
                "id": current_user["_id"],
                "email": current_user["email"],
                "full_name": current_user["full_name"]
            }
        }

@app.put("/settings")
def update_settings(settings: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update application settings"""
    # For now, we'll store settings in the user document
    # In a production app, you might want a separate settings collection
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    try:
        # Merge the allowed fields into the user's nested settings dict.
        allowed = {"default_language", "max_file_size", "cache_enabled", "max_abstractions",
                   "auto_save", "theme", "notifications", "github_token"}
        incoming = {k: v for k, v in settings.items() if k in allowed}
        # An empty github_token means "keep the existing one"
        if incoming.get("github_token") == "":
            incoming.pop("github_token")

        if incoming:
            users_collection = db.users
            user_doc = users_collection.find_one({"_id": current_user["_id"]}) or {}
            merged = dict(user_doc.get("settings") or {})
            merged.update(incoming)
            users_collection.update_one(
                {"_id": current_user["_id"]},
                {"$set": {"settings": merged}}
            )
        
        return {"message": "Settings updated successfully"}
    
    except Exception as e:
        print(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

# Tutorial Management Routes
@app.get("/tutorials")
def get_tutorials(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all tutorials for the current user"""
    if tutorials_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    tutorials = list(tutorials_collection.find({"user_id": current_user["_id"]}))
    
    # Normalize ids and format dates
    for tutorial in tutorials:
        tutorial["id"] = tutorial["_id"]
        del tutorial["_id"]
        if "created_at" in tutorial:
            tutorial["created_at"] = tutorial["created_at"].isoformat()
        if "updated_at" in tutorial:
            tutorial["updated_at"] = tutorial["updated_at"].isoformat()
    
    return tutorials

@app.get("/tutorials/{tutorial_id}")
def get_tutorial(tutorial_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get a specific tutorial"""
    if tutorials_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    tutorial = tutorials_collection.find_one({"_id": tutorial_id, "user_id": current_user["_id"]})
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    tutorial["id"] = tutorial["_id"]
    del tutorial["_id"]
    if "created_at" in tutorial:
        tutorial["created_at"] = tutorial["created_at"].isoformat()
    if "updated_at" in tutorial:
        tutorial["updated_at"] = tutorial["updated_at"].isoformat()
    
    return tutorial

@app.get("/tutorials/{tutorial_id}/download/pdf")
def download_tutorial_pdf(tutorial_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Download tutorial as PDF"""
    if tutorials_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    tutorial = tutorials_collection.find_one({"_id": tutorial_id, "user_id": current_user["_id"]})
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    try:
        # Generate PDF using new Node.js service with user email
        pdf_content = generate_pdf_with_nodejs_service(
            tutorial["content"], 
            tutorial["title"],
            current_user.get("email")
        )
        
        # Create response with PDF
        headers = {
            'Content-Disposition': f'attachment; filename="{tutorial["title"]}.pdf"',
            'Content-Type': 'application/pdf'
        }
        
        return Response(content=pdf_content, headers=headers, media_type='application/pdf')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@app.get("/projects/{project_id}/download/pdf")
def download_project_pdf(project_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Download project tutorial as PDF"""
    print(f"PDF download requested for project {project_id} by user {current_user['_id']}")
    
    if projects_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    project = projects_collection.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        print(f"Project {project_id} not found for user {current_user['_id']}")
        raise HTTPException(status_code=404, detail="Project not found")
    
    print(f"Project found: {project['name']}, status: {project['status']}")
    
    if project["status"] != "completed":
        raise HTTPException(status_code=400, detail="Project is not completed yet")
    
    try:
        tutorial_content = ""
        project_name = project.get("name", "Tutorial")
        
        # Try to find associated tutorial first
        if tutorials_collection is not None:
            tutorial = tutorials_collection.find_one({"project_id": project_id, "user_id": current_user["_id"]})
            if tutorial:
                print("Found tutorial in database, using content from database")
                tutorial_content = tutorial["content"]
                project_name = tutorial["title"]
            else:
                print("No tutorial found in database, trying to read from project result")
                # Fallback: generate from project result if no tutorial found
                if not project.get("result") or not project["result"].get("chapters"):
                    print("No result or chapters found in project")
                    raise HTTPException(status_code=404, detail="No tutorial content found")
                
                # Get chapters from project result
                chapters = project["result"]["chapters"]
                print(f"Found {len(chapters)} chapters to process")
                
                # Try to determine if chapters are content strings or file paths
                for i, chapter in enumerate(chapters):
                    if isinstance(chapter, str):
                        # Check if it looks like a file path or content
                        if chapter.startswith('#') or len(chapter) > 500:
                            # Looks like markdown content
                            print(f"Chapter {i+1}: Using direct content ({len(chapter)} characters)")
                            tutorial_content += f"\n\n{chapter}\n\n"
                        elif os.path.exists(chapter):
                            # It's a file path and the file exists
                            print(f"Chapter {i+1}: Reading from file: {chapter}")
                            try:
                                with open(chapter, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                    tutorial_content += f"\n\n{content}\n\n"
                                    print(f"Successfully read {len(content)} characters from {chapter}")
                            except Exception as file_error:
                                print(f"Error reading file {chapter}: {file_error}")
                        else:
                            # Treat as content even if it doesn't look like typical markdown
                            print(f"Chapter {i+1}: Treating as content ({len(chapter)} characters)")
                            tutorial_content += f"\n\n{chapter}\n\n"
                
                # Also try reading from chapter_files if available
                if project["result"].get("chapter_files"):
                    print(f"Found {len(project['result']['chapter_files'])} additional chapter files")
                    for chapter_file in project["result"]["chapter_files"]:
                        if os.path.exists(chapter_file):
                            try:
                                with open(chapter_file, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                    tutorial_content += f"\n\n{content}\n\n"
                                    print(f"Successfully read {len(content)} characters from {chapter_file}")
                            except Exception as file_error:
                                print(f"Error reading file {chapter_file}: {file_error}")
                
                if not tutorial_content.strip():
                    print("No tutorial content found after processing chapters")
                    raise HTTPException(status_code=404, detail="No tutorial content available")
                
                print(f"Combined tutorial content: {len(tutorial_content)} characters")
        else:
            raise HTTPException(status_code=500, detail="Tutorial service not available")
        
        # Generate PDF using new Node.js service with user email
        print(f"Generating PDF for '{project_name}' with {len(tutorial_content)} characters")
        pdf_content = generate_pdf_with_nodejs_service(tutorial_content, project_name, current_user.get("email"))
        print(f"Generated PDF: {len(pdf_content)} bytes")
        
        # Create response with PDF
        safe_filename = "".join(c for c in project_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        headers = {
            'Content-Disposition': f'attachment; filename="{safe_filename}-tutorial.pdf"',
            'Content-Type': 'application/pdf'
        }
        
        return Response(content=pdf_content, headers=headers, media_type='application/pdf')
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@app.delete("/tutorials/{tutorial_id}")
def delete_tutorial(tutorial_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a tutorial"""
    if tutorials_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    tutorial = tutorials_collection.find_one({"_id": tutorial_id, "user_id": current_user["_id"]})
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    tutorials_collection.delete_one({"_id": tutorial_id, "user_id": current_user["_id"]})
    
    return {"message": "Tutorial deleted successfully"}

@app.get("/projects/{project_id}/export")
def export_project_tutorial(project_id: str, format: str = "markdown", current_user: Dict[str, Any] = Depends(get_current_user)):
    """Export project tutorial in different formats"""
    if projects_collection is None:
        raise HTTPException(status_code=500, detail="Database not available")
    
    project = projects_collection.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["status"] != "completed":
        raise HTTPException(status_code=400, detail="Project is not completed yet")
    
    try:
        # Try to find associated tutorial first
        tutorial_content = ""
        if tutorials_collection is not None:
            tutorial = tutorials_collection.find_one({"project_id": project_id, "user_id": current_user["_id"]})
            if tutorial:
                tutorial_content = tutorial["content"]
            else:
                # Fallback: generate from project result if no tutorial found
                if not project.get("result") or not project["result"].get("chapters"):
                    raise HTTPException(status_code=404, detail="No tutorial content found")
                
                # Get chapters from project result - handle both content and file paths
                chapters = project["result"]["chapters"]
                for i, chapter in enumerate(chapters):
                    if isinstance(chapter, str):
                        # Check if it looks like a file path or content
                        if chapter.startswith('#') or len(chapter) > 500:
                            # Looks like markdown content
                            tutorial_content += f"\n\n{chapter}\n\n"
                        elif os.path.exists(chapter):
                            # It's a file path and the file exists
                            with open(chapter, 'r', encoding='utf-8') as f:
                                tutorial_content += f"\n\n{f.read()}\n\n"
                        else:
                            # Treat as content even if it doesn't look like typical markdown
                            tutorial_content += f"\n\n{chapter}\n\n"
                
                # Also try reading from chapter_files if available
                if project["result"].get("chapter_files"):
                    for chapter_file in project["result"]["chapter_files"]:
                        if os.path.exists(chapter_file):
                            with open(chapter_file, 'r', encoding='utf-8') as f:
                                tutorial_content += f"\n\n{f.read()}\n\n"
        else:
            raise HTTPException(status_code=500, detail="Tutorial service not available")
        
        if not tutorial_content.strip():
            raise HTTPException(status_code=404, detail="No tutorial content available")
        
        # Generate response based on format
        if format == "markdown":
            headers = {
                'Content-Disposition': f'attachment; filename="{project["name"]}-tutorial.md"',
                'Content-Type': 'text/markdown'
            }
            return Response(content=tutorial_content, headers=headers, media_type='text/markdown')
            
        elif format == "html":
            # Convert markdown to HTML
            html_content = markdown.markdown(tutorial_content, extensions=['tables', 'fenced_code', 'toc'])
            html_full = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{project["name"]} Tutorial</title>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }}
        h1, h2, h3 {{ color: #2563eb; }}
        code {{ background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }}
        pre {{ background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }}
        blockquote {{ border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 16px 0; }}
    </style>
</head>
<body>
    {html_content}
    <hr>
    <p><em>Generated with CodeTutor AI</em></p>
</body>
</html>
"""
            headers = {
                'Content-Disposition': f'attachment; filename="{project["name"]}-tutorial.html"',
                'Content-Type': 'text/html'
            }
            return Response(content=html_full, headers=headers, media_type='text/html')
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use 'markdown' or 'html'")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export tutorial: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    web_workers = int(os.getenv("WEB_CONCURRENCY", "2"))
    if web_workers > 1:
        uvicorn.run("backend:app", host="0.0.0.0", port=port, workers=web_workers)
    else:
        uvicorn.run(app, host="0.0.0.0", port=port)