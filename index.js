const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const TurndownService = require('turndown');
const fs = require('fs');

dotenv.config();

const crawler = async () => {
  try{
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=1920,1080'],
      userDataDir: './user_data',
    })
    const page = await browser.newPage();

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

    for(let i=0;;i++) {
      await page.goto('https://www.clien.net/service/mypage/myArticle?&type=articles&sk=title&sv=&po='+i);
      if(await page.$('.list_empty')){
        break;
      }
      await page.waitForSelector('.report_label');
      const links = await page.evaluate(() => {
        const articles = document.querySelectorAll('.list_subject');
        return [...articles]
          .filter((article) => article.href)
          .map((article) => article.href)
      })

      for (const link of links) {
        await page.goto(link);
        await page.waitForSelector('article');

        const article = await page.evaluate(() => {
          const html = document.querySelector('.post_article').innerHTML;
          const date = document.querySelector('.post_author span').innerText.split(' ').splice(1,2).join('T');
          const title = document.querySelector('.post_subject>span').innerText;
          const board = document.querySelector('.board_name a').innerText;
          return {title, date, html, board}
        })

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
        const article_md = turndownService.turndown(article.html);
        const post_md = 
`---
title: '${article.title}'
date: '${article.date}'
template: 'post'
category: 'clien'
tags: 
  - '${article.board}'
draft: false
---

${article_md}

원본 URL: [${link}](${link})`
        const filename = article.date.split(' ').join('_');
        fs.writeFile(__dirname+`/markdown/${filename}.md`, post_md, 'utf8', function(error){ console.log(`write ${filename}.md`) });
        await page.goBack();
        await page.waitForSelector('.report_label');
      }
      
    }

    console.log('finish!');
    
  } catch(e) {
    console.error(e);
  }
}

crawler();

