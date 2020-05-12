const {admin, db} = require('../utils/admin')

exports.authMiddleware = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            const idToken = req.headers.authorization.split(' ')[1]
            req.user = await admin.auth().verifyIdToken(idToken)
            const data = await db.collection('users').where('userId', '==', req.user.uid).limit(1).get()
            req.user.handle = data.docs[0].data().handle
            req.user.imageUrl = data.docs[0].data().imageUrl
            return next()
        } else {
            return res.status(403).json({error: `No authorized`})
        }
    } catch (e) {
        if (e.code === 'auth/argument-error') {
            return res.status(403).json({error: `Auth problem: ${e.message}`})
        }
        return res.status(500).json({error: e.message})
    }
}