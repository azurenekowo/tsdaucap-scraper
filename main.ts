import { info, warn, error } from './modules/logger'
import config from './config.json'
import scrape from './modules/scraper'
import student_id from './modules/student_id'

const outputFile = Bun.file(config.output)
let counter = 1
let sf = config.data_collection.start

if(!await(outputFile.exists())) {
    info('Output file not found, creating new file...')
    'stt,sbd,mhs,ten,van,toan,anh,xt,note'
    switch(config.mode) {
        case 'tsdaucap':
            await Bun.write(config.output, 'stt,sbd,mhs,ten,van,anh,toan,xt,note\n')
        case 'hanoimoi':
            await Bun.write(config.output, 'stt,sbd,mhs,van,anh,toan,xt,note\n')
    }
    info('Output file regenerated, script will start running shortly...')
}
else {
    const prev = (await Bun.file(config.output).text()).trim().split('\n')
    counter = prev.length
    sf = (parseInt(prev[prev.length - 1].split(',')[1]) + 1).toString()
    info(`Resuming data collection, offset ${sf}`)
}

info('Data collection started')
await scrape(sf, config.mode, counter)
