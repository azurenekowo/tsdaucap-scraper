import { error, warn, info } from './modules/logger'

const headers = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,vi-VN;q=0.6,vi;q=0.5",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "pragma": "no-cache",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    "Referer": "https://tsdaucap.hanoi.gov.vn/tra-cuu-tuyen-sinh-10",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "requestverificationtoken": "CfDJ8D6iEx6NYfxNsjjMZmWN5jzqly3inUCdjfgMJGswQ0m_SqteILSaRB4vUUyxTToi1g6Ql8yz6BGzYC6_DLX_viin4hVAc7eUc3Js4LEl0O3uZRUtpf6wrZXe8YCDIVck5IXdJnfo2slbO67iDCAirck",
    "cookies": ".AspNetCore.Antiforgery.68HoDSos0ic=CfDJ8D6iEx6NYfxNsjjMZmWN5jztt-UQHhH3zRPBfD-QGm7NXTAHSbl9EsPhRgdvMHo70ddNM7ZQEYRy9zhCAZ91OK3Tf0fVLYHJ1l9sWiduqUt9ur_C_ykJNtV0RAmIiaZ9a_2NH8EsVSuScs-N-75RLtw; BIGipServerPool_TSDC_HN=1915228332.34304.0000;"
}
const captchaManual = await Bun.file('tempcaptcha.json').json()
const captcha = {
    time: captchaManual.time,
    ans: captchaManual.input
}

info(`LOAI_TRA_CUU=02&GIA_TRI=001001&CaptchaTime=${captcha.time}&CaptchaInput=${captcha.ans}`)

const studentRequest = await fetch("https://tsdaucap.hanoi.gov.vn/tra-cuu-diem-thi-10", {
    method: "POST",
    headers: headers,
    body: `LOAI_TRA_CUU=02&GIA_TRI=001001&CaptchaTime=${captcha.time}&CaptchaInput=${captcha.ans}`
})