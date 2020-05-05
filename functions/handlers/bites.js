const {db} = require('../utils/admin')

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
            })
        })

        return res.json(bites)
    } catch (e) {
        console.error(e)
    }
}

exports.addBite = async (req, res) => {
    try {
        const newBite = {
            body: req.body.body,
            userHandle: req.user.handle,
            createdAt: new Date().toISOString()
        }
        const response = await db.collection('bites').add(newBite)
        res.json({message: `created ${response.id}`})
    } catch (e) {
        res.status(500).json({error: `something went wrong: ${e}`})
    }
}