import sleep from "./sleep"
import config from '../config.json'
import { error, info } from "./logger"
import student_id from "./student_id"
import headers from '../headers.json'
import { appendFileSync } from "node:fs"


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
        const captchaRequest = await fetch(`https://tsdaucap.hanoi.gov.vn/getcaptcha?_=${Date.now()}`, {
            headers: headers.tsdaucap
        })
        const captchaData = await captchaRequest.json()

        let captcha: any
        if(config.captcha_mode == 'AUTO') {
            const captchaAuto = await (await fetch(config.captcha_solver, {
                method: 'POST',
                body: `${captchaData.image}`
            }))?.json()
            captcha = {
                time: captchaData.time,
                ans: captchaAuto.output.toLowerCase()
            }
        }
        else {
            const captchaManual = await Bun.file('tempcaptcha.json').json()
            captcha = {
                time: captchaManual.time,
                ans: captchaManual.input
            }
        }
        info(`LOAI_TRA_CUU=02&GIA_TRI=${id}&CaptchaTime=${captcha.time}&CaptchaInput=${captcha.ans}`)

        const studentRequest = await fetch("https://tsdaucap.hanoi.gov.vn/tra-cuu-diem-thi-10", {
            method: "POST",
            headers: headers.tsdaucap,
            body: `LOAI_TRA_CUU=02&GIA_TRI=${id}&CaptchaTime=${captcha.time}&CaptchaInput=${captcha.ans}`
        })
        const studentRecord = await studentRequest.json()
        if(!studentRecord) {
            error(studentRequest.statusText)
            process.exit()
        }
        if (!studentRecord?.result) {
            info(`\x1b[0;31mFailed\x1b[0m querying "${id}": ${studentRecord.message}`)
            switch(studentRecord.message) {
                case 'Không tìm thấy hồ sơ thí sinh, vui lòng kiểm tra lại.':
                    await sleep(config.delay.fail)
                    return await scrape(student_id(parseInt(id) + 1), "tsdaucap", counter)
                case 'Sai mã bảo vệ.':
                    await sleep(config.delay.fail)
                    return await scrape(id, "tsdaucap", counter)
                case 'Xác thực không thành công.':
                    await sleep(config.delay.fail)
                    return await scrape(id, "tsdaucap", counter)
                default:
                    await sleep(config.delay.fail)
                    return await scrape(id, "tsdaucap", counter)
            }            
        }
        
        const kq = studentRecord.kq
        const scoreData = kq.diemThi.match(/\d+\.\d+/g)
        info(JSON.stringify(studentRecord, null, 4))
        appendFileSync(config.output, `${counter},${kq.soBaoDanh},${kq.maHocSinh},${kq.hoTen},${parseResult(scoreData[0])},${parseResult(scoreData[1])},${parseResult(scoreData[2])},${parseResult(scoreData[3])}${scoreData.length >=5 ? `${scoreData[4]}`: ''}\n`)

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

function parseResult(input: any) {
    if(input == undefined) {
        return '0'
    }
    return input
}