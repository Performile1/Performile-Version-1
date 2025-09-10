import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../RegisterForm';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Create a test-utils file to wrap with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

describe('RegisterForm', () => {
  const queryClient = new QueryClient();
  const mockRegister = vi.fn();
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock implementation
    (useAuthStore as any).mockImplementation(() => ({
      register: mockRegister,
    }));
  });

  const renderComponent = () => {
    return render(
      <TestWrapper>
        <RegisterForm onSwitchToLogin={vi.fn()} />
      </TestWrapper>
    );
  };

  it('renders the form with all fields', () => {
    renderComponent();
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted empty', async () => {
    renderComponent();
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check for validation errors
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    
    // Should not call register function
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows password strength indicator', async () => {
    renderComponent();
    
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Type a weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    // Check for weak password indicator
    expect(await screen.findByText(/weak/i, { selector: 'span' })).toBeInTheDocument();
    
    // Type a stronger password
    fireEvent.change(passwordInput, { target: { value: 'Str0ngP@ss' } });
    
    // Check for strong password indicator
    expect(await screen.findByText(/strong/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    // Mock successful registration
    mockRegister.mockResolvedValueOnce(true);
    
    renderComponent();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Str0ngP@ss' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check if register was called with the right data
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'Str0ngP@ss',
        user_role: 'consumer',
        phone: '',
      });
    });
    
    // Should redirect to dashboard on success
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows error message when registration fails', async () => {
    // Mock failed registration
    const errorMessage = 'Email already in use';
    mockRegister.mockRejectedValueOnce({ message: errorMessage });
    
    renderComponent();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Str0ngP@ss' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check for error message
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderComponent();
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    
    // Password should be hidden by default
    expect(passwordInput.type).toBe('password');
    
    // Click the toggle button
    fireEvent.click(toggleButton);
    
    // Password should be visible
    expect(passwordInput.type).toBe('text');
    
    // Click the toggle button again
    fireEvent.click(toggleButton);
    
    // Password should be hidden again
    expect(passwordInput.type).toBe('password');
  });
});
