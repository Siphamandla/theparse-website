import React from "react";
import Select from "react-select";
import { ClearIndicator } from "./ClearIndicator";

interface Option {
  value: string;
  label: string;
}

interface MultiselectProps {
  name?: string;
  className?: string;
  required?: boolean; // Add `required` to the props interface
  options: Option[];
  selected: Option[];
  setSelected: React.Dispatch<React.SetStateAction<Option[]>>;
  labelname: string;
  Iwidth: string;
  placeholder: string;
}

const Multiselect: React.FC<MultiselectProps> = ({
  name,
  selected,
  setSelected,
  options,
  labelname,
  Iwidth,
  placeholder,
  className,
  required, // Add `required` here
}) => {
  const onChange = (selectedOptions: Option[] | null) => {
    setSelected(selectedOptions || []); // Handle null case for clearing options
  };

  // Custom styles for react-select components
  const customStyles = {
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

  return (
    <div className={className} style={{ width: Iwidth }}>
      {/* Render the label above the Select component */}
      {labelname && (
        <label htmlFor={name} className="text-sm font-medium text-dark dark:text-white">
          {labelname} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Select
        isMulti
        name={name}
        isClearable={true}
        components={{ ClearIndicator }}
        value={selected}
        styles={customStyles}
        onChange={onChange}
        options={options}
        isSearchable={true}
        placeholder={placeholder}
        className="text-black"
      />
    </div>
  );
};

export default Multiselect;