import React, { useState } from "react";
import { components } from "react-select";

// Custom ClearIndicator with Tailwind Tooltip
export const ClearIndicator = (props) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md py-1 px-2 z-10">
          Clear all
          <div className="tooltip-arrow bg-gray-800 h-2 w-2 transform rotate-45 absolute bottom-[-4px] left-1/2 -translate-x-1/2"></div>
        </div>
      )}
      <components.ClearIndicator {...props} />
    </div>
  );
};