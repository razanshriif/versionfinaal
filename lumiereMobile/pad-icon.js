const Jimp = require('jimp');

async function padIcon() {
  console.log('Reading icon.png...');
  const iconPath = './assets/icon.png';
  const paddedIconPath = './assets/icon-padded.png';
  
  try {
    const originalImage = await Jimp.read(iconPath);
    
    // Create a new 1024x1024 white background image
    const paddedImage = new Jimp(1024, 1024, '#FFFFFF');
    
    // Resize original image to fit within a smaller box, e.g., 650x650
    // to give it enough padding around the edges
    originalImage.contain(700, 700);
    
    // Composite the resized original onto the center of the white background
    paddedImage.composite(originalImage, (1024 - 700) / 2, (1024 - 700) / 2);
    
    await paddedImage.writeAsync(paddedIconPath);
    console.log('Successfully created padded icon at ' + paddedIconPath);
    
    // Replace the original icon.png with the padded one
    const fs = require('fs');
    fs.renameSync(paddedIconPath, iconPath);
    console.log('Replaced original icon.png with the padded one.');
    
  } catch (error) {
    console.error('Error padding icon:', error);
  }
}

padIcon();
