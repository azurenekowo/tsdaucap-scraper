import { info, warn, error } from "./logger";
import Tesseract, { createWorker } from 'tesseract.js'
import { createCanvas, loadImage } from '@napi-rs/canvas'

let worker: Tesseract.Worker

const server = Bun.serve({
    port: 3000,
    async fetch(request) {
        if(!request.body || request.method != 'POST') return new Response('Error: Invalid request')
        const initTime = Date.now()
        const requestData = await request.json()
        const solvedCaptcha = await solveCaptcha(requestData.img)
        
        info(`Solved CAPTCHA -> "${solvedCaptcha}" in ${Date.now() - initTime} ms`)
        return Response.json({ ocr: solvedCaptcha })
    }
})

await initTesseractWorker()
info(`CAPTCHA solver instance started at ${server.url}`)

async function initTesseractWorker() {
    worker = await createWorker('eng')
}

async function solveCaptcha(img: string) {
    const image = await loadImage(`data:image/png;base64,${img}`)
    const canvas = createCanvas(image.width * 2, image.height * 2)
    const context = canvas.getContext('2d')
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const captchaImage = canvas.toBuffer('image/png')
    await Bun.write('captcha.png', captchaImage)

    info(`Received CAPTCHA image "${img.slice(0,16)}..."`)
    const data = await worker.recognize(captchaImage)
    const solvedCaptcha: string = data.data.text.replace(/[^a-zA-Z0-9]+/g, '').replace(/\\n/g, '').trim()
    return solvedCaptcha
}