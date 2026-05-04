require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'posts.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@syndiki.online';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Tyughj098@@', 10);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use(session({
    secret: 'syndiki-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- AUTH ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        req.session.isLoggedIn = true;
        res.json({ success: true });
    } else { res.status(401).json({ error: 'Invalid credentials' }); }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.status(401).json({ error: 'Unauthorized' });
};

app.get('/api/check-auth', (req, res) => {
    res.json({ isLoggedIn: !!req.session.isLoggedIn });
});

// --- POSTS ---
app.get('/api/posts', (req, res) => {
    try {
        let posts = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        // If not logged in, only show published posts
        if (!req.session.isLoggedIn) {
            posts = posts.filter(p => p.status === 'published');
        }
        res.json(posts);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/posts', checkAuth, upload.single('image'), (req, res) => {
    try {
        const { title, category, content, metaTitle, metaDesc, status } = req.body;
        const posts = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        
        const newPost = {
            id: Date.now().toString(),
            title, slug, category, content,
            metaTitle: metaTitle || title,
            metaDesc: metaDesc || content.substring(0, 160).replace(/<[^>]*>/g, ''),
            image: req.file ? `/uploads/${req.file.filename}` : null,
            status: status || 'published',
            date: new Date().toISOString()
        };
        posts.unshift(newPost);
        fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2));
        res.status(201).json(newPost);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/posts/:id', checkAuth, upload.single('image'), (req, res) => {
    try {
        const { title, category, content, metaTitle, metaDesc, status } = req.body;
        let posts = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        const index = posts.findIndex(p => p.id === req.params.id);
        
        if (index === -1) return res.status(404).send('Not found');

        posts[index] = {
            ...posts[index],
            title: title || posts[index].title,
            category: category || posts[index].category,
            content: content || posts[index].content,
            metaTitle: metaTitle || posts[index].metaTitle,
            metaDesc: metaDesc || posts[index].metaDesc,
            status: status || posts[index].status,
            image: req.file ? `/uploads/${req.file.filename}` : posts[index].image
        };

        fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2));
        res.json(posts[index]);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/posts/:id', checkAuth, (req, res) => {
    try {
        let posts = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        posts = posts.filter(p => p.id !== req.params.id);
        fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2));
        res.json({ success: true });
    } catch (e) { res.status(500).send('Error'); }
});

// --- AI ---
app.post('/api/ai/generate', checkAuth, async (req, res) => {
    const { topic } = req.body;
    const KEY = process.env.OPENROUTER_API_KEY;
    if (!KEY || KEY === 'YOUR_OPENROUTER_KEY_HERE') return res.status(400).json({ error: 'API Key missing' });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": [
                    { "role": "system", "content": "Expert SEO Syndic. Retourne JSON: {title, content, metaTitle, metaDescription}" },
                    { "role": "user", "content": `Sujet: ${topic}` }
                ],
                "response_format": { "type": "json_object" }
            })
        });
        const data = await response.json();
        res.json(JSON.parse(data.choices[0].message.content));
    } catch (e) { res.status(500).json({ error: 'AI Error' }); }
});

// --- SEO ---
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /\nSitemap: https://syndiki.online/sitemap.xml");
});

app.get('/sitemap.xml', (req, res) => {
    const posts = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')).filter(p => p.status === 'published');
    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    xml += `<url><loc>https://syndiki.online/</loc><priority>1.0</priority></url>`;
    posts.forEach(p => { xml += `<url><loc>https://syndiki.online/article.html?slug=${p.slug}</loc><lastmod>${p.date.split('T')[0]}</lastmod></url>`; });
    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml').send(xml);
});

app.listen(PORT, () => console.log(`Dashboard on port ${PORT}`));
