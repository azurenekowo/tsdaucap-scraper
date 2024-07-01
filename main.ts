import { info, warn, error } from './modules/logger'
import config from './config.json'
import scrape from './modules/scraper'
import student_id from './modules/student_id'

const outputFile = Bun.file(config.output)
let counter = 1
let sf = config.data_collection.start

if(!await(outputFile.exists())) {
    info('Output file not found, creating new file...')
    if(config.mode == 'tsdaucap') {
        await Bun.write(config.output, 'stt,sbd,mhs,ten,van,anh,toan,xt,note\n')
    } 
    else {
        await Bun.write(config.output, 'stt,sbd,mhs,van,anh,toan,xt,note\n')
    }
    info('Output file regenerated, script will start running shortly...')
}
else {
    const prev = (await Bun.file(config.output).text()).trim().split('\n')
    counter = prev.length
    sf = (parseInt(prev[prev.length - 1].split(',')[1]) + 1).toString()
    if(!isNaN(parseInt(sf))) {
        info(`Resuming data collection, offset ${sf}`)
    }
    else {
        sf = config.data_collection.start
    }
}

if(config.mode == 'tsdaucap') {
    const headers = await (await Bun.file('headers.json').json())
    if(!headers.tsdaucap['requestverificationtoken'] && !headers.tsdaucap['cookie']) {
        const html = await fetch('https://tsdaucap.hanoi.gov.vn/tra-cuu-tuyen-sinh-10', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        })
        const rawhtml = await html.text()
        const rqverificationtoken = rawhtml.match(/^.*__RequestVerificationToken.*$/mi)?.map(m => m)[0].trim().replace(/\\/g, '').replace('<input name="__RequestVerificationToken" type="hidden" value="', '').replace('" />', '')
        const antiforgerycookie = html.headers.getSetCookie().find(c => c.includes('.AspNetCore.Antiforgery.'))?.replace(' path=/; samesite=strict; httponly', '')
        const serverpoolcookie = html.headers.getSetCookie().find(c => c.includes('BIGipServerPool_TSDC_HN='))?.replace(' path=/; Httponly; Secure', '')
        
        headers.tsdaucap['requestverificationtoken'] = rqverificationtoken
        headers.tsdaucap['cookie'] = `${antiforgerycookie}; ${serverpoolcookie}`
        await Bun.write('headers.json', JSON.stringify(headers, null, 4))
        info('Spoofed Antiforgery cookie + RequestVerificationToken, please restart the script.')

        process.exit()
    }
    if(config.captcha_mode == 'MANUAL' && !(await Bun.file('tempcaptcha.json').exists())) {
        const captchaRequest = await (await fetch(`https://tsdaucap.hanoi.gov.vn/getcaptcha?_=${Date.now()}`, {
            headers: { 'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" }
        })).json()
        await Bun.write('tempcaptcha.json', JSON.stringify({
            time: captchaRequest.time,
            input: '' 
        }, null, 4))
        info('Manual CAPTCHA mode: Please solve the CAPTCHA and put it into tempcaptcha.json')
        info(`data:image/png;base64,${captchaRequest.image}`)
        process.exit()
    }
}
info('Data collection started')
await scrape(sf, config.mode, counter)
