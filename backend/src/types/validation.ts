export interface ValidationResult {
  valid: boolean;
  errors: string[];
  details: Record<string, any>;
}

export interface BundlePackage {
  name: string;
  description?: string;
  version: string;
  creator: string;
  packageId: string;
  uuid: string;
  createdAt: string;
  downloadUrl: string;
}
