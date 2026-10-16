import { create } from "zustand";
import { EditionType, ModuleId, EditionConfig } from "../types/edition";
import { getEditionConfig, isModuleEnabledForEdition } from "../config/editionConfig";
import api from "../lib/api";

interface EditionState {
  currentEdition: EditionType;
  config: EditionConfig;
  facilityName: string;
  isBackendSynced: boolean;
  isModuleEnabled: (moduleId: ModuleId) => boolean;
  syncWithBackend: () => Promise<void>;
  setEdition: (edition: EditionType) => void;
}

const envEdition = import.meta.env.VITE_APP_EDITION as string | undefined;
const initialConfig = getEditionConfig(envEdition || "Hospital");

export const useEditionStore = create<EditionState>((set, get) => ({
  currentEdition: initialConfig.type,
  config: initialConfig,
  facilityName: "CuraSphere Healthcare Facility",
  isBackendSynced: false,

  isModuleEnabled: (moduleId: ModuleId) => {
    return isModuleEnabledForEdition(moduleId, get().currentEdition);
  },

  syncWithBackend: async () => {
    try {
      const response = await api.get("/system/edition");
      if (response.data?.success && response.data?.data) {
        const { currentEdition, facilityName } = response.data.data;
        const resolvedConfig = getEditionConfig(currentEdition);
        set({
          currentEdition: resolvedConfig.type,
          config: resolvedConfig,
          facilityName: facilityName || get().facilityName,
          isBackendSynced: true
        });
      }
    } catch {
      // Backend not yet available or offline; fallback to safe configuration
    }
  },

  setEdition: (edition: EditionType) => {
    const resolvedConfig = getEditionConfig(edition);
    set({
      currentEdition: resolvedConfig.type,
      config: resolvedConfig
    });
  }
}));
