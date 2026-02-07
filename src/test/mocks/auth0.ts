/**
 * Auth0 Mocks - Mock Auth0 authentication functions for testing
 */

import { vi } from "vitest";

export type MockAuth0User = {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
  linkedinId?: string;
};

// Mock user data
export const mockLinkedInUser: MockAuth0User = {
  sub: "linkedin|12345",
  name: "Test User",
  email: "test@example.com",
  picture: "https://example.com/picture.jpg",
  linkedinId: "12345",
};

// Mock loginWithLinkedInPopup
export const mockLoginWithLinkedInPopup = vi.fn(
  async (): Promise<MockAuth0User> => {
    // Default: successful login
    return mockLinkedInUser;
  },
);

// Mock isAuth0Configured
export const mockIsAuth0Configured = vi.fn(() => true);

// Helper: Make login fail
export const makeLoginFail = (errorMessage = "LinkedIn login failed") => {
  mockLoginWithLinkedInPopup.mockRejectedValueOnce(new Error(errorMessage));
};

// Helper: Make Auth0 unconfigured
export const makeAuth0Unconfigured = () => {
  mockIsAuth0Configured.mockReturnValueOnce(false);
};

// Helper: Reset all mocks
export const clearAuth0Mocks = () => {
  mockLoginWithLinkedInPopup.mockClear();
  mockIsAuth0Configured.mockClear();
  // Reset to default behavior
  mockLoginWithLinkedInPopup.mockResolvedValue(mockLinkedInUser);
  mockIsAuth0Configured.mockReturnValue(true);
};

// Default export
export default {
  loginWithLinkedInPopup: mockLoginWithLinkedInPopup,
  isAuth0Configured: mockIsAuth0Configured,
};
