import React from 'react';
import './StarRating.css';

const MAX_STARS = 5;

/**
 * Star rating component.
 * @param {Object} props
 * @param {number} props.rating - Value 0-5 (display or current selection).
 * @param {boolean} [props.interactive] - If true, stars are clickable to set rating.
 * @param {function} [props.onChange] - Called with (value) when interactive and user selects a star.
 * @param {string} [props.ariaLabel] - Accessibility label (e.g. "Rate 4 out of 5 stars").
 * @param {string} [props.className] - Optional class for the wrapper.
 */
const StarRating = ({ rating = 0, interactive = false, onChange, ariaLabel, className = '' }) => {
  const value = Math.min(MAX_STARS, Math.max(0, Number(rating) || 0));
  const rounded = Math.round(value);

  const handleClick = (starIndex) => {
    if (interactive && onChange && typeof onChange === 'function') {
      onChange(starIndex + 1);
    }
  };

  const handleKeyDown = (e, starIndex) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange?.(starIndex + 1);
    }
  };

  const label = ariaLabel || (interactive ? `Rate ${rounded} out of ${MAX_STARS} stars` : `${value} out of ${MAX_STARS} stars`);

  return (
    <span
      className={`star-rating ${interactive ? 'star-rating-interactive' : ''} ${className}`.trim()}
      role={interactive ? 'group' : 'img'}
      aria-label={label}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const filled = i < rounded;
        const starValue = i + 1;
        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              className={`star-rating-btn ${filled ? 'filled' : ''}`}
              onClick={() => handleClick(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
              aria-pressed={rounded === starValue}
            >
              <span aria-hidden="true">{filled ? '★' : '☆'}</span>
            </button>
          );
        }
        return (
          <span key={i} className={`star-rating-star ${filled ? 'filled' : ''}`} aria-hidden="true">
            {filled ? '★' : '☆'}
          </span>
        );
      })}
    </span>
  );
};

export default StarRating;
