import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';

const CodePlayground = ({ 
  initialCode = '', 
  language = 'javascript',
  title = 'Code Playground',
  editable = true,
  showOutput = true 
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    try {
      if (language === 'javascript') {
        // Create a safe execution environment
        const safeConsole = {
          log: (...args) => {
            setOutput(prev => prev + args.join(' ') + '\n');
          }
        };
        
        // Clear previous output
        setOutput('');
        
        // Wrap code in try-catch for safety
        const wrappedCode = `
          try {
            ${code}
          } catch (error) {
            console.log('Error: ' + error.message);
          }
        `;
        
        // Create a new function with our safe console
        const func = new Function('console', wrappedCode);
        func(safeConsole);
        
      } else if (language === 'python') {
        // For Python, we'd need a backend service
        // For now, show a placeholder
        setOutput('Python execution requires backend service...');
      }
    } catch (error) {
      setOutput('Error: ' + error.message);
    }
    setIsRunning(false);
  };

  const resetCode = () => {
    setCode(initialCode);
    setOutput('');
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      
      // Move cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyCode}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={resetCode}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Reset code"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Play size={14} />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Code Editor */}
        <div className="flex-1">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyPress}
            readOnly={!editable}
            className="w-full h-64 bg-gray-900 text-white font-mono text-sm p-4 resize-none outline-none"
            placeholder={`Enter your ${language} code here...`}
            spellCheck="false"
          />
        </div>

        {/* Output Panel */}
        {showOutput && (
          <div className="w-1/2 border-l border-gray-700">
            <div className="bg-gray-800 px-4 py-2 text-gray-300 text-xs font-medium">
              Output
            </div>
            <pre className="h-56 bg-gray-900 text-green-400 font-mono text-sm p-4 overflow-auto whitespace-pre-wrap">
              {output || 'Click "Run" to see output...'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePlayground;