import { Fragment, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { BRAND } from '../config'
import { POSTS, postFor } from '../data/blog'
import Label from './ui/Label'
import { ArrowUpRight } from './ui/Icons'
import './Blog.css'

export function BlogList() {
  return (
    <section className="blog section" data-tone="light">
      <div className="container">
        <header className="blog__head">
          <Label index="01">Blog</Label>
          <h2 className="title" data-reveal="lines">
            Notes from
            <br /> the <em>rooftop.</em>
          </h2>
          <p className="lede" data-reveal="up">
            News and ideas from the world of solar energy.
          </p>
        </header>
        <ul className="blog__list">
          {POSTS.map((p) => (
            <li key={p.slug} data-reveal="up">
              <a href={`/blog/${p.slug}`} className="post-card">
                <div className="post-card__media">
                  <img src={p.img} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="post-card__body">
                  <p className="mono post-card__meta">
                    {p.date} · {p.tag}
                  </p>
                  <h3 className="post-card__title">{p.title}</h3>
                  <p className="post-card__excerpt">{p.excerpt}</p>
                  <span className="mono post-card__more">
                    Read article <ArrowUpRight />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function BlogPost() {
  const { slug } = useParams()
  const post = postFor(slug)

  useEffect(() => {
    if (post) document.title = `${post.title} — ${BRAND.legalName}`
  }, [post])

  if (!post) return <Navigate to="/blog" replace />
  const others = POSTS.filter((p) => p.slug !== slug)

  return (
    <article className="article section" data-tone="light">
      <div className="container article__inner">
        <a href="/blog" className="mono article__back">
          ← All articles
        </a>
        <p className="mono article__meta">
          {post.date} · {post.tag}
        </p>
        <h1 className="article__title" data-reveal="lines">
          {post.title}
        </h1>
        <div className="article__hero" data-reveal="up">
          <img src={post.img} alt="" decoding="async" />
        </div>
        <div className="article__body">
          {post.body.map((b, i) => (
            <Fragment key={i}>
              {b.p && <p>{b.p}</p>}
              {b.h && <h2>{b.h}</h2>}
              {b.img && <img src={b.img} alt="" loading="lazy" decoding="async" />}
              {b.quote && (
                <blockquote>
                  <p>“{b.quote}”</p>
                  <cite>— {b.by}</cite>
                </blockquote>
              )}
            </Fragment>
          ))}
        </div>
        {others.length > 0 && (
          <aside className="article__next">
            <p className="mono">Read next</p>
            {others.map((o) => (
              <a key={o.slug} href={`/blog/${o.slug}`} className="article__next-link">
                <span>{o.title}</span>
                <ArrowUpRight />
              </a>
            ))}
          </aside>
        )}
      </div>
    </article>
  )
}
