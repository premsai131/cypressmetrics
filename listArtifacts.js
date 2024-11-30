const fs = require('fs');
const path = require('path');

function listArtifactContents(directory) {
  console.log(`Reading contents of directory: ${directory}`);

  if (!fs.existsSync(directory)) {
    console.error(`Directory ${directory} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(directory);
  if (files.length === 0) {
    console.log('No files found in the directory.');
    return;
  }

  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      console.log(`\nFile: ${file}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log('Contents:');
      console.log(content);
    } else if (stats.isDirectory()) {
      console.log(`\nDirectory: ${file}`);
      console.log('Contents:');
      listArtifactContents(filePath); // Recursive call for nested directories
    }
  });
}

const directoryToScan = process.argv[2] || 'downloaded-artifacts'; // Default to 'downloaded-artifacts'
listArtifactContents(directoryToScan);
