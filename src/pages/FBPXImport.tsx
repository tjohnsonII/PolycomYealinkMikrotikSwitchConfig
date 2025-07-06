import React from 'react';
import { useRef, useState } from 'react';

/**
 * FBPXImport Component
 * 
 * This component provides a dynamic table interface for importing and editing FBPX (FreePBX) data.
 * Key features:
 * - CSV import/export functionality
 * - Dynamic column management (add/delete columns)
 * - Dynamic row management (add/delete rows)
 * - Real-time editing of cell data
 * - Responsive table design optimized for 100% browser zoom
 * - Word-wrapped column headers for better readability
 * 
 * Table sizing strategy:
 * - Data columns: 100px width (allows ~19 columns + actions to fit on standard screens)
 * - Actions column: 80px width
 * - Total estimated width: ~1,980px (fits most 1920px+ screens at 100% zoom)
 */

// Default FBPX fields - these represent common FreePBX extension configuration fields
// In a production environment, these should be imported from a shared constants file
const DEFAULT_FPBX_FIELDS = [
  "extension", "name", "description", "tech", "secret", "callwaiting_enable", "voicemail",
  "voicemail_enable", "voicemail_vmpwd", "voicemail_email", "voicemail_pager", "voicemail_options",
  "voicemail_same_exten", "outboundcid", "id", "dial", "user", "max_contacts", "accountcode"
];

// Type definition for a single FBPX form row
type FpbxFormType = Record<string, string>;

/**
 * Creates an empty FBPX row with all fields initialized to empty strings
 * @param fields - Array of field names to create empty values for
 * @returns Object with all fields set to empty strings
 */
const createEmptyFpbxRow = (fields = DEFAULT_FPBX_FIELDS): FpbxFormType => 
  fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as FpbxFormType);

// Default number of empty rows to display when component loads
const DEFAULT_ROWS = 10;

const FBPXImport: React.FC = () => {
  // State for managing the dynamic list of field names/columns
  const [fpbxFields, setFpbxFields] = useState<string[]>([...DEFAULT_FPBX_FIELDS]);
  
  // State for managing the table data - array of row objects
  const [fpbxRows, setFpbxRows] = useState<FpbxFormType[]>(
    Array(DEFAULT_ROWS).fill(0).map(() => createEmptyFpbxRow(fpbxFields))
  );
  
  // Ref for the hidden download link used for CSV export
  const fpbxDownloadRef = useRef<HTMLAnchorElement>(null);
  
  // Ref for the table container to control horizontal scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Handles changes to individual cell inputs
   * Updates the specific row and field with the new value
   */
  const handleFpbxChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFpbxRows(rows => rows.map((row, i) => i === idx ? { ...row, [name]: value } : row));
  };

  /**
   * Deletes a column from the table
   * Removes the field from fpbxFields and removes that property from all rows
   * Prevents deletion if only one column remains
   */
  const handleFpbxDeleteColumn = (field: string) => {
    if (fpbxFields.length <= 1) return; // Prevent deleting the last column
    setFpbxFields(fields => fields.filter(f => f !== field));
    setFpbxRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[field];
      return newRow;
    }));
  };

  /**
   * Adds new empty rows to the table
   * @param count - Number of rows to add (default: 1)
   */
  const handleFpbxAddRow = (count = 1) => {
    setFpbxRows(rows => [...rows, ...Array(count).fill(0).map(() => createEmptyFpbxRow(fpbxFields))]);
  };

  /**
   * Deletes a specific row from the table
   * @param idx - Index of the row to delete
   */
  const handleFpbxDeleteRow = (idx: number) => {
    setFpbxRows(rows => rows.filter((_, i) => i !== idx));
  };

  /**
   * Handles CSV file import
   * Parses the CSV and updates both fields and rows based on the file contents
   */
  const handleFpbxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean); // Split by newlines and remove empty lines
      const [header, ...rows] = lines; // First line is header, rest are data rows
      const fields = header.split(','); // Parse CSV header
      
      setFpbxFields(fields); // Update columns based on CSV header
      
      // Parse each data row and create objects with field names as keys
      const data = rows.map(line => {
        const values = line.split(',');
        return fields.reduce((acc, f, i) => ({ ...acc, [f]: values[i] || '' }), {} as FpbxFormType);
      });
      
      // Update rows with parsed data, or create one empty row if no data
      setFpbxRows(data.length ? data : [createEmptyFpbxRow(fields)]);
    };
    
    reader.readAsText(file);
  };

  /**
   * Exports current table data as CSV
   * Creates a CSV blob and triggers download via hidden link
   */
  const handleFpbxExport = () => {
    // Create CSV content: header row + data rows
    const csv = [fpbxFields.join(',')].concat(
      fpbxRows.map(row => fpbxFields.map(f => row[f] || '').join(','))
    ).join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    if (fpbxDownloadRef.current) {
      fpbxDownloadRef.current.href = url;
      fpbxDownloadRef.current.download = 'fpbx_import.csv';
      fpbxDownloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); // Cleanup URL after download
    }
  };

  return (
    // Main container with optimized styling for proper positioning at 100% zoom
    <div style={{ 
      padding: '8px 16px',
      minWidth: '100%',
      boxSizing: 'border-box',
      margin: '0 auto',
      transform: 'translateX(0)', // Ensures proper horizontal positioning
      position: 'relative'
    }}>
      <h2>FBPX Import</h2>
      
      {/* Control buttons section */}
      <div style={{ marginBottom: '16px', width: '100%' }}>
        <input type="file" accept=".csv" onChange={handleFpbxImport} style={{ marginRight: '8px' }} />
        <button onClick={handleFpbxExport} style={{ marginRight: '8px' }}>Export CSV</button>
        <button 
          onClick={() => {
            // Reset horizontal scroll to show leftmost columns
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollLeft = 0;
            }
          }}
          style={{ 
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer'
          }}
        >
          ← Scroll to Start
        </button>
      </div>
      
      {/* Hidden download link for CSV export */}
      <a ref={fpbxDownloadRef} style={{ display: 'none' }}>Download</a>
      
      {/* Informational text about horizontal scrolling */}
      <div style={{ 
        marginBottom: '8px', 
        fontSize: '14px', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        Scroll horizontally to see all {fpbxFields.length} columns →
      </div>
      
      {/* 
        Table container with horizontal scrolling
        - maxHeight: 60vh prevents table from taking too much vertical space
        - overflowX: auto enables horizontal scrolling when needed
        - Fixed width columns ensure consistent table layout
      */}
      <div 
        ref={tableContainerRef}
        style={{ 
          overflowX: 'auto', 
          overflowY: 'auto',
          border: '2px solid #ddd',
          borderRadius: '4px',
          maxHeight: '60vh',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: 'white',
          margin: '0',
          padding: '0'
        }}
        onLoad={() => {
          // Ensure table starts scrolled to the left on load
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = 0;
          }
        }}
      >
        {/* 
          Table with fixed layout and optimized column widths
          - tableLayout: 'fixed' ensures consistent column widths
          - borderCollapse: 'separate' allows for better border control
          - Each column is exactly 100px wide for predictable layout
        */}
        <table style={{ 
          borderCollapse: 'separate',
          borderSpacing: '0',
          fontSize: '16px',
          backgroundColor: 'white',
          width: 'auto',
          margin: '0',
          tableLayout: 'fixed'
        }}>
          <thead>
            <tr>
              {fpbxFields.map((f) => (
                <th key={f} style={{ 
                  border: '2px solid #ccc', 
                  padding: '8px 4px', 
                  width: '100px', // Fixed width for consistent layout
                  minWidth: '100px',
                  maxWidth: '100px',
                  backgroundColor: '#f5f5f5',
                  textAlign: 'center',
                  verticalAlign: 'top',
                  whiteSpace: 'normal', // Allow text wrapping
                  wordWrap: 'break-word', // Break long words if needed
                  lineHeight: '1.2',
                  boxSizing: 'border-box'
                }}>
                  {/* Column title with larger font for better readability */}
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '16px', lineHeight: '1.2' }}>{f}</div>
                  
                  {/* Delete column button */}
                  <button
                    style={{ 
                      fontSize: '11px', 
                      padding: '3px 5px', 
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      width: '85%',
                      margin: '0 auto',
                      display: 'block'
                    }}
                    onClick={() => handleFpbxDeleteColumn(f)}
                    title={`Delete column ${f}`}
                  >
                    Delete
                  </button>
                </th>
              ))}
              
              {/* Actions column header - slightly smaller than data columns */}
              <th style={{
                border: '2px solid #ccc',
                padding: '8px 4px',
                backgroundColor: '#f5f5f5',
                width: '80px',
                minWidth: '80px',
                maxWidth: '80px',
                textAlign: 'center',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                lineHeight: '1.2',
                boxSizing: 'border-box',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {fpbxRows.map((row, idx) => (
              <tr key={idx}>
                {fpbxFields.map((f) => (
                  <td key={f} style={{ 
                    border: '2px solid #ccc', 
                    padding: '6px',
                    backgroundColor: 'white',
                    width: '100px', // Match header width exactly
                    minWidth: '100px',
                    maxWidth: '100px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    boxSizing: 'border-box'
                  }}>
                    {/* Input field for editing cell data */}
                    <input
                      name={f}
                      value={row[f] || ''}
                      onChange={e => handleFpbxChange(idx, e)}
                      style={{ 
                        width: '95%', // Slight margin within cell
                        padding: '5px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '14px',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                  </td>
                ))}
                
                {/* Actions column - contains delete row button */}
                <td style={{ 
                  border: '2px solid #ccc', 
                  padding: '6px', 
                  textAlign: 'center',
                  backgroundColor: 'white',
                  width: '80px', // Match header width exactly
                  minWidth: '80px',
                  maxWidth: '80px',
                  verticalAlign: 'middle',
                  boxSizing: 'border-box'
                }}>
                  <button 
                    onClick={() => handleFpbxDeleteRow(idx)}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '5px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Row management buttons */}
      <div style={{ marginTop: 8 }}>
        <button onClick={() => handleFpbxAddRow(1)}>Add 1 Row</button>{' '}
        <button onClick={() => handleFpbxAddRow(5)}>Add 5 Rows</button>{' '}
        <button onClick={() => handleFpbxAddRow(10)}>Add 10 Rows</button>
      </div>
    </div>
  );
};

export default FBPXImport;
