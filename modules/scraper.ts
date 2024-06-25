import sleep from "./sleep"
import config from '../config.json'
import { error, info } from "./logger"
import student_id from "./student_id"
import { load } from 'cheerio'

const outputFile = Bun.file(config.output)

/**
 * 
 * @param id StudentID
 * @param {('tsdaucap'|'hanoimoi')} method Scrape method
 * @param counter Counter
 *
 */
export default async function scrape(id: string, method: string, counter: number) {
    if (parseInt(id) > parseInt(config.data_collection.end)) {
        info('Data collection completed')
        return process.exit(0)
    }
    if(method == 'tsdaucap') {
        const captchaRequest = await fetch(`https://tsdaucap.hanoi.gov.vn/getcaptcha?_=${Date.now()}`)
        const captchaData = await captchaRequest.json()

        const captcha = await (await fetch(config.captcha_solver, {
            method: 'POST',
            body: `${captchaData.image}`
        }))?.json()

        const keyRequest = await (await fetch('https://tsdaucap.hanoi.gov.vn/tra-cuu-diem-thi-10', {
            method: 'POST',
            headers: headers.tsdaucap,
            body: JSON.stringify({
                LOAI_TRA_CUU: '02',
                GIA_TRI: id,
                CaptchaTime: captchaData.time,
                CaptchaInput: captcha.output
            })
        })).json()

        if(!keyRequest) {
            error('KeyRequest returned null (Upstream data source is inaccessible).')
            process.exit()
        }
        if(!keyRequest?.result) {
            switch(keyRequest.data.message) {
                case 'Không tìm thấy hồ sơ thí sinh, vui lòng kiểm tra lại.':
                    info(`Failed querying "${id}": ${keyRequest.data.message}`)
                    await sleep(config.delay.fail)
                    return await scrape(student_id(parseInt(id) + 1), "tsdaucap", counter)
                case 'Sai mã bảo vệ.':
                    info(`Failed querying "${id}": ${keyRequest.data.message}`)
                    await sleep(config.delay.fail)
                    return await scrape(id, "tsdaucap", counter)
                case 'Xác thực không thành công.':
                    info(`Failed querying "${id}": ${keyRequest.data.message}`)
                    await sleep(config.delay.fail)
                    return await scrape(id, "tsdaucap", counter)
            }
        }
        const requestKey = keyRequest.data.key

        const studentHtmlResults = await (await fetch('https://tsdaucap.hanoi.gov.vn/TraCuu/KetQuaTraCuuTuyenSinh10', {
            method: 'GET',
            headers: headers.tsdaucap,
            body: JSON.stringify({
                key: requestKey
            })
        })).text()

        const $ = load(studentHtmlResults)
        const rawScoreData: any = $('.box-thong-tin-diem').html()?.trim().replace(/<div class="row" style="margin-bottom: 8px;">.{1,}:&nbsp;  <b>|<\/b><\/div>/gm, '').split('\n').map(i => i.trim())
        const resultArray = rawScoreData[3].match(/\d+\.\d+/g)
        let diemVan: string; let diemToan: string; let diemAnh: string; let tongXT: string; let note = ''
        
        if (resultArray) {
            diemVan = parseResult(resultArray[0])
            diemAnh = parseResult(resultArray[1])
            diemToan = parseResult(resultArray[2])
            tongXT = parseResult(resultArray[3])
            if (resultArray.length == 5) {
                note = `,${parseResult(resultArray[4])}`
            }
        }
        else {
            diemVan = '0'; diemToan = '0'; diemAnh = '0'; tongXT = '0'
        }
        
        const studentRecord = {
            sbd: rawScoreData[0],
            mhs: rawScoreData[1],
            name: rawScoreData[2],
            score: {
                van: diemVan,
                toan: diemToan,
                anh: diemAnh,
                tong: tongXT,
                note: note
            }
        }
        await Bun.write(config.output, `${counter},${studentRecord.sbd},${studentRecord.mhs},${studentRecord.name},${studentRecord.score.van},${studentRecord.score.toan},${studentRecord.score.anh},${studentRecord.score.tong}${studentRecord.score.note}\n`)
        info(`#${counter} . ${studentRecord.sbd}; ${studentRecord.mhs}; ${studentRecord.name}; ${studentRecord.score.van}, ${studentRecord.score.toan}, ${studentRecord.score.anh}, ${studentRecord.score.tong}${studentRecord.score.note}`)
        await sleep(config.delay.normal)
        const new_counter = counter + 1
        await scrape(student_id(parseInt(id) + 1), 'tsdaucap', new_counter)
    }
    else {
        const request = await fetch("https://hanoimoi.vn/api/getdiemthi", {
            headers: headers.hanoimoi,
            body: `y=2024&t=2&q=${id}`,
            method: "POST",
            redirect: 'manual'
        })
        if(request.headers.get('location')?.startsWith('/404') && request.status == 302) {
            error('InitialRequest returned 404 (Upstream data source is inaccessible).')
            process.exit()
        }

        if(!request.ok) {
            error(`Failed querying "${id}"`)
            await sleep(config.delay.fail)
            return await scrape(id, 'hanoimoi', counter)
        }
        const data = await request.json()
        if(!data.SBD || data.SBD == '') {
            error(`Failed querying "${id}": Empty record`)
            await sleep(config.delay.fail)
            const new_counter = counter + 1
            return await scrape(student_id(parseInt(id) + 1), 'hanoimoi', new_counter)
        }
        
        const resultArray = data.Diem.match(/\d+\.\d+/g)
        let diemVan: string; let diemToan: string; let diemAnh: string; let tongXT: string; let note = ''

        if (resultArray) {
            diemVan = parseResult(resultArray[0])
            diemAnh = parseResult(resultArray[1])
            diemToan = parseResult(resultArray[2])
            tongXT = parseResult(resultArray[3])
            if (resultArray.length == 5) {
                note = `,${parseResult(resultArray[4])}`
            }
        }
        else {
            diemVan = '0'; diemToan = '0'; diemAnh = '0'; tongXT = '0'
        }
        await Bun.write(config.output, `${counter},${data.SBD}${data.MS_HS},${diemVan},${diemToan},${diemAnh},${tongXT}${note}\n`)
        info(`#${counter} | StudentNo: ${data.SBD} | StudentID: ${data.MS_HS} | Results: ${data.Diem}`)
        await sleep(config.delay.normal)
        const new_counter = counter + 1
        await scrape(student_id(parseInt(id) + 1), 'hanoimoi', new_counter)
    }
}

const headers = {
    'hanoimoi': {
        "accept": "*/*",
        "accept-language": "en,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,vi-VN;q=0.6,vi;q=0.5",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://hanoimoi.vn/diem-thi-lop-10-2024",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    'tsdaucap': {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,vi-VN;q=0.6,vi;q=0.5",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://tsdaucap.hanoi.gov.vn/tra-cuu-tuyen-sinh-10",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
}

function parseResult(input: any) {
    if(input == undefined) {
        return '0'
    }
    return input
}