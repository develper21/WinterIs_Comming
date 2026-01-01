// #region Validators

/**
 * Validation Utilities
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  return errors;
};

export const validateRegisterInput = (data) => {
  const errors = [];
  if (!data.name || data.name.trim().length < 3) {
    errors.push("Name must be at least 3 characters");
  }
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }
  if (!data.password) {
    errors.push("Password is required");
  } else {
    const passwordErrors = validatePassword(data.password);
    errors.push(...passwordErrors);
  }
  if (!data.role) {
    errors.push("Role is required");
  }
  return errors;
};

export const validateLoginInput = (data) => {
  const errors = [];
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }
  if (!data.password) {
    errors.push("Password is required");
  }
  return errors;
};
