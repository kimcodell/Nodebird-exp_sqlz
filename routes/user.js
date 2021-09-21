const express = require('express');

const { isLoggedIn } = require('./middleware');
const User = require('../models/user');

const router = express.Router();

//id는 사용자가 팔로우할 사람id
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
	try {
		const user = await User.findOne({ where: { id: req.user.id } });	//현재 로그인한 사용자
		if (user) {
			await user.addFollowings([parseInt(req.params.id, 10)]);
			res.send('success');
		} else {
			res.status(404).send('no user');
		}
	} catch (error) {
		console.error(error);
		next(error);
	}
});

module.exports = router;