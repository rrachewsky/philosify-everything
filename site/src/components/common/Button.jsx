// Button - Reusable button component

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const baseStyles = {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled || loading ? 0.6 : 1,
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#6c757d',
      color: 'white',
    },
    danger: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#4CAF50',
      border: '2px solid #4CAF50',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...variantStyles[variant],
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`button button-${variant} ${className}`}
      style={combinedStyles}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export default Button;
