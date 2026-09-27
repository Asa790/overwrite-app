const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'photo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
        const mimeMatch = allowedTypes.test(file.mimetype);
        const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeMatch || extMatch) {
            cb(null, true);
        } else {
            cb(new Error('Please upload an image file (PNG, JPG, WEBP, GIF)'));
        }
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database('override.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS good_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bad_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS let_go_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    is_custom INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
    db.exec(`ALTER TABLE good_memories ADD COLUMN image_url TEXT`);
} catch (e) {
}

const count = db.prepare('SELECT COUNT(*) as count FROM let_go_messages').get().count;
if (count === 0) {
    const defaultMessages = [
        "You are not what happened to you; you are who you choose to become. Proud of you for letting this go.",
        "Every release makes room for something beautiful to take root. You've learned, grown, and now you're moving forward.",
        "Closing this chapter takes real courage. Honor the lesson, leave the weight behind, and step into the light.",
        "You survived it, you learned from it, and now you are officially free of it. Congratulations on letting go!",
        "Pain that is released transforms into wisdom. Celebrate this victory — you are choosing your peace.",
        "Letting go doesn't mean forgetting; it means acknowledging that you deserve better days ahead. You did it!",
        "Breathe deeply. The heavy storm has passed, and you came out stronger, wiser, and lighter.",
        "You just reclaimed your energy from the past. Keep walking forward with your head held high.",
        "The rearview mirror is small for a reason — your focus is on the open road ahead. Well done!",
        "A heavy rock just dropped from your backpack. Feel that lightness? That is your strength shining through."
    ];
    const insertStmt = db.prepare('INSERT INTO let_go_messages (content, is_custom) VALUES (?, 0)');
    for (const msg of defaultMessages) {
        insertStmt.run(msg);
    }
}

app.post('/api/good', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        const { content, imageUrl } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Caption or memory description cannot be empty' });
        }

        let finalImageUrl = null;
        if (req.file) {
            finalImageUrl = '/uploads/' + req.file.filename;
        } else if (imageUrl && imageUrl.trim()) {
            finalImageUrl = imageUrl.trim();
        }

        const stmt = db.prepare('INSERT INTO good_memories (content, image_url) VALUES (?, ?)');
        const info = stmt.run(content.trim(), finalImageUrl);
        res.json({ id: info.lastInsertRowid, content: content.trim(), image_url: finalImageUrl });
    });
});

app.post('/api/override', (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

    const badInfo = db.prepare('INSERT INTO bad_memories (content) VALUES (?)').run(content.trim());

    const override = db.prepare('SELECT * FROM good_memories ORDER BY RANDOM() LIMIT 1').get();
    res.json({ 
        bad_memory_id: badInfo.lastInsertRowid,
        override: override || null,
        message: override ? null : 'No good memories recorded yet. Seed some positive moments first!'
    });
});

app.post('/api/memories/bad/:id/let-go', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM bad_memories WHERE id = ?').run(id);

    let congrats = db.prepare('SELECT * FROM let_go_messages ORDER BY RANDOM() LIMIT 1').get();
    if (!congrats) {
        congrats = { content: "You let it go and chose your peace. Proud of your strength!" };
    }

    res.json({
        success: true,
        congrats: congrats.content
    });
});

app.get('/api/memories/:type', (req, res) => {
    const { type } = req.params;
    const table = type === 'good' ? 'good_memories' : 'bad_memories';
    
    const list = db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`).all();
    res.json(list);
});

app.put('/api/memories/:type/:id', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        const { type, id } = req.params;
        const { content, imageUrl, removeImage } = req.body;
        const table = type === 'good' ? 'good_memories' : 'bad_memories';

        if (!content || !content.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

        if (table === 'good_memories') {
            if (req.file) {
                const newImageUrl = '/uploads/' + req.file.filename;
                db.prepare(`UPDATE good_memories SET content = ?, image_url = ? WHERE id = ?`).run(content.trim(), newImageUrl, id);
            } else if (removeImage === 'true' || removeImage === true) {
                db.prepare(`UPDATE good_memories SET content = ?, image_url = NULL WHERE id = ?`).run(content.trim(), id);
            } else if (imageUrl !== undefined) {
                db.prepare(`UPDATE good_memories SET content = ?, image_url = ? WHERE id = ?`).run(content.trim(), imageUrl.trim() || null, id);
            } else {
                db.prepare(`UPDATE good_memories SET content = ? WHERE id = ?`).run(content.trim(), id);
            }
        } else {
            db.prepare(`UPDATE ${table} SET content = ? WHERE id = ?`).run(content.trim(), id);
        }
        res.json({ success: true });
    });
});

app.delete('/api/memories/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const table = type === 'good' ? 'good_memories' : 'bad_memories';

    if (table === 'good_memories') {
        const item = db.prepare('SELECT image_url FROM good_memories WHERE id = ?').get(id);
        if (item && item.image_url && item.image_url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, 'public', item.image_url);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) {}
            }
        }
    }

    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    res.json({ success: true });
});

app.get('/api/let-go/messages', (req, res) => {
    const list = db.prepare('SELECT * FROM let_go_messages ORDER BY is_custom ASC, id ASC').all();
    res.json(list);
});

app.post('/api/let-go/messages', (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content cannot be empty' });
    }
    const info = db.prepare('INSERT INTO let_go_messages (content, is_custom) VALUES (?, 1)').run(content.trim());
    res.json({
        id: info.lastInsertRowid,
        content: content.trim(),
        is_custom: 1
    });
});

app.delete('/api/let-go/messages/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM let_go_messages WHERE id = ?').run(id);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`✨ Override running at http://localhost:${PORT}`);
});