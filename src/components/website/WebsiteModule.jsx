/**
 * Website Module - Standalone page-centric content management.
 * Left sidebar: collapsible "Pages" + site-wide sections (Images, Metadata, Schema, Links, Scripts).
 * Content: page detail (tabs) or site-wide view (all managed images/metadata/schema/links/scripts).
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/lib/auth-store'
import { useSeoPages, useProject, useSiteImages, useSiteLinks, useSiteScripts, useSiteSchema, useSiteFaqs } from '@/lib/hooks'
import { ModuleLayout } from '@/components/ModuleLayout'
import { MODULE_ICONS } from '@/lib/module-icons'
import { Button } from '@/components/ui/button'
import { Globe2, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import WebsiteSidebar from '@/components/projects/website/WebsiteSidebar'
import WebsiteModuleView from '@/components/projects/website/WebsiteModuleView'
import SiteImagesPanel from '@/components/projects/site/SiteImagesPanel'
import SitePagesPanel from '@/components/projects/site/SitePagesPanel'
import SiteFAQsPanel from '@/components/projects/site/SiteFAQsPanel'
import SiteSchemaPanel from '@/components/projects/site/SiteSchemaPanel'
import SiteLinksPanel from '@/components/projects/site/SiteLinksPanel'
import SiteScriptsPanel from '@/components/projects/site/SiteScriptsPanel'
import { WEBSITE_SECTIONS } from '@/components/projects/website/WebsiteSidebar'

export default function WebsiteModule() {
  const navigate = useNavigate()
  const { currentProject: authProject } = useAuthStore()
  const projectId = authProject?.id

  const { data: project } = useProject(projectId, { enabled: !!projectId })
  const { data: websitePagesData, isLoading: websitePagesLoading } = useSeoPages(
    projectId,
    { limit: 500 },
    { enabled: !!projectId }
  )
  const { data: siteImages = [] } = useSiteImages(projectId, { enabled: !!projectId })
  const { data: siteLinks = [] } = useSiteLinks(projectId, { enabled: !!projectId })
  const { data: siteScripts = [] } = useSiteScripts(projectId, { enabled: !!projectId })
  const { data: siteSchema = [] } = useSiteSchema(projectId, { enabled: !!projectId })
  const { data: siteFaqs = [] } = useSiteFaqs(projectId, { enabled: !!projectId })
  // Normalize: hook may return { pages: [...] } or { pages: { pages: [...] } } when API wraps in .data
  const rawPages = Array.isArray(websitePagesData?.pages)
    ? websitePagesData.pages
    : Array.isArray(websitePagesData?.pages?.pages)
      ? websitePagesData.pages.pages
      : Array.isArray(websitePagesData)
        ? websitePagesData
        : []
  // Sort by path to match Analytics module "Site Pages" order (path-sorted hierarchy)
  const websitePages = [...rawPages].sort((a, b) => {
    const pathA = a.path || (a.url ? new URL(a.url, 'https://x').pathname : '') || ''
    const pathB = b.path || (b.url ? new URL(b.url, 'https://x').pathname : '') || ''
    return pathA.localeCompare(pathB, undefined, { sensitivity: 'base' })
  })

  const [selectedPage, setSelectedPage] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [activeTab, setActiveTab] = useState('analytics')

  useEffect(() => {
    if (!projectId) setSelectedPage(null)
  }, [projectId])

  useEffect(() => {
    if (websitePages?.length && !selectedPage && !activeSection) setSelectedPage(websitePages[0])
  }, [websitePages, selectedPage, activeSection])

  const displayProject = project ?? authProject

  return (
    <ModuleLayout
      leftSidebar={
        projectId ? (
          <WebsiteSidebar
            projectId={projectId}
            pages={websitePages}
            selectedPage={selectedPage}
            activeSection={activeSection}
            onSelectPage={setSelectedPage}
            onSelectSection={setActiveSection}
            isLoading={websitePagesLoading}
          />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            Select a project to view pages.
          </div>
        )
      }
      leftSidebarTitle="Website"
      defaultLeftSidebarOpen
      ariaLabel="Website module"
    >
      <ModuleLayout.Header
        title="Website"
        icon={MODULE_ICONS.website}
        subtitle="Page-level content: metadata, images, FAQ, schema, and more"
        actions={
          !projectId ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              <FileText className="h-4 w-4 mr-2" />
              Select project
            </Button>
          ) : null
        }
      />
      <ModuleLayout.Content>
        {!projectId ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center max-w-sm">
              <Globe2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-foreground">Select a project</p>
              <p className="text-sm mt-1">
                Choose a project from Projects to manage its website pages, metadata, images, FAQ, and more.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => navigate('/projects')}>
                Go to Projects
              </Button>
            </div>
          </div>
        ) : activeSection ? (
          <ScrollArea className="h-full">
            <div className="p-6">
              {activeSection === WEBSITE_SECTIONS.IMAGES && (
                <SiteImagesPanel project={displayProject} images={siteImages} />
              )}
              {activeSection === WEBSITE_SECTIONS.METADATA && (
                <SitePagesPanel project={displayProject} pages={websitePages} />
              )}
              {activeSection === WEBSITE_SECTIONS.FAQS && (
                <SiteFAQsPanel project={displayProject} faqs={Array.isArray(siteFaqs) ? siteFaqs : (siteFaqs?.faqs ?? [])} />
              )}
              {activeSection === WEBSITE_SECTIONS.SCHEMA && (
                <SiteSchemaPanel project={displayProject} schema={Array.isArray(siteSchema) ? siteSchema : (siteSchema?.schema ?? [])} />
              )}
              {activeSection === WEBSITE_SECTIONS.LINKS && (
                <SiteLinksPanel project={displayProject} links={Array.isArray(siteLinks) ? siteLinks : (siteLinks?.links ?? [])} />
              )}
              {activeSection === WEBSITE_SECTIONS.SCRIPTS && (
                <SiteScriptsPanel project={displayProject} scripts={Array.isArray(siteScripts) ? siteScripts : (siteScripts?.scripts ?? [])} />
              )}
            </div>
          </ScrollArea>
        ) : selectedPage ? (
          <WebsiteModuleView
            projectId={projectId}
            project={displayProject}
            selectedPage={selectedPage}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center max-w-sm">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium text-foreground">Select a page or section</p>
              <p className="text-sm mt-1">
                Expand <strong>Pages</strong> in the sidebar to pick a page, or choose Images, Metadata, FAQs, Schema, Links, or Scripts for a site-wide view.
              </p>
            </div>
          </div>
        )}
      </ModuleLayout.Content>
    </ModuleLayout>
  )
}
