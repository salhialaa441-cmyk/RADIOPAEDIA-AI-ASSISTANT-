const fs = require('fs');
const path = require('path');

const caseFolder = '231344_Radiology_Case_Radiopaediaorg';
const outputDir = path.join(__dirname, 'output', caseFolder);
const metadataPath = path.join(outputDir, 'metadata.json');
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

console.log('Case:', metadata.caseTitle);
console.log('');

// Scan modalities
const modalityEntries = fs.readdirSync(outputDir, { withFileTypes: true });
for (const modalityEntry of modalityEntries) {
  if (modalityEntry.isDirectory() && modalityEntry.name !== 'metadata.json') {
    console.log('=== Modality:', modalityEntry.name, '===');

    const modalityPath = path.join(outputDir, modalityEntry.name);
    const protocolEntries = fs.readdirSync(modalityPath, { withFileTypes: true });

    for (const protocolEntry of protocolEntries) {
      if (protocolEntry.isDirectory()) {
        const protocolPath = path.join(modalityPath, protocolEntry.name);
        const seriesEntries = fs.readdirSync(protocolPath, { withFileTypes: true });

        for (const seriesEntry of seriesEntries) {
          if (seriesEntry.isDirectory()) {
            const seriesPath = path.join(protocolPath, seriesEntry.name);
            const seriesMetadataPath = path.join(seriesPath, 'metadata.json');

            if (fs.existsSync(seriesMetadataPath)) {
              const seriesMetadata = JSON.parse(fs.readFileSync(seriesMetadataPath, 'utf-8'));
              console.log('  Protocol:', seriesMetadata.protocol);
              console.log('    folderName:', seriesEntry.name);
              console.log('    protocolPath:', protocolPath);
              console.log('    modality:', seriesMetadata.modality);
              console.log('    imagesDownloaded:', seriesMetadata.imagesDownloaded);

              // Generate URL as PanelGrid does
              let protocolFolderName = seriesEntry.name;
              if (seriesMetadata.protocolPath) {
                const pathParts = seriesMetadata.protocolPath.replace(/\\/g, '/').split('/');
                protocolFolderName = pathParts[pathParts.length - 1];
              }

              const imageServerUrl = 'http://127.0.0.1:3456/output';
              const baseUrl = `${imageServerUrl}/${caseFolder}/${seriesMetadata.modality}/${protocolFolderName}/${seriesEntry.name}/images`;
              console.log('    Generated URL:', baseUrl + '/img_0001.jpg');

              // Test if file exists
              const localPath = path.join(__dirname, 'output', caseFolder, seriesMetadata.modality, protocolFolderName, seriesEntry.name, 'images', 'img_0001.jpg');
              const exists = fs.existsSync(localPath);
              console.log('    File exists:', exists);
              console.log('    Local path:', localPath);
              console.log('');
            }
          }
        }
      }
    }
  }
}
