const fs = require('fs')
const axios = require('axios').default
const { timestamp, studentID, sleep } = require('./modules')
let { interval, range, scraper, logging, output } = require('./config.json')

let counter
let startFrom = range.from

if (!fs.existsSync(output.filename)) {
    console.log(timestamp() + ' Đang khởi tạo một file dữ liệu mới')
    fs.writeFileSync(output.filename, 'stt,sbd,mhs,van,toan,anh,xt,note', output.encoding)
    counter = 1
}
else {
    const prev = fs.readFileSync(output.filename).toString().trim().split('\n')
    counter = prev.length
    startFrom = parseInt(prev[prev.length - 1].split(',')[1]) + 1
    console.log(timestamp() + ' Tiếp tục thu thập từ số báo danh ' + studentID(startFrom))
}

console.log(timestamp() + ' Bắt đầu thu thập...\n')
request(studentID(startFrom))

async function request(sbd) {
    if(logging.verbose) console.log(timestamp() + ' Hiện tại đang truy vấn Số Báo danh ' + sbd)
    if (parseInt(sbd) > parseInt(range.to)) {
        console.log('\n' + timestamp() + ' Đã thu thập đủ danh sách thí sinh.')
        return process.exit(0)
    }
    const { data } = await axios({
        url: scraper.request_DO_NOT_TOUCH[scraper.mode].url,
        method: scraper.request_DO_NOT_TOUCH[scraper.mode].method,
        headers: scraper.headers_DO_NOT_TOUCH[scraper.mode],
        data:
            (scraper.mode == 'hanoimoi'
                ? {
                    t: 2,
                    q: sbd
                }
                : {
                    t: 2,
                    q: sbd
                })
    }).catch(async () => {
        await sleep(interval.fail)
        return await request(studentID(sbd))
    })
    if (data.SBD == '') {
        await sleep(interval.fail)
        return await request(studentID(parseInt(sbd) + 1))
    }

    const resultArray = data.Diem.match(/\d+\.\d+/g)
    let diemVan; let diemToan; let diemAnh; let tongXT; let note = ''

    if (resultArray) {
        diemVan = resultArray[0] != undefined ? resultArray[0] : '0'
        diemToan = resultArray[1] != undefined ? resultArray[1] : '0'
        diemAnh = resultArray[2] != undefined ? resultArray[2] : '0'
        tongXT = resultArray[3] != undefined ? resultArray[3] : '0'
        if (resultArray.length == 5) {
            note = ',diemchuyen: ' + resultArray[4] != undefined ? resultArray[4] : '0'
        }
    }
    else {
        diemVan = '0'; diemToan = '0'; diemAnh = '0'; tongXT = '0'
    }
    fs.appendFileSync(output.filename,
        `\n${counter},${data.SBD},${data.MS_HS},${diemVan},${diemToan},${diemAnh},${tongXT}${note}`,
        output.encoding)
    console.log(`#${counter} | Số Báo danh: ${data.SBD} | Mã Học sinh: ${data.MS_HS} | Điểm: ${data.Diem}`)
    await sleep(interval.normal)
    counter++
    await request(studentID(parseInt(sbd) + 1))
}
