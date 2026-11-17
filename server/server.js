require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());          // allows Live Server (127.0.0.1:5500) to call this API
app.use(express.json());

const Note = mongoose.model('Note', new mongoose.Schema({
  clientId: { type: String, required: true, unique: true }, // the id made by makeId()
  title: String,
  note: String,
  label: String,
  createdAt: Date,
  updatedAt: Date
}));

// Save a note (upsert, so sending the same note twice never creates duplicates)
app.post('/api/notes', async (req, res) => {
  try {
    const { id, title, note, label, createdAt, updatedAt } = req.body;
    if (!id || (!title && !note)) {
      return res.status(400).json({ error: 'id and a title or note are required' });
    }
    const saved = await Note.findOneAndUpdate(
      { clientId: id },
      { clientId: id, title, note, label, createdAt, updatedAt },
      { upsert: true, new: true }
    );
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    res.json(await Note.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(process.env.PORT || 3000, () =>
      console.log('Server running on http://localhost:' + (process.env.PORT || 3000)));
  })
  .catch(err => console.error('MongoDB connection error:', err.message));