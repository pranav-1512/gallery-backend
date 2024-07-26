const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');
const Image = require('../models/Image');
const fetchuser = require('../middleware/fetchuser');

const mongourl = "mongodb+srv://admin:admin@cluster0.k08td3s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

// Create MongoDB connection
const conn = mongoose.createConnection(mongourl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

// Init GridFS
console.log('Initializing GridFS...');
// let gfs, gridfsBucket;
// conn.once('open', () => {
//   gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
//     bucketName: 'uploads'
//   });
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection('uploads');
//   console.log('GridFS initialized');
// });

// let gfs, gridfsBucket;
// conn.once('open', () => {
//   gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
//     bucketName: 'uploads'
//   });
//   gfs = new mongoose.mongo.GridFSBucket(conn.db, {
//     bucketName: 'uploads'
//   });
//   console.log('GridFS initialized');
// });

let gfs;
conn.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
  gfs = conn.db.collection('uploads.files');
  console.log('GridFS initialized');
});

// Create storage engine
const storage = new GridFsStorage({
    url: mongourl,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  storage.on('file', (file) => {
    console.log('A file is being written to MongoDB:', file);
  });
  
  storage.on('connection', () => {
    console.log('GridFS storage connected');
  });
  
  storage.on('connectionFailed', (err) => {
    console.error('GridFS storage connection failed:', err);
  });

storage.on('connectionError', function (err) {
    console.log('Connection error:', err);
});

storage.on('streamError', function (err) {
    console.log('Stream error:', err);
});

const upload = multer({ storage });

// Route 1: Upload an image
router.post('/upload', fetchuser, upload.single('image'), async (req, res) => {
    console.log('Upload route hit');
    try {
      console.log("Request body:", req.body);
      console.log("File:", req.file);
      if (!req.file) {
        return res.status(400).send('No file uploaded');
      }
  
      const newImage = new Image({
        userId: req.user.user.id,
        filename: req.file.filename,
        description: req.body.description,
        tag: req.body.tag
      });
  
      await newImage.save();
      res.json(newImage);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send('Server Error: ' + error.message);
    }
  });

// Route 2: Get all images for a user
router.get('/all', fetchuser, async (req, res) => {
    try {
        const images = await Image.find({ userId: req.user.user.id });
        res.json(images);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});



// Add this route to your backend
router.get('/file/:filename', async (req, res) => {
  if (!gfs) {
    console.error('GridFS not initialized');
    return res.status(500).send('Server not ready');
  }

  try {
    const file = await gfs.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).send('File not found');
    }

    // Set the proper content type
    res.set('Content-Type', file.contentType);

    // Create read stream
    const readstream = gridfsBucket.openDownloadStreamByName(file.filename);
    // Pipe the read stream to the response
    readstream.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).send('Server Error');
  }
});

router.put('/update/:id', fetchuser, async (req, res) => {
  try {
    const { description, tag } = req.body;
    const updatedImage = await Image.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.user.id },
      { $set: { description, tag } },
      { new: true }
    );
    console.log("desc",description,"tag",tag)
    console.log("id",req.params.id)
    console.log("Updated Image",updatedImage)

    if (!updatedImage) {
      return res.status(404).json({ success: false, error: 'Image not found or you do not have permission to update it' });
    }

    res.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
});

// Route 4: Delete an image
router.delete('/delete/:id', fetchuser, async (req, res) => {
    console.log("ID", req.params.id)
    try {
        const image = await Image.findOne({ _id: req.params.id, userId: req.user.user.id });
        console.log("Image", image)
        if (!image) {
            return res.status(404).send('Image not found');
        }

        // Delete file from GridFS
        const file = await gridfsBucket.find({ filename: image.filename }).toArray();
        if (file.length > 0) {
            await gridfsBucket.delete(file[0]._id);
        }

        // Delete image document from MongoDB
        await Image.findByIdAndDelete(req.params.id);

        res.json({ success: "Image has been deleted" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

router.get('/tags', fetchuser, async (req, res) => {
  try {
    const tags = await Image.distinct('tag', { userId: req.user.user.id });
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).send('Server Error: ' + error.message);
  }
});

module.exports = router;