// Spinner - Loading spinner component

export function Spinner({ size = 40, color = '#4CAF50', className = '' }) {
  const spinnerStyles = {
    border: `4px solid #f3f3f3`,
    borderTop: `4px solid ${color}`,
    borderRadius: '50%',
    width: `${size}px`,
    height: `${size}px`,
    animation: 'spin 1s linear infinite',
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        className={`spinner ${className}`}
        style={spinnerStyles}
        role="status"
        aria-label="Loading"
      />
    </>
  );
}

export default Spinner;
