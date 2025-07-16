
import React from 'react';
import '../styles/App.css';
import '../styles/TestComponent.css';

const TestComponent: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>CSS Test</h1>
        <p>Testing CSS variables and imports</p>
      </div>
      
      <div className="page-grid-demo">
        <div className="color-block red">Brand Red</div>
        <div className="color-block green">Brand Green</div>
        <div className="color-block blue">Brand Blue</div>
      </div>

      <div className="button-row">
        <button type="button">Primary Button</button>
        <button type="button" className="secondary">Secondary Button</button>
        <button type="button" className="danger">Danger Button</button>
      </div>

      <div className="form-demo">
        <h2>Form Test</h2>
        <div className="form-group">
          <label htmlFor="test-input">Test Input:</label>
          <input id="test-input" type="text" placeholder="Enter text..." />
        </div>
        <div className="form-group">
          <label htmlFor="test-select">Test Select:</label>
          <select id="test-select" title="Choose an option" aria-label="Test Select">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="test-textarea">Test Textarea:</label>
          <textarea id="test-textarea" placeholder="Enter text..." />
        </div>
      </div>

      <div className="success">
        This is a success message to test the success styling.
      </div>

      <div className="error">
        This is an error message to test the error styling.
      </div>
    </div>
  );
};

export default TestComponent;
