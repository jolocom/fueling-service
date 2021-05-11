export const BaseHtml = (res, content) => {
  res.header('Content-type', 'text/html')
  res.write(
`<html>
<head>
<style>
h1, p {
  color: #444;
}
a {
  color: #942F51;
}
code {
  -webkit-user-select: all;
  user-select: all;
}
div.centered {
  text-align: center;
}

.btn-default {
    color: #333;
    background-color: #fff;
    border-color: #ccc;
}
.btn {
    display: inline-block;
    padding: 6px 12px;
    margin-bottom: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.42857143;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;

    /*border: 1px solid transparent;*/
    border-radius: 0;
}

</style>
<body>
${content}
</body>
</html>
`)
}

const defaultSocialUrls = [
  'https://twitter.com/mnzakisol/status/1288492560558821377'
]
export const TheFaucetIsEmpty = (res, urls = defaultSocialUrls) => BaseHtml(res,
`<div class="centered">
  <h1>😱 The faucet is empty! 😱</h1>
  <p>Please be a champ and go to <a href="https://faucet.rinkeby.io/">the rinkeby faucet</a>

  </p>

  <p>and paste one of these:
    <ul>
      ${urls.map(url => `<li><code>${url}</code></li>`)}
    </ul>
  </p>

  <p> then click
  <span class="btn btn-default dropdown-toggle"> Give me Ether
    <i class="fa fa-caret-down"></i>
  </span> and choose the largest number.
  </p>

  <p>
  then come back to click <a href="/redistribute">here</a>
  </p>
</div>
`)
