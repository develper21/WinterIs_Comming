describe('BloodBank Login Flow', () => {
  beforeEach(() => {
    // Mock the API responses
    cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/login`, {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: {
          userCode: 'HOSP-DEL-001-001',
          name: 'Dr. Test User',
          email: 'doctor@hospital.com',
          role: 'doctor',
          organizationCode: 'HOSP-DEL-001',
          organizationName: 'Test Hospital'
        }
      }
    }).as('loginRequest');
  });

  it('should display login page correctly', () => {
    cy.visit('/login');
    
    // Check if login form elements are present
    cy.get('[data-testid="organization-code"]').should('be.visible');
    cy.get('[data-testid="email"]').should('be.visible');
    cy.get('[data-testid="password"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.visit('/login');
    
    // Try to login without filling fields
    cy.get('[data-testid="login-button"]').click();
    
    // Check for validation messages
    cy.get('[data-testid="error-message"]').should('contain', 'Organization code is required');
    cy.get('[data-testid="error-message"]').should('contain', 'Email is required');
    cy.get('[data-testid="error-message"]').should('contain', 'Password is required');
  });

  it('should validate email format', () => {
    cy.visit('/login');
    
    cy.get('[data-testid="organization-code"]').type('HOSP-DEL-001');
    cy.get('[data-testid="email"]').type('invalid-email');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid email format');
  });

  it('should validate organization code format', () => {
    cy.visit('/login');
    
    cy.get('[data-testid="organization-code"]').type('INVALID');
    cy.get('[data-testid="email"]').type('doctor@hospital.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid organization code format');
  });

  it('should successfully login with valid credentials', () => {
    cy.visit('/login');
    
    // Fill in valid credentials
    cy.get('[data-testid="organization-code"]').type('HOSP-DEL-001');
    cy.get('[data-testid="email"]').type('doctor@hospital.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for API call
    cy.wait('@loginRequest');
    
    // Check if redirected to dashboard
    cy.url().should('include', '/dashboard');
    
    // Check if user info is displayed
    cy.get('[data-testid="user-name"]').should('contain', 'Dr. Test User');
    cy.get('[data-testid="user-role"]').should('contain', 'Doctor');
  });

  it('should handle login failure', () => {
    // Mock failed login response
    cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/login`, {
      statusCode: 401,
      body: {
        message: 'Invalid credentials'
      }
    }).as('loginFailed');

    cy.visit('/login');
    
    cy.get('[data-testid="organization-code"]').type('HOSP-DEL-001');
    cy.get('[data-testid="email"]').type('wrong@hospital.com');
    cy.get('[data-testid="password"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@loginFailed');
    
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });

  it('should handle network errors', () => {
    // Mock network error
    cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/login`, {
      forceNetworkError: true
    }).as('networkError');

    cy.visit('/login');
    
    cy.get('[data-testid="organization-code"]').type('HOSP-DEL-001');
    cy.get('[data-testid="email"]').type('doctor@hospital.com');
    cy.get('[data-testid="password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@networkError');
    
    cy.get('[data-testid="error-message"]').should('contain', 'Network error');
  });
});
