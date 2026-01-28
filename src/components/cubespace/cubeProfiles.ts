export type CubeProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl?: string;
  linkedinUrl?: string;
  verified?: boolean;
};

export type CubeProfileMap = Record<number, CubeProfile>;

export const buildFullName = (firstName: string, lastName: string) => {
  return `${firstName} ${lastName}`.trim();
};
