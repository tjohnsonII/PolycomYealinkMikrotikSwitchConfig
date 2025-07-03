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

const FBPXImport: React.FC = () => {
  const [fpbxRows, setFpbxRows] = useState<FpbxFormType[]>([createEmptyFpbxRow()]);
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
    // CSV import logic (stub)
  };
  const handleFpbxExport = () => {
    // CSV export logic (stub)
  };

  return (
    <div>
      <h2>FBPX Import</h2>
      <input type="file" accept=".csv" onChange={handleFpbxImport} />
      <button onClick={handleFpbxExport}>Export CSV</button>
      <a ref={fpbxDownloadRef} style={{ display: 'none' }}>Download</a>
      <table>
        <thead>
          <tr>
            {FPBX_FIELDS.map(f => <th key={f}>{f}</th>)}
          </tr>
        </thead>
        <tbody>
          {fpbxRows.map((row, idx) => (
            <tr key={idx}>
              {FPBX_FIELDS.map(f => (
                <td key={f}>
                  <input
                    name={f}
                    value={row[f] || ''}
                    onChange={e => handleFpbxChange(idx, e)}
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
      <button onClick={() => handleFpbxAddRow(1)}>Add Row</button>
    </div>
  );
};

export default FBPXImport;
