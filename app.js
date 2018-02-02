const videoshow = require('videoshow');
const sharp = require('sharp');
const fs = require('fs');
const rimraf = require('rimraf');

let path = '';
let outputFilename = '';
let framerate = 24
let tempImages = [];
let quality = 90; // TODO: Make this an arg

process.argv.forEach(function (val, index, array) {
  if (val.match(/images=/)) {
    path = val.substring(7)
  }

  if (val.match(/video=/)) {
    outputFilename = val.substring(6)
  }

  if (val.match(/framerate=/)) {
    framerate = val.substring(10)
  }

  if (val.match(/quality=/)) {
    framerate = val.substring(8)
  }
});

if (parseInt(framerate)) {
  framerate = parseInt(framerate)
} else {
  console.error(`framerate must be an integer. default framerate is 24. example: framerate='60'`);
  process.exit();
}

if (parseInt(quality)) {
  quality = parseInt(quality)
} else {
  console.error(`quality must be an integer between 1 and 100. default quality is 90. example: quality='90'`);
  process.exit();
}

if (path === '') {
  console.error(`images required. example: images='./path/to/images'`);
  process.exit();
}

if (outputFilename === '') {
  console.error(`filename required. example: video='filename-for-video'`);
  process.exit();
}

let workingDirectory = `${path}videogram-tmp/`;
if (!fs.existsSync(workingDirectory)) {
  fs.mkdirSync(workingDirectory);
}

fs.readdir(path, (err, files) => {
  let images = files.filter(file => file.match(/(.jpg|.jpeg|.png)/));
  console.log('Processing images...');

  images.map(image => {
    let tempImage = `${workingDirectory}${image}`;
    tempImages.push(tempImage);

    sharp(path + image)
      .metadata()
      .then(metadata => {
        if (metadata.width > metadata.height) {
          return sharp(path + image)
            .resize(metadata.width, metadata.width)
            .background({ r: 0, g: 0, b: 0, alpha: 0 })
            .embed()
            .jpeg({ quality: quality })
            .toFile(tempImage);
        }

        if (metadata.height > metadata.width) {
          return sharp(path + image)
            .resize(metadata.height, metadata.height)
            .background({ r: 0, g: 0, b: 0, alpha: 0 })
            .embed()
            .jpeg({ quality: quality })
            .toFile(tempImage);
        }

        return sharp(path + image).jpeg({ quality: quality }).toFile(tempImage);
      });
  });

  if (tempImages.length > 0) {
    let videoOptions = {
      framerate: framerate,
      loop: 1, // seconds TODO: Make this an arg
      transition: false, // TODO: Make this an arg
      size: '800x?', // TODO: Make this an arg
      videoBitrate: 2048, // TODO: Make this an arg
      videoCodec: 'libx264', // TODO: Make this an arg
      format: 'mp4', // TODO: Make this an arg
      pixelFormat: 'yuv420p' // TODO: Make this an arg
    };

    console.log('Images processed.');
    console.log('Processing video...');
    videoshow(tempImages, videoOptions)
      .save(`${outputFilename}.mp4`)
      .on('error', function (err, stdout, stderr) {
        console.error('Error:', err);
        console.error('ffmpeg stderr:', stderr);
      })
      .on('end', function (output) {
        rimraf.sync(workingDirectory); // TODO: Won't get here if no images found
        console.log('Video created in:', output);
      });
  }
});
