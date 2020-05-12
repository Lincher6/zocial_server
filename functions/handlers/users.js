const {db, admin} = require('../utils/admin')
const {config} = require('../utils/config')
const {reduceUserDetails} = require('../utils/validators')

exports.addUserDetails = async (req, res) => {
    try {
        const userDetails = reduceUserDetails(req.body)
        await db.doc(`/users/${req.user.handle}`).update(userDetails)
        return res.json({message: 'Details were updated'})
    } catch (e) {
        return res.status(500).json({error: e})
    }
}

exports.getAuthUserDetails = async (req, res) => {
    try {
        const userDetails = {}

        const userData = await db.doc(`/users/${req.user.handle}`).get()
        if (userData.exists) {
            userDetails.credentials = userData.data()
        }

        userDetails.likes = []
        const likesData = await db.collection('likes').where('userHandle', '==', req.user.handle).get()
        likesData.forEach(doc => {
            userDetails.likes.push(doc.data())
        })

        userDetails.notifications = []
        const notifications = await db
            .collection('notifications')
            .where('recipient', '==', req.user.handle)
            .orderBy('createdAt', 'desc')
            .get()
        notifications.forEach(notification => {
            userDetails.notifications.push({
                sender: notification.data().sender,
                recipient: notification.data().recipient,
                createdAt: notification.data().createdAt,
                read: notification.data().read,
                biteId: notification.data().biteId,
                type: notification.data().type
            })
        })

        return res.json(userDetails)
    } catch (e) {
        return res.status(500).json({error: e})
    }
}

exports.getUserDetails = async (req, res) => {
    try {
        const userDetails = {}
        const userData = await db.doc(`/users/${req.params.handle}`).get()
        if (!userData.exists) {
            return res.status(404).json({error: 'User not found'})
        }

        userDetails.user = userData.data()
        userDetails.bites = []

        const bites = await db
            .collection('bites')
            .where('userHandle', '==', req.params.handle)
            .orderBy('createdAt', 'desc')
            .get()
        bites.forEach(bite => {
            userDetails.bites.push({
                body: bite.data().body,
                userHandle: bite.data().handle,
                createdAt: bite.data().createdAt,
                userImage: bite.data().imageUrl,
                likesCount: bite.data().likesCount,
                commentsCount: bite.data().commentsCount,
                biteId: bite.id
            })
        })

        return res.status(200).json(userDetails)

    } catch (e) {
        return res.status(500).json({error: e})
    }
}

exports.uploadImage = async (req, res) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busBoy = new BusBoy({headers: req.headers})
    let imageFileName
    let imageToBeUploaded = {}

    busBoy.on('file', (filedName, file, fileName, encoding, mimeType) => {
        if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
            res.status(400).json({error: 'Not an image'})
        }

        const imageExtension = fileName.split('.')[fileName.split('.').length - 1]
        imageFileName = `${Math.round(Math.random() * 100000000)}.${imageExtension}`
        const imagePath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = {imagePath, mimeType}
        file.pipe(fs.createWriteStream(imagePath))

    })

    busBoy.on('finish', async () => {
        try {
            await admin.storage().bucket().upload(imageToBeUploaded.imagePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimeType
                    }
                }
            })

            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            await db.doc(`/users/${req.user.handle}`).update({imageUrl})
            return res.json({message: 'image uploaded successfully'})

        } catch (e) {
            return res.status(500).json({error: e})
        }

    })

    busBoy.end(req.rawBody)
}

exports.markReadNotifications = async (req, res) => {
    try {
        const batch = db.batch()
        req.body.forEach( notificationId => {
            const notification = db.doc(`/notifications/${notificationId}`)
            batch.update(notification, { read: true })
        })
        await batch.commit()
        return res.status(200).json({ message: 'Notifications marked' })
    } catch (e) {
        return res.status(500).json({error: e})
    }
}