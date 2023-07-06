const fs = require('fs')
const cheerio = require('cheerio')
const axios = require('axios').default
const Tesseract = require('tesseract.js')
const { timestamp, studentID, sleep } = require('./modules')
let { interval, range, scraper, logging, output } = require('./config.json')

const { createCanvas, loadImage } = require('canvas')
const sharp = require('sharp')
const { config } = require('process')

request(studentID(range.from))

async function request(sbd) {
    console.log(timestamp() + ' Đang truy vấn Số Báo danh ' + sbd)
    if (parseInt(sbd) > parseInt(range.to)) {
        console.log('\n' + timestamp() + ' Đã thu thập đủ danh sách thí sinh.')
        return process.exit(0)
    }
    // Get the CAPTCHA and OCR it
    if(logging.verbose) console.log(timestamp() + ' Fetching a new CAPTCHA')
    const captchaRequest = await axios({
        url: 'https://tsdaucap.hanoi.gov.vn/getcaptcha',
        method: 'GET',
        headers: scraper.headers_DO_NOT_TOUCH['tsdc'],
        data: {
            '_': Date.now()
        }
    })
    fs.writeFileSync('captcha.png', Buffer.from(captchaRequest.data.image, 'base64'))
    if(logging.verbose) {
        // console.log(timestamp() + ' Response dump:\n' + JSON.stringify(captchaRequest.data, null, 2))
        console.log(timestamp() + ' Received CAPTCHA image') 
        console.log(timestamp() + ' Recognizing...')
    }
    const canvas = createCanvas()
    const image = await loadImage('captcha.png')
    fs.unlinkSync('captcha.png')
    canvas.width = image.width * 2
    canvas.height = image.height * 2
    const context = canvas.getContext('2d')
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const tempBuffer = canvas.toBuffer('image/png')
    const imageBuffer = await sharp(tempBuffer).sharpen({ 
        sigma: 10,
        flat: true,
        jagged: true,
        minAmplify: 100,
        maxAmplify: 200
    }).toBuffer()
    fs.writeFileSync('captcha-white.png', imageBuffer, 'base64')

    const worker = await initializeTesseract()
    const ocr = await worker.recognize('captcha-white.png', 'eng')
    await worker.terminate()

    const captcha = {
        ans: ocr.data.text.trim().toLowerCase().replace(/\s+/g, ''),
        time: captchaRequest.data.time
    }
    if(logging.verbose) console.log(timestamp() + ' Solved CAPTCHA. ' + captcha.ans)

    // Request the key to query a record
    const keyRequest = await axios({
        url: 'https://tsdaucap.hanoi.gov.vn/tra-cuu-diem-thi-10',
        method: 'POST',
        headers: scraper.headers_DO_NOT_TOUCH['tsdc'],
        data: {
            LOAI_TRA_CUU: '02',
            GIA_TRI: sbd,
            CaptchaTime: captcha.time,
            CaptchaInput: captcha.ans
        }
    }).catch(e => {
        console.log(e)
    })
    
    if(!keyRequest.data.result) {
        console.log(timestamp() + ' ' + keyRequest.data.message)
        await sleep(interval.fail)
        return await request(sbd)
    }
    const key = keyRequest.data.key
    
    if(logging.verbose) console.log(timestamp() + ' Response dump:\n' + JSON.stringify(keyRequest.data, null, 2))
    const htmlScoreResponse = await axios({
        url: 'https://tsdaucap.hanoi.gov.vn/TraCuu/KetQuaTraCuuTuyenSinh10',
        method: 'GET',
        headers: scraper.headers_DO_NOT_TOUCH['tsdc'],
        data: {
            key: key
        }
    })
    
    const $ = cheerio.load(htmlScoreResponse.data)
    const rawScoreData = $('.box-thong-tin-diem').html().trim().replace(/<div class="row" style="margin-bottom: 8px;">.{1,}:&nbsp;  <b>|<\/b><\/div>/gm, '').split('\n').map(i => i.trim())
    
    'stt,sbd,mhs,van,toan,anh,xt,note'
    const resultArray = rawScoreData[3].match(/\d+\.\d+/g)
    let diemVan; let diemToan; let diemAnh; let tongXT; let note = ''

    if (resultArray) {
        diemVan = resultArray[0] != undefined ? resultArray[0] : '0'
        diemAnh = resultArray[1] != undefined ? resultArray[1] : '0'
        diemToan = resultArray[2] != undefined ? resultArray[2] : '0'
        tongXT = resultArray[3] != undefined ? resultArray[3] : '0'
        if (resultArray.length == 5) {
            note = ',diemchuyen: ' + resultArray[4] != undefined ? resultArray[4] : '0'
        }
    }
    else {
        diemVan = '0'; diemToan = '0'; diemAnh = '0'; tongXT = '0'
    }
    
    const record = {
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
    console.log(record)
    await sleep(interval.normal)
    return await request(studentID(parseInt(sbd) + 1))
}

async function initializeTesseract() {
    const worker = await Tesseract.createWorker()
    await worker.loadLanguage('eng')
    await worker.initialize('eng', 0)
    return worker
}