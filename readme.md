# 🎓 tsdaucap-scraper  
A simple prgram to scrape the scores of Hanoi students who have participated in the high school entrance exam of the year 2023-2024.



## Quickstart
*If you haven't installed NodeJS yet, [download it here](https://nodejs.org/en/download)*

```bash
git clone https://github.com/azurenekowo/tsdaucap-scraper
cd tsdaucap-scraper
npm install 
node main.js
```

## Configuration
Inside the folder, there is a `config.json` file that you can modify to suit your needs.  

 - Interval  
    + `normal`: delay for each success query.  
    + `fail`: delay for each failed query. (ex. empty record, request timeout)
 - Range
    + `from`: The first student ID to query and iterate up.
    + `to`: The final student ID to query and stop the program.
 - Output
    + `filename`: The name of the file the program is going to store data into.
    + `encoding`: [Advanced] Change the file encoding.
 - Scraper
    + `mode`: The method that the program is going to scrape.  
    *For now, there is only one mode for Hanoimoi. Subjected to change.*
    + `request_DO_NOT_TOUCH` and `headers_DO_NOT_TOUCH`: As the name suggests, don't touch it unless you know what you are doing.
 - Logging
    + `verbose`: If enabled, it will log whenever a request was sent. 

## Frequently Asked Questions
**Q:** It doesn't return any scores, just `"Đang truy vấn Số Báo danh xxxxxx"` non-stop!  
**A:** It is the fault of Hanoi's Department of Education and Training to blame for.  
They had made it so the students' IDs don't continuously increase step by step. As a result, there are various gaps in the dataset.  

**Q:** The scores returned `undefined` partially!  
**A:** This issue should have been fixed. It is due to an incomplete result (either the student has skipped that exam). From now onwards, all `undefined` scores will be treated as `0` and written into the database as so.

**Q:** Why did you do this?  
**A:** For fun, but I would say it was for analytical, educational and demonstrational purposes.  
On a more serious note, I think this shouldn't stress the servers in any noticable or impactful/harmful way.

## TODOs
 - [x] CSV output, sanitized bad/empty responses  
 - [ ] Automatically detects and skip gaps of empty entries in order to save bandwith
 - [ ] CAPTCHA bypass for [tsdaucap](https://tsdaucap.hanoi.gov.vn). Partially added support at [d238ef1](https://github.com/azurenekowo/tsdaucap-scraper/commit/d238ef10aea78bc60a8cc006f439d948e1174c9c)

## Other Things
Contributions are welcomed. If you have any ideas or improvements, how about submitting a pull request?  
I made this after I passed the exam, by the way. 

---
From azure with 💜
