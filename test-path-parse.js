const path = 'C:\\Users\\salhi\\RADIOPAEDIA-AI-ASSISTANT-\\output\\231344_Radiology_Case_Radiopaediaorg\\MRI\\Axial_T1';
console.log('Input:', path);

const pathParts = path.replace(/\\/g, '/').split('/');
console.log('Parts:', pathParts);
console.log('Last part:', pathParts[pathParts.length - 1]);
