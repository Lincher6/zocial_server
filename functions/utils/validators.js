const isEmpty = (string) => {
    if (string.trim() === '') return true
    else return false
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true
    else return false
}

const validateSighUp = (data) => {
    if (isEmpty(data.email)) return 'Email не должен быть пустым'
    else if (!isEmail(data.email)) return 'Некорректный Email'
    else if (isEmpty(data.password)) return 'Пароль не должен быть пустым'
    else if (data.password !== data.confirmPassword) return 'Пароли не совпадают'
    else if (isEmpty(data.handle)) return 'Имя пользователя не должно быть пустым'
    else if (data.handle.length > 20) return 'Имя пользователя слишком длинное'
}

const validateLogin = (data) => {
    if (isEmpty(data.email)) return 'Email не должен быть пустым'
    else if (isEmpty(data.password)) return 'Пароль не должен быть пустым'
    return null
}

const reduceUserDetails = (data) => {
    const userDetails = {}

    if (isEmpty(data.bio)) userDetails.bio = ''
    else userDetails.bio = data.bio

    if (isEmpty(data.location)) userDetails.location = ''
    else userDetails.location = data.location

    if (!isEmpty(data.website)) {
        if (data.website.startsWith('http')) {
            userDetails.website = data.website
        } else {
            userDetails.website = `http://${data.website}`
        }
        return userDetails
    } else {
        userDetails.website = ''
    }

    return userDetails
}

module.exports = {validateSighUp, validateLogin, reduceUserDetails}

