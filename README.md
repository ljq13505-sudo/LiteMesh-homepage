# LiteMesh 项目主页评审版

本仓库用于展示和评审重新设计的 LiteMesh 项目主页。

- 在线评审页面：https://ljq13505-sudo.github.io/LiteMesh-homepage/
- 原项目主页：https://ochenglino.github.io/LiteMesh-homepage/
- 原主页源代码：https://github.com/ochenglino/LiteMesh-homepage
- 算法仓库：https://github.com/ochenglino/LiteMesh

页面中的项目作者、所属机构、研究文字、图注、引用占位内容和页脚均沿用原项目主页。本仓库用于主页改版评审，不替代原项目主页。

## 版本管理

- `main` 分支保存最新评审版本，也是 GitHub Pages 的发布分支。
- `review-v1` 标签保存首次上线的评审版本。
- `review-v2` 标签保存第二版（2026 年 10 月 18 日）：重新从“网页资料”中的原始 PDF 导出高清图片，并将 720p 循环视频替换为由 4K 原视频制作的网页播放版本。
- 第二版排版修订继续更新 `main`：放大顶部两个校标，统一正文、图片、视频和图注的内容宽度；`review-v2` 保留第二版首次上线的快照。
- 后续重要版本可依次使用 `review-v3`、`review-v4` 等标签保存。
- 标签用于保留对应版本的源代码；如需同时在线展示历史版本，可再添加独立访问地址。

推送前可运行 `git remote -v` 检查远程仓库：`origin` 指向本评审仓库，`upstream` 指向原主页仓库。

## 本地预览

可直接打开 `index.html`，或在仓库目录运行：

```sh
python -m http.server 8010 --bind 127.0.0.1
```

本地预览地址：http://127.0.0.1:8010/

## 素材与设计参考

- 原主页布局及项目素材：https://github.com/ochenglino/LiteMesh-homepage
- CWF 学术项目主页参考：https://ruixu.me/html/CWF/index.html
- 字体与排版参考：https://github.com/eliahuhorwitz/Academic-project-page-template
- 分区导航参考：https://vision-banana.github.io/
- Inter 字体许可证（SIL 开放字体许可证）：https://github.com/ljq13505-sudo/LiteMesh-homepage/blob/main/fonts/OFL.txt

第二版素材来自本地“网页资料”文件夹：

- `teaser.pdf`、`CAD_features.pdf`、`weak_features.pdf` 和 `CWFvsOurs.pdf` 均按原始 PDF 的裁剪区域重新导出为宽 5760 像素的 PNG，保留原图内容与标注。
- Introduction 使用 `Teaser-Video.mp4` 制作的 3840×2160、30 fps、H.264 网页播放版本，保留约 66 秒的完整内容，以静音、自动播放、循环播放的方式展示，并优化为可边加载边播放。
- 图片和视频链接带有第二版缓存标记，避免浏览器继续使用旧素材。
- 4 分 20 秒的 `Method-Video.mp4` 未纳入页面。PDF 原件和本地工作说明也未纳入发布内容。

原始 PDF 与第一版所用原件一致；第二版提高导出像素，原始素材自身的细节上限保持不变。无对应新原件的相关方法对比图沿用第一版。
