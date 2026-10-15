# LiteMesh 项目主页评审版

本仓库用于展示和评审重新设计的 LiteMesh 项目主页。

- [在线评审页面](https://ljq13505-sudo.github.io/LiteMesh-homepage/)
- [原项目主页](https://ochenglino.github.io/LiteMesh-homepage/)
- [原主页源代码](https://github.com/ochenglino/LiteMesh-homepage)
- [算法仓库](https://github.com/ochenglino/LiteMesh)

页面中的项目作者、所属机构、研究文字、图注、引用占位内容和页脚均沿用原项目主页。本仓库用于主页改版评审，不替代原项目主页。

## 版本管理

- `main` 分支保存最新评审版本，也是 GitHub Pages 的发布分支。
- `review-v1` 标签保存首次上线的评审版本。
- 后续重要版本可依次使用 `review-v2`、`review-v3` 等标签保存。
- 标签用于保留对应版本的源代码；如需同时在线展示历史版本，可再添加独立访问地址。

推送前可运行 `git remote -v` 检查远程仓库：`origin` 指向本评审仓库，`upstream` 指向原主页仓库。

## 本地预览

可直接打开 `index.html`，或在仓库目录运行：

```sh
python -m http.server 8010 --bind 127.0.0.1
```

然后访问 [本地预览页面](http://127.0.0.1:8010/)。

## 素材与设计参考

- [原主页布局及项目素材](https://github.com/ochenglino/LiteMesh-homepage)
- [CWF 学术项目主页参考](https://ruixu.me/html/CWF/index.html)
- [字体与排版参考](https://github.com/eliahuhorwitz/Academic-project-page-template)
- [分区导航参考](https://vision-banana.github.io/)
- 本地使用的 Inter 字体遵循 SIL 开放字体许可证，详见 [字体许可证](fonts/OFL.txt)。

高清图片由提供的项目原始 PDF 导出。Introduction 部分使用原始 MP4 视频，以静音、自动播放、循环播放的方式展示。较长的演示视频未纳入页面，PDF 原件和本地工作说明也未纳入发布内容。
