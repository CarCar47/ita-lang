import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "green" | "blue" | "yellow" | "red";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = "",
  showLabel = false,
  size = "md",
  color = "green",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  };

  const colors = {
    green: "bg-green-600 dark:bg-green-500",
    blue: "bg-blue-600 dark:bg-blue-500",
    yellow: "bg-yellow-600 dark:bg-yellow-500",
    red: "bg-red-600 dark:bg-red-500",
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colors[color]} h-full transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};
