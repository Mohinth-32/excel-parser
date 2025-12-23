import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

function FileParser() {
  const [parsedData, setParsedData] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setCopied(false);

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(file);
    } else {
      setError('Unsupported file type. Please upload a CSV or Excel file.');
      setParsedData('');
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      complete: (results) => {
        const formattedData = formatData(results.data);
        setParsedData(formattedData);
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setParsedData('');
      }
    });
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Parse all sheets
        let allData = '';
        workbook.SheetNames.forEach((sheetName, index) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (workbook.SheetNames.length > 1) {
            allData += `\n=== Sheet: ${sheetName} ===\n\n`;
          }
          allData += formatData(jsonData);
          if (index < workbook.SheetNames.length - 1) {
            allData += '\n';
          }
        });
        
        setParsedData(allData);
      } catch (error) {
        setError(`Error parsing Excel: ${error.message}`);
        setParsedData('');
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
      setParsedData('');
    };
    reader.readAsArrayBuffer(file);
  };

  const formatData = (data) => {
    if (!data || data.length === 0) return '';
    
    // Find the maximum width for each column
    const columnWidths = [];
    data.forEach(row => {
      row.forEach((cell, index) => {
        const cellStr = String(cell ?? '');
        if (!columnWidths[index] || cellStr.length > columnWidths[index]) {
          columnWidths[index] = cellStr.length;
        }
      });
    });

    // Format each row
    return data.map(row => {
      return row.map((cell, index) => {
        const cellStr = String(cell ?? '');
        return cellStr.padEnd(columnWidths[index], ' ');
      }).join('  |  ');
    }).join('\n');
  };

  const handleCopy = async () => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(parsedData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for browsers that don't support Clipboard API
        copyToClipboardFallback(parsedData);
      }
    } catch (err) {
      // If modern API fails, try fallback method
      try {
        copyToClipboardFallback(parsedData);
      } catch (fallbackErr) {
        setError('Failed to copy to clipboard. Please select and copy manually.');
      }
    }
  };

  const copyToClipboardFallback = (text) => {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    
    // Select the text
    textarea.focus();
    textarea.select();
    
    try {
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      document.body.removeChild(textarea);
      throw err;
    }
  };

  const handleClear = () => {
    setParsedData('');
    setFileName('');
    setError('');
    setCopied(false);
    // Reset file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const processFile = (file) => {
    setFileName(file.name);
    setError('');
    setCopied(false);

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      parseExcel(file);
    } else {
      setError('Unsupported file type. Please upload a CSV or Excel file.');
      setParsedData('');
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="file-parser"
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}>
      <h1>Excel & CSV Parser</h1>
      <p className="subtitle">Upload a file to parse and copy the data</p>

      <div className={`upload-section ${isDragging ? 'dragging' : ''}`}>
        <div className="drop-zone">
          <label htmlFor="file-input" className="upload-label">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Choose File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInputChange}
            className="file-input"
          />
          <p className="drop-hint">or drag and drop your file here</p>
        </div>
        {fileName && <span className="file-name">{fileName}</span>}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {parsedData && (
        <div className="result-section">
          <div className="result-header">
            <h2>Parsed Data</h2>
            <div className="button-group">
              <button onClick={handleCopy} className="copy-button">
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button onClick={handleClear} className="clear-button">
                🗑️ Clear
              </button>
            </div>
          </div>
          <pre className="data-output">{parsedData}</pre>
        </div>
      )}

      
    </div>
  );
}

export default FileParser;
