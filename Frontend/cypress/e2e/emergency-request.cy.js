describe('Emergency Blood Request Flow', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        userCode: 'HOSP-DEL-001-001',
        name: 'Dr. Test User',
        email: 'doctor@hospital.com',
        role: 'doctor',
        organizationCode: 'HOSP-DEL-001'
      }));
    });

    // Mock API responses
    cy.intercept('GET', `${Cypress.env('apiUrl')}/blood-banks/nearby`, {
      statusCode: 200,
      body: [
        {
          _id: 'bb1',
          name: 'City Blood Bank',
          distance: 2.5,
          bloodStock: {
            'A+': 10,
            'B+': 5,
            'O+': 15
          }
        },
        {
          _id: 'bb2',
          name: 'Central Blood Bank',
          distance: 5.0,
          bloodStock: {
            'A+': 8,
            'B+': 12,
            'O+': 20
          }
        }
      ]
    }).as('nearbyBloodBanks');

    cy.intercept('POST', `${Cypress.env('apiUrl')}/emergency-requests`, {
      statusCode: 200,
      body: {
        requestId: 'REQ-001',
        status: 'confirmed',
        matchedBloodBank: {
          name: 'City Blood Bank',
          distance: 2.5,
          availableUnits: 10
        }
      }
    }).as('emergencyRequest');
  });

  it('should display emergency request form', () => {
    cy.visit('/dashboard');
    
    // Check if emergency request button is present
    cy.get('[data-testid="emergency-request-btn"]').should('be.visible');
    
    // Click on emergency request
    cy.get('[data-testid="emergency-request-btn"]').click();
    
    // Check if form is displayed
    cy.get('[data-testid="emergency-request-form"]').should('be.visible');
    cy.get('[data-testid="blood-group"]').should('be.visible');
    cy.get('[data-testid="units"]').should('be.visible');
    cy.get('[data-testid="urgency"]').should('be.visible');
  });

  it('should create emergency blood request successfully', () => {
    cy.visit('/dashboard');
    
    // Start emergency request
    cy.get('[data-testid="emergency-request-btn"]').click();
    
    // Fill in request details
    cy.get('[data-testid="blood-group"]').select('O+');
    cy.get('[data-testid="units"]').type('3');
    cy.get('[data-testid="urgency"]').select('critical');
    
    // Submit request
    cy.get('[data-testid="submit-request"]').click();
    
    // Wait for API call
    cy.wait('@emergencyRequest');
    
    // Check success message
    cy.get('[data-testid="success-message"]').should('contain', 'Emergency request confirmed');
    
    // Check matched blood bank info
    cy.get('[data-testid="matched-blood-bank"]').should('contain', 'City Blood Bank');
    cy.get('[data-testid="available-units"]').should('contain', '10');
  });

  it('should validate form fields', () => {
    cy.visit('/dashboard');
    
    cy.get('[data-testid="emergency-request-btn"]').click();
    
    // Try to submit without filling form
    cy.get('[data-testid="submit-request"]').click();
    
    // Check validation errors
    cy.get('[data-testid="error-message"]').should('contain', 'Blood group is required');
    cy.get('[data-testid="error-message"]').should('contain', 'Number of units is required');
    cy.get('[data-testid="error-message"]').should('contain', 'Urgency level is required');
  });

  it('should show nearby blood banks', () => {
    cy.visit('/dashboard');
    
    // Navigate to blood banks section
    cy.get('[data-testid="blood-banks-tab"]').click();
    
    // Wait for API call
    cy.wait('@nearbyBloodBanks');
    
    // Check if blood banks are displayed
    cy.get('[data-testid="blood-bank-list"]').should('be.visible');
    cy.get('[data-testid="blood-bank-item"]').should('have.length', 2);
    
    // Check first blood bank details
    cy.get('[data-testid="blood-bank-item"]').eq(0).within(() => {
      cy.get('[data-testid="blood-bank-name"]').should('contain', 'City Blood Bank');
      cy.get('[data-testid="blood-bank-distance"]').should('contain', '2.5 km');
      cy.get('[data-testid="blood-stock-O+"]').should('contain', '15');
    });
  });

  it('should handle no blood banks available', () => {
    // Mock empty response
    cy.intercept('GET', `${Cypress.env('apiUrl')}/blood-banks/nearby`, {
      statusCode: 200,
      body: []
    }).as('noBloodBanks');

    cy.visit('/dashboard');
    cy.get('[data-testid="blood-banks-tab"]').click();
    
    cy.wait('@noBloodBanks');
    
    cy.get('[data-testid="no-blood-banks"]').should('contain', 'No blood banks found nearby');
  });

  it('should handle emergency escalation to NGOs', () => {
    // Mock escalation response
    cy.intercept('POST', `${Cypress.env('apiUrl')}/emergency-requests`, {
      statusCode: 200,
      body: {
        requestId: 'REQ-002',
        status: 'escalated',
        message: 'No blood banks available. Request escalated to NGOs',
        matchedNGOs: [
          {
            name: 'Red Cross Society',
            contact: '+91-9876543210',
            estimatedDonors: 5
          }
        ]
      }
    }).as('escalatedRequest');

    cy.visit('/dashboard');
    
    cy.get('[data-testid="emergency-request-btn"]').click();
    cy.get('[data-testid="blood-group"]').select('AB-');
    cy.get('[data-testid="units"]').type('2');
    cy.get('[data-testid="urgency"]').select('critical');
    cy.get('[data-testid="submit-request"]').click();
    
    cy.wait('@escalatedRequest');
    
    // Check escalation message
    cy.get('[data-testid="escalation-message"]').should('contain', 'Request escalated to NGOs');
    
    // Check NGO information
    cy.get('[data-testid="ngo-list"]').should('be.visible');
    cy.get('[data-testid="ngo-item"]').should('contain', 'Red Cross Society');
  });
});
