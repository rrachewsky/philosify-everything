// Input - Reusable form input component

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const inputStyles = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '16px',
    border: error ? '2px solid #dc3545' : '1px solid #ccc',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyles = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  };

  const errorStyles = {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '4px',
  };

  return (
    <div className={`input-group ${className} mb-4`}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={inputStyles}
        className={error ? 'input-error' : ''}
        {...props}
      />

      {error && (
        <div style={errorStyles} className="input-error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default Input;
