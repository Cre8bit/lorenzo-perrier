export type CubeProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl?: string;
  linkedinUrl?: string;
  verified?: boolean;
  profession?: string;
};

export type CubeProfileMap = Record<string, CubeProfile>;

export const buildFullName = (firstName: string, lastName: string) => {
  return `${firstName} ${lastName}`.trim();
};
