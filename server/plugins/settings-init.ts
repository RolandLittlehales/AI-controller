import { initializeSettings } from "../services/settingsInit";

export default async function () {
  // Initialize settings on server startup
  await initializeSettings();
};