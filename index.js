// api/index.js
const connectToDatabase = require('../db');
const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true });

const Record = mongoose.models.Record || mongoose.model('Record', RecordSchema);

module.exports = async (req, res) => {
  // CORS so GitHub Pages can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    // READ: GET /api
    if (req.method === 'GET') {
      const records = await Record.find({}).sort({ createdAt: -1 });
      return res.status(200).json(records);
    }

    // CREATE: POST /api
    if (req.method === 'POST') {
      const { title, content } = req.body || {};
      const newRecord = await Record.create({ title, content });
      return res.status(201).json(newRecord);
    }

    // UPDATE and DELETE need an id: /api?id=RECORD_ID
    const { id } = req.query;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'A valid record id is required' });
    }

    // UPDATE: PUT /api?id=...
    if (req.method === 'PUT') {
      const { title, content } = req.body || {};
      const updated = await Record.findByIdAndUpdate(
        id,
        { title, content },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ error: 'Record not found' });
      return res.status(200).json(updated);
    }

    // DELETE: DELETE /api?id=...
    if (req.method === 'DELETE') {
      const deleted = await Record.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Record not found' });
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    return res.status(500).json({ error: 'Database connection failed' });
  }
};