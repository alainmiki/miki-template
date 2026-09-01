const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const extDir = 'miki-template-extension';
const buildDir = 'miki-template-extension/.vsix-build';
const vsixPath = 'miki-template-1.2.0.vsix';

if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true });
if (fs.existsSync(vsixPath)) fs.unlinkSync(vsixPath);

fs.mkdirSync(buildDir, { recursive: true });
const extTarget = path.join(buildDir, 'extension');
fs.mkdirSync(extTarget, { recursive: true });

function copyDirSync(src, dest) {
  fs.readdirSync(src).forEach(item => {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  });
}

copyDirSync(extDir, extTarget);

const manifest = '<?xml version="1.0" encoding="utf-8"?><PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011"><Metadata><Identity Id="alainmiki.miki-template" Version="1.2.0" Language="en-US" Publisher="alainmiki" /><DisplayName>miki-template</DisplayName><Description>Django-style template language syntax highlighting and snippets for miki-template</Description><Tags>django template miki syntax highlight snippet</Tags><Categories>Programming Languages,Snippets</Categories><GalleryFlags>Public</GalleryFlags><License>LICENSE</License><Icon>extension/icon.png</Icon></Metadata><Installation><InstallationTarget Id="Microsoft.VisualStudio.Code" /></Installation><Dependencies /><Assets><Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Content" Path="extension/syntaxes/miki-template.tmLanguage.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Content" Path="extension/syntaxes/language-configuration.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Snippet" Path="extension/snippets/miki-template.json" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Image" Path="extension/icon.png" Addressable="true" /><Asset Type="Microsoft.VisualStudio.Code.Image" Path="extension/icon.svg" Addressable="true" /></Assets></PackageManifest>';
const ct = '<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="json" ContentType="application/json" /><Default Extension="png" ContentType="image/png" /><Default Extension="svg" ContentType="image/svg+xml" /><Default Extension="md" ContentType="text/markdown" /></Types>';
fs.writeFileSync(path.join(buildDir, 'extension.vsixmanifest'), manifest);
fs.writeFileSync(path.join(buildDir, '[Content_Types].xml'), ct);

const files = [];
function collectFiles(dir, base) {
  fs.readdirSync(dir).forEach(item => {
    const s = path.join(dir, item);
    const d = path.join(base, item);
    if (fs.statSync(s).isDirectory()) {
      collectFiles(s, d);
    } else {
      files.push({ path: d, content: fs.readFileSync(s) });
    }
  });
}
collectFiles(buildDir, '');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const localFiles = [];
const centralDir = [];
let offset = 0;

for (const file of files) {
  const pathBytes = Buffer.from(file.path);
  const data = file.content;
  const compressed = zlib.deflateSync(data);
  const crc = crc32(data);
  
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(8, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(compressed.length, 18);
  localHeader.writeUInt32LE(data.length, 22);
  localHeader.writeUInt16LE(pathBytes.length, 26);
  localHeader.writeUInt16LE(0, 28);
  
  const localFile = Buffer.concat([localHeader, pathBytes, compressed]);
  localFiles.push(localFile);
  
  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(8, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(compressed.length, 20);
  centralHeader.writeUInt32LE(data.length, 24);
  centralHeader.writeUInt16LE(pathBytes.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(offset, 42);
  
  const centralEntry = Buffer.concat([centralHeader, pathBytes]);
  centralDir.push(centralEntry);
  
  offset += localFile.length;
}

const centralDirOffset = offset;
const centralDirSize = centralDir.reduce((sum, entry) => sum + entry.length, 0);
const endRecord = Buffer.alloc(22);
endRecord.writeUInt32LE(0x06054b50, 0);
endRecord.writeUInt16LE(0, 4);
endRecord.writeUInt16LE(0, 6);
endRecord.writeUInt16LE(centralDir.length, 8);
endRecord.writeUInt16LE(centralDir.length, 10);
endRecord.writeUInt32LE(centralDirSize, 12);
endRecord.writeUInt32LE(centralDirOffset, 16);
endRecord.writeUInt16LE(0, 20);

const zipBuffer = Buffer.concat([...localFiles, ...centralDir, endRecord]);
fs.writeFileSync(vsixPath, zipBuffer);

if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true });
console.log('VSIX created:', vsixPath, 'size:', zipBuffer.length);
