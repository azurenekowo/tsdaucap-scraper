
/**
 * 
 * @returns {string} A formatted time string [HH:mm:ss]
 */

module.exports.timestamp = function() {
    return `[${new Date().toLocaleTimeString('en-GB', { hour12: false })}]`
}


/**
 * @description Formats an input and return a queryable student ID
 * @param {any} input An unformatted int/string (ex. 2001 or 12345)
 * @returns {string}
 */

module.exports.studentID = function(input) {
    let output = input
    if(output.toString().length < 6) {
        for(let i = 0; i = (6 - output.toString().length); i++) {
            output = '0' + output
        }
    }
    return output
}

module.exports.sleep = async function(time) {
    return new Promise(resolve => setTimeout(resolve, time))
}