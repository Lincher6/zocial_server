const { db } = require('../utils/admin')

exports.getAllBites = async (req, res) => {
    try {
        const response = await db
            .collection('bites')
            .orderBy('createdAt', 'desc')
            .get()
        const bites = []
        response.docs.map((doc) => {
            bites.push({
                biteId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt,
                imageUrl: doc.data().imageUrl,
            })
        })

        return res.json(bites)
    } catch (e) {
        console.error(e)
    }
}

exports.getBite = async (req, res) => {
    try {
        let bite = {}
        const biteData = await db.doc(`/bites/${req.params.biteId}`).get()
        if (!biteData.exists) {
            return res.status(404).json({ error: 'Bite not found' })
        }
        bite = biteData.data()
        bite.biteId = biteData.id
        const commentsData = await db
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .where('biteId', '==', req.params.biteId)
            .get();

        bite.comments = []
        commentsData.forEach(doc => {
            bite.comments.push(doc.data())
        })

        return res.json(bite)
    } catch (e) {
        res.status(500).json({error: `something went wrong: ${e}`})
    }
}

exports.deleteBite = async (req, res) => {
    try {
        const biteData = await db.doc(`/bites/${req.params.biteId}`).get()
        if (!biteData.exists) {
            return res.status(404).json({ error: 'Bite not exist'})
        }

        if (biteData.data().userHandle !== req.user.handle) {
            return res.status(403).json({ error: 'Not authorized for this operation'})
        }

        await biteData.ref.delete()
        return res.status(200).json({ message: 'Bite was deleted successfully' })
    } catch (e) {
        res.status(500).json({error: `something went wrong: ${e}`})
    }

}

exports.addBite = async (req, res) => {
    try {
        const newBite = {
            body: req.body.body,
            userHandle: req.user.handle,
            createdAt: new Date().toISOString(),
            imageUrl: req.user.imageUrl,
            likesCount: 0,
            commentsCount: 0
        }
        const response = await db.collection('bites').add(newBite)
        newBite.biteId = response.id
        res.json(newBite)
    } catch (e) {
        res.status(500).json({error: `something went wrong: ${e}`})
    }
}

exports.commentBite = async (req, res) => {
    try {
        if (req.body.body.trim() === '') {
            return res.status(400).json({ error: 'Must not be empty' })
        }

        let comment = {
            body: req.body.body,
            userHandle: req.user.handle,
            biteId: req.params.biteId,
            createdAt: new Date().toISOString(),
            userImage: req.user.imageUrl
        }

        const biteData = await db.doc(`/bites/${req.params.biteId}`).get()
        if (!biteData.exists) {
            return res.status(404).json({ error: 'Bite does not exist anymore' })
        }
        await biteData.ref.update({ commentsCount: biteData.data().commentsCount + 1 })
        await db.collection('comments').add(comment)
        return res.json(comment)
    } catch (e) {
        res.status(500).json({error: `something went wrong: ${e.code}`})
    }
}

exports.likeBite = async (req, res) => {
    try {
        const {biteDocument, bite, likeData} = await likeFlow(req, res)

        if (!likeData.empty) {
            return res.status(400).json({ error: 'Already liked by you' })
        }

        bite.likesCount++

        const like = {
            biteId: req.params.biteId,
            userHandle: req.user.handle
        }
        await db.collection('likes').add(like)
        await biteDocument.update({ likesCount:  bite.likesCount})
        return res.status(201).json(bite)
    } catch (e) {
        return res.status(500).json({error: `something went wrong: ${e}`})
    }
}

exports.unLikeBite = async (req, res) => {
    try {
        const {biteDocument, bite, likeData} = await likeFlow(req, res)

        if (likeData.empty) {
            return res.status(400).json({ error: 'Not liked yet' })
        }

        bite.likesCount--

        await db.doc(`/likes/${likeData.docs[0].id}`).delete()
        await biteDocument.update({ likesCount:  bite.likesCount})
        return res.status(200).json(bite)
    } catch (e) {
        res.status(500).json({error: `something went wrong: ${e}`})
    }
}

const likeFlow = async (req, res) => {
    const biteDocument = db.doc(`/bites/${req.params.biteId}`)
    const biteData = await biteDocument.get()
    if (!biteData.exists) {
        return res.status(404).json({ error: 'Bite does nor exist anymore' })
    }
    const bite = biteData.data()
    bite.biteId = biteData.id

    const likeData = await db
        .collection('likes')
        .where('biteId', '==', req.params.biteId)
        .where('userHandle', '==', req.user.handle)
        .get()

    return {biteDocument, bite, likeData}
}