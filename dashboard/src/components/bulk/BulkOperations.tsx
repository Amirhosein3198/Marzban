import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { Users2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import useDirDetection from '@/hooks/use-dir-detection'

// Lazy load GroupOperations component
const GroupOperations = lazy(() => import('./GroupOperations'))

// Loading skeleton component
const OperationsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

export default function BulkOperations() {
  const { t } = useTranslation()
  const dir = useDirDetection()
  const isRTL = dir === 'rtl'

  return (
    <div className="flex-1 w-full space-y-6 pt-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <CardTitle className="text-xl">{t('bulk.groups.title')}</CardTitle>
              <CardDescription className="text-sm">{t('bulk.groups.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OperationsSkeleton />}>
            <GroupOperations />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
} 