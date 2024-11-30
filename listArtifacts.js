const fs = require('fs');
const path = require('path');

const directoryPath = process.argv[2] || '.';

console.log(`Reading contents of directory: ${directoryPath}`);

if (!fs.existsSync(directoryPath)) {
  console.error(`Directory ${directoryPath} does not exist.`);
  process.exit(1);
}

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error(`Error reading directory ${directoryPath}:`, err);
    process.exit(1);
  }

  console.log(`Contents of directory ${directoryPath}:`);
  files.forEach((file) => {
    console.log(file);
  });
});
