import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpansionModuleTab from './ExpansionModuleTab';

describe('ExpansionModuleTab', () => {
  it('renders Yealink and Polycom sections', () => {
    render(<ExpansionModuleTab />);
    expect(screen.getByText(/Yealink Expansion Module/i)).toBeInTheDocument();
    expect(screen.getByText(/Polycom VVX Color Expansion Module/i)).toBeInTheDocument();
  });

  it('generates Yealink config for BLF', () => {
    render(<ExpansionModuleTab />);
    fireEvent.change(screen.getByLabelText(/Label:/i), { target: { value: 'TestLabel' } });
    fireEvent.change(screen.getByLabelText(/Value \(Phone\/Ext\):/i), { target: { value: '1001' } });
    fireEvent.change(screen.getByLabelText(/PBX IP:/i), { target: { value: '10.0.0.1' } });
    fireEvent.click(screen.getByText(/Generate Yealink Expansion Config/i));
    expect(screen.getByDisplayValue(/expansion_module/)).toHaveValue(
      expect.stringContaining('TestLabel')
    );
    expect(screen.getByDisplayValue(/expansion_module/)).toHaveValue(
      expect.stringContaining('1001@10.0.0.1')
    );
  });

  it('generates Polycom config', () => {
    render(<ExpansionModuleTab />);
    fireEvent.change(screen.getByLabelText(/Linekey Index/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/^Address/i), { target: { value: '2002@pbx' } });
    fireEvent.change(screen.getByLabelText(/^Label:/i), { target: { value: 'PolyLabel' } });
    fireEvent.click(screen.getByText(/Generate Polycom Expansion Config/i));
    expect(screen.getByDisplayValue(/attendant.resourcelist/)).toHaveValue(
      expect.stringContaining('PolyLabel')
    );
    expect(screen.getByDisplayValue(/attendant.resourcelist/)).toHaveValue(
      expect.stringContaining('2002@pbx')
    );
  });
});
