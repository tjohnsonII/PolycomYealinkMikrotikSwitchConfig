import React from 'react';
import { useRef, useState } from 'react';
import '../styles/inline-styles-fix.css';

/**
 * VPBXImport Component
 * 
 * This component provides a dynamic table interface for importing and editing VPBX (Virtual PBX) data.
 * Key features:
 * - CSV import/export functionality
 * - Dynamic column management (add/delete columns)
 * - Dynamic row management (add/delete rows)
 * - Real-time editing of cell data
 * - Dropdown selection for phone models (ensures valid model selection)
 * - Responsive table design optimized for 100% browser zoom
 * - Word-wrapped column headers for better readability
 * 
 * Special UI Elements:
 * - "model" column uses a dropdown with predefined phone models from phone_models.txt
 * - All other columns use standard text inputs
 * 
 * Table sizing strategy:
 * - Data columns: 100px width (allows ~21 columns + actions to fit on standard screens)
 * - Actions column: 80px width
 * - Total estimated width: ~2,180px (fits most 1920px+ screens at 100% zoom)
 */

// Phone model options for the dropdown - imported from phone_models.txt
const PHONE_MODELS = [
  "VVX400",
  "VVX500", 
  "VVX600",
  "SIP-T46S",
  "SIP-T46U",
  "SIP-T48S",
  "SIP-T48U",
  "T54W",
  "T57W",
  "56h Dect w/ 60p Base",
  "56h Dect w/ 76p Base",
  "56h Dect Handset",
  "Stand Alone Softphone",
  "SideCar Entry",
  "Trio 8500 Conference",
  "SSIP7000",
  "SSIP700-Mic",
  "SSIP6000",
  "SSIP330",
  "HT813 ATA",
  "8180 IP Loud Ringer",
  "8301 Paging Server",
  "8186",
  "W56P",
  "W60P",
  "CP-7842-3PCC",
  "CP-8832-K9",
  "CP-7832-3PCC",
  "CP-8832-3PCC",
  "SPA-122 ATA",
  "CP-7811-3PCC",
  "CP960",
  "CP9200",
  "D230",
  "i12 Door Strike"
];

// Default VPBX fields - these represent common Virtual PBX configuration fields
// Note: VPBX includes additional fields like "mac" and "model" for device management
const DEFAULT_VPBX_FIELDS = [
  "mac", "model", "extension",
  "name", "description", "tech", "secret", "callwaiting_enable", "voicemail",
  "voicemail_enable", "voicemail_vmpwd", "voicemail_email", "voicemail_pager", "voicemail_options",
  "voicemail_same_exten", "outboundcid", "id", "dial", "user", "max_contacts", "accountcode"
];

// Type definition for a single VPBX form row
type VpbxFormType = Record<string, string>;

/**
 * Creates an empty VPBX row with all fields initialized to empty strings
 * @param fields - Array of field names to create empty values for
 * @returns Object with all fields set to empty strings
 */
const createEmptyVpbxRow = (fields = DEFAULT_VPBX_FIELDS): VpbxFormType => 
  fields.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as VpbxFormType);

// Default number of empty rows to display when component loads
const DEFAULT_ROWS = 10;

const VPBXImport: React.FC = () => {
  // State for managing the dynamic list of field names/columns
  const [vpbxFields, setVpbxFields] = useState<string[]>([...DEFAULT_VPBX_FIELDS]);
  
  // State for managing the table data - array of row objects
  const [vpbxRows, setVpbxRows] = useState<VpbxFormType[]>(
    Array(DEFAULT_ROWS).fill(0).map(() => createEmptyVpbxRow(vpbxFields))
  );
  
  // Ref for the hidden download link used for CSV export
  const vpbxDownloadRef = useRef<HTMLAnchorElement>(null);
  
  // Ref for the table container to control horizontal scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Handles changes to individual cell inputs and dropdowns
   * Updates the specific row and field with the new value
   * Supports both input elements and select dropdowns
   */
  const handleVpbxChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVpbxRows(rows => rows.map((row, i) => i === idx ? { ...row, [name]: value } : row));
  };

  /**
   * Deletes a column from the table
   * Removes the field from vpbxFields and removes that property from all rows
   * Prevents deletion if only one column remains
   */
  const handleVpbxDeleteColumn = (field: string) => {
    if (vpbxFields.length <= 1) return; // Prevent deleting the last column
    setVpbxFields(fields => fields.filter(f => f !== field));
    setVpbxRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[field];
      return newRow;
    }));
  };

  /**
   * Adds new empty rows to the table
   * @param count - Number of rows to add (default: 1)
   */
  const handleVpbxAddRow = (count = 1) => {
    setVpbxRows(rows => [...rows, ...Array(count).fill(0).map(() => createEmptyVpbxRow(vpbxFields))]);
  };

  /**
   * Deletes a specific row from the table
   * @param idx - Index of the row to delete
   */
  const handleVpbxDeleteRow = (idx: number) => {
    setVpbxRows(rows => rows.filter((_, i) => i !== idx));
  };

  /**
   * Handles CSV file import
   * Parses the CSV and updates both fields and rows based on the file contents
   */
  const handleVpbxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean); // Split by newlines and remove empty lines
      const [header, ...rows] = lines; // First line is header, rest are data rows
      const fields = header.split(','); // Parse CSV header
      
      setVpbxFields(fields); // Update columns based on CSV header
      
      // Parse each data row and create objects with field names as keys
      const data = rows.map(line => {
        const values = line.split(',');
        return fields.reduce((acc, f, i) => ({ ...acc, [f]: values[i] || '' }), {} as VpbxFormType);
      });
      
      // Update rows with parsed data, or create one empty row if no data
      setVpbxRows(data.length ? data : [createEmptyVpbxRow(fields)]);
    };
    
    reader.readAsText(file);
  };

  /**
   * Exports current table data as CSV
   * Creates a CSV blob and triggers download via hidden link
   */
  const handleVpbxExport = () => {
    // Create CSV content: header row + data rows
    const csv = [vpbxFields.join(',')].concat(
      vpbxRows.map(row => vpbxFields.map(f => row[f] || '').join(','))
    ).join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    if (vpbxDownloadRef.current) {
      vpbxDownloadRef.current.href = url;
      vpbxDownloadRef.current.download = 'vpbx_import.csv';
      vpbxDownloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); // Cleanup URL after download
    }
  };

  return (
    // Main container with optimized styling for proper positioning at 100% zoom
    <div className="vpbx-import-container">
      <h2>VPBX Import</h2>
      
      {/* Control buttons section */}
      <div className="vpbx-import-controls">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleVpbxImport} 
          className="vpbx-import-file-input" 
          title="Import CSV file"
        />
        <button onClick={handleVpbxExport} className="vpbx-import-export-button">Export CSV</button>
        <button 
          onClick={() => {
            // Reset horizontal scroll to show leftmost columns
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollLeft = 0;
            }
          }}
          className="vpbx-import-scroll-button"
        >
          ← Scroll to Start
        </button>
      </div>
      
      {/* Hidden download link for CSV export */}
      <a ref={vpbxDownloadRef} className="vpbx-import-download-link">Download</a>
      
      {/* Informational text about horizontal scrolling */}
      <div className="vpbx-import-scroll-info">
        Scroll horizontally to see all {vpbxFields.length} columns →
      </div>
      
      {/* 
        Table container with horizontal scrolling
        - maxHeight: 60vh prevents table from taking too much vertical space
        - overflowX: auto enables horizontal scrolling when needed
        - Fixed width columns ensure consistent table layout
      */}
      <div 
        ref={tableContainerRef}
        className="vpbx-import-table-container"
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
        <table className="vpbx-import-table">
          <thead>
            <tr>
              {vpbxFields.map((f) => (
                <th key={f} className="vpbx-import-header-cell">
                  {/* Column title with larger font for better readability */}
                  <div className="vpbx-import-header-title">{f}</div>
                  
                  {/* Delete column button */}
                  <button
                    className="vpbx-import-delete-column-button"
                    onClick={() => handleVpbxDeleteColumn(f)}
                    title={`Delete column ${f}`}
                  >
                    Delete
                  </button>
                </th>
              ))}
              
              {/* Actions column header - slightly smaller than data columns */}
              <th className="vpbx-import-actions-header">Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {vpbxRows.map((row, idx) => (
              <tr key={idx}>
                {vpbxFields.map((f) => (
                  <td key={f} className="vpbx-import-data-cell">
                    {/* 
                      Conditional rendering: 
                      - Use dropdown for "model" column to ensure valid phone model selection
                      - Use regular input for all other columns 
                    */}
                    {f === 'model' ? (
                      <select
                        name={f}
                        value={row[f] || ''}
                        onChange={e => handleVpbxChange(idx, e as React.ChangeEvent<HTMLSelectElement>)}
                        className="vpbx-import-select"
                        title={`Select phone model for row ${idx + 1}`}
                      >
                        <option value="">Select Model</option>
                        {PHONE_MODELS.map(model => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={f}
                        value={row[f] || ''}
                        onChange={e => handleVpbxChange(idx, e)}
                        className="vpbx-import-input"
                        placeholder={`Enter ${f}`}
                      />
                    )}
                  </td>
                ))}
                
                {/* Actions column - contains delete row button */}
                <td className="vpbx-import-actions-cell">
                  <button 
                    onClick={() => handleVpbxDeleteRow(idx)}
                    className="vpbx-import-delete-row-button"
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
      <div className="vpbx-import-row-controls">
        <button onClick={() => handleVpbxAddRow(1)} className="vpbx-import-add-row-button">Add 1 Row</button>
        <button onClick={() => handleVpbxAddRow(5)} className="vpbx-import-add-row-button">Add 5 Rows</button>
        <button onClick={() => handleVpbxAddRow(10)} className="vpbx-import-add-row-button">Add 10 Rows</button>
      </div>
    </div>
  );
};

export default VPBXImport;
