import favicons from 'favicons';
import fs from 'fs/promises';
import path from 'path';

const source = 'public/logo.svg';
const dest = 'public';

const configuration = {
  path: '/',
  appName: 'GridStor Analytics',
  icons: {
    android: false,
    appleIcon: false,
    appleStartup: false,
    coast: false,
    favicons: true,
    firefox: false,
    windows: false,
    yandex: false
  }
};

async function generateFavicon() {
  try {
    const response = await favicons(source, configuration);
    
    // Create the public directory if it doesn't exist
    await fs.mkdir(dest, { recursive: true });
    
    // Save favicon files
    await Promise.all(
      response.images.map(image => 
        fs.writeFile(path.join(dest, image.name), image.contents)
      )
    );
    
    console.log('Favicon generated successfully!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon(); 