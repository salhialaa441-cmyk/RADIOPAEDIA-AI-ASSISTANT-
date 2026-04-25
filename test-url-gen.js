const fs = require('fs');
const path = require('path');

// Simulate what IPC handler does
const outputDir = path.join(__dirname, 'output');
const caseFolder = '231344_Radiology_Case_Radiopaediaorg';
const casePath = path.join(outputDir, caseFolder);

const modalityEntries = fs.readdirSync(casePath, { withFileTypes: true });
for (const modalityEntry of modalityEntries) {
  if (modalityEntry.isDirectory() && modalityEntry.name === 'MRI') {
    const modalityPath = path.join(casePath, modalityEntry.name);
    const protocolEntries = fs.readdirSync(modalityPath, { withFileTypes: true });

    for (const protocolEntry of protocolEntries) {
      if (protocolEntry.isDirectory() && protocolEntry.name === 'Axial_T1') {
        const protocolPath = path.join(modalityPath, protocolEntry.name);
        console.log('protocolPath:', protocolPath);

        const seriesEntries = fs.readdirSync(protocolPath, { withFileTypes: true });
        for (const seriesEntry of seriesEntries) {
          if (seriesEntry.isDirectory()) {
            console.log('  seriesEntry.name:', seriesEntry.name);

            // What IPC returns
            const protocolObj = {
              folderName: seriesEntry.name,
              protocolPath: protocolPath,
            };
            console.log('  protocolObj:', protocolObj);

            // What generateImageUrls does
            let protocolFolderName = protocolObj.folderName;
            if (protocolObj.protocolPath) {
              const parts = protocolObj.protocolPath.replace(/\\/g, '/').split('/');
              protocolFolderName = parts[parts.length - 1];
            }
            console.log('  protocolFolderName:', protocolFolderName);

            // Generated URL
            const baseUrl = 'http://127.0.0.1:3456/output/' + caseFolder + '/' + modalityEntry.name + '/' + protocolFolderName + '/' + protocolObj.folderName + '/images';
            console.log('  Generated URL:', baseUrl + '/img_0001.jpg');

            // Correct URL
            const correctUrl = 'http://127.0.0.1:3456/output/' + caseFolder + '/' + modalityEntry.name + '/' + protocolEntry.name + '/' + seriesEntry.name + '/images/img_0001.jpg';
            console.log('  Correct URL:', correctUrl);

            // Check if file exists at generated path
            const generatedPath = path.join(outputDir, caseFolder, modalityEntry.name, protocolFolderName, protocolObj.folderName, 'images', 'img_0001.jpg');
            const exists = fs.existsSync(generatedPath);
            console.log('  File exists at generated path:', exists);
            console.log('');
          }
        }
      }
    }
  }
}
