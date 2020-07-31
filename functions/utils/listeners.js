const functions = require('firebase-functions');
const { db } = require('./admin')

exports.generateNotification = (type) => {
    return functions
        .region('europe-west2')
        .firestore
        .document(`/${type}s/{id}`)
        .onCreate(async (snapshot) => {
            try {
                const biteData = await db.doc(`/bites/${snapshot.data().biteId}`).get()
                if (biteData.exists && biteData.data().userHandle !== snapshot.data().userHandle) {
                    const notification = {
                        sender: snapshot.data().userHandle,
                        recipient: biteData.data().userHandle,
                        createdAt: new Date().toISOString(),
                        read: false,
                        biteId: biteData.id,
                        type
                    }
                    return await db.doc(`/notifications/${snapshot.id}`).set(notification)
                }
            } catch (e) {
                console.log(e)
            }
        })
}

exports.deleteNotification = (type) => {
    return functions
        .region('europe-west2')
        .firestore
        .document(`/${type}s/{id}`)
        .onDelete(async (snapshot) => {
            try {
                return await db.doc(`/notifications/${snapshot.id}`).delete()
            } catch (e) {
                console.log(e)
            }
        })
}

exports.onUserImageChange = functions
    .region('europe-west2')
    .firestore
    .document(`/users/{userId}`)
    .onUpdate(async change => {
        try {
            if (change.before.data().imageUrl !== change.after.data().imageUrl) {
                const batch = db.batch()

                const bitesData = await db
                    .collection('bites')
                    .where('userHandle', '==', change.after.data().handle)
                    .get()
                bitesData.forEach(doc => {
                    const biteData = db.doc(`/bites/${doc.id}`)
                    batch.update(biteData, { imageUrl: change.after.data().imageUrl })
                })

                const commentsData = await db
                    .collection('comments')
                    .where('userHandle', '==', change.after.data().handle)
                    .get()
                commentsData.forEach(doc => {
                    const commentData = db.doc(`/comments/${doc.id}`)
                    batch.update(commentData, { userImage: change.after.data().imageUrl })
                })

                return await batch.commit()
            }
        } catch (e) {
            console.log(e)
        }
    })

exports.onBiteDelete = functions
    .region('europe-west2')
    .firestore
    .document(`/bites/{biteId}`)
    .onDelete(async (snapshot, context) => {
        try {
            const batch = db.batch()
            const biteId = context.params.biteId
            const commentsData = await db.collection('comments').where('biteId', '==', biteId).get()
            commentsData.forEach(doc => {
                batch.delete(db.doc(`/comments/${doc.id}`))
            })
            const likesData = await db.collection('likes').where('biteId', '==', biteId).get()
            likesData.forEach(doc => {
                batch.delete(db.doc(`/likes/${doc.id}`))
            })
            const notificationsData = await db.collection('notifications').where('biteId', '==', biteId).get()
            notificationsData.forEach(doc => {
                batch.delete(db.doc(`/notifications/${doc.id}`))
            })

            return await batch.commit()
        } catch (e) {
            console.log(e)
        }
    })

exports.onUserOffline = functions.database.ref('/users/{uid}').onUpdate(
    async (change, context) => {
        const eventStatus = change.after.val();

        // Then use other event data to create a reference to the
        // corresponding Firestore document.
        const userStatusFirestoreRef = db.doc(`onlineUsers/${context.params.uid}`);
        return userStatusFirestoreRef.set(eventStatus);
    });