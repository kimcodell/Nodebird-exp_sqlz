const passport = require('passport');

const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models');

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id);    //세션에 user의 id만 저장하는 로직
    });

    passport.deserializeUser((id, done) => {
        User.findOne({ 
            where: { id },
            attributes: ['id', 'nick'],
            include: [{
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followers',
            }, {
                model: User,
                attributes: ['id', 'nick'],
                as: 'Followings',
            }],
        })
        .then(user => done(null, user))
        .catch(err => done(err));
    });

    local();
    kakao();
};