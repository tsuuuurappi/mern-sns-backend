const router = require('express').Router();
const User = require('../models/User');

// CRUD
// ユーザー情報の更新
// :id=mongoDBのランダムidを取得できる
router.put('/:id', async (req, res) => {
  // req.params=[*/user/ランダムid]のランダムid
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndUpdate(req.params.id, {
        // $set=すべてのパラメータ ※今回の場合、Userスキーマの全パラメータ
        // req.body=更新するパラメータの値
        $set: req.body,
      });
      res.status(200).json('ユーザー情報が更新されました');
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json('あなたは自分のアカウントの時だけ情報を更新できます');
  }
});

// ユーザー情報の削除
router.delete('/:id', async (req, res) => {
  // req.params=[*/user/ランダムid]のランダムid
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json('ユーザー情報が削除されました');
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json('あなたは自分のアカウントの時だけ情報を削除できます');
  }
});

// ユーザー情報の取得
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    // user._doc=ユーザーの全情報
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// ユーザーのフォロー
router.put('/:id/follow', async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      // 相手のユーザー
      const user = await User.findById(req.params.id);
      // 自分自身
      const currentUser = await User.findById(req.body.userId);
      // フォロワーに自分がいなかったらフォローできる ※相手のフォロワーに自分自身を追加
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({
          // 配列にpush
          $push: {
            followers: req.body.userId,
          },
        });
        // 自分自身のフォローに相手を追加
        await currentUser.updateOne({
          $push: {
            followings: req.params.id,
          },
        });
        return res.status(200).json('フォローに成功しました！');
      } else {
        return res.status(403).json('あなたはすでにこのユーザーをフォローしています。');
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(500).json('自分自身をフォローできません');
  }
});

// ユーザーのフォロー解除
router.put('/:id/unfollow', async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      // 相手のユーザー
      const user = await User.findById(req.params.id);
      // 自分自身
      const currentUser = await User.findById(req.body.userId);
      // フォロワーに自分がいたらフォロー解除できる ※相手のフォロワーから自分自身を削除
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({
          // 配列からpull(削除)
          $pull: {
            followers: req.body.userId,
          },
        });
        // 自分自身のフォローから相手を削除
        await currentUser.updateOne({
          $pull: {
            followings: req.params.id,
          },
        });
        return res.status(200).json('フォロー解除に成功しました！');
      } else {
        return res.status(403).json('このユーザーはフォロー解除できません。');
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(500).json('自分自身をフォロー解除できません');
  }
});

module.exports = router;
