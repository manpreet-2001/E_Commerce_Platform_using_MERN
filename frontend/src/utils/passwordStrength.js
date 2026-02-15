/**
 * Password strength rules and validation.
 * Use same rules on backend for security.
 */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p) => (p || '').length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p || '') },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p || '') },
  { id: 'number', label: 'One number', test: (p) => /\d/.test(p || '') },
  { id: 'special', label: 'One special character (!@#$%^&* etc.)', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p || '') },
];

export function getPasswordRuleResults(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    pass: rule.test(password),
  }));
}

export function isPasswordStrong(password) {
  if (!password || typeof password !== 'string') return false;
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function getPasswordErrorMessage(password) {
  const results = getPasswordRuleResults(password);
  const failed = results.filter((r) => !r.pass).map((r) => r.label);
  if (failed.length === 0) return null;
  return `Password must have: ${failed.join('; ')}`;
}
