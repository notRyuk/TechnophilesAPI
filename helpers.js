import { user } from "./mongoose.js"


const lowerCase = (() => {
    var i = 97
    var letters = ""
    for(var k=0; k<26; k++) {
        letters += String.fromCharCode(i+k)
    }
    return letters
})()

const createLowerCaseObject = () => {
    var obj = {}
    for(var a of lowerCase) {
        obj[a] = []
    }
    return obj
}

class Globals {
    constructor() {
        this.users = this.updateUsers()
    }

    updateUsers = () => {
        var userObject = createLowerCaseObject()
        user.find({}, (err, __users) => {
            if(err) return err
            if(__users) {
                __users = __users.map(__user => __user._id)
                for(var __user of __users) {
                    userObject[__user[0]].push(__user)
                }
            }
        })
        return userObject
    }

    addNewUser(username) {
        this.users[username[0]].push(username)
    }

    updateOldUsername(oldUsername, newUsername) {
        this.users[oldUsername[0]].splice(this.users[oldUsername[0]].indexOf(oldUsername), 1)
        this.users[newUsername[0]].push(newUsername)
    }
}

const __globals = new Globals()

export {
    lowerCase,
    createLowerCaseObject,
    __globals
}