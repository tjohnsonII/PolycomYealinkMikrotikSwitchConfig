import React, { useRef, useState } from 'react';
import * as Papa from 'papaparse';

const COLUMNS = [
  'username',
  'password',
  'email',
  'profile',
  'account1Sip.credentials.password',
  'account1Sip.credentials.displayName',
  'account1Sip.credentials.username',
  'account1Sip.domain',
];

type RowType = Record<(typeof COLUMNS)[number], string>;

const StrettoImportExportTab: React.FC = () => {
  // Start with 10 rows by default
  const [rows, setRows] = useState<RowType[]>(Array(10).fill(0).map(() => Object.fromEntries(COLUMNS.map(c => [c, ''])) as RowType));
  const [columns, setColumns] = useState<string[]>([...COLUMNS]);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const [error, setError] = useState('');

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const validRows = (results.data as RowType[]).filter(
          row => row.username && row['account1Sip.credentials.username']
        );
        setRows(validRows);
        setError(validRows.length < (results.data as RowType[]).length ? 'Some rows were skipped due to missing required fields.' : '');
      },
    });
  }

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

  // Editable table for Stretto import/export
  function handleCellChange(rowIdx: number, col: string, value: string) {
    setRows(rows => {
      const updated = [...rows];
      updated[rowIdx] = { ...updated[rowIdx], [col]: value };
      return updated;
    });
  }

  function handleAddRows(count = 1) {
    setRows(rows => [...rows, ...Array(count).fill(0).map(() => Object.fromEntries(columns.map(c => [c, ''])) as RowType)]);
  }

  function handleDeleteRow(idx: number) {
    setRows(rows => rows.filter((_, i) => i !== idx));
  }

  // Remove a column (field) from the table
  function handleDeleteColumn(col: string) {
    setColumns(cols => cols.filter(c => c !== col));
    setRows(rows => rows.map(row => {
      const newRow = { ...row };
      delete newRow[col];
      return newRow;
    }));
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px' }}>
      <h2>Stretto Import/Export</h2>
      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
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
        <a ref={downloadRef} style={{ display: 'none' }}>Download</a>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: 1200, width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} style={{ border: '1px solid #ccc', padding: '12px 8px', background: '#f4f4f4', position: 'relative', height: 48, verticalAlign: 'middle', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>{col}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(col)}
                    style={{ background: '#fff', border: '1px solid #f00', color: '#f00', fontWeight: 'bold', cursor: 'pointer', borderRadius: 4, padding: '2px 10px', marginLeft: 4, height: 32 }}
                    title={`Delete column ${col}`}
                  >
                    Delete
                  </button>
                </div>
              </th>
            ))}
            <th style={{ border: '1px solid #ccc', padding: 4, background: '#f4f4f4' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 12 }}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ height: 44 }}>
                {columns.map(col => (
                  <td key={col} style={{ border: '1px solid #ccc', padding: '8px 0', verticalAlign: 'middle', textAlign: 'center', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <input
                        type="text"
                        value={row[col] || ''}
                        onChange={e => handleCellChange(i, col, e.target.value)}
                        style={{ width: '90%', border: '1px solid #ccc', borderRadius: 4, padding: '8px 0', fontSize: 15, textAlign: 'center', background: '#fff' }}
                      />
                    </div>
                  </td>
                ))}
                <td style={{ border: '1px solid #ccc', padding: 6, textAlign: 'center', verticalAlign: 'middle', background: '#fff' }}>
                  <button type="button" onClick={() => handleDeleteRow(i)} style={{ color: 'red', background: '#fff', border: '1px solid #f00', borderRadius: 4, padding: '2px 10px', fontWeight: 'bold', height: 32 }}>Delete</button>
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
