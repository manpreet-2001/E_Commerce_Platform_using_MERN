import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

/**
 * CityTech logo: icon + store name.
 * Use asLink={true} (default) to wrap in Link to "/", or false for span only.
 * variant="light" for use on dark backgrounds (e.g. hero).
 */
const Logo = ({ asLink = true, size = 'medium', variant = 'dark', className = '' }) => {
  const sizeClass = size === 'small' ? 'logo--small' : size === 'large' ? 'logo--large' : '';
  const variantClass = variant === 'light' ? 'logo--light' : '';

  const content = (
    <>
      <span className="logo-icon" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M14 20h12M20 14v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="28" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="28" r="1.5" fill="currentColor" />
          <circle cx="28" cy="28" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <span className="logo-text">CityTech</span>
    </>
  );

  const classNames = `logo ${sizeClass} ${variantClass} ${className}`.trim();

  if (asLink) {
    return (
      <Link to="/" className={classNames} aria-label="CityTech - Home">
        {content}
      </Link>
    );
  }

  return (
    <span className={`logo logo--no-link ${sizeClass} ${variantClass} ${className}`.trim()}>
      {content}
    </span>
  );
};

export default Logo;
