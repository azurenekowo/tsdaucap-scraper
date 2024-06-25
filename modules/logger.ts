
function getDate(type: string) {
    const temp_date = new Date()
    switch(type) {
        case 'TIME':
            return `${temp_date.toLocaleTimeString('en-GB', {hour12: false})}`
        break
        case 'FULL':
            return `${temp_date.toLocaleDateString('en-GB')} ${temp_date.toLocaleTimeString('en-GB', {hour12: false})}`
        break
        case 'DATE':
            return `${temp_date.toLocaleDateString('en-GB')}`
        break
    }
}

export function error(data: any): void {
  return console.error(`\x1b[90m${getDate('TIME')} | \x1b[0;31mERROR\x1b[0m \n           ${data}`);
}
export function info(data: any): void {
  return console.log(`\x1b[90m${getDate('TIME')} |\x1b[0m ${data}`);
}
export function warn(data: any): void {
  return console.warn(`\x1b[90m${getDate('TIME')} | \x1b[0;33mWARN\x1b[0m \n           ${data}`);
}

