import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/author.scss"

interface AuthorOptions {
  /**
   * Text to display before the author name(s)
   */
  prefix?: string
  /**
   * Whether to display authors only if they exist
   */
  showOnlyIfExists?: boolean
  /**
   * Separator to use between multiple authors
   */
  separator?: string
  /**
   * Whether to use "and" before the last author in a list
   */
  useAndSeparator?: boolean
}

const defaultOptions: AuthorOptions = {
  prefix: "by",
  showOnlyIfExists: true,
  separator: ", ",
  useAndSeparator: true,
}

function coerceToArray(input: string | string[]): string[] | undefined {
  if (input === undefined || input === null) return undefined

  // coerce to array
  if (!Array.isArray(input)) {
    input = input
      .toString()
      .split(",")
      .map((author: string) => author.trim())
  }

  // remove all non-strings
  return input
    .filter((author: unknown) => typeof author === "string" || typeof author === "number")
    .map((author: string | number) => author.toString())
}

function formatAuthorList(authors: string[], separator: string, useAndSeparator: boolean): string {
  if (authors.length === 0) return ""
  if (authors.length === 1) return authors[0]
  if (authors.length === 2) {
    return useAndSeparator ? `${authors[0]} and ${authors[1]}` : authors.join(separator)
  }
  
  if (useAndSeparator) {
    const lastAuthor = authors[authors.length - 1]
    const otherAuthors = authors.slice(0, -1)
    return `${otherAuthors.join(separator)}${separator}and ${lastAuthor}`
  }
  
  return authors.join(separator)
}

export default ((opts?: Partial<AuthorOptions>) => {
  const options: AuthorOptions = { ...defaultOptions, ...opts }

  function Author({ fileData, displayClass }: QuartzComponentProps) {
    const authorData = fileData.frontmatter?.author || fileData.frontmatter?.authors
    const authors = coerceToArray(authorData as string | string[])

    if (!authors || (authors.length === 0 && options.showOnlyIfExists)) {
      return null
    }

    const formattedAuthors = authors && authors.length > 0 
      ? formatAuthorList(authors, options.separator!, options.useAndSeparator!)
      : "Unknown"

    return (
      <div class={classNames(displayClass, "author")}>
        {options.prefix && <span class="author-prefix">{options.prefix} </span>}
        <span class="author-name">{formattedAuthors}</span>
      </div>
    )
  }

  Author.css = style
  return Author
}) satisfies QuartzComponentConstructor
