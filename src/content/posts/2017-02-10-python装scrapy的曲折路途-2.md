---
title: "Python装Scrapy的曲折路途"
description: "Scrapy这个模块比较神奇，感觉像装全家桶一样而且可能会遇到许多问题，我这里说一下解决方法。 lxml安装有问题。 (一) 首先安装wheel命令行执行 pip install wheel(二) 下载相应版本的lxml后缀为.whl的文件https://link.zhihu.com/?target=http%3A//www.lfd.uci.edu/%7Egohlke/pythonlibs"
publishDate: "2017-02-10T15:33:00.000Z"
updatedDate: "2017-02-10T16:01:00.000Z"
categories: ["经验"]
tags: ["Σ(っ°Д°;)っ"]
sourceSite: "old_blog"
legacyPath: "2017/02/10/Scrapy/index.html"
legacyUrl: "https://jinse666.cn/2017/02/10/Scrapy/"
---
<p>Scrapy这个模块比较神奇，感觉像装全家桶一样<img src="http://p1.bqimg.com/567571/bd8288a8e593d786.png" alt=""><br>而且可能会遇到许多问题，我这里说一下解决方法。</p>
<hr>
<ol>
<li>lxml安装有问题。</li>
</ol>
<blockquote>
<p>(一) 首先安装wheel命令行执行<br> <code>pip install wheel</code><br>(二) 下载相应版本的lxml后缀为.whl的文件<br><a href="https://link.zhihu.com/?target=http%3A//www.lfd.uci.edu/%7Egohlke/pythonlibs/%23lxml" target="_blank" rel="external">https://link.zhihu.com/?target=http%3A//www.lfd.uci.edu/%7Egohlke/pythonlibs/%23lxml</a><br>(三)安装lxml进入lxml下载的根目录，按住shift然后鼠标右键选择在<strong>此处打开命令行窗口</strong><br><code>pip install lxml_文件名.whl</code><br>(四)检验安装成功与否任意处打开命令行窗口<br><code>python 回车</code><br><code>import lxml</code><br>如果没有报错就安装成功了！如果没成功请。。。。。。</p>
<p>作者：杨航锋<br>链接：<a href="https://www.zhihu.com/question/49470061/answer/116163941" target="_blank" rel="external">https://www.zhihu.com/question/49470061/answer/116163941</a><br>来源：知乎</p>
<blockquote>
<p>著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。</p>
</blockquote>
</blockquote>
<p>这点话是我自己的：cp33 意思是 CPython3.3 根据自己的Python版本选择</p>
<p>2.可能需要一个神奇的环境:<br><a href="https://www.microsoft.com/en-us/download/details.aspx?id=44266" target="_blank" rel="external">https://www.microsoft.com/en-us/download/details.aspx?id=44266</a><br>Microsoft Visual C++ Compiler for Python 2.7</p>
<p>PS:部分网页可能需要翻那啥，自行解决啦</p>