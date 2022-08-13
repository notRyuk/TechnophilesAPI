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

export default Tokenizer;