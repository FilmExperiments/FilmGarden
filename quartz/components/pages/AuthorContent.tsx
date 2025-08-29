import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import style from "../styles/listPage.scss"
import { PageList, SortFn } from "../PageList"
import { FullSlug, resolveRelative, simplifySlug } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { ComponentChildren } from "preact"

interface AuthorContentOptions {
  sort?: SortFn
  numPages: number
}

const defaultOptions: AuthorContentOptions = {
  numPages: 10,
}

// Helper function to extract authors from frontmatter
function extractAuthors(data: QuartzPluginData): string[] {
  const authors: string[] = []
  
  if (data.frontmatter?.author) {
    if (Array.isArray(data.frontmatter.author)) {
      authors.push(...data.frontmatter.author.map(a => a.toString().trim()))
    } else {
      // Handle comma-separated string
      const authorString = data.frontmatter.author.toString()
      authors.push(...authorString.split(",").map(a => a.trim()))
    }
  }
  
  if (data.frontmatter?.authors) {
    if (Array.isArray(data.frontmatter.authors)) {
      authors.push(...data.frontmatter.authors.map(a => a.toString().trim()))
    } else {
      // Handle comma-separated string
      const authorsString = data.frontmatter.authors.toString()
      authors.push(...authorsString.split(",").map(a => a.trim()))
    }
  }
  
  return [...new Set(authors)] // Remove duplicates
}

export default ((opts?: Partial<AuthorContentOptions>) => {
  const options: AuthorContentOptions = { ...defaultOptions, ...opts }

  const AuthorContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props
    const slug = fileData.slug

    if (!(slug?.startsWith("authors/") || slug === "authors")) {
      throw new Error(`Component "AuthorContent" tried to render a non-author page: ${slug}`)
    }

    const author = simplifySlug(slug.slice("authors/".length) as FullSlug)
    const allPagesWithAuthor = (author: string) =>
      allFiles.filter((file) => extractAuthors(file).includes(author))

    const content = (
      (tree as Root).children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath!, tree)
    ) as ComponentChildren
    const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
    const classes = cssClasses.join(" ")
    
    if (author === "/") {
      const authors = [
        ...new Set(allFiles.flatMap((data) => extractAuthors(data))),
      ].sort((a, b) => a.localeCompare(b))
      return (
        <div class={`popover-hint ${classes}`}>
          <article>
            <p>{content}</p>
          </article>
          <div class="page-listing">
            <p>
              Found {authors.length} author{authors.length === 1 ? "" : "s"}.
            </p>
            <div>
              {authors.map((authorName) => {
                const linkDest = resolveRelative(slug, `../authors/${authorName}` as FullSlug)
                const numPages = allPagesWithAuthor(authorName).length
                return (
                  <div>
                    <a class="internal author-link" href={linkDest}>
                      {authorName}
                    </a>
                    <p>
                      {numPages} page{numPages === 1 ? "" : "s"}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    } else {
      const pages = allPagesWithAuthor(author)
      const listProps = {
        ...props,
        allFiles: pages,
      }

      const contentPage = allFiles.find((file) => file.slug === `authors/${author}`)
      if (contentPage) {
        const content = htmlToJsx(contentPage.filePath!, tree)
        return (
          <div class={`popover-hint ${classes}`}>
            <article>{content}</article>
            <div class="page-listing">
              <p>
                {pages.length === 0 ? (
                  "No pages found with this author."
                ) : (
                  <>
                    Showing {pages.length} page{pages.length === 1 ? "" : "s"} authored by{" "}
                    <em>{author}</em>.
                  </>
                )}
              </p>
              <PageList limit={options.numPages} sort={options.sort} {...listProps} />
            </div>
          </div>
        )
      } else {
        return (
          <div class={`popover-hint ${classes}`}>
            <article>
              <p>{content}</p>
            </article>
            <div class="page-listing">
              <p>
                {pages.length === 0 ? (
                  "No pages found with this author."
                ) : (
                  <>
                    Showing {pages.length} page{pages.length === 1 ? "" : "s"} authored by{" "}
                    <em>{author}</em>.
                  </>
                )}
              </p>
              <PageList limit={options.numPages} sort={options.sort} {...listProps} />
            </div>
          </div>
        )
      }
    }
  }

  AuthorContent.css = style + PageList.css
  return AuthorContent
}) satisfies QuartzComponentConstructor
