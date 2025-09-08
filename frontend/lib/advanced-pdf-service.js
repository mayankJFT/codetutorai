const React = require('react');
const { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Font, Image, Link } = require('@react-pdf/renderer');
const { marked } = require('marked');

// Use built-in fonts to avoid font loading issues
// React-PDF has built-in support for Helvetica, Times, and Courier

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151'
  },
  
  // Header styles
  header: {
    marginBottom: 40,
    paddingBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    textAlign: 'center'
  },
  
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: 500
  },
  
  // Content styles
  content: {
    flexGrow: 1
  },
  
  // Typography
  h1: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    marginTop: 30,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    letterSpacing: -0.5
  },
  
  h2: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1f2937',
    marginTop: 25,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  
  h3: {
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    marginTop: 20,
    marginBottom: 10
  },
  
  paragraph: {
    fontSize: 11,
    lineHeight: 1.7,
    marginBottom: 12,
    color: '#4b5563',
    textAlign: 'justify'
  },
  
  // Code styles
  codeBlock: {
    backgroundColor: '#f9fafb',
    border: '1pt solid #e5e7eb',
    borderRadius: 6,
    padding: 16,
    marginVertical: 12,
    fontFamily: 'Courier',
    fontSize: 9,
    lineHeight: 1.4,
    color: '#374151'
  },
  
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 9,
    backgroundColor: '#f3f4f6',
    color: '#dc2626',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    fontSize: 11,
    color: '#4b5563'
  },
  
  listBullet: {
    width: 20,
    color: '#6b7280',
    fontWeight: 600
  },
  
  listContent: {
    flex: 1,
    lineHeight: 1.6
  },
  
  // Blockquote
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    borderRadius: 6
  },
  
  blockquoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#1e40af',
    lineHeight: 1.6
  },
  
  // Table styles
  table: {
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 600
  },
  
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    lineHeight: 1.4
  },
  
  // Footer styles
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: 500
  },
  
  footerDate: {
    fontSize: 9,
    color: '#9ca3af'
  },
  
  // Page numbers
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 20,
    right: 40,
    color: '#9ca3af'
  },
  
  // Spacing utilities
  spacingSmall: {
    marginBottom: 8
  },
  
  spacingMedium: {
    marginBottom: 16
  },
  
  spacingLarge: {
    marginBottom: 24
  }
});

class AdvancedPDFService {
  constructor() {
    this.configureMarked();
  }

  configureMarked() {
    // Configure marked for better parsing
    marked.setOptions({
      breaks: true,
      gfm: true,
      sanitize: false
    });
  }

  parseMarkdownToElements(markdown) {
    const tokens = marked.lexer(markdown);
    return this.tokensToElements(tokens);
  }

  tokensToElements(tokens) {
    const elements = [];
    
    tokens.forEach((token, index) => {
      switch (token.type) {
        case 'heading':
          elements.push(this.createHeading(token, index));
          break;
        case 'paragraph':
          elements.push(this.createParagraph(token, index));
          break;
        case 'code':
          elements.push(this.createCodeBlock(token, index));
          break;
        case 'blockquote':
          elements.push(this.createBlockquote(token, index));
          break;
        case 'list':
          elements.push(this.createList(token, index));
          break;
        case 'table':
          elements.push(this.createTable(token, index));
          break;
        case 'space':
          elements.push(React.createElement(View, { key: `space-${index}`, style: styles.spacingSmall }));
          break;
      }
    });
    
    return elements;
  }

  createHeading(token, index) {
    const headingStyles = {
      1: styles.h1,
      2: styles.h2,
      3: styles.h3,
      4: styles.h3,
      5: styles.h3,
      6: styles.h3
    };
    
    return React.createElement(
      Text, 
      { 
        key: `heading-${index}`, 
        style: [headingStyles[token.depth] || styles.h3, styles.spacingMedium] 
      },
      token.text
    );
  }

  createParagraph(token, index) {
    const text = this.parseInlineText(token.text);
    return React.createElement(
      Text, 
      { 
        key: `paragraph-${index}`, 
        style: [styles.paragraph, styles.spacingSmall] 
      },
      text
    );
  }

  createCodeBlock(token, index) {
    return React.createElement(
      View,
      { key: `codeblock-${index}`, style: styles.codeBlock },
      React.createElement(
        Text,
        { style: { fontFamily: 'Courier', fontSize: 9, lineHeight: 1.4 } },
        token.text
      )
    );
  }

  createBlockquote(token, index) {
    const content = this.tokensToElements(token.tokens);
    return React.createElement(
      View,
      { key: `blockquote-${index}`, style: styles.blockquote },
      React.createElement(
        View,
        null,
        ...content.map(child => 
          React.cloneElement(child, { 
            style: [child.props.style, styles.blockquoteText] 
          })
        )
      )
    );
  }

  createList(token, index) {
    const items = token.items.map((item, itemIndex) => {
      const bullet = token.ordered ? `${itemIndex + 1}.` : '•';
      return React.createElement(
        View,
        { key: `list-item-${itemIndex}`, style: styles.listItem },
        React.createElement(
          Text,
          { style: styles.listBullet },
          bullet
        ),
        React.createElement(
          Text,
          { style: styles.listContent },
          item.text
        )
      );
    });

    return React.createElement(
      View,
      { key: `list-${index}`, style: styles.spacingMedium },
      ...items
    );
  }

  createTable(token, index) {
    const headerRow = React.createElement(
      View,
      { style: [styles.tableRow, styles.tableHeader] },
      ...token.header.map((header, cellIndex) =>
        React.createElement(
          Text,
          { key: `header-${cellIndex}`, style: styles.tableCell },
          header.text
        )
      )
    );

    const bodyRows = token.rows.map((row, rowIndex) =>
      React.createElement(
        View,
        { key: `row-${rowIndex}`, style: styles.tableRow },
        ...row.map((cell, cellIndex) =>
          React.createElement(
            Text,
            { key: `cell-${cellIndex}`, style: styles.tableCell },
            cell.text
          )
        )
      )
    );

    return React.createElement(
      View,
      { key: `table-${index}`, style: [styles.table, styles.spacingMedium] },
      headerRow,
      ...bodyRows
    );
  }

  parseInlineText(text) {
    // Handle inline code, bold, italic
    return text
      .replace(/`([^`]+)`/g, (match, code) => code) // Remove backticks for now
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers for now
      .replace(/\*([^*]+)\*/g, '$1'); // Remove italic markers for now
  }

  createPDFDocument(content, title, userEmail) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const footerText = userEmail ? `Generated by ${userEmail}` : 'Generated by CodeTutor AI';
    const elements = this.parseMarkdownToElements(content);

    return React.createElement(
      Document,
      { 
        title: title,
        author: userEmail || 'CodeTutor AI',
        subject: 'Tutorial Documentation',
        creator: 'CodeTutor AI Advanced PDF Generator'
      },
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        
        // Header
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(
            Text,
            { style: styles.title },
            title
          ),
          React.createElement(
            Text,
            { style: styles.subtitle },
            'Professional Tutorial Documentation'
          )
        ),
        
        // Content
        React.createElement(
          View,
          { style: styles.content },
          ...elements
        ),
        
        // Footer
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            Text,
            { style: styles.footerText },
            footerText
          ),
          React.createElement(
            Text,
            { style: styles.footerDate },
            currentDate
          )
        ),
        
        // Page number
        React.createElement(
          Text,
          { 
            style: styles.pageNumber,
            render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`
          }
        )
      )
    );
  }

  async generatePDF(content, title, userEmail = null) {
    try {
      console.log(`Generating advanced PDF for '${title}' with React PDF`);
      console.log(`Content preview: ${content.substring(0, 200)}...`);
      
      const document = this.createPDFDocument(content, title, userEmail);
      console.log('Document created successfully');
      
      const pdfBuffer = await pdf(document).toBuffer();
      console.log(`Buffer type: ${typeof pdfBuffer}, length: ${pdfBuffer ? pdfBuffer.length : 'undefined'}`);
      
      if (!pdfBuffer) {
        throw new Error('PDF buffer is null or undefined');
      }
      
      console.log(`Successfully generated advanced PDF: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generating PDF with React PDF:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Advanced PDF generation failed: ${error.message}`);
    }
  }
}

module.exports = AdvancedPDFService;