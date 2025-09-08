const { jsPDF } = require('jspdf');
const { marked } = require('marked');

// Simple syntax highlighting without PrismJS to avoid loading issues

class EnhancedPDFService {
  constructor() {
    this.configureMarked();
    this.syntaxColors = {
      'comment': [107, 114, 128],      // #6b7280 - gray
      'keyword': [147, 51, 234],       // #9333ea - purple
      'string': [34, 197, 94],         // #22c55e - green
      'number': [249, 115, 22],        // #f97316 - orange
      'function': [59, 130, 246],      // #3b82f6 - blue
      'operator': [156, 163, 175],     // #9ca3af - gray
      'punctuation': [75, 85, 99],     // #4b5563 - dark gray
      'variable': [168, 85, 247],      // #a855f7 - purple
      'property': [14, 165, 233],      // #0ea5e9 - sky blue
      'class-name': [236, 72, 153],    // #ec4899 - pink
      'regex': [34, 197, 94],          // #22c55e - green
      'boolean': [249, 115, 22],       // #f97316 - orange
      'builtin': [59, 130, 246],       // #3b82f6 - blue
      'default': [55, 65, 81]          // #374151 - dark gray
    };
  }

  configureMarked() {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  detectLanguage(code) {
    // Simple language detection based on common patterns
    if (code.includes('function') && code.includes('const')) return 'javascript';
    if (code.includes('def ') || code.includes('import ')) return 'python';
    if (code.includes('class ') && code.includes('public')) return 'java';
    if (code.includes('#include') || code.includes('std::')) return 'cpp';
    if (code.includes('SELECT') || code.includes('FROM')) return 'sql';
    if (code.includes('{') && code.includes('}')) return 'json';
    return 'javascript'; // default
  }

  highlightCode(code, language = null) {
    // Simple regex-based syntax highlighting
    const detectedLang = language || this.detectLanguage(code);
    const tokens = [];
    
    try {
      switch (detectedLang) {
        case 'javascript':
        case 'typescript':
          return this.highlightJavaScript(code);
        case 'python':
          return this.highlightPython(code);
        case 'java':
          return this.highlightJava(code);
        default:
          return this.highlightGeneric(code);
      }
    } catch (error) {
      console.warn('Syntax highlighting failed:', error);
      return [{ text: code, type: 'default' }];
    }
  }

  highlightJavaScript(code) {
    const tokens = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) tokens.push({ text: '\n', type: 'default' });
      
      // Comment highlighting
      if (line.trim().startsWith('//')) {
        tokens.push({ text: line, type: 'comment' });
        return;
      }
      
      // String highlighting
      const parts = line.split(/(".*?"|'.*?'|`.*?`)/);
      parts.forEach((part, partIndex) => {
        if (partIndex % 2 === 1 && (part.startsWith('"') || part.startsWith("'") || part.startsWith('`'))) {
          tokens.push({ text: part, type: 'string' });
        } else {
          // Keyword highlighting
          const keywordRegex = /\b(function|const|let|var|if|else|for|while|return|class|import|export|from|async|await|try|catch)\b/g;
          const withKeywords = part.replace(keywordRegex, '###KEYWORD###$1###KEYWORD###');
          const keywordParts = withKeywords.split('###KEYWORD###');
          
          keywordParts.forEach((keywordPart, keywordIndex) => {
            if (keywordIndex % 2 === 1) {
              tokens.push({ text: keywordPart, type: 'keyword' });
            } else if (keywordPart) {
              // Number highlighting
              const numberRegex = /\b(\d+\.?\d*)\b/g;
              const withNumbers = keywordPart.replace(numberRegex, '###NUMBER###$1###NUMBER###');
              const numberParts = withNumbers.split('###NUMBER###');
              
              numberParts.forEach((numberPart, numberIndex) => {
                if (numberIndex % 2 === 1) {
                  tokens.push({ text: numberPart, type: 'number' });
                } else if (numberPart) {
                  tokens.push({ text: numberPart, type: 'default' });
                }
              });
            }
          });
        }
      });
    });
    
    return tokens;
  }

  highlightPython(code) {
    const tokens = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) tokens.push({ text: '\n', type: 'default' });
      
      // Comment highlighting
      if (line.trim().startsWith('#')) {
        tokens.push({ text: line, type: 'comment' });
        return;
      }
      
      // String highlighting
      const parts = line.split(/(".*?"|'.*?')/);
      parts.forEach((part, partIndex) => {
        if (partIndex % 2 === 1 && (part.startsWith('"') || part.startsWith("'"))) {
          tokens.push({ text: part, type: 'string' });
        } else {
          // Keyword highlighting
          const keywordRegex = /\b(def|class|if|else|elif|for|while|return|import|from|try|except|with|as|pass|break|continue)\b/g;
          const withKeywords = part.replace(keywordRegex, '###KEYWORD###$1###KEYWORD###');
          const keywordParts = withKeywords.split('###KEYWORD###');
          
          keywordParts.forEach((keywordPart, keywordIndex) => {
            if (keywordIndex % 2 === 1) {
              tokens.push({ text: keywordPart, type: 'keyword' });
            } else if (keywordPart) {
              tokens.push({ text: keywordPart, type: 'default' });
            }
          });
        }
      });
    });
    
    return tokens;
  }

  highlightJava(code) {
    const tokens = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) tokens.push({ text: '\n', type: 'default' });
      
      // Comment highlighting
      if (line.trim().startsWith('//')) {
        tokens.push({ text: line, type: 'comment' });
        return;
      }
      
      // String highlighting
      const parts = line.split(/(".*?")/);
      parts.forEach((part, partIndex) => {
        if (partIndex % 2 === 1 && part.startsWith('"')) {
          tokens.push({ text: part, type: 'string' });
        } else {
          // Keyword highlighting
          const keywordRegex = /\b(public|private|class|interface|extends|implements|if|else|for|while|return|new|this|static|final|void|int|String)\b/g;
          const withKeywords = part.replace(keywordRegex, '###KEYWORD###$1###KEYWORD###');
          const keywordParts = withKeywords.split('###KEYWORD###');
          
          keywordParts.forEach((keywordPart, keywordIndex) => {
            if (keywordIndex % 2 === 1) {
              tokens.push({ text: keywordPart, type: 'keyword' });
            } else if (keywordPart) {
              tokens.push({ text: keywordPart, type: 'default' });
            }
          });
        }
      });
    });
    
    return tokens;
  }

  highlightGeneric(code) {
    // Generic highlighting for unknown languages
    return [{ text: code, type: 'default' }];
  }

  async generatePDF(content, title, userEmail = null) {
    try {
      console.log(`Generating enhanced PDF with syntax highlighting for '${title}'`);
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set up document properties
      doc.setProperties({
        title: title,
        creator: 'CodeTutor AI Enhanced',
        author: userEmail || 'CodeTutor AI'
      });

      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Add enhanced header with gradient effect
      doc.setFillColor(99, 102, 241); // Indigo gradient start
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text
      
      // Title with shadow effect
      const titleLines = doc.splitTextToSize(title, maxWidth - 40);
      doc.text(titleLines, margin, 25);
      
      // Enhanced subtitle
      yPosition = 35;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 220, 255); // Light purple
      doc.text('Professional Tutorial with Advanced Code Highlighting', margin, yPosition);
      yPosition = 60;

      // Parse and add content with enhancements
      const tokens = marked.lexer(content);
      yPosition = this.renderTokensEnhanced(doc, tokens, yPosition, margin, maxWidth, pageHeight);

      // Enhanced footer with gradient
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const footerText = userEmail ? `Generated by ${userEmail}` : 'Generated by CodeTutor AI';
      
      // Footer background
      const footerY = pageHeight - 25;
      doc.setFillColor(249, 250, 251); // Light gray background
      doc.rect(0, footerY - 5, pageWidth, 25, 'F');
      
      // Footer line
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
      
      // Footer text with styling
      doc.setFontSize(9);
      doc.setTextColor(99, 102, 241);
      doc.setFont('helvetica', 'bold');
      doc.text(footerText, margin, footerY + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(currentDate, pageWidth - margin - doc.getTextWidth(currentDate), footerY + 5);

      // Enhanced page numbers with styling
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(99, 102, 241);
        doc.setFont('helvetica', 'bold');
        const pageText = `${i} / ${pageCount}`;
        const pageNumWidth = doc.getTextWidth(pageText);
        
        // Page number background
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(99, 102, 241);
        doc.roundedRect(pageWidth - margin - pageNumWidth - 8, footerY + 8, pageNumWidth + 6, 8, 2, 2, 'FD');
        
        doc.text(pageText, pageWidth - margin - pageNumWidth - 5, footerY + 13);
      }

      // Return PDF as buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      console.log(`Successfully generated enhanced PDF: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      throw new Error(`Enhanced PDF generation failed: ${error.message}`);
    }
  }

  renderTokensEnhanced(doc, tokens, yPosition, margin, maxWidth, pageHeight) {
    tokens.forEach((token) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      switch (token.type) {
        case 'heading':
          yPosition = this.renderEnhancedHeading(doc, token, yPosition, margin, maxWidth);
          break;
        case 'paragraph':
          yPosition = this.renderEnhancedParagraph(doc, token, yPosition, margin, maxWidth);
          break;
        case 'code':
          yPosition = this.renderEnhancedCodeBlock(doc, token, yPosition, margin, maxWidth);
          break;
        case 'list':
          yPosition = this.renderEnhancedList(doc, token, yPosition, margin, maxWidth);
          break;
        case 'blockquote':
          yPosition = this.renderEnhancedBlockquote(doc, token, yPosition, margin, maxWidth);
          break;
        case 'space':
          yPosition += 6;
          break;
      }
    });
    return yPosition;
  }

  renderEnhancedHeading(doc, token, yPosition, margin, maxWidth) {
    yPosition += 10;
    
    const sizes = { 1: 20, 2: 17, 3: 15, 4: 13, 5: 12, 6: 11 };
    const colors = { 1: [17, 24, 39], 2: [31, 41, 55], 3: [55, 65, 81] };
    const fontSize = sizes[token.depth] || 12;
    const color = colors[token.depth] || [75, 85, 99];
    
    // Heading background for h1 and h2
    if (token.depth <= 2) {
      const bgColor = token.depth === 1 ? [239, 246, 255] : [249, 250, 251];
      doc.setFillColor(...bgColor);
      doc.roundedRect(margin - 5, yPosition - 5, maxWidth + 10, fontSize + 8, 3, 3, 'F');
    }
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    
    const lines = doc.splitTextToSize(token.text, maxWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.5) + 8;

    // Enhanced underlines with gradients
    if (token.depth <= 2) {
      const lineColor = token.depth === 1 ? [99, 102, 241] : [156, 163, 175];
      doc.setDrawColor(...lineColor);
      doc.setLineWidth(token.depth === 1 ? 1.5 : 1);
      doc.line(margin, yPosition, margin + 120, yPosition);
      yPosition += 8;
    }

    return yPosition;
  }

  renderEnhancedParagraph(doc, token, yPosition, margin, maxWidth) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    // Enhanced text with better formatting
    let text = token.text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold handling
      .replace(/\*(.*?)\*/g, '$1')     // Italic handling
      .replace(/`([^`]+)`/g, '$1');    // Inline code handling

    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Add subtle background for better readability
    if (lines.length > 3) {
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(margin - 3, yPosition - 3, maxWidth + 6, lines.length * 6 + 4, 2, 2, 'F');
    }
    
    doc.text(lines, margin, yPosition);
    
    return yPosition + lines.length * 6 + 10;
  }

  renderEnhancedCodeBlock(doc, token, yPosition, margin, maxWidth) {
    // Enhanced code block background with gradient effect
    const codeLines = token.text.split('\n').filter(line => line.trim());
    const lineHeight = 5.5;
    const padding = 8;
    const blockHeight = (codeLines.length * lineHeight) + (padding * 2);
    
    // Multi-layer background for depth
    doc.setFillColor(17, 24, 39); // Dark background
    doc.roundedRect(margin - 4, yPosition - padding, maxWidth + 8, blockHeight, 4, 4, 'F');
    
    doc.setFillColor(31, 41, 55); // Slightly lighter overlay
    doc.roundedRect(margin - 2, yPosition - padding + 2, maxWidth + 4, blockHeight - 4, 3, 3, 'F');
    
    // Code line numbers background
    doc.setFillColor(55, 65, 81);
    doc.roundedRect(margin, yPosition - padding + 4, 15, blockHeight - 8, 2, 2, 'F');
    
    // Render syntax-highlighted code
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    
    codeLines.forEach((line, lineIndex) => {
      const currentY = yPosition + (lineIndex * lineHeight);
      
      // Line number
      doc.setTextColor(156, 163, 175); // Gray
      doc.text((lineIndex + 1).toString().padStart(2), margin + 2, currentY);
      
      // Highlight the code line
      const highlightedTokens = this.highlightCode(line);
      let xOffset = margin + 18;
      
      highlightedTokens.forEach(({ text, type }) => {
        const color = this.syntaxColors[type] || this.syntaxColors['default'];
        doc.setTextColor(...color);
        
        if (text) {
          doc.text(text, xOffset, currentY);
          xOffset += doc.getTextWidth(text);
        }
      });
    });
    
    return yPosition + blockHeight + 12;
  }

  renderEnhancedList(doc, token, yPosition, margin, maxWidth) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    token.items.forEach((item, index) => {
      // Enhanced bullet styling
      const bullet = token.ordered ? `${index + 1}.` : '●';
      const bulletWidth = doc.getTextWidth(bullet + '  ');
      
      // Bullet background circle
      if (!token.ordered) {
        doc.setFillColor(99, 102, 241);
        doc.circle(margin + 4, yPosition - 2, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('●', margin + 2.5, yPosition);
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
      } else {
        doc.setTextColor(99, 102, 241);
        doc.setFont('helvetica', 'bold');
        doc.text(bullet, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
      }
      
      // Item text with enhanced formatting
      const itemText = item.text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      const lines = doc.splitTextToSize(itemText, maxWidth - bulletWidth);
      doc.text(lines, margin + bulletWidth, yPosition);
      
      yPosition += lines.length * 6 + 4;
    });
    
    return yPosition + 8;
  }

  renderEnhancedBlockquote(doc, token, yPosition, margin, maxWidth) {
    const quoteText = this.extractTextFromTokens(token.tokens);
    const lines = doc.splitTextToSize(quoteText, maxWidth - 15);
    const blockHeight = lines.length * 6 + 12;
    
    // Enhanced blockquote with gradient background
    doc.setFillColor(239, 246, 255); // Light blue
    doc.roundedRect(margin, yPosition - 5, maxWidth, blockHeight, 4, 4, 'F');
    
    // Multi-color left border
    doc.setDrawColor(59, 130, 246); // Blue
    doc.setLineWidth(3);
    doc.line(margin + 5, yPosition - 5, margin + 5, yPosition + blockHeight - 5);
    
    doc.setDrawColor(147, 197, 253); // Light blue accent
    doc.setLineWidth(1);
    doc.line(margin + 9, yPosition - 5, margin + 9, yPosition + blockHeight - 5);
    
    // Quote icon
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('"', margin + 12, yPosition + 2);
    
    // Quote text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 64, 175);
    doc.text(lines, margin + 20, yPosition + 5);
    
    return yPosition + blockHeight + 8;
  }

  extractTextFromTokens(tokens) {
    return tokens.map(token => {
      if (token.text) return token.text;
      if (token.tokens) return this.extractTextFromTokens(token.tokens);
      return '';
    }).join(' ');
  }
}

module.exports = EnhancedPDFService;