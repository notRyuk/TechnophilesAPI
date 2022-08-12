import { user } from "./mongoose.js";
import { promisify } from 'util';
import { exec as exec1} from 'child_process';
const exec = promisify(exec1)


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

/**
 * Returns the queries with their start and end index if found in the text
 * @param {String} query A string consisting of words to be entered as the query
 * @param {String} text The text within which the queries are to be searched
 * @returns 
 */
const searchBlog = async(query, text) => {
    var out = ""
    const child = await exec(`java search "${query}" "${text}"`)
    if(child.stdout) {
        out += child.stdout
    }
    if(child.stderr) {
        out += `stderr: ${child.stderr}`
    }
    return out
}

function List(array) {
    return new Proxy(array, {
        get: (target, prop, rec) => {
            if(prop.split(",").length > 1) {
                return prop.split(",").map( e => rec[p])
            }
            if(prop < 0) {
                return Reflect.get(target, String(target.length+parseInt(prop, 10), rec))
            }
            return Reflect.get(target, prop.at, rec)
        },
        set: (target, prop, value, rec) => {
            if(prop < 0) {
                return Reflect.set(target, String(target.length+parseInt(prop, 10)), value, rec)
            }
            return Reflect.set(target, prop, value, rec)
        }
    })
}

class Tokenizer {
    /**
     * Tokenize the text into a token for multiple other purposes
     * @param {String} text The text that has to be tokenized
     * @returns String
     */
    encrypt(text) {
        var year = new Date().getFullYear()
        var key = Math.floor((text.charCodeAt(0)*text.charCodeAt(1)+16)/year)
        var text = this.shuffle(text.split("").map((e, i) => (e.charCodeAt(0)+key).toString().padStart(3, "0")+(i+key).toString().padStart(2, "0"))).join("")
        year = year.toString().split("").map((e, i) => (i===0)?e.charCodeAt(0)-key:e.charCodeAt(0)+key).join("")
        text += ":"+year+key.toString()+"-"+key.toString().length
        return text
    }

    /**
     * Decrypts the given token into string
     * @param {String} token The token that is to be converted back into the text
     * @returns String
     */
    decrypt(token) {
        var tokens = token.split("-")
        var keyLength = Number(tokens[tokens.length-1])
        var mainTokens = tokens[0].split(":")
        var temp = mainTokens[1].split("").reverse()
        var key = 0
        var i = 0
        while(i<keyLength) {
            key += Number(temp.splice(0, 1))*(10**i)
            i++
        }
        key = Number(key)
        var keys = []
        var temp1 = mainTokens[0].split("")
        for(var i=0; i<mainTokens[0].length/5; i++) {
            temp = []
            for(var k=0; k<5; k++) {
                temp.push(temp1.splice(0, 1)[0])
            }
            keys.push(temp)
        }
        var values = Array(keys.length).fill("")
        for(var k of keys) {
            var ascii = 0
            var index = 0
            i = 3
            while(i--) {
                ascii += (+k.splice(0, 1))*(10**i)
            }
            i = 2
            while(i--) {
                index += (+k.splice(0, 1))*(10**i)
            }
            values[index-key] = String.fromCharCode(ascii-key)
        }
        return values.join("")
    }

    /**
     * Returns the shuffled array
     * @param {String[]} array The strings that have to be shuffled
     * @returns String[]
     */
    shuffle(array) {
        var m = array.length, t, i
        while(m) {
            i = Math.floor(Math.random()*m--)
            t = array[m]
            array[m] = array[i]
            array[i] = t
        }
        return array
    }
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
const tokenizer = new Tokenizer()

export {
    lowerCase,
    createLowerCaseObject,
    searchBlog,
    __globals,
    stateList,
    tokenizer
}