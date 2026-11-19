const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database(path.join(__dirname, 'periodic.db'), { readonly: true });

app.use(cors());
app.use(express.json());

function formatElement(row) {
    if (!row) return null;
    return {
        ...row,
        shells: row.shells_json ? JSON.parse(row.shells_json) : [],
        atomic_radii: row.atomic_radii_json ? JSON.parse(row.atomic_radii_json) : []
    };
}


app.get('/', (req, res) => {
  res.json({ message: 'Periodic Table API functional' });
});


app.get('/api/elements', (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM elements WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search) {
      query += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(symbol) LIKE LOWER(?) OR CAST(atomic_number AS TEXT) = ?)';
      const likeTerm = `%${search}%`;
      params.push(likeTerm, likeTerm, search.trim());
    }

    query += ' ORDER BY atomic_number ASC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(formatElement));
  } catch (err) {
    res.status(500).json({ error: 'Error to fetch elements', details: err.message });
  }
});


app.get('/api/elements/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumber = /^\d+$/.test(identifier);

    const row = isNumber
      ? db.prepare('SELECT * FROM elements WHERE atomic_number = ?').get(Number(identifier))
      : db.prepare('SELECT * FROM elements WHERE LOWER(symbol) = LOWER(?)').get(identifier);

    if (!row) {
      return res.status(404).json({ error: 'Element not found' });
    }

    res.json(formatElement(row));
  } catch (err) {
    res.status(500).json({ error: 'Error to fetch element', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});

