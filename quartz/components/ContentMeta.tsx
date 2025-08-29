import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"

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
        let authorText = ""
        
        if (Array.isArray(authorData)) {
          if (authorData.length === 1) {
            authorText = authorData[0]
          } else if (authorData.length === 2) {
            authorText = `${authorData[0]} and ${authorData[1]}`
          } else {
            const lastAuthor = authorData[authorData.length - 1]
            const otherAuthors = authorData.slice(0, -1)
            authorText = `${otherAuthors.join(", ")}, and ${lastAuthor}`
          }
        } else if (typeof authorData === "string") {
          // Handle comma-separated string
          const authors = authorData.split(",").map(a => a.trim())
          if (authors.length === 1) {
            authorText = authors[0]
          } else if (authors.length === 2) {
            authorText = `${authors[0]} and ${authors[1]}`
          } else {
            const lastAuthor = authors[authors.length - 1]
            const otherAuthors = authors.slice(0, -1)
            authorText = `${otherAuthors.join(", ")}, and ${lastAuthor}`
          }
        }
        
        segments.push(<span>by {authorText}</span>)
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
