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
    const filePath = path.join(directoryPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      console.log(`\nContents of directory: ${filePath}`);
      fs.readdir(filePath, (err, nestedFiles) => {
        if (err) {
          console.error(`Error reading nested directory ${filePath}:`, err);
          process.exit(1);
        }
        nestedFiles.forEach((nestedFile) => {
          console.log(nestedFile);
        });
      });
    } else {
      console.log(file);
    }
  });
});
