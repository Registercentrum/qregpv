const express = require('express');
const app = express();
const fs = require('fs');

const port = process.env.DEV_PORT || 3005;
const baseUrl = '';

const codeToNameMap = {
    1867: 'HypOverview',
    1899: 'HypOverTime'
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/devapi/pages/:pageId', function (req, res) {    
    const pageId = req.params.pageId;
    const pageName = codeToNameMap[pageId];
    if(!pageName)
    {
        console.log(`pageId ${pageId} is not defined or implemented..`);
        return res.status(401).end("pagenotfound");
    }
    console.log(` serving widget number ${pageId}, as ${pageName}`);
    fs.readFile(`src/views/${pageName}.html`, 'utf-8', function (err, htmlFile) {
        if (err)
            return res.status(401).end(err);

        fs.readFile(`src/views/${pageName}.js`, 'utf-8', function (err, jsFile) {
            if (err)
                return res.status(401).end(err.message);
            const result = `${htmlFile}<script>${jsFile}</script>`;
            return res.status(200).end(JSON.stringify({
                data: {
                    PageContent: result,
                    PageID: pageId
                }
            }));
        });
    })
});

app.listen(port, function () {
    console.log(`listening on ${port}, for api calls.`);
})