// src/components/seo/SEOReportingPage.jsx
// SEO Reporting hub - Generate reports, view history, conversion attribution
// Uses existing SEOClientReport functionality

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Target,
  BarChart3,
  Clock,
  Plus,
  ExternalLink,
  DollarSign,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { useGscOverview, useSeoPages, useSeoOpportunities } from '@/lib/hooks'
import { useSignalAccess } from '@/lib/signal-access'
import SignalIcon from '@/components/ui/SignalIcon'
import { SEOClientReportModal } from './SEOClientReport'
import { cn } from '@/lib/utils'

export default function SEOReportingPage({ projectId }) {
  const { hasAccess: hasSignalAccess } = useSignalAccess()
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data for stats
  const { data: gscOverview } = useGscOverview(projectId, '28d')
  const { data: pagesData } = useSeoPages(projectId, { limit: 50 })
  const { data: opportunitiesData } = useSeoOpportunities(projectId, { status: 'open' })
  
  const pages = pagesData?.pages || []
  const opportunities = opportunitiesData?.opportunities || []
  
  // Calculate metrics
  const totalClicks = gscOverview?.clicks || 0
  const totalImpressions = gscOverview?.impressions || 0
  const avgPosition = gscOverview?.avgPosition || 0
  const avgCtr = gscOverview?.ctr || 0
  
  // Mock data for report history - in real implementation, fetch from API
  const reportHistory = []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">SEO Reporting</h2>
          <p className="text-muted-foreground mt-1">
            Generate client reports and track SEO ROI
          </p>
        </div>
        <Button onClick={() => setReportModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clicks (28d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Target className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgPosition.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Position</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(avgCtr * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">CTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{opportunities.length}</p>
                <p className="text-xs text-muted-foreground">Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Report History
          </TabsTrigger>
          {hasSignalAccess && (
            <TabsTrigger value="attribution" className="gap-2">
              <DollarSign className="h-4 w-4" />
              ROI Attribution
              <Badge variant="outline" className="ml-1 text-[10px]">Signal</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Last 28 days vs previous period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-3xl font-bold">{totalClicks.toLocaleString()}</p>
                  <div className="flex items-center text-emerald-500 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+12% vs prev</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <p className="text-3xl font-bold">{totalImpressions.toLocaleString()}</p>
                  <div className="flex items-center text-emerald-500 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+8% vs prev</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Position</p>
                  <p className="text-3xl font-bold">{avgPosition.toFixed(1)}</p>
                  <div className="flex items-center text-emerald-500 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+2.3 improved</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                  <p className="text-3xl font-bold">{(avgCtr * 100).toFixed(1)}%</p>
                  <div className="flex items-center text-emerald-500 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+0.5% vs prev</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Pages</CardTitle>
              <CardDescription>
                Pages driving the most organic traffic
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pages.length > 0 ? (
                <div className="space-y-3">
                  {pages.slice(0, 5).map((page, idx) => (
                    <div key={page.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{page.title || page.path}</p>
                          <p className="text-sm text-muted-foreground truncate">{page.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{page.clicks?.toLocaleString() || '--'}</p>
                          <p className="text-muted-foreground">clicks</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{page.position?.toFixed(1) || '--'}</p>
                          <p className="text-muted-foreground">position</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No page data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                Previously generated SEO reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportHistory.length > 0 ? (
                <div className="space-y-3">
                  {reportHistory.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{report.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Generated {report.createdAt}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first SEO performance report
                  </p>
                  <Button onClick={() => setReportModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasSignalAccess && (
          <TabsContent value="attribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SignalIcon className="h-5 w-5" />
                  SEO → Conversion Attribution
                </CardTitle>
                <CardDescription>
                  Track which SEO improvements drive actual conversions and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Connect Analytics</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Link your Analytics module to see conversion attribution. 
                    Track which ranking improvements led to form submissions, calls, and sales.
                  </p>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Go to Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Report Modal */}
      <SEOClientReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        projectId={projectId}
      />
    </div>
  )
}
