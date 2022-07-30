import { user } from "./mongoose.js";


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
        setImmediate(() => {
            var userObject = createLowerCaseObject()
            var users = []
            user.find({}, (err, __users) => {
                if(err) return err
                if(__users) {
                    users = __users
                    __users = __users.map(__user => __user._id)
                    for(var __user of __users) {
                        delete __user.__v
                        userObject[__user[0]].push(__user)
                    }
                }
            })
            this.users = userObject
            this.user_col = users
        })
    }

    // updateUsers = () => {
    //     var userObject = createLowerCaseObject()
    //     var users = []
    //     user.find({}, (err, __users) => {
    //         if(err) return err
    //         if(__users) {
    //             console.log("__users", __users)
    //             users.push(__users)
    //             __users = __users.map(__user => __user._id)
    //             // console.log(__users)
    //             for(var __user of __users) {
    //                 delete __user.__v
    //                 userObject[__user[0]].push(__user)
    //             }
    //             // this.users = userObject
    //             // this.user_col = users
    //             // console.log(this.users)
    //             cache.set("users", userObject)
    //             cache.set("user_col", users)
    //             console.log("users", userObject)
    //             console.log("user_col", users)
    //             return new Globals(userObject, users)
    //         }
    //     })
    // }

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

const stateList = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttarakhand",
    "Uttar Pradesh",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli",
    "Daman and Diu",
    "Delhi",
    "Lakshadweep",
    "Puducherry"
]

const __globals = new Globals()

export {
    lowerCase,
    createLowerCaseObject,
    __globals,
    stateList
}