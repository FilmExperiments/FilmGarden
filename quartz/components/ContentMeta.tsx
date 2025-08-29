import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"
import { FullSlug, resolveRelative } from "../util/path"

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  // Merge options with defaults
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []

      if (fileData.dates) {
        segments.push(<Date date={getDate(cfg, fileData)!} locale={cfg.locale} />)
      }

      // Display author if available in frontmatter
      if (fileData.frontmatter?.author || fileData.frontmatter?.authors) {
        const authorData = fileData.frontmatter?.author || fileData.frontmatter?.authors
        let authors: string[] = []
        
        if (Array.isArray(authorData)) {
          authors = authorData.map(a => a.toString().trim())
        } else if (typeof authorData === "string") {
          // Handle comma-separated string
          authors = authorData.split(",").map(a => a.trim())
        }
        
        // Create clickable author links
        const authorLinks = authors.map((author, index) => {
          const linkDest = resolveRelative(fileData.slug!, `authors/${author}` as FullSlug)
          return (
            <a href={linkDest} class="internal author-link" key={index}>
              {author}
            </a>
          )
        })
        
        // Format the author links with proper separators
        let formattedAuthors: (string | JSX.Element)[] = []
        if (authorLinks.length === 1) {
          formattedAuthors = [authorLinks[0]]
        } else if (authorLinks.length === 2) {
          formattedAuthors = [authorLinks[0], " and ", authorLinks[1]]
        } else if (authorLinks.length > 2) {
          for (let i = 0; i < authorLinks.length; i++) {
            if (i === 0) {
              formattedAuthors.push(authorLinks[i])
            } else if (i === authorLinks.length - 1) {
              formattedAuthors.push(", and ", authorLinks[i])
            } else {
              formattedAuthors.push(", ", authorLinks[i])
            }
          }
        }
        
        segments.push(<span>by {formattedAuthors}</span>)
      }

      // Display reading time if enabled
      if (options.showReadingTime) {
        const { minutes, words: _words } = readingTime(text)
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes),
        })
        segments.push(<span>{displayedTime}</span>)
      }

      return (
        <p show-comma={options.showComma} class={classNames(displayClass, "content-meta")}>
          {segments}
        </p>
      )
    } else {
      return null
    }
  }

  ContentMetadata.css = style

  return ContentMetadata
}) satisfies QuartzComponentConstructor
