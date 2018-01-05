const videoshow = require("videoshow");
const Jimp = require("jimp");
const fs = require('fs');

let path = "./images/";

fs.readdir(path, (err, files) => {

  var filePaths = files.map(file => path + file);

  let images = filePaths.filter(file => file.indexOf(".jpg") > -1);

  images.map(image => {
    Jimp.read(image, (err, img) => {
      if (img.bitmap.height != img.bitmap.width) {
        
        if (img.bitmap.height > img.bitmap.width) {
          img
            .contain(img.bitmap.height, img.bitmap.height, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_CENTER)
            .write(image)
        }
          
        
        if (img.bitmap.width > img.bitmap.height) {
          img
            .contain(img.bitmap.width, img.bitmap.width)
            .write(image)
        }
      }
    })
  })

  var videoOptions = {
    fps: 23,
    loop: 1, // seconds
    transition: false,
    size: "800x?",
    videoBitrate: 2048,
    videoCodec: 'libx264',
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }

  videoshow(images, videoOptions)
    .save('video.mp4')
    .on('start', function (command) {
      console.log('ffmpeg process started:', command)
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err)
      console.error('ffmpeg stderr:', stderr)
    })
    .on('end', function (output) {
      console.error('Video created in:', output)
    })
})




