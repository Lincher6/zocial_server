const { db, firebase } = require('../utils/admin')
const { config } = require('../utils/config')
const { validateSighUp, validateLogin } = require('../utils/validators')

exports.signUp = async (req, res) => {
    try {
        const newUser = {
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
            handle: req.body.handle,
        }

        const error = validateSighUp(newUser)

        if (error) {
            return res.status(400).json({ error })
        }

        const doc = await db.doc(`/users/${newUser.handle}`).get()
        if (doc.exists) {
            return res.status(400).json({ error: `Имя пользователя уже существует` })
        }

        const data = await firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/no-avatar.png?alt=media`,
            createdAt: new Date().toISOString(),
            userId: data.user.uid,
            friends: [],
            images: [],
            bio: '',
            location: '',
            website: '',
        }
        await db.doc(`/users/${newUser.handle}`).set(userCredentials)

        const token = await data.user.getIdToken()
        return res.status(201).json({ token })

    } catch (e) {

        if (e.code === 'auth/email-already-in-use') {
            return res.status(400).json({ error: `Email уже используется другим пользоваетелем` })
        }
        return res.status(500).json({ error: `Что-то пошло не так: ${e}` })
    }
}

exports.login = async (req, res) => {
    try {
        const userInput = {
            email: req.body.email,
            password: req.body.password
        }

        const error = validateLogin(userInput)

        if (error) {
            return res.status(400).json({ error })
        }

        const data = await firebase.auth().signInWithEmailAndPassword(userInput.email, userInput.password)
        const token = await data.user.getIdToken()
        return res.json({ token })
    } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
            return res.status(403).json({ error: 'Неверный логин или пароль' })
        }
        return res.status(500).json({ error: `Что-то пошло не так: ${e}` })
    }
}