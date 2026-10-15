# LiteMesh homepage review

Online review copy of the redesigned LiteMesh project homepage.

- Review website: https://ljq13505-sudo.github.io/LiteMesh-homepage/
- Original project website: https://ochenglino.github.io/LiteMesh-homepage/
- Original homepage source: https://github.com/ochenglino/LiteMesh-homepage
- Algorithm repository: https://github.com/ochenglino/LiteMesh

This repository is used to review the homepage redesign. Project authors,
affiliations, research text, captions, citation placeholder, and footer follow
the original project website. It does not replace the original project website.

## Review versions

- `main` contains the latest review version and is the GitHub Pages publishing branch.
- `review-v1` marks the first published review version.
- Future review milestones can be saved as `review-v2`, `review-v3`, and so on.
- Tags preserve source history; separate online URLs for older versions can be added when needed.

Check `git remote -v` before pushing: `origin` is this review repository and
`upstream` is the original homepage repository.

## Local preview

Open `index.html` directly, or run the following in the repository directory:

```sh
python -m http.server 8010 --bind 127.0.0.1
```

Then open http://127.0.0.1:8010/ .

## Assets and design references

- Original homepage layout and project assets: https://github.com/ochenglino/LiteMesh-homepage
- CWF academic-page reference: https://ruixu.me/html/CWF/index.html
- Typography reference: https://github.com/eliahuhorwitz/Academic-project-page-template
- Section-navigation reference: https://vision-banana.github.io/
- Local Inter fonts are distributed under the SIL Open Font License; see `fonts/OFL.txt`.

High-resolution figures are exported from the supplied original project PDFs.
The introduction uses the original muted, autoplaying, looping MP4. The longer
presentation video is not included. PDF source copies and local working notes
are excluded from publication.
