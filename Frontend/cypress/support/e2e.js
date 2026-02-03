// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands or global setup here
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage();
  
  // Clear cookies before each test
  cy.clearCookies();
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on certain errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});
