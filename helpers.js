import { user } from "./mongoose.js";
import { promisify } from 'util';
import { exec as exec1} from 'child_process';

import Tokenizer from "./tokenizer.js";

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
 * @returns String
 */
const searchBlog = async(query, text) => {
    query = query.replace(/[0-9]+/, "")
    text = text.replace(/[0-9]+/, "")
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

const tokenizer = new Tokenizer()

export {
    lowerCase,
    createLowerCaseObject,
    searchBlog,
    stateList,
    tokenizer
}