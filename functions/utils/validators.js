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
    const errors = {}

    if (isEmpty(data.email)) errors.email = 'Must not be empty'
    else if (!isEmail(data.email)) errors.email = 'Email is not valid'

    if (isEmpty(data.password)) errors.password = 'Must not be empty'
    if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match'

    if (isEmpty(data.handle)) errors.handle = 'Must not be empty'

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    }
}

const validateLogin = (data) => {
    const errors = {}

    if (isEmpty(data.email)) errors.email = 'Must not be empty'
    if (isEmpty(data.password)) errors.password = 'Must not be empty'

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    }
}

module.exports = {validateSighUp, validateLogin}

