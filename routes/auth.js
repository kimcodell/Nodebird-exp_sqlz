const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

const { isLoggedIn, isNotLoggedIn } = require('./middleware');
const User = require('../models/user');

const router = express.Router();

router.post('/join', isNotLoggedIn, async (req, res, next) => {
    const { email, nick, password } = req.body;
    try {
        const exUser = await User.findOne({ where: { email } });
        if (exUser) {
            return res.redirect('/join?error=exist');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {   //POST auth/login 요청이 들어오면 passport.authenticate('local' 이 실행되며 localStrategy가 실행
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            return res.redirect(`/?loginError=${info.message}`);
        }
        return req.login(user, (loginError) => {    //req.login 하면 passport index로 가서 serializeUser 실행
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            //여기서 세션 쿠키를 브라우저로 보내줌
            return res.redirect('/');
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙임
});

router.get('/logout', isLoggedIn, (req, res) => {
    //로그인 한 후에는 req.user에 유저 정보가 있음. 로그인 전에는 없음. 
    req.logout();     //req.logout 하면 서버에서 세션 쿠키가 사라짐
    req.session.destroy();
    res.redirect('/');
});

router.get('/kakao', isNotLoggedIn, passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;