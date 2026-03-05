
const auth = (req, res, next) => {
    if (req.session.admin) {
        console.log("Authenticated admin:", req.session.admin);
        console.log("login success");
        next();
    } else {
        res.redirect('/login');
    }
};

module.exports = auth;