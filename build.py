"""
orange-creatives/portal build script
articles/*/meta.json を読んで index.html を生成する
"""
import json, glob, os, sys

sys.stdout.reconfigure(encoding='utf-8')

BLOG_DIR = os.path.dirname(os.path.abspath(__file__))

def load_articles():
    articles = []
    for meta_path in glob.glob(os.path.join(BLOG_DIR, 'articles', '*', 'meta.json')):
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)
        dir_name = os.path.basename(os.path.dirname(meta_path))
        meta['_dir'] = dir_name
        articles.append(meta)
    articles.sort(key=lambda a: a.get('order', 999))
    return articles

def render_card(article):
    tags_html = ''.join(
        f'<span class="card-tag">{t}</span>' for t in article.get('tags', [])
    )
    return f'''    <a class="card" href="articles/{article['_dir']}/">
      <img class="card-image" src="articles/{article['_dir']}/{article['cover']}" alt="{article['title']}">
      <div class="card-body">
        <div class="card-meta">
          {tags_html}
          <span>{article['date']}</span>
        </div>
        <div class="card-title">{article['title']}</div>
        <div class="card-desc">{article['description']}</div>
      </div>
    </a>'''

def build():
    articles = load_articles()
    cards_html = '\n\n'.join(render_card(a) for a in articles)

    html = f'''<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>orange creatives</title>
  <style>
    :root {{
      --bg: #f9f9f7;
      --surface: #fff;
      --text: #1a1a1a;
      --muted: #888;
      --border: #e5e5e5;
      --accent: #e8622a;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }}
    header {{
      padding: 3rem 2rem 2rem;
      max-width: 960px;
      margin: 0 auto;
      border-bottom: 1px solid var(--border);
    }}
    header h1 {{ font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }}
    header p {{ margin-top: 0.4rem; color: var(--muted); font-size: 0.9rem; }}
    main {{ max-width: 960px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }}
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s, transform 0.2s;
    }}
    .card:hover {{ box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }}
    .card-image {{ width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; background: #f0ede8; }}
    .card-body {{ padding: 1.2rem 1.3rem 1.4rem; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }}
    .card-meta {{ font-size: 0.78rem; color: var(--muted); display: flex; gap: 0.8rem; align-items: center; }}
    .card-tag {{ color: var(--accent); font-weight: 600; }}
    .card-title {{ font-size: 1rem; font-weight: 700; line-height: 1.5; }}
    .card-desc {{ font-size: 0.85rem; color: var(--muted); line-height: 1.6; margin-top: auto; padding-top: 0.4rem; }}
    footer {{ text-align: center; padding: 2rem; color: var(--muted); font-size: 0.8rem; border-top: 1px solid var(--border); }}
    @media (prefers-color-scheme: dark) {{
      :root {{ --bg: #1a1a1a; --surface: #222; --text: #d4d4d8; --muted: #666; --border: #333; }}
    }}
  </style>
</head>
<body>

<header>
  <h1>orange creatives</h1>
  <p>apps, music, words, and whatever catches my eye</p>
</header>

<main>
  <div class="grid">

{cards_html}

  </div>
</main>

<footer>
  <p>orange</p>
</footer>

</body>
</html>'''

    out = os.path.join(BLOG_DIR, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Built {len(articles)} cards -> index.html')

if __name__ == '__main__':
    build()
