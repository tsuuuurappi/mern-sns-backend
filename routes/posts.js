const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');

// 投稿を作成する
router.post('/', async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    return res.status(200).json(savedPost);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 投稿を更新する
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({
        $set: req.body,
      });
      return res.status(200).json('投稿編集に成功しました！');
    } else {
      return res.status(403).json('あなたはほかの人の投稿を編集できません');
    }
  } catch (err) {
    return res.status(403).json(err);
  }
});

// 投稿を削除する
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      return res.status(200).json('投稿削除に成功しました！');
    } else {
      return res.status(403).json('あなたはほかの人の投稿を削除できません');
    }
  } catch (err) {
    return res.status(403).json(err);
  }
});

// 特定の投稿を取得する
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// 特定の投稿にいいねを押す
router.put('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // いいねが押されていない場合、いいねが押せる
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({
        // 配列にpush
        $push: {
          likes: req.body.userId,
        },
      });
      return res.status(200).json('投稿にいいねを押しました！');
    } else {
      // いいねしているユーザーIDを取り除く
      await post.updateOne({
        $pull: {
          likes: req.body.userId,
        },
      });
      return res.status(403).json('投稿にいいねを外しました。');
    }
  } catch (err) {
    return res.status(500).json(err);
  }
});

// プロフィール専用のタイムラインの取得
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await Post.find({ userId: user._id });
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json(err);
  }
});

// タイムラインの投稿を取得
// このルーティングの上に「:id」任意の文字列で受け取るルーティングが存在するため
// 下記のように、/allを末尾指定してあげる必要がある ※コードの記載順がもろに影響する
router.get('/timeline/:userId', async (req, res) => {
  try {
    // 自分自身の投稿
    const currentUser = await User.findById(req.params.userId);
    // PostスキーマのuserIdを取得するために[currentUser._id=currentUserのid]をfind引数にしている
    const userPosts = await Post.find({ userId: currentUser._id });

    // フォロワーの投稿
    // Promise.allは、await処理のcurrentUserが完了するまで待つため指定する必要がある
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    // userPostsとfriendPostsを連結して返す
    // ...friendPostsで配列を展開する形で返す
    return res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
