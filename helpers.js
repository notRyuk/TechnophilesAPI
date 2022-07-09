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
        setImmediate(() => this.updateUsers(), 0)
        // this.users = __updates[0]
        // this.user_col = __updates[1]
    }

    updateUsers = () => {
        var userObject = createLowerCaseObject()
        var users = []
        user.find({}, (err, __users) => {
            if(err) return err
            if(__users) {
                this.user_col = __users
                __users = __users.map(__user => __user._id)
                for(var __user of __users) {
                    delete __user.__v
                    users.push(__user)
                    userObject[__user[0]].push(__user)
                }
                this.users = userObject
                this.user_col = users
                console.log(this.users)
            }
        })
        return [userObject, users]
    }

    addNewUser(username) {
        this.users[username[0]].push(username)
    }

    updateOldUsername(oldUsername, newUsername) {
        this.users[oldUsername[0]].splice(this.users[oldUsername[0]].indexOf(oldUsername), 1)
        this.users[newUsername[0]].push(newUsername)
    }

    deleteUsername(username) {
        this.users[username[0]].splice(this.users[username[0]].indexOf(username),1)
    }

    addNewUserToCol(userObject) {
        this.user_col.push(userObject)
    }

    updateUserInCol(id, userObject) {
        this.deleteUserFromCol(id)
        this.user_col.push(userObject)
    }

    deleteUserFromCol(id) {
        var __id  = this.users[id[0]]
        if(!__id.includes(id)) {
            return {
                status: 404,
                comment: "BadRequest! No such user in database!"
            }
        }
        this.user_col.splice(this.user_col.map(e => e._id).indexOf(id), 1)
    }
}

const __globals = new Globals()

export {
    lowerCase,
    createLowerCaseObject,
    __globals
}