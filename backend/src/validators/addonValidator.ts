import JSZip from 'jszip';
import fs from 'fs/promises';

export interface AddonValidationDetails {
  hasManifest: boolean;
  manifestVersion: number;
  packType: string;
  hasValidUUID: boolean;
  dependencies: string[];
  minEngineVersion: string;
  contentWarnings: string[];
}

export async function validateAddon(zipPath: string): Promise<{
  valid: boolean;
  errors: string[];
  details: AddonValidationDetails;
}> {
  const errors: string[] = [];
  const details: AddonValidationDetails = {
    hasManifest: false,
    manifestVersion: 0,
    packType: 'unknown',
    hasValidUUID: false,
    dependencies: [],
    minEngineVersion: '1.0.0',
    contentWarnings: []
  };

  try {
    const buffer = await fs.readFile(zipPath);
    const zip = await JSZip.loadAsync(buffer);

    const manifestFile = zip.file(/manifest\.json$/);
    if (!manifestFile || manifestFile.length === 0) {
      errors.push('Missing manifest.json in root directory');
    } else {
      try {
        const manifestContent = await manifestFile[0].async('string');
        const manifest = JSON.parse(manifestContent);

        details.hasManifest = true;
        details.manifestVersion = manifest.format_version;
        details.packType = manifest.header?.name || 'unknown';

        const headerUUID = manifest.header?.uuid;
        const modulesUUIDs = manifest.modules?.map((m: any) => m.uuid) || [];
        if (!headerUUID || modulesUUIDs.some((uuid: string) => !isValidUUID(uuid))) {
          errors.push('Invalid or missing UUIDs in manifest');
        } else {
          details.hasValidUUID = true;
        }

        details.dependencies = manifest.dependencies?.map((d: any) => d.uuid) || [];
        details.minEngineVersion = manifest.header?.min_engine_version || '1.0.0';

        if (!manifest.format_version) {
          errors.push('Missing format_version in manifest');
        }
        if (manifest.format_version !== 2) {
          details.contentWarnings.push(
            `Using manifest format version ${manifest.format_version}. Bedrock Edition uses version 2.`
          );
        }
      } catch (e) {
        errors.push(`Invalid JSON in manifest.json: ${(e as Error).message}`);
      }
    }

    const files = Object.keys(zip.files);
    const hasBedrockFiles = files.some(f => 
      f.includes('functions/') || 
      f.includes('entities/') || 
      f.includes('loot_tables/') ||
      f.includes('blocks.json')
    );

    if (files.length === 0) {
      errors.push('ZIP file is empty');
    }

    if (!hasBedrockFiles && details.packType === 'unknown') {
      details.contentWarnings.push('No Bedrock-specific files detected. Ensure this is a valid add-on.');
    }

    return {
      valid: errors.length === 0,
      errors,
      details
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to validate archive: ${(error as Error).message}`],
      details
    };
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
