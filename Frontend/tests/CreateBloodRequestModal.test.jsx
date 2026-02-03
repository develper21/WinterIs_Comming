import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateBloodRequestModal from '../src/components/CreateBloodRequestModal';

// Mock the API service
jest.mock('../src/services/hospitalBloodRequestApi', () => ({
  createBloodRequest: jest.fn()
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('CreateBloodRequestModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (isOpen = true) => {
    return render(
      <CreateBloodRequestModal
        isOpen={isOpen}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  };

  it('renders modal when open', () => {
    renderModal();
    
    expect(screen.getByText(/create blood request/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blood group/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of units/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/urgency level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderModal(false);
    
    expect(screen.queryByText(/create blood request/i)).not.toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates form fields when user types', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const unitsInput = screen.getByLabelText(/number of units/i);
    await user.type(unitsInput, '3');
    
    expect(unitsInput).toHaveValue(3);
  });

  it('selects blood group from dropdown', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const bloodGroupSelect = screen.getByLabelText(/blood group/i);
    await user.selectOptions(bloodGroupSelect, 'O+');
    
    expect(bloodGroupSelect).toHaveValue('O+');
  });

  it('selects urgency level from dropdown', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    await user.selectOptions(urgencySelect, 'critical');
    
    expect(urgencySelect).toHaveValue('critical');
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/blood group is required/i)).toBeInTheDocument();
    expect(screen.getByText(/number of units is required/i)).toBeInTheDocument();
    expect(screen.getByText(/urgency level is required/i)).toBeInTheDocument();
  });

  it('validates units range', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const unitsInput = screen.getByLabelText(/number of units/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.type(unitsInput, '15');
    await user.click(submitButton);
    
    expect(screen.getByText(/units must be between 1 and 10/i)).toBeInTheDocument();
  });

  it('validates minimum units', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const unitsInput = screen.getByLabelText(/number of units/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.type(unitsInput, '0');
    await user.click(submitButton);
    
    expect(screen.getByText(/units must be between 1 and 10/i)).toBeInTheDocument();
  });

  it('submits form successfully with valid data', async () => {
    const { createBloodRequest } = require('../src/services/hospitalBloodRequestApi');
    const { success } = require('react-hot-toast');
    
    const mockResponse = {
      requestId: 'REQ-001',
      status: 'pending',
      message: 'Blood request submitted successfully'
    };
    
    createBloodRequest.mockResolvedValue(mockResponse);
    
    const user = userEvent.setup();
    renderModal();
    
    const bloodGroupSelect = screen.getByLabelText(/blood group/i);
    const unitsInput = screen.getByLabelText(/number of units/i);
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(bloodGroupSelect, 'O+');
    await user.type(unitsInput, '3');
    await user.selectOptions(urgencySelect, 'high');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(createBloodRequest).toHaveBeenCalledWith({
        bloodGroup: 'O+',
        units: 3,
        urgency: 'high'
      });
    });
    
    await waitFor(() => {
      expect(success).toHaveBeenCalledWith('Blood request submitted successfully');
    });
    
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles API error gracefully', async () => {
    const { createBloodRequest } = require('../src/services/hospitalBloodRequestApi');
    const { error } = require('react-hot-toast');
    
    createBloodRequest.mockRejectedValue(new Error('Network error'));
    
    const user = userEvent.setup();
    renderModal();
    
    const bloodGroupSelect = screen.getByLabelText(/blood group/i);
    const unitsInput = screen.getByLabelText(/number of units/i);
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(bloodGroupSelect, 'A+');
    await user.type(unitsInput, '2');
    await user.selectOptions(urgencySelect, 'medium');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(error).toHaveBeenCalledWith('Network error');
    });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const { createBloodRequest } = require('../src/services/hospitalBloodRequestApi');
    
    // Mock a delayed response
    createBloodRequest.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const user = userEvent.setup();
    renderModal();
    
    const bloodGroupSelect = screen.getByLabelText(/blood group/i);
    const unitsInput = screen.getByLabelText(/number of units/i);
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    
    await user.selectOptions(bloodGroupSelect, 'B+');
    await user.type(unitsInput, '1');
    await user.selectOptions(urgencySelect, 'low');
    await user.click(submitButton);
    
    // Check loading state
    expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    });
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderModal();
    
    // First trigger an error by submitting empty form
    const submitButton = screen.getByRole('button', { name: /submit request/i });
    await user.click(submitButton);
    
    // Error should appear
    expect(screen.getByText(/blood group is required/i)).toBeInTheDocument();
    
    // Start typing in units field
    const unitsInput = screen.getByLabelText(/number of units/i);
    await user.type(unitsInput, '2');
    
    // Error should be cleared
    expect(screen.queryByText(/blood group is required/i)).not.toBeInTheDocument();
  });

  it('has all required blood group options', () => {
    renderModal();
    
    const bloodGroupSelect = screen.getByLabelText(/blood group/i);
    const options = Array.from(bloodGroupSelect.options);
    
    const expectedGroups = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    expect(options.map(option => option.value)).toEqual(expectedGroups);
  });

  it('has all required urgency level options', () => {
    renderModal();
    
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    const options = Array.from(urgencySelect.options);
    
    const expectedUrgency = ['', 'low', 'medium', 'high', 'critical'];
    expect(options.map(option => option.value)).toEqual(expectedUrgency);
  });
});
