import React from 'react';


import SwitchDynamicTemplate from './SwitchDynamicTemplate';
import Switch24DynamicTemplate from './Switch24DynamicTemplate';
import Switch8DynamicTemplate from './Switch8DynamicTemplate';

const SwitchTemplates: React.FC = () => {
  return (
    <div className="container">
      <h2>Switch Templates</h2>
      <SwitchDynamicTemplate />
      <Switch24DynamicTemplate />
      <Switch8DynamicTemplate />
    </div>
  );
};

export default SwitchTemplates;
