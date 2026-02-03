// Custom Cypress commands for BloodBank application

// Custom command for login
Cypress.Commands.add('login', (organizationCode, email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="organization-code"]').type(organizationCode);
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

// Custom command for API login
Cypress.Commands.add('apiLogin', (organizationCode, email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      organizationCode,
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Custom command for checking blood availability
Cypress.Commands.add('checkBloodAvailability', (bloodGroup) => {
  cy.get('[data-testid="blood-group-select"]').select(bloodGroup);
  cy.get('[data-testid="search-button"]').click();
});

// Custom command for emergency blood request
Cypress.Commands.add('emergencyBloodRequest', (requestData) => {
  cy.get('[data-testid="emergency-request-btn"]').click();
  cy.get('[data-testid="blood-group"]').select(requestData.bloodGroup);
  cy.get('[data-testid="units"]').type(requestData.units);
  cy.get('[data-testid="urgency"]').select(requestData.urgency);
  cy.get('[data-testid="submit-request"]').click();
});

// Custom command for checking toast notifications
Cypress.Commands.add('checkToast', (message) => {
  cy.get('[data-testid="toast-notification"]')
    .should('be.visible')
    .and('contain', message);
});

// Custom command for waiting for API responses
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(`@${alias}`).its('response.statusCode').should('eq', 200);
});
