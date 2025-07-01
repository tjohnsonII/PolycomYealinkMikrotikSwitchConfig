import React, { useState } from 'react';

// Example columns and data for the Hosted Order Tracker
const DEFAULT_COLUMNS = [
  'CUSTOMER ABBREV', 'CUSTOMER NAME', 'LOCATION', 'DEPLOY FROM (SF/GR)', 'PROJECT MANAGER',
  'SURVEY DATE', 'KICKOFF DATE', 'INSTALL DATE', 'ON-NET or OTT', 'ORDER ID', 'PON',
  'LINK TO CONTRACT', '# SEATS MINIMUM', 'PBX TYPE', 'PBX IP ADDRESS', 'PHONE MODEL / QTY',
  'SWITCH / ASSET #', 'UPS / ASSET #', 'SIDECAR / ASSET #', 'MIKROTIK / ASSET #', 'MIKROTIK IP',
  'ATA / ASSET #', 'ALGO / ASSET #', 'Wall Mount | QTY', 'NOTES',
  // Add more columns as needed
];

const DEFAULT_ROWS = [
  // Add a single empty row for initial state
  Object.fromEntries(DEFAULT_COLUMNS.map(col => [col, ''])),
];

const HostedOrderTrackerTab: React.FC = () => {
  const [columns, setColumns] = useState([...DEFAULT_COLUMNS]);
  const [rows, setRows] = useState([...DEFAULT_ROWS]);

  // Add row(s)
  function handleAddRows(count = 1) {
    setRows(rows => [...rows, ...Array(count).fill(0).map(() => Object.fromEntries(columns.map(c => [c, ''])))]);
  }

  // Delete row
  function handleDeleteRow(idx: number) {
    setRows(rows => rows.filter((_, i) => i !== idx));
  }

  // Delete column
  function handleDeleteColumn(col: string) {
    setColumns(cols => cols.filter(c => c !== col));
    setRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[col];
      return newRow;
    }));
  }

  // Cell change
  function handleCellChange(rowIdx: number, col: string, value: string) {
    setRows(rows => {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [col]: value };
      return updated;
    });
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2>Hosted Order Tracker</h2>
      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => handleAddRows(1)} style={{ marginRight: 8 }}>Add 1 Row</button>
        <button type="button" onClick={() => handleAddRows(5)} style={{ marginRight: 8 }}>Add 5 Rows</button>
        <button type="button" onClick={() => handleAddRows(10)} style={{ marginRight: 8 }}>Add 10 Rows</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} style={{ border: '1px solid #ccc', padding: 4, background: '#f4f4f4', position: 'relative' }}>
                  {col}
                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(col)}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                    title={`Delete column ${col}`}
                  >
                    ×
                  </button>
                </th>
              ))}
              <th style={{ border: '1px solid #ccc', padding: 4, background: '#f4f4f4' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col} style={{ border: '1px solid #ccc', padding: 4 }}>
                    <input
                      type="text"
                      value={row[col] || ''}
                      onChange={e => handleCellChange(i, col, e.target.value)}
                      style={{ width: '100%', border: '1px solid #ccc', borderRadius: 4, padding: 4 }}
                    />
                  </td>
                ))}
                <td style={{ border: '1px solid #ccc', padding: 4, textAlign: 'center' }}>
                  <button type="button" onClick={() => handleDeleteRow(i)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HostedOrderTrackerTab;
