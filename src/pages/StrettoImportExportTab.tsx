import React, { useRef, useState } from 'react';
import * as Papa from 'papaparse';

/**
 * StrettoImportExportTab Component
 * 
 * This component provides a dynamic table interface for importing and editing Stretto data.
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

// Default Stretto fields - these represent common Stretto configuration fields
// Note: account1Sip fields use dot notation for nested properties in Stretto configuration
const DEFAULT_STRETTO_FIELDS = [
  'username',
  'password',
  'email',
  'profile',
  'account1Sip.credentials.password',
  'account1Sip.credentials.displayName',
  'account1Sip.credentials.username',
  'account1Sip.domain',
];

// Type definition for a single Stretto form row
type RowType = Record<string, string>;

/**
 * Creates an empty Stretto row with all fields initialized to empty strings
 * @param fields - Array of field names to create empty values for
 * @returns Object with all fields set to empty strings
 */
const createEmptyStrettoRow = (fields = DEFAULT_STRETTO_FIELDS): RowType => 
  fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as RowType);

// Default number of empty rows to display when component loads
const DEFAULT_ROWS = 10;

const StrettoImportExportTab: React.FC = () => {
  // State for managing the dynamic list of field names/columns
  const [columns, setColumns] = useState<string[]>([...DEFAULT_STRETTO_FIELDS]);
  
  // State for managing the table data - array of row objects
  const [rows, setRows] = useState<RowType[]>(
    Array(DEFAULT_ROWS).fill(0).map(() => createEmptyStrettoRow(columns))
  );
  
  // Ref for the hidden download link used for CSV export
  const downloadRef = useRef<HTMLAnchorElement>(null);
  
  // Ref for the table container to control horizontal scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // State for managing import/export error messages
  const [error, setError] = useState('');

  /**
   * Handles CSV file import
   * Parses the uploaded CSV file and validates required fields
   * Only includes rows that have both username and account1Sip.credentials.username
   */
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        // Filter out rows that don't have required fields
        const validRows = (results.data as RowType[]).filter(
          row => row.username && row['account1Sip.credentials.username']
        );
        setRows(validRows);
        
        // Show error message if some rows were skipped
        setError(validRows.length < (results.data as RowType[]).length ? 
          'Some rows were skipped due to missing required fields.' : '');
      },
    });
  }

  /**
   * Handles CSV export functionality
   * Creates a CSV file with current table data and triggers download
   */
  function handleExport() {
    const csvHeader = columns.join(',') + '\n';
    const csvRows = rows.map(row =>
      columns.map(col => `"${(row[col] || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n') + '\n';
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = 'stretto_import.csv';
      downloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /**
   * Handles changes to individual cell inputs
   * Updates the specific row and field with the new value
   */
  function handleCellChange(rowIdx: number, col: string, value: string) {
    setRows(rows => {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [col]: value };
      return updated;
    });
  }

  /**
   * Adds new empty rows to the table
   * @param count - Number of rows to add (default: 1)
   */
  function handleAddRows(count = 1) {
    setRows(rows => [...rows, ...Array(count).fill(0).map(() => createEmptyStrettoRow(columns))]);
  }

  /**
   * Deletes a specific row from the table
   * @param idx - Index of the row to delete
   */
  function handleDeleteRow(idx: number) {
    setRows(rows => rows.filter((_, i) => i !== idx));
  }

  /**
   * Deletes a column from the table
   * Removes the field from columns and removes that property from all rows
   * Prevents deletion if only one column remains
   */
  function handleDeleteColumn(col: string) {
    if (columns.length <= 1) return; // Prevent deleting the last column
    setColumns(cols => cols.filter(c => c !== col));
    setRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[col];
      return newRow;
    }));
  }

  /**
   * Scrolls the table container back to the leftmost position
   * Useful when the table is wide and user wants to return to the beginning
   */
  const scrollToStart = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  };

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto', 
      padding: '0 8px',
      // Ensure the container doesn't cut off content on the left side
      boxSizing: 'border-box'
    }}>
      <h2>Stretto Import/Export</h2>
      
      {/* Control panel for file operations and row management */}
      <div style={{ 
        marginBottom: 12, 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 8, 
        alignItems: 'center' 
      }}>
        <input type="file" accept=".csv" onChange={handleImport} />
        <button type="button" onClick={handleExport}>
          Export as CSV
        </button>
        <button type="button" onClick={() => handleAddRows(1)}>
          Add 1 Row
        </button>
        <button type="button" onClick={() => handleAddRows(5)}>
          Add 5 Rows
        </button>
        <button type="button" onClick={() => handleAddRows(10)}>
          Add 10 Rows
        </button>
        <button type="button" onClick={scrollToStart}>
          Scroll to Start
        </button>
        {/* Hidden download link for CSV export */}
        <a ref={downloadRef} style={{ display: 'none' }}>Download</a>
      </div>

      {/* Display error messages if any */}
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: 8,
          padding: '8px',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {/* Table container with horizontal scroll capability */}
      <div 
        ref={tableContainerRef}
        style={{ 
          width: '100%', 
          overflowX: 'auto',
          // Ensure the container starts at the leftmost position
          marginLeft: 0,
          paddingLeft: 0
        }}
      >
        <table style={{ 
          // Fixed table layout for consistent column widths
          tableLayout: 'fixed',
          // Set minimum width to accommodate all columns
          minWidth: `${columns.length * 100 + 80}px`,
          borderCollapse: 'separate', 
          borderSpacing: '0 6px',
          // Ensure table starts at the left edge
          marginLeft: 0
        }}>
          <thead>
            <tr>
              {/* Render column headers with delete functionality */}
              {columns.map(col => (
                <th 
                  key={col} 
                  style={{ 
                    // Fixed width for data columns
                    width: '100px',
                    border: '1px solid #ccc', 
                    padding: '8px 4px', 
                    background: '#f4f4f4',
                    position: 'relative', 
                    height: '60px',
                    verticalAlign: 'top',
                    textAlign: 'center',
                    // Enable word wrapping for long column names
                    wordWrap: 'break-word',
                    whiteSpace: 'normal'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'flex-start',
                    gap: '4px',
                    height: '100%'
                  }}>
                    {/* Column header text with larger font for readability */}
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '14px',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      // Allow text to wrap within the column
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}>
                      {col}
                    </span>
                    {/* Delete column button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col)}
                      disabled={columns.length <= 1}
                      style={{ 
                        background: columns.length <= 1 ? '#ccc' : '#fff', 
                        border: `1px solid ${columns.length <= 1 ? '#999' : '#f00'}`, 
                        color: columns.length <= 1 ? '#666' : '#f00', 
                        fontWeight: 'bold', 
                        cursor: columns.length <= 1 ? 'not-allowed' : 'pointer', 
                        borderRadius: 4, 
                        padding: '2px 6px',
                        fontSize: '11px',
                        height: '24px',
                        minWidth: '50px'
                      }}
                      title={columns.length <= 1 ? 'Cannot delete the last column' : `Delete column ${col}`}
                    >
                      Delete
                    </button>
                  </div>
                </th>
              ))}
              {/* Actions column header */}
              <th style={{ 
                width: '80px',
                border: '1px solid #ccc', 
                padding: '8px 4px', 
                background: '#f4f4f4',
                textAlign: 'center',
                verticalAlign: 'middle',
                fontSize: '14px',
                fontWeight: 600
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Render table rows or "No data" message */}
            {rows.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + 1} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '20px',
                    fontSize: '16px',
                    color: '#666',
                    fontStyle: 'italic'
                  }}
                >
                  No data available. Import a CSV file or add rows to get started.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} style={{ height: '44px' }}>
                  {/* Render data cells */}
                  {columns.map(col => (
                    <td 
                      key={col} 
                      style={{ 
                        width: '100px',
                        border: '1px solid #ccc', 
                        padding: '2px', 
                        verticalAlign: 'middle', 
                        textAlign: 'center', 
                        background: '#fff' 
                      }}
                    >
                      <input
                        type="text"
                        value={row[col] || ''}
                        onChange={e => handleCellChange(i, col, e.target.value)}
                        style={{ 
                          width: '94px',
                          border: '1px solid #ddd', 
                          borderRadius: 3, 
                          padding: '6px 3px', 
                          fontSize: '14px',
                          textAlign: 'center', 
                          background: '#fff',
                          boxSizing: 'border-box'
                        }}
                        placeholder={`Enter ${col}`}
                      />
                    </td>
                  ))}
                  {/* Actions column with delete button */}
                  <td style={{ 
                    width: '80px',
                    border: '1px solid #ccc', 
                    padding: '2px', 
                    textAlign: 'center', 
                    verticalAlign: 'middle', 
                    background: '#fff' 
                  }}>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteRow(i)} 
                      style={{ 
                        color: 'red', 
                        background: '#fff', 
                        border: '1px solid #f00', 
                        borderRadius: 4, 
                        padding: '4px 8px', 
                        fontWeight: 'bold', 
                        fontSize: '12px',
                        cursor: 'pointer',
                        height: '32px'
                      }}
                      title={`Delete row ${i + 1}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StrettoImportExportTab;
