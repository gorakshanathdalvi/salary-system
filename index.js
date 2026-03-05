const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const adminRoutes = require('./routes/admin');
const loginRoutes = require('./routes/login');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
    createParentPath: true
}));
app.set('view engine', 'ejs');
app.use(session({
    secret: "your_secret_key_here",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static('public'));
app.use((req, res, next) => {
    res.locals.admin = req.session.admin || null;
    console.log("Current session admin:", res.locals.admin);
    next();
});

app.use('/', adminRoutes);
app.use('/login', loginRoutes);


const port = 1000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});