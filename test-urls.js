// Test image URL generation
function generateImageUrls(protocol, caseFolder, imageServerUrl) {
  if (!protocol || !caseFolder || !imageServerUrl) return [];

  // Extract protocol folder name from protocolPath
  let protocolFolderName = protocol.folderName;
  if (protocol.protocolPath) {
    const pathParts = protocol.protocolPath.replace(/\\/g, '/').split('/');
    protocolFolderName = pathParts[pathParts.length - 1];
  }
  console.log('Protocol folder name:', protocolFolderName);

  const imageFolder = imageServerUrl + '/' + caseFolder + '/' + protocol.modality + '/' + protocolFolderName + '/' + protocol.folderName + '/images';
  const urls = [];

  for (let i = 0; i < Math.min(3, protocol.imagesDownloaded); i++) {
    const num = String(i + 1).padStart(4, '0');
    urls.push(imageFolder + '/img_' + num + '.jpg');
  }

  return urls;
}

// Test with actual protocol data
const protocol = {
  protocol: 'Axial C+arterial phase',
  folderName: 'series_736757',
  modality: 'CT',
  protocolPath: 'C:\\Users\\salhi\\RADIOPAEDIA-AI-ASSISTANT-\\output\\231663_Radiology_Case_Radiopaediaorg\\CT\\Axial_Carterial_phase',
  imagesDownloaded: 409
};

const urls = generateImageUrls(protocol, '231663_Radiology_Case_Radiopaediaorg', 'http://localhost:3456/output');
console.log('\nGenerated URLs:');
urls.forEach(url => console.log('  ' + url));

// Test if URLs are valid
const http = require('http');
let checked = 0;
let passed = 0;
console.log('\nTesting URLs:');
urls.forEach(url => {
  http.get(url, (res) => {
    const status = res.statusCode === 200 ? '✓ OK' : '✗ ' + res.statusCode;
    if (res.statusCode === 200) passed++;
    console.log('  ' + status + ' - ' + url.split('/').pop());
    checked++;
    if (checked === urls.length) {
      console.log('\nResult: ' + passed + '/' + urls.length + ' URLs working');
      process.exit(passed === urls.length ? 0 : 1);
    }
  }).on('error', (e) => {
    console.log('  ✗ Error: ' + e.message);
    checked++;
  });
});
