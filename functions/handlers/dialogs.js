const { db, firebase } = require('../utils/admin')

exports.startDialog = async (req, res) => {
    try {
        const id = req.params.dialogId
        const dialogDoc = db.doc(`/dialogs/${id}`)
        const dialogData = await dialogDoc.get()

        if (dialogData.exists) {
            await dialogDoc.update({ activeAt: new Date() })
        } else {
            const imageTwo = (await db.doc(`/users/${req.body.userTwo}`).get()).data().imageUrl
            const newDialog = {
                userOneNewMessages: 0,
                userTwoNewMessages: 1,
                users: [req.user.handle, req.body.userTwo],
                userOne: req.user.handle,
                userTwo: req.body.userTwo,
                imageOne: req.user.imageUrl,
                imageTwo,
                activeAt: new Date()
            }
            const firstMessage = {
                dialogId: id,
                sender: req.user.handle,
                recipient: req.body.userTwo,
                createdAt: new Date(),
                read: false,
                body: `${req.user.handle} начал диалог.`
            }
            await db.collection('dialogs').doc(id).set(newDialog)
            await db.collection('messages').add(firstMessage)
        }
        return res.status(201).json({ message: `dialog created/updated successfully` })

    } catch (e) {
        res.status(500).json({ error: `something went wrong: ${e}` })
    }
}

exports.getDialogs = async (req, res) => {
    try {
        const dialogs = []

        const searchBatchOne = await db.collection('dialogs').where('userOne', '==', req.user.handle).get()
        searchBatchOne.forEach(doc => {
            const dialog = {
                dialogId: doc.id,
                recipient: doc.data().userTwo,
                recipientImageUrl: doc.data().imageTwo,
                activeAt: doc.data().activeAt,
                newMessages: doc.data().userOneNewMessages,

            }
            dialogs.push(dialog)
        })

        const searchBatchTwo = await db.collection('dialogs').where('userTwo', '==', req.user.handle).get()
        searchBatchTwo.forEach(doc => {
            const dialog = {
                dialogId: doc.id,
                recipient: doc.data().userOne,
                recipientImageUrl: doc.data().imageOne,
                activeAt: doc.data().activeAt,
                newMessages: doc.data().userTwoNewMessages,

            }
            dialogs.push(dialog)
        })

        return res.status(200).json({ dialogs })

    } catch (e) {
        res.status(500).json({ error: `something went wrong: ${e}` })
    }
}