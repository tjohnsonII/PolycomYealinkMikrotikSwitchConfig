import React from 'react';


import { useRef, useState } from 'react';

// These should be imported from a shared constants file in a real refactor
const FPBX_FIELDS = [
  "extension", "name", "description", "tech", "secret", "callwaiting_enable", "voicemail",
  "voicemail_enable", "voicemail_vmpwd", "voicemail_email", "voicemail_pager", "voicemail_options",
  "voicemail_same_exten", "outboundcid", "id", "dial", "user", "max_contacts", "accountcode"
];

type FpbxFormType = Record<string, string>;

const createEmptyFpbxRow = (): FpbxFormType => FPBX_FIELDS.reduce((acc, f) => ({ ...acc, [f]: '' }), {} as FpbxFormType);


const DEFAULT_ROWS = 10;

const FBPXImport: React.FC = () => {
  const [fpbxRows, setFpbxRows] = useState<FpbxFormType[]>(Array(DEFAULT_ROWS).fill(0).map(createEmptyFpbxRow));
  const fpbxDownloadRef = useRef<HTMLAnchorElement>(null);

  const handleFpbxChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFpbxRows(rows => rows.map((row, i) => i === idx ? { ...row, [name]: value } : row));
  };
  const handleFpbxAddRow = (count = 1) => {
    setFpbxRows(rows => [...rows, ...Array(count).fill(0).map(createEmptyFpbxRow)]);
  };
  const handleFpbxDeleteRow = (idx: number) => {
    setFpbxRows(rows => rows.filter((_, i) => i !== idx));
  };
  const handleFpbxImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines;
      const fields = header.split(',');
      const data = rows.map(line => {
        const values = line.split(',');
        return fields.reduce((acc, f, i) => ({ ...acc, [f]: values[i] || '' }), {} as FpbxFormType);
      });
      setFpbxRows(data.length ? data : [createEmptyFpbxRow()]);
    };
    reader.readAsText(file);
  };
  const handleFpbxExport = () => {
    const csv = [FPBX_FIELDS.join(',')].concat(
      fpbxRows.map(row => FPBX_FIELDS.map(f => row[f] || '').join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    if (fpbxDownloadRef.current) {
      fpbxDownloadRef.current.href = url;
      fpbxDownloadRef.current.download = 'fpbx_import.csv';
      fpbxDownloadRef.current.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <div>
      <h2>FBPX Import</h2>
      <input type="file" accept=".csv" onChange={handleFpbxImport} />
      <button onClick={handleFpbxExport}>Export CSV</button>
      <a ref={fpbxDownloadRef} style={{ display: 'none' }}>Download</a>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              {FPBX_FIELDS.map(f => <th key={f} style={{ border: '1px solid #ccc', padding: 4 }}>{f}</th>)}
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {fpbxRows.map((row, idx) => (
              <tr key={idx}>
                {FPBX_FIELDS.map(f => (
                  <td key={f} style={{ border: '1px solid #ccc', padding: 2 }}>
                    <input
                      name={f}
                      value={row[f] || ''}
                      onChange={e => handleFpbxChange(idx, e)}
                      style={{ width: 120 }}
                    />
                  </td>
                ))}
                <td>
                  <button onClick={() => handleFpbxDeleteRow(idx)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => handleFpbxAddRow(1)}>Add 1 Row</button>{' '}
        <button onClick={() => handleFpbxAddRow(5)}>Add 5 Rows</button>{' '}
        <button onClick={() => handleFpbxAddRow(10)}>Add 10 Rows</button>
      </div>
    </div>
  );
};

export default FBPXImport;
