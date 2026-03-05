const router = require('express').Router();
const exe = require('../config/conn');

router.get('/', (req, res) => {
   res.render("login");
});
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("Login attempt:", username);
    console.log("Password:", password);
    if (!username || !password) {
        return res.render("login", { error: "Please enter both username and password." });
    }
    try {
        const result = await exe('SELECT * FROM admins WHERE admin_username = ? AND admin_password = ?', [username, password]);
        if (result.length > 0) {
            req.session.admin = result[0];
            res.redirect('/');
        } else {
            res.render("login", { error: "Invalid credentials" });
        }
    } catch (err) {
        console.error(err);
        res.render("login", { error: "An error occurred during login." });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
        }
        res.redirect('/login');
    });
});


module.exports = router;