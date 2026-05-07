import React from 'react';

export const ClinicalReportRenderer = ({ report, isDark = false, isPDF = false }: { report: string, isDark?: boolean, isPDF?: boolean }) => {
  if (!report) return null;

  // Ensure escaped newlines are properly converted. Also replace multiple newlines with exact spacing.
  const formattedReport = report.replace(/\\n/g, '\n');

  // Base styling for the container
  const containerStyle = {
    fontSize: isPDF ? '11.5px' : '14px',
    lineHeight: isPDF ? '1.8' : '1.7',
    fontWeight: isPDF ? 300 : 500,
    color: isPDF ? '#111111' : (isDark ? '#cbd5e1' : '#1e293b'), // #cbd5e1 = slate-300, #1e293b = slate-800
  };

  return (
    <div 
      className={`whitespace-pre-wrap text-justify block w-full`}
      style={containerStyle}
    >
      {formattedReport}
    </div>
  );
}
