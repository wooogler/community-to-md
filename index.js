const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const TurndownService = require('turndown');

dotenv.config();

const crawler = async () => {
  try{
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=1920,1080'],
      userDataDir: './user_data',
    })
    const page = await browser.newPage();
    // await page.setRequestInterception(true);

    // page.on('request', (req) => {
    //   switch(req.resourceType()) {
    //     case 'stylesheet':
    //     case 'font':
    //     case 'image':
    //       req.abort();
    //       break;
    //     default:
    //       req.continue();
    //       break;
    //   }
    // })

    await page.setViewport({
      width: 1300,
      height: 2000,
    })
    await page.goto('https://www.clien.net');
    if (await page.$('.nickname')) {
      console.log('이미 로그인 되어 있음');
    } else {
      await page.type('.input_id', process.env.ID);
      await page.type('.input_pw', process.env.PASSWORD);
      await page.click('.button_submit');
      await page.waitForSelector('.button_logout');
    }

    await page.goto('https://www.clien.net/service/board/park/15186926');
    await page.waitForSelector('article');
    const html = await page.evaluate(() => {
      return document.querySelector('.post_article').innerHTML;
    })

    const 

    const turndownService = new TurndownService({
      blankReplacement (content, node) {
        const types = ['SCRIPT', 'IFRAME']
        if (types.indexOf(node.nodeName) !== -1) {
          return `\n\n${node.outerHTML}\n\n`
        } else {
          const output = []
          node.childNodes.forEach((child) => {
            if (types.indexOf(child.nodeName) !== -1) {
              output.push(child.src)
            }
          })
          if (output.length) {
            return '\n\n`youtube:' + output.join('\n\n') + '`\n\n'
          } else {
            return node.isBlock ? '\n\n' : ''
          }
        }
      }
    });
    const md = turndownService.turndown(html);
    console.log(md);
    
    // await page.goto('https://www.clien.net/service/mypage/myArticle?&type=articles&sk=title&sv=&po=0');
    // await page.waitForSelector('.report_label');
    // const links = await page.evaluate(() => {
    //   const articles = document.querySelectorAll('.list_subject')
    //   return [...articles].map((article) => {
    //     return article.href;
    //   })
    // })

    // for (const link of links) {
    //   await page.goto(link);
    //   await page.waitForSelector('article');
      
    //   await page.goBack();
    //   await page.waitForSelector('.report_label');
    // }
    
  } catch(e) {
    console.error(e);
  }
}

crawler();

