import useAuthStore from '@/lib/auth-store'
import TenantDashboard from '@/components/TenantDashboard'
import AgencyDashboard from '@/components/dashboard/AgencyDashboard'

const Dashboard = ({ onNavigate }) => {
  const { currentOrg, currentProject } = useAuthStore()

  // Agency org (Uptrade Media): no project/org context = agency home
  const isUptradeMediaOrg =
    currentOrg?.slug === 'uptrade-media' ||
    currentOrg?.domain === 'uptrademedia.com' ||
    currentOrg?.org_type === 'agency'
  const isInTenantContext =
    (!!currentProject && !isUptradeMediaOrg) || (!!currentOrg && !isUptradeMediaOrg)

  if (isInTenantContext) {
    return <TenantDashboard onNavigate={onNavigate} />
  }

  return <AgencyDashboard onNavigate={onNavigate} />
}

export default Dashboard
