const express = require('express');
const cors = require('cors');
const EnhancedPDFService = require('./lib/enhanced-pdf-service');

const app = express();
const port = process.env.PORT || process.env.PDF_PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize enhanced PDF service
const pdfService = new EnhancedPDFService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'PDF Generation Service',
    timestamp: new Date().toISOString() 
  });
});

// PDF generation endpoint
app.post('/generate-pdf', async (req, res) => {
  try {
    console.log('PDF generation request received');
    
    const { content, title, userEmail } = req.body;
    
    if (!content || !title) {
      return res.status(400).json({ 
        error: 'Content and title are required' 
      });
    }

    console.log(`Generating PDF for: ${title}`);
    console.log(`User: ${userEmail || 'Anonymous'}`);
    console.log(`Content length: ${content.length} characters`);

    // Generate PDF using advanced React PDF service
    const pdfBuffer = await pdfService.generatePDF(content, title, userEmail);
    
    // Check if PDF buffer is valid
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation returned empty buffer');
    }
    
    // Set response headers
    const safeTitle = title.replace(/[^a-zA-Z0-9\s-_]/g, '').trim() || 'tutorial';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    // Send PDF
    res.end(pdfBuffer);
    
    console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

// Start server
app.listen(port, () => {
  console.log(`PDF Generation Service running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;