interface ImportMetaEnv {
  readonly VITE_GREEN_API_ID: string
  readonly VITE_GREEN_API_TOKEN: string
  readonly VITE_GREEN_API_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
