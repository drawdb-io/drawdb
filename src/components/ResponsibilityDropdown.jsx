import React from 'react';
import { Select } from '@douyinfe/semi-ui';
import { responsibilityOptions } from '../data/constants';

const ResponsibilityDropdown = ({ value, onChange, size = "small", disabled = false }) => {
  const renderOption = (option) => (
    <div className="flex items-center gap-2">
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: option.color }}
      />
      <span className="text-sm">{option.label}</span>
    </div>
  );

  const renderSelectedItem = (option) => (
    <div className="flex items-center gap-1">
      <div 
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: option.color }}
      />
      <span className="text-xs font-medium">{option.value}</span>
    </div>
  );

  return (
    <Select
      value={value}
      onChange={onChange}
      size={size}
      disabled={disabled}
      placeholder="--"
      className="min-w-[60px]"
      dropdownClassName="responsibility-dropdown"
      optionList={responsibilityOptions.map(option => ({
        ...option,
        label: renderOption(option),
        render: () => renderSelectedItem(option)
      }))}
      renderSelectedItem={(option) => 
        option ? renderSelectedItem(option) : <span className="text-xs text-gray-400">--</span>
      }
    />
  );
};

export default ResponsibilityDropdown;