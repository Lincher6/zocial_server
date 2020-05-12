const { db, firebase } = require('../utils/admin')
const { config } = require('../utils/config')
const {validateSighUp, validateLogin} = require('../utils/validators')

exports.signUp = async (req, res) => {
    try {
        const newUser = {
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
            handle: req.body.handle,
        }

        const  { errors, isValid} = validateSighUp(newUser)

        if (!isValid) {
            return res.status(400).json({errors})
        }

        const noImg = 'empty-avatar.png'

        const doc = await db.doc(`/users/${newUser.handle}`).get()
        if (doc.exists) {
            return res.status(400).json({message: `userName already exists`})
        }

        const data = await firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            createdAt: new Date().toISOString(),
            userId: data.user.uid
        }
        await db.doc(`/users/${newUser.handle}`).set(userCredentials)

        const token = await data.user.getIdToken()
        return res.status(201).json({token})

    } catch (e) {

        if (e.code === 'auth/email-already-in-use') {
            return res.status(400).json({error: `email already in use`})
        }
        return res.status(500).json({error: `something went wrong: ${e}`})
    }
}

exports.login = async (req, res) => {
    try {
        const userInput = {
            email: req.body.email,
            password: req.body.password
        }

        const  { errors, isValid} = validateLogin(userInput)

        if (!isValid) {
            return res.status(400).json({errors})
        }

        const data = await firebase.auth().signInWithEmailAndPassword(userInput.email, userInput.password)
        const token = await data.user.getIdToken()
        return res.json({token})
    } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
            return res.status(403).json({error: e.message})
        }
        return res.status(500).json({error: `something went wrong: ${e}`})
    }
}