import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, joinSegments } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
import { FilePath } from "../../util/path"
import AuthorContent from "../../components/pages/AuthorContent"

interface AuthorPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
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

function computeAuthorInfo(
  allFiles: QuartzPluginData[],
  content: ProcessedContent[],
): [Set<string>, Record<string, ProcessedContent>] {
  const authors: Set<string> = new Set(
    allFiles.flatMap((data) => extractAuthors(data)),
  )

  // add base author index
  authors.add("index")

  const authorDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
    [...authors].map((author) => {
      const title =
        author === "index"
          ? "Author Index"
          : `Articles by ${author}`
      return [
        author,
        defaultProcessedContent({
          slug: joinSegments("authors", author) as FullSlug,
          frontmatter: { title, tags: [] },
        }),
      ]
    }),
  )

  // Update with actual content if available
  for (const [tree, file] of content) {
    const slug = file.data.slug!
    if (slug.startsWith("authors/")) {
      const author = slug.substring(8) // Remove "authors/" prefix
      if (authors.has(author)) {
        authorDescriptions[author] = [tree, file]
      }
    }
  }

  return [authors, authorDescriptions]
}

async function processAuthorPage(
  ctx: BuildCtx,
  author: string,
  authorContent: ProcessedContent,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
): Promise<FilePath> {
  const [tree, file] = authorContent
  const slug = joinSegments("authors", author) as FullSlug
  const externalResources = pageResources(slug, resources)
  const componentData: QuartzComponentProps = {
    ctx,
    fileData: file.data,
    externalResources,
    cfg: ctx.cfg.configuration,
    children: [],
    tree,
    allFiles,
  }

  const content = renderPage(ctx.cfg.configuration, slug, componentData, opts, externalResources)
  return write({
    ctx,
    content,
    slug: file.data.slug!,
    ext: ".html",
  })
}

export const AuthorPage: QuartzEmitterPlugin<Partial<AuthorPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: AuthorContent({ sort: userOpts?.sort }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "AuthorPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)
      const [authors, authorDescriptions] = computeAuthorInfo(allFiles, content)

      for (const author of authors) {
        yield processAuthorPage(ctx, author, authorDescriptions[author], allFiles, opts, resources)
      }
    },
  }
}
