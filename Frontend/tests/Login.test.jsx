import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import Login from '../src/pages/Login';

// Mock the auth API
jest.mock('../src/services/authApi', () => ({
  loginUser: jest.fn()
}));

// Mock react-router-dom
const MockedRouter = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

// Mock AuthContext
const MockedAuthProvider = ({ children }) => {
  const mockLogin = jest.fn();
  return (
    <AuthProvider value={{ login: mockLogin }}>
      {children}
    </AuthProvider>
  );
};

const renderLogin = () => {
  return render(
    <MockedRouter>
      <MockedAuthProvider>
        <Login />
      </MockedAuthProvider>
    </MockedRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderLogin();
    
    expect(screen.getByLabelText(/organization code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('updates form fields when user types', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    
    await user.type(orgCodeInput, 'HOSP-DEL-001');
    await user.type(emailInput, 'doctor@hospital.com');
    await user.type(passwordInput, 'password123');
    
    expect(orgCodeInput).toHaveValue('HOSP-DEL-001');
    expect(emailInput).toHaveValue('doctor@hospital.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    // First trigger an error by submitting empty form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    // Error should appear
    expect(screen.getByText(/organization code is required/i)).toBeInTheDocument();
    
    // Start typing in organization code field
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    await user.type(orgCodeInput, 'H');
    
    // Error should be cleared
    expect(screen.queryByText(/organization code is required/i)).not.toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/organization code is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('validates organization code format', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(orgCodeInput, 'INVALID');
    await user.type(emailInput, 'doctor@hospital.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText(/invalid organization code format/i)).toBeInTheDocument();
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(orgCodeInput, 'HOSP-DEL-001');
    await user.type(emailInput, 'doctor@hospital.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const { loginUser } = require('../src/services/authApi');
    const { success } = require('react-hot-toast');
    
    const mockResponse = {
      token: 'mock-jwt-token',
      user: {
        userCode: 'HOSP-DEL-001-001',
        name: 'Dr. Test User',
        email: 'doctor@hospital.com',
        role: 'doctor',
        organizationCode: 'HOSP-DEL-001'
      }
    };
    
    loginUser.mockResolvedValue(mockResponse);
    
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(orgCodeInput, 'HOSP-DEL-001');
    await user.type(emailInput, 'doctor@hospital.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        organizationCode: 'HOSP-DEL-001',
        email: 'doctor@hospital.com',
        password: 'password123'
      });
    });
    
    await waitFor(() => {
      expect(success).toHaveBeenCalledWith('Login successful!');
    });
  });

  it('handles login failure', async () => {
    const { loginUser } = require('../src/services/authApi');
    const { error } = require('react-hot-toast');
    
    loginUser.mockRejectedValue(new Error('Invalid credentials'));
    
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(orgCodeInput, 'HOSP-DEL-001');
    await user.type(emailInput, 'doctor@hospital.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows loading state during submission', async () => {
    const { loginUser } = require('../src/services/authApi');
    
    // Mock a delayed response
    loginUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(orgCodeInput, 'HOSP-DEL-001');
    await user.type(emailInput, 'doctor@hospital.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Check loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('displays multiple validation errors', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const orgCodeInput = screen.getByLabelText(/organization code/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(orgCodeInput, 'INVALID');
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    expect(screen.getByText(/invalid organization code format/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });
});
