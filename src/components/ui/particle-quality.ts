import type { QualitySettings } from "./particle-field-3d";

let externalQualitySettings: QualitySettings | null = null;

export const setParticleField3DQuality = (settings: QualitySettings) => {
  externalQualitySettings = settings;
};

export const getExternalQualitySettings = () => externalQualitySettings;
