const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer-core");
const chromium = require("chromium");

const obj = require("./../index");

const selectors = {
  titleSelector: ".content > h6 > a",
  imageUrlSelector: ".img > a",
  dateSelector: ".blog-detail .bd-item:first-child > span",
  likesSelector: ".zilla-likes > span",
  base_url: "https://rategain.com/blog/page/",
  postSelector: ".blog-item",
};

// Function to extract data from a single blog post

const extractPostData = async (post) => {
  let title, imageUrl, date, likes;

  try {
    title = await post.$eval(
      selectors.titleSelector,
      (element) => element?.textContent
    );
  } catch (error) {
    console.error("Error while extracting title:", error.message);
    title = null;
  }

  try {
    imageUrl = await post.$eval(selectors.imageUrlSelector, (element) =>
      element?.getAttribute("data-bg")
    );
  } catch (error) {
    console.error("Error while extracting imageUrl:", error.message);
    imageUrl = null;
  }

  try {
    date = await post.$eval(
      selectors.dateSelector,
      (element) => element?.textContent
    );
  } catch (error) {
    console.error("Error while extracting date:", error.message);
    date = null;
  }

  try {
    likes = await post.$eval(
      selectors.likesSelector,
      (element) => element?.textContent
    );
    likes = +likes?.split(" ")[0];
  } catch (error) {
    console.error("Error while extracting likes:", error.message);
    likes = null;
  }

  return { title, imageUrl, date, likes };
};

const scrapeData = async (browser, pageNumber, socketClient, total) => {
  const page = await browser.newPage();
  await page.goto(`${selectors.base_url}${pageNumber}`);

  // Extract data from all blog posts on the current page
  const posts = await page.$$(selectors.postSelector);
  const currentPagePosts = [];
  let id = 1;
  for (const post of posts) {
    const postData = await extractPostData(post);
    currentPagePosts.push({ ...postData, id });

    if (socketClient)
      socketClient.emit("progress", {
        completed: (pageNumber - 1) * 9 + id,
        total,
      });

    id++;
  }
  return currentPagePosts;
};

router.get("/scrape", async (req, res) => {
  let params = { limit: 45 };
  const socketId = req?.query?.socketId;
  const socketClient = obj?.connectedClients?.get(socketId);
  try {
    for (const key in params) {
      if (req?.query?.[key]) {
        params[key] = +req?.query?.[key];
      }
    }
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromium.path,
      args: ["--no-sandbox"],
    });
    const posts = [];
    let expectedTotal = params?.limit === 45 ? 402 : params?.limit * 9;
    for (
      let pageNumber = 1;
      pageNumber <= Math.min(params?.limit, 45);
      pageNumber++
    ) {
      const currentPagePosts = await scrapeData(
        browser,
        pageNumber,
        socketClient,
        expectedTotal
      );
      posts.push(...currentPagePosts);
    }
    await browser.close();
    res.send({ count: posts?.length, posts });
  } catch (err) {
    res.status(500).send(err?.message);
  }
});

module.exports = router;
