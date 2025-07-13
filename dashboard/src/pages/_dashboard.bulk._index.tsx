import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Users2, LucideIcon, Layers } from 'lucide-react'

import PageHeader from '@/components/page-header'
import PageTransition from '@/components/PageTransition'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
  url: string
}

const tabs: Tab[] = [
  { 
    id: 'bulk.groups.title', 
    label: 'bulk.groups.title', 
    icon: Users2, 
    url: '/bulk' 
  },
  { 
    id: 'bulk.users.title', 
    label: 'bulk.users.title', 
    icon: Layers, 
    url: '/bulk/users' 
  },
]

/**
 * Bulk Operations Main Page
 * 
 * Provides tabbed navigation for bulk operations including:
 * - Group operations (/bulk)
 * - User operations (/bulk/users)
 * 
 * Uses the same pattern as the nodes page with nested routing.
 */
const BulkOperations = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id)

  useEffect(() => {
    const currentTab = tabs.find(tab => location.pathname === tab.url)
    if (currentTab) {
      setActiveTab(currentTab.id)
    }
  }, [location.pathname])

  const getPageHeaderProps = () => {
    if (location.pathname === '/bulk/users') {
      return {
        title: 'bulk.users.title',
        description: 'bulk.users.description',
        buttonIcon: undefined,
        buttonText: undefined,
        onButtonClick: undefined,
      }
    }
    
    return {
      title: 'bulk.groups.title',
      description: 'bulk.groups.description',
      buttonIcon: undefined,
      buttonText: undefined,
      onButtonClick: undefined,
    }
  }

  return (
    <div className="flex flex-col gap-0 w-full items-start">
      <PageTransition isContentTransition={true}>
        <PageHeader {...getPageHeaderProps()} />
      </PageTransition>
      <div className="w-full">
        {/* Enhanced responsive tab navigation */}
        <div className="flex border-b px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.url)}
              className={`relative flex-shrink-0 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-foreground border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">{t(tab.label)}</span>
              </div>
            </button>
          ))}
        </div>
        {/* Enhanced responsive content area */}
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
          <PageTransition isContentTransition={true}>
            <Outlet />
          </PageTransition>
        </div>
      </div>
    </div>
  )
}

export default BulkOperations 