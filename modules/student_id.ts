export default function(input: number) {
    let output: string = input.toString()
    if(output.toString().length < 6) {
        for(let i = 0; i = (6 - output.toString().length); i++) {
            output = '0' + output
        }
    }
    return output
}