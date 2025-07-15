import React, { useState } from 'react';
// Expansion module preview icons, tooltips, and Polycom constants
import { EXP_TYPE_ICONS, EXP_TYPE_TOOLTIPS, POLYCOM_PAGE_LABELS, POLYCOM_KEYS_PER_PAGE } from '../constants/expansionModule'; // POLYCOM_PAGE_LABELS, POLYCOM_KEYS_PER_PAGE are used in Polycom preview
// ...import any other shared components or icons as needed

// Polycom expansion module state shape
interface PolycomSection {
  address: string;         // SIP address or extension for the key
  label: string;           // Display label for the key
  type: string;            // Key function type (e.g., automata for BLF)
  linekeyCategory: string; // Key category (BLF, EFK, etc.)
  linekeyIndex: string;    // Key position (1-84)
  activePage: number;      // Current preview page (0-2)
}

// Main Expansion Module Tab component
const ExpansionModuleTab: React.FC = () => {
  // Polycom expansion module form state
  const [polycomSection, setPolycomSection] = useState<PolycomSection>({
    address: '',
    label: '',
    type: 'automata',
    linekeyCategory: 'BLF',
    linekeyIndex: '',
    activePage: 0,
  });
  // Polycom config output
  const [polycomOutput, setPolycomOutput] = useState('');

  // Yealink expansion module form state
  const [yealinkSection, setYealinkSection] = useState({
    templateType: 'BLF',   // BLF or SpeedDial
    sidecarPage: '1',      // Page number (1-3)
    sidecarLine: '1',      // Button number (1-20)
    label: '',             // Display label
    value: '',             // Extension or number
    pbxIp: '',             // PBX IP for BLF
  });
  // Yealink config output
  const [yealinkOutput, setYealinkOutput] = useState('');

  // Generate Yealink expansion config string based on form state
  const generateYealinkExpansion = () => {
    const { templateType, sidecarPage, sidecarLine, value, pbxIp } = yealinkSection;
    let config = '';
    if (templateType === 'BLF') {
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.type=16\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.value=${value}@${pbxIp}\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.line=1\n`;
    } else {
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.type=13\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.value=${value}\n`;
      config += `expansion_module.${sidecarPage}.key.${sidecarLine}.line=1\n`;
    }
    setYealinkOutput(config);
  };

  // Generate Polycom expansion config string based on form state
  const generatePolycomExpansion = () => {
    const { address, label, type, linekeyCategory, linekeyIndex } = polycomSection;
    let config = '';
    config += `attendant.resourcelist.${linekeyIndex}.address=${address}\n`;
    config += `attendant.resourcelist.${linekeyIndex}.label=${label}\n`;
    config += `attendant.resourcelist.${linekeyIndex}.type=${type}\n`;
    config += `linekey.${linekeyIndex}.category=${linekeyCategory}\n`;
    config += `linekey.${linekeyIndex}.index=${linekeyIndex}\n`;
    setPolycomOutput(config);
  };

  return (
    <div className="expansion-module-container">
      {/* Yealink Expansion Module Preview and Form */}
      <div className="expansion-module-section">
        <h3 className="expansion-module-title">Yealink Expansion Module</h3>
        {/* Device images for user reference */}
        <img src="/images/expansion/yealinkexp40.jpeg" alt="Yealink EXP40 expansion module" className="expansion-module-image" />
        <img src="/images/expansion/yealinkexp50.jpeg" alt="Yealink EXP50 expansion module" className="expansion-module-image" />
        {/* Instructions for users */}
        <div className="expansion-module-instructions">
          <b>Instructions:</b> Fill out the form below to generate a config for a Yealink expansion key. Use the page toggles to preview each page. Hover over any key in the preview for details.
        </div>
        {/* Yealink config form */}
        <div className="expansion-module-form-group">
          <label htmlFor="yealink-template-type" className="expansion-module-label">
            Template Type:
            <span className="expansion-module-info-icon" title="BLF: Busy Lamp Field (monitors extension/park status). SpeedDial: Quick dial to a number or extension.">ℹ️</span>
          </label>
          <select 
            id="yealink-template-type"
            className="expansion-module-select"
            value={yealinkSection.templateType} 
            onChange={e => setYealinkSection(s => ({ ...s, templateType: e.target.value }))}
            aria-describedby="yealink-template-type-desc"
          >
            <option value="BLF">BLF</option>
            <option value="SpeedDial">SpeedDial</option>
          </select>
          <span id="yealink-template-type-desc" className="sr-only">
            Choose between BLF for monitoring extension status or SpeedDial for quick dialing
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="yealink-sidecar-page" className="expansion-module-label">
            Sidecar Page (1-3):
            <span className="expansion-module-info-icon" title="Select which page of the expansion module to configure (1-3).">ℹ️</span>
          </label>
          <input 
            id="yealink-sidecar-page"
            type="number" 
            min="1" 
            max="3" 
            className="expansion-module-input"
            value={yealinkSection.sidecarPage} 
            onChange={e => setYealinkSection(s => ({ ...s, sidecarPage: e.target.value }))}
            aria-describedby="yealink-sidecar-page-desc"
          />
          <span id="yealink-sidecar-page-desc" className="sr-only">
            Select page 1, 2, or 3 of the expansion module
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="yealink-sidecar-line" className="expansion-module-label">
            Sidecar Line (1-20):
            <span className="expansion-module-info-icon" title="Select which button (1-20) on the current page to configure.">ℹ️</span>
          </label>
          <input 
            id="yealink-sidecar-line"
            type="number" 
            min="1" 
            max="20" 
            className="expansion-module-input"
            value={yealinkSection.sidecarLine} 
            onChange={e => setYealinkSection(s => ({ ...s, sidecarLine: e.target.value }))}
            aria-describedby="yealink-sidecar-line-desc"
          />
          <span id="yealink-sidecar-line-desc" className="sr-only">
            Select button number 1 through 20 on the current page
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="yealink-label" className="expansion-module-label">
            Label:
            <span className="expansion-module-info-icon" title="The text label that will appear on the phone's display for this key.">ℹ️</span>
          </label>
          <input 
            id="yealink-label"
            type="text" 
            className="expansion-module-input"
            value={yealinkSection.label} 
            onChange={e => setYealinkSection(s => ({ ...s, label: e.target.value }))}
            placeholder="Enter display label"
            aria-describedby="yealink-label-desc"
          />
          <span id="yealink-label-desc" className="sr-only">
            Enter the text that will appear on the phone display for this key
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="yealink-value" className="expansion-module-label">
            Value (Phone/Ext):
            <span className="expansion-module-info-icon" title="The extension or number this key will dial or monitor.">ℹ️</span>
          </label>
          <input 
            id="yealink-value"
            type="text" 
            className="expansion-module-input"
            value={yealinkSection.value} 
            onChange={e => setYealinkSection(s => ({ ...s, value: e.target.value }))}
            placeholder="Enter extension or phone number"
            aria-describedby="yealink-value-desc"
          />
          <span id="yealink-value-desc" className="sr-only">
            Enter the extension or phone number this key will dial or monitor
          </span>
        </div>
        {/* PBX IP only shown for BLF type */}
        {yealinkSection.templateType === 'BLF' && (
          <div className="expansion-module-form-group">
            <label htmlFor="yealink-pbx-ip" className="expansion-module-label">
              PBX IP:
              <span className="expansion-module-info-icon" title="The PBX IP address for BLF monitoring.">ℹ️</span>
            </label>
            <input 
              id="yealink-pbx-ip"
              type="text" 
              className="expansion-module-input"
              value={yealinkSection.pbxIp} 
              onChange={e => setYealinkSection(s => ({ ...s, pbxIp: e.target.value }))}
              placeholder="Enter PBX IP address"
              aria-describedby="yealink-pbx-ip-desc"
            />
            <span id="yealink-pbx-ip-desc" className="sr-only">
              Enter the PBX IP address for BLF monitoring
            </span>
          </div>
        )}
        {/* Generate config button */}
        <button 
          onClick={generateYealinkExpansion} 
          className="expansion-module-generate-button"
          aria-label="Generate Yealink expansion module configuration"
        >
          Generate Yealink Expansion Config
        </button>
        {/* Output area for generated config */}
        <div className="expansion-module-output">
          <label htmlFor="yealink-output" className="expansion-module-label">Generated Configuration:</label>
          <textarea 
            id="yealink-output"
            className="expansion-module-textarea"
            value={yealinkOutput} 
            readOnly 
            rows={6}
            aria-label="Generated Yealink configuration output"
          />
        </div>
        {/* Graphical preview of Yealink expansion module keys */}
        <div className="expansion-module-preview">
          <div className="expansion-module-preview-header">
            <b>Preview:</b> Page
            {/* Page toggle buttons */}
            {[1,2,3].map(page => (
              <button
                key={page}
                type="button"
                className={`expansion-module-page-button ${yealinkSection.sidecarPage === String(page) ? 'active' : ''}`}
                onClick={() => setYealinkSection(s => ({ ...s, sidecarPage: String(page) }))}
                aria-label={`Switch to page ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
          {/* 2x10 grid for each page */}
          <div className="expansion-module-grid">
            {Array.from({ length: 20 }).map((_, idx) => {
              // Highlight the currently selected key
              const isCurrent = parseInt(yealinkSection.sidecarLine) === idx + 1 && yealinkSection.sidecarPage === String(Math.ceil((idx + 1) / 20) || '1');
              const label = isCurrent ? yealinkSection.label : '';
              const value = isCurrent ? yealinkSection.value : '';
              const type = isCurrent ? yealinkSection.templateType : '';
              const icon = EXP_TYPE_ICONS[type || 'default'];
              const tooltip = label ? `Line: ${yealinkSection.sidecarLine}\nType: ${type}\nLabel: ${label}\nValue: ${value}` : 'Empty';
              
              const keyClasses = [
                'expansion-module-key',
                type === 'BLF' ? 'expansion-module-key-blf' : '',
                type === 'SpeedDial' ? 'expansion-module-key-speeddial' : ''
              ].filter(Boolean).join(' ');
              
              return (
                <div
                  key={idx}
                  className={keyClasses}
                  title={tooltip}
                  role="button"
                  tabIndex={0}
                  aria-label={tooltip}
                >
                  <span className="expansion-module-key-icon" title={EXP_TYPE_TOOLTIPS[type || 'default']}>
                    {icon}
                  </span>
                  <div className="expansion-module-key-label">
                    {label || <span className="expansion-module-key-empty">Empty</span>}
                  </div>
                  <div className="expansion-module-key-value">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Polycom Expansion Module Preview and Form */}
      <div className="expansion-module-section">
        <h3 className="expansion-module-title">Polycom VVX Color Expansion Module</h3>
        {/* Device image for user reference */}
        <img src="/images/expansion/polycomVVX_Color_Exp_Module_2201.jpeg" alt="Polycom VVX Color Expansion Module" className="expansion-module-image" />
        {/* Instructions for users */}
        <div className="expansion-module-instructions">
          <b>Instructions:</b> Fill out the form below to generate a config for a Polycom expansion key. The preview grid below shows the button layout for each page (1–3). Hover over any key for details. <br />
          <b>Linekey Index:</b> The key position to configure (1–84). Keys 1–28 appear on Page 1, 29–56 on Page 2, and 57–84 on Page 3. Use the buttons on the bottom of the module to switch pages during use.
        </div>
        {/* Polycom config form */}
        <div className="expansion-module-form-group">
          <label htmlFor="polycom-linekey-index" className="expansion-module-label">
            Linekey Index (1-84):
            <span className="expansion-module-info-icon" title="The key position to configure (1–84). Keys 1–28 appear on Page 1, 29–56 on Page 2, and 57–84 on Page 3. Use the buttons on the bottom of the module to switch pages during use.">ℹ️</span>
          </label>
          <input 
            id="polycom-linekey-index"
            type="number" 
            min="1" 
            max="84" 
            className="expansion-module-input"
            value={polycomSection.linekeyIndex} 
            onChange={e => setPolycomSection(s => ({ ...s, linekeyIndex: e.target.value }))}
            placeholder="Enter key position (1-84)"
            aria-describedby="polycom-linekey-index-desc"
          />
          <span id="polycom-linekey-index-desc" className="sr-only">
            Enter the key position from 1 to 84
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="polycom-address" className="expansion-module-label">
            Address (e.g. 1001@ip):
            <span className="expansion-module-info-icon" title="The SIP address or extension for this key.">ℹ️</span>
          </label>
          <input 
            id="polycom-address"
            type="text" 
            className="expansion-module-input"
            value={polycomSection.address} 
            onChange={e => setPolycomSection(s => ({ ...s, address: e.target.value }))}
            placeholder="Enter SIP address (e.g. 1001@192.168.1.100)"
            aria-describedby="polycom-address-desc"
          />
          <span id="polycom-address-desc" className="sr-only">
            Enter the SIP address or extension for this key
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="polycom-label" className="expansion-module-label">
            Label:
            <span className="expansion-module-info-icon" title="The text label that will appear on the phone's display for this key.">ℹ️</span>
          </label>
          <input 
            id="polycom-label"
            type="text" 
            className="expansion-module-input"
            value={polycomSection.label} 
            onChange={e => setPolycomSection(s => ({ ...s, label: e.target.value }))}
            placeholder="Enter display label"
            aria-describedby="polycom-label-desc"
          />
          <span id="polycom-label-desc" className="sr-only">
            Enter the text that will appear on the phone display for this key
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="polycom-type" className="expansion-module-label">
            Type:
            <span className="expansion-module-info-icon" title="The function type for this key (e.g., automata for BLF, normal for speed dial).">ℹ️</span>
          </label>
          <input 
            id="polycom-type"
            type="text" 
            className="expansion-module-input"
            value={polycomSection.type} 
            onChange={e => setPolycomSection(s => ({ ...s, type: e.target.value }))}
            placeholder="Enter type (e.g., automata, normal)"
            aria-describedby="polycom-type-desc"
          />
          <span id="polycom-type-desc" className="sr-only">
            Enter the function type for this key
          </span>
        </div>
        <div className="expansion-module-form-group">
          <label htmlFor="polycom-linekey-category" className="expansion-module-label">
            Linekey Category:
            <span className="expansion-module-info-icon" title="The key category (BLF, EFK, etc.).">ℹ️</span>
          </label>
          <input 
            id="polycom-linekey-category"
            type="text" 
            className="expansion-module-input"
            value={polycomSection.linekeyCategory} 
            onChange={e => setPolycomSection(s => ({ ...s, linekeyCategory: e.target.value }))}
            placeholder="Enter category (e.g., BLF, EFK)"
            aria-describedby="polycom-linekey-category-desc"
          />
          <span id="polycom-linekey-category-desc" className="sr-only">
            Enter the key category
          </span>
        </div>
        {/* Generate config button */}
        <button 
          onClick={generatePolycomExpansion} 
          className="expansion-module-generate-button"
          aria-label="Generate Polycom expansion module configuration"
        >
          Generate Polycom Expansion Config
        </button>
        {/* Output area for generated config */}
        <div className="expansion-module-output">
          <label htmlFor="polycom-output" className="expansion-module-label">Generated Configuration:</label>
          <textarea 
            id="polycom-output"
            className="expansion-module-textarea"
            value={polycomOutput} 
            readOnly 
            rows={6}
            aria-label="Generated Polycom configuration output"
          />
        </div>
        {/* Graphical preview of Polycom expansion module keys */}
        <div className="expansion-module-preview">
          <div className="expansion-module-preview-header">
            <b>Preview:</b>
            {/* Page toggle buttons for Polycom preview */}
            {POLYCOM_PAGE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`expansion-module-page-button ${polycomSection.activePage === i ? 'active' : ''}`}
                onClick={() => setPolycomSection(s => ({ ...s, activePage: i }))}
                aria-label={`Switch to ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* 2x14 grid for each Polycom page (28 keys per page) */}
          <div className="expansion-module-grid">
            {Array.from({ length: POLYCOM_KEYS_PER_PAGE }).map((_, idx) => {
              // Calculate global key index for Polycom expansion
              const globalIdx = polycomSection.activePage * POLYCOM_KEYS_PER_PAGE + idx + 1;
              // Highlight the currently selected key
              const isCurrent = parseInt(polycomSection.linekeyIndex) === globalIdx;
              const label = isCurrent ? polycomSection.label : '';
              const value = isCurrent ? polycomSection.address : '';
              const type = isCurrent ? polycomSection.type : '';
              const icon = EXP_TYPE_ICONS[type === 'automata' ? 'BLF' : type === 'normal' ? 'SpeedDial' : 'default'];
              const tooltip = label ? `Index: ${globalIdx}\nType: ${type}\nLabel: ${label}\nValue: ${value}` : 'Empty';
              
              const keyClasses = [
                'expansion-module-key',
                type === 'automata' ? 'expansion-module-key-blf' : '',
                type === 'normal' ? 'expansion-module-key-speeddial' : ''
              ].filter(Boolean).join(' ');
              
              return (
                <div
                  key={idx}
                  className={keyClasses}
                  title={tooltip}
                  role="button"
                  tabIndex={0}
                  aria-label={tooltip}
                >
                  <span className="expansion-module-key-icon" title={EXP_TYPE_TOOLTIPS[type === 'automata' ? 'BLF' : type === 'normal' ? 'SpeedDial' : 'default']}>
                    {icon}
                  </span>
                  <div className="expansion-module-key-label">
                    {label || <span className="expansion-module-key-empty">Empty</span>}
                  </div>
                  <div className="expansion-module-key-value">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpansionModuleTab;
