/**
 * CubeOwnerCard.test.tsx - Tests for the owner card form component
 *
 * Tests:
 * - Form visibility and state management
 * - Input validation
 * - Form submission
 * - Error handling
 * - LinkedIn connection button states
 * - Profile display
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CubeOwnerCard } from "@/components/cubespace/CubeOwnerCard";
import type { CubeProfile } from "@/components/cubespace/cubeProfiles";

describe("CubeOwnerCard", () => {
  const mockProfile: CubeProfile = {
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    linkedinUrl: "https://www.linkedin.com/in/johndoe",
    verified: true,
    photoUrl: "https://example.com/photo.jpg",
  };

  const mockCallbacks = {
    onDismiss: vi.fn(),
    onConnectLinkedIn: vi.fn(),
    onSaveName: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should not render when closed", () => {
      const { container } = render(
        <CubeOwnerCard open={false} authConfigured={true} {...mockCallbacks} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when open", () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      expect(screen.getByText("This cube is yours.")).toBeInTheDocument();
    });
  });

  describe("Initial State", () => {
    it("should display initial title and description", () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      expect(screen.getByText("This cube is yours.")).toBeInTheDocument();
      expect(screen.getByText("Add your name and photo?")).toBeInTheDocument();
    });

    it("should show LinkedIn button when not connected", () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      expect(screen.getByText("Connect LinkedIn")).toBeInTheDocument();
    });

    it("should show both LinkedIn and Add name buttons initially", () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      expect(screen.getByText("Connect LinkedIn")).toBeInTheDocument();
      expect(screen.getByText("Add name")).toBeInTheDocument();
    });
  });

  describe("Profile Display", () => {
    it("should display profile information when provided", () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should show verified badge when verified", () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      // Check for verified indicator (small circle) by checking its styling or parent context
      const verifiedElements = screen.queryAllByText("LinkedIn connected");
      expect(verifiedElements.length).toBeGreaterThan(0);
    });

    it("should show profile photo when available", () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      const img = screen.getByAltText("John Doe") as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe("https://example.com/photo.jpg");
    });

    it("should show initials when no photo", () => {
      const profileNoPhoto = { ...mockProfile, photoUrl: undefined };
      render(
        <CubeOwnerCard
          open={true}
          profile={profileNoPhoto}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("should show LinkedIn connected label", () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      // Verify the profile info section exists with LinkedIn connected indicator
      const verifiedElements = screen.queryAllByText("LinkedIn connected");
      expect(verifiedElements.length).toBeGreaterThan(0);
    });
  });

  describe("LinkedIn Button", () => {
    it("should call onConnectLinkedIn when button clicked", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const button = screen.getByText("Connect LinkedIn");
      await userEvent.click(button);

      expect(mockCallbacks.onConnectLinkedIn).toHaveBeenCalledOnce();
    });

    it("should be disabled when connecting", () => {
      render(
        <CubeOwnerCard
          open={true}
          authStatus={{ status: "loading" }}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      const button = screen.getByText("Connecting...");
      expect(button).toBeDisabled();
    });

    it("should display error message on auth error", () => {
      render(
        <CubeOwnerCard
          open={true}
          authStatus={{ status: "error", message: "Login failed" }}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });

    it("should be disabled when auth not configured", () => {
      render(
        <CubeOwnerCard open={true} authConfigured={false} {...mockCallbacks} />,
      );

      const button = screen.getByText("Connect LinkedIn");
      expect(button).toBeDisabled();
    });

    it("should show message when auth not configured", () => {
      render(
        <CubeOwnerCard open={true} authConfigured={false} {...mockCallbacks} />,
      );

      expect(
        screen.getByText("Auth0 config is missing in this build."),
      ).toBeInTheDocument();
    });

    it("should show connected state when already connected", () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      const connectedButtons = screen.queryAllByText("LinkedIn connected");
      // Button should exist and be disabled
      const buttonElement = connectedButtons.find(
        (el) => el.tagName.toLowerCase() === "button",
      );
      expect(buttonElement).toBeInTheDocument();
      expect(buttonElement).toBeDisabled();
    });
  });

  describe("Add Name Form", () => {
    it("should toggle form visibility with Add name button", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      expect(
        screen.queryByPlaceholderText("https://www.linkedin.com/in/..."),
      ).not.toBeInTheDocument();

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      expect(
        screen.getByPlaceholderText("https://www.linkedin.com/in/..."),
      ).toBeInTheDocument();
    });

    it("should close form with Back button", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const backButton = screen.getByText("Back");
      await userEvent.click(backButton);

      expect(
        screen.queryByPlaceholderText("https://www.linkedin.com/in/..."),
      ).not.toBeInTheDocument();
    });

    it("should populate form with existing profile data", async () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText(
        "First name",
      ) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(
        "Last name",
      ) as HTMLInputElement;

      expect(firstNameInput.value).toBe("John");
      expect(lastNameInput.value).toBe("Doe");
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when first name is empty", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const lastNameInput = screen.getByLabelText("Last name");
      await userEvent.clear(lastNameInput);
      await userEvent.type(lastNameInput, "Doe");

      const submitButton = screen.getByText("Save name");
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when last name is empty", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText("First name");
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, "John");

      const submitButton = screen.getByText("Save name");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when both names filled", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText("First name");
      const lastNameInput = screen.getByLabelText("Last name");

      await userEvent.type(firstNameInput, "John");
      await userEvent.type(lastNameInput, "Doe");

      const submitButton = screen.getByText("Save name");
      expect(submitButton).not.toBeDisabled();
    });

    it("should trim whitespace from names", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText("First name");
      const lastNameInput = screen.getByLabelText("Last name");

      await userEvent.type(firstNameInput, "  John  ");
      await userEvent.type(lastNameInput, "  Doe  ");

      const submitButton = screen.getByText("Save name");
      await userEvent.click(submitButton);

      expect(mockCallbacks.onSaveName).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        linkedinUrl: undefined,
      });
    });
  });

  describe("Form Submission", () => {
    it("should call onSaveName with form data", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText("First name");
      const lastNameInput = screen.getByLabelText("Last name");

      await userEvent.type(firstNameInput, "Jane");
      await userEvent.type(lastNameInput, "Smith");

      const submitButton = screen.getByText("Save name");
      await userEvent.click(submitButton);

      expect(mockCallbacks.onSaveName).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Smith",
        linkedinUrl: undefined,
      });
    });

    it("should include LinkedIn URL when provided", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText("First name");
      const lastNameInput = screen.getByLabelText("Last name");
      const linkedinInput = screen.getByPlaceholderText(
        "https://www.linkedin.com/in/...",
      );

      await userEvent.type(firstNameInput, "Jane");
      await userEvent.type(lastNameInput, "Smith");
      await userEvent.type(linkedinInput, "https://www.linkedin.com/in/jane");

      const submitButton = screen.getByText("Save name");
      await userEvent.click(submitButton);

      expect(mockCallbacks.onSaveName).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Smith",
        linkedinUrl: "https://www.linkedin.com/in/jane",
      });
    });

    it("should not include empty LinkedIn URL", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      const firstNameInput = screen.getByLabelText("First name");
      const lastNameInput = screen.getByLabelText("Last name");

      await userEvent.type(firstNameInput, "Jane");
      await userEvent.type(lastNameInput, "Smith");

      const submitButton = screen.getByText("Save name");
      await userEvent.click(submitButton);

      expect(mockCallbacks.onSaveName).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Jane",
          lastName: "Smith",
        }),
      );

      const call = mockCallbacks.onSaveName.mock.calls[0][0];
      expect(call.linkedinUrl).toBeUndefined();
    });
  });

  describe("Error Display", () => {
    it("should display save error message", () => {
      render(
        <CubeOwnerCard
          open={true}
          error="Failed to save"
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("Failed to save")).toBeInTheDocument();
    });

    it("should display auth error message", () => {
      render(
        <CubeOwnerCard
          open={true}
          authStatus={{ status: "error", message: "Auth failed" }}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("Auth failed")).toBeInTheDocument();
    });

    it("should prioritize save error over auth error", () => {
      render(
        <CubeOwnerCard
          open={true}
          error="Save error"
          authStatus={{ status: "error", message: "Auth error" }}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("Save error")).toBeInTheDocument();
      expect(screen.queryByText("Auth error")).not.toBeInTheDocument();
    });
  });

  describe("Saving State", () => {
    it("should disable all buttons while saving", () => {
      render(
        <CubeOwnerCard
          open={true}
          saving={true}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      const addNameButton = screen.getByText("Add name");
      const connectButton = screen.getByText("Connect LinkedIn");

      expect(addNameButton).toBeDisabled();
      expect(connectButton).toBeDisabled();
    });

    it("should show saving state in form submission button", async () => {
      const { rerender } = render(
        <CubeOwnerCard
          open={true}
          authConfigured={true}
          saving={false}
          {...mockCallbacks}
        />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      rerender(
        <CubeOwnerCard
          open={true}
          authConfigured={true}
          saving={true}
          {...mockCallbacks}
        />,
      );

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });

  describe("Dismiss", () => {
    it("should call onDismiss with Not now button", async () => {
      render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const notNowButton = screen.getByText("Not now");
      await userEvent.click(notNowButton);

      expect(mockCallbacks.onDismiss).toHaveBeenCalledOnce();
    });

    it("should call onDismiss with Done button when profile exists", async () => {
      render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      const doneButton = screen.getByText("Done");
      await userEvent.click(doneButton);

      expect(mockCallbacks.onDismiss).toHaveBeenCalledOnce();
    });
  });

  describe("Form Reset on Profile Change", () => {
    it("should reset form fields when card is closed and reopened", async () => {
      const { rerender } = render(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      const addNameButton = screen.getByText("Add name");
      await userEvent.click(addNameButton);

      // Close the card
      rerender(
        <CubeOwnerCard open={false} authConfigured={true} {...mockCallbacks} />,
      );

      // Reopen the card
      rerender(
        <CubeOwnerCard open={true} authConfigured={true} {...mockCallbacks} />,
      );

      // Form should be hidden again
      expect(
        screen.queryByPlaceholderText("https://www.linkedin.com/in/..."),
      ).not.toBeInTheDocument();
    });

    it("should populate new profile data when profile prop changes", async () => {
      const { rerender } = render(
        <CubeOwnerCard
          open={true}
          profile={mockProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      // First verify profile data is displayed
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      const newProfile = {
        firstName: "Jane",
        lastName: "Smith",
        fullName: "Jane Smith",
      };

      rerender(
        <CubeOwnerCard
          open={true}
          profile={newProfile}
          authConfigured={true}
          {...mockCallbacks}
        />,
      );

      // After rerender with new profile, the new name should be displayed
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });
});
