// lib/sanitize.ts
import sanitizeHtml from 'sanitize-html'

export function sanitize(content?: string) {
  if (!content) return ''
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','figure','figcaption','iframe']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src','alt','title','width','height','loading'],
      a: ['href','name','target','rel'],
      iframe: ['src','width','height','frameborder','allow','allowfullscreen']
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'nofollow noopener noreferrer' }),
      img: sanitizeHtml.simpleTransform('img', { loading: 'lazy' })
    },
    // evita scripts embutidos via data:
    allowedSchemesByTag: { img: ['http','https','data'] }
  })
}
