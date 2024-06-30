> [!IMPORTANT]  
> THIS PROGRAM IS DEFUNCT. FUCK YOU 🖕 hanoi.edu.vn     
> BLAME THEM FOR THEIR CUNT-LIKE WEBSITE WITH SHITTY SERVERS. FUCK THEM ALL. THEY CAN ROT IN HELL AND I WON'T GIVE A FLYING FUCK.


# 🎓 tsdaucap-scraper  
A simple prgram to scrape the scores of Hanoi students who have participated in the high school entrance exam of Hanoi.


> [!IMPORTANT]  
> If you are updating from the legacy version, please delete the old folder and pull again.    
> Or if you still want to use the legacy version, `cd legacy` and continue using it from there.

## Quickstart
*If you haven't installed Bun yet, [download it here](https://bun.sh/)*

```bash
git clone https://github.com/azurenekowo/tsdaucap-scraper
cd tsdaucap-scraper
bun install
bun main.ts
```
## CAPTCHA solver (for `tsdaucap.hanoi.gov.vn`)
> Special thanks to [@4pii4](https://github.com/4pii4) for writing the CAPTCHA solver script.    

> [!IMPORTANT]  
> This external script requires `tesseract` to be installed on your machine. Please install it by [downloading it here](https://tesseract-ocr.github.io/tessdoc/Installation.html) and modify the 18th line in `pytesshost.py` to point it to the executable file.  
> `pytesseract.pytesseract.tesseract_cmd = "<TESSERACT EXECUTABLE PATH>" `

`python pytesshost.py`, then configure the `captcha_solver` endpoint. It should automatically solve the CAPTCHAs fed from the scraper script.

## Configuration
Edit the `config.json` file accordingly to suit your needs.

 - `delay`  
    + `normal`: delay for each success query.  
    + `fail`: delay for each failed query. (ex. empty record, request timeout, wrong CAPTCHA, etc.)
 - `data_collection`
    + `start`: The first student ID to query and iterate up.
    + `end`: The final student ID to query and stop the program.
 - `output`: The name of the file the program is going to store data into.
 - `mode`: The method that the program is going to scrape.  
    + Available modes: `hanoimoi`, `tsdaucap`
 - `captcha_solver`: The CAPTCHA solver endpoint (for `tsdaucap` mode)


## Frequently Asked Questions
**Q:** Massive gaps in the dataset / delays in which no new data are added  
**A:** Blame [Sở Giáo dục và Đào tạo thành phố Hà Nội (https://hanoi.edu.vn/)](https://hanoi.edu.vn/) for this issue, not me.  
They had made it so there are gaps in the dataset, in which students' IDs don't continuously increase step by step.

**Q:** The scores returned `undefined` partially!  
**A:** ~~Uncomplete result (either the student has skipped that exam/no exam submitted)~~. Solved. From now on it will be treated as `0`.

**Q:** Why did you do this?  
**A:** Educational purposes. Looking at the data and graphs is fun.   
On a more serious note, I think this shouldn't stress the servers in any noticable or impactful/harmful way.

## TODOs
 - [x] CSV output, sanitized bad/empty responses
 - [x] CAPTCHA bypass for [tsdaucap](https://tsdaucap.hanoi.gov.vn).
 - [ ] WebUI   
 - [ ] Automatically detects and skip gaps of empty entries in order to save bandwith
     
.

---
From azure with 💜
