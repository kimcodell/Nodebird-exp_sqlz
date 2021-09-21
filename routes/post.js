const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middleware');

const router = express.Router();

try {
    fs.readdirSync('uploads');
} catch (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({     //multer 자체는 미들웨어 아님
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {   //multer 함수로 생성한 객체에 single, array, field, none 등 미들웨어가 있음.
    console.log(req.file);
    res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
    try {
        console.log('post', req.user);
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            UserId: req.user.id,
        });
        const hashtags = new Set(req.body.content.match(/#[^\s#]*/g));
        if (hashtags) {
            const result = await Promise.all(   //findOrCreate 같은 함수는 Promise이므로 해당 객체에 모두 await을 적용하기 위해 Promise.all()
                Array.from(hashtags, tag => {
                    return Hashtag.findOrCreate({   //findOrCreate는 이차원배열로 결과 나옴. [[data, true],[data, true],[data, false]] false면 이미 있어서 디비에서 찾은 것.
                        where: { title: tag.slice(1).toLowerCase() },
                    })
                })
            );
            await post.addHashtags(result.map(r => r[0]));  //add~~ 함수에는 id 또는 그 모델의 객체를 넣을 수 있음. 그러면 시퀄라이즈가 알아서 디비에 넣음.
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;