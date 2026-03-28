---
title: "Python装Scrapy的曲折路途"
description: "happy的地方"
publishDate: "2017-02-09T16:00:00.000Z"
categories: ["经验"]
tags: ["σっдっ"]
sourceSite: "old_blog_2"
legacyPath: "blog/python装scrapy的曲折路途/index.html"
legacyUrl: "http://j1nse.xyz/blog/python%E8%A3%85scrapy%E7%9A%84%E6%9B%B2%E6%8A%98%E8%B7%AF%E9%80%94/"
---
<p>Scrapy这个模块比较神奇，感觉像装全家桶一样<img src="http://p1.bqimg.com/567571/bd8288a8e593d786.png" alt="">
而且可能会遇到许多问题，我这里说一下解决方法。</p>

<hr>

<ol>
<li>lxml安装有问题。</li>
</ol>

<blockquote>
<p>(一) 首先安装wheel命令行执行
 <code>pip install wheel</code>
(二) 下载相应版本的lxml后缀为.whl的文件
<a href="https://link.zhihu.com/?target=http%3A//www.lfd.uci.edu/%7Egohlke/pythonlibs/%23lxml">https://link.zhihu.com/?target=http%3A//www.lfd.uci.edu/%7Egohlke/pythonlibs/%23lxml</a>
(三)安装lxml进入lxml下载的根目录，按住shift然后鼠标右键选择在<strong>此处打开命令行窗口</strong>
<code>pip install lxml_文件名.whl</code>
(四)检验安装成功与否任意处打开命令行窗口
<code>python 回车</code>
<code>import lxml</code>
如果没有报错就安装成功了！如果没成功请。。。。。。</p>

<p>作者：杨航锋
链接：<a href="https://www.zhihu.com/question/49470061/answer/116163941">https://www.zhihu.com/question/49470061/answer/116163941</a>
来源：知乎
&gt;著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。</p>
</blockquote>

<p>这点话是我自己的：cp33 意思是 CPython3.3 根据自己的Python版本选择</p>

<p>2.可能需要一个神奇的环境:
<a href="https://www.microsoft.com/en-us/download/details.aspx?id=44266">https://www.microsoft.com/en-us/download/details.aspx?id=44266</a>
Microsoft Visual C++ Compiler for Python 2.7</p>

<p>PS:部分网页可能需要翻那啥，自行解决啦</p>