const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

// إنشاء تطبيق Express
const app = express();

// إعدادات Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // استضافة الملفات الثابتة من مجلد "public"

// إعداد اتصال MySQL
const db = mysql.createConnection({
    host: 'localhost',       // عنوان الخادم
    user: 'root',            // اسم المستخدم لقاعدة البيانات
    password: '12345678', // كلمة المرور الخاصة بك
    database: 'user_management' // اسم قاعدة البيانات
});

// التحقق من الاتصال بقاعدة البيانات
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// تسجيل مستخدم جديد
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // تشفير كلمة المرور
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    res.status(400).send('Email already exists.');
                } else {
                    res.status(500).send('Error saving user.');
                }
            } else {
                res.status(201).send('User registered successfully.');
            }
        });
    } catch (error) {
        res.status(500).send('Error encrypting password.');
    }
});

// تسجيل الدخول
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            res.status(500).send('Database error.');
        } else if (results.length === 0) {
            res.status(400).send('User not found.');
        } else {
            const user = results[0];
            const isPasswordValid = await bcrypt.compare(password, user.password); // التحقق من كلمة المرور
            if (isPasswordValid) {
                res.status(200).send('Login successful.');
            } else {
                res.status(400).send('Incorrect password.');
            }
        }
    });
});

// إعداد المنفذ
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
