// Vite environment types
// Types are automatically available when vite is installed as a dependency

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
