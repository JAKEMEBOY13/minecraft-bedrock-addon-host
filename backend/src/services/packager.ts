import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface PackageMetadata {
  name: string;
  description?: string;
  version: string;
  creator: string;
  format: 'bedrock';
  createdAt?: string;
  uuid?: string;
}

export async function packageAddon(
  zipPath: string,
  metadata: PackageMetadata
): Promise<{ mcpack: string; mcworld: string | null }> {
  const packageId = generatePackageId();
  const timestamp = new Date().toISOString();
  
  const mcpackFilename = `${packageId}.mcpack`;
  const mcpackPath = path.join('downloads', mcpackFilename);

  try {
    const addonBuffer = await fs.readFile(zipPath);
    const addonZip = await JSZip.loadAsync(addonBuffer);

    const packageZip = new JSZip();

    addonZip.forEach((relativePath, file) => {
      if (!file.dir) {
        packageZip.file(relativePath, file.async('arraybuffer'));
      }
    });

    const metadataFile = {
      ...metadata,
      createdAt: timestamp,
      uuid: metadata.uuid || uuidv4(),
      packageId,
      downloadUrl: `/downloads/${mcpackFilename}`
    };

    packageZip.file('pack_metadata.json', JSON.stringify(metadataFile, null, 2));

    const dataDir = 'data/addons';
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      path.join(dataDir, `${packageId}.json`),
      JSON.stringify(metadataFile, null, 2)
    );

    const mcpackBuffer = await packageZip.generateAsync({ type: 'nodebuffer' });
    
    await fs.mkdir('downloads', { recursive: true });
    
    await fs.writeFile(mcpackPath, mcpackBuffer);

    const checksum = crypto
      .createHash('sha256')
      .update(mcpackBuffer)
      .digest('hex');

    await fs.writeFile(
      path.join('downloads', `${packageId}.sha256`),
      checksum
    );

    console.log(`✅ Packaged: ${mcpackFilename} (${(mcpackBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return {
      mcpack: mcpackFilename,
      mcworld: null
    };
  } catch (error) {
    throw new Error(`Failed to package addon: ${(error as Error).message}`);
  }
}

function generatePackageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}
