import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useBulkAddGroupsToUsers, useBulkRemoveUsersFromGroups, useGetAllGroups, useGetAdmins, useGetUsers } from '@/service/api'
import { queryClient } from '@/utils/query-client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Users, UserCheck, UserX, Plus, Minus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GroupOperations() {
  const { t } = useTranslation()
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<number[]>([])
  const [operationType, setOperationType] = useState<'add' | 'remove'>('add')
  const [searchGroups, setSearchGroups] = useState('')
  const [searchUsers, setSearchUsers] = useState('')
  const [searchAdmins, setSearchAdmins] = useState('')

  const { data: groupsData, isLoading: groupsLoading } = useGetAllGroups({})
  const { data: usersData, isLoading: usersLoading } = useGetUsers({})
  const { data: adminsData, isLoading: adminsLoading } = useGetAdmins({})
  
  const bulkAddGroupsMutation = useBulkAddGroupsToUsers()
  const bulkRemoveGroupsMutation = useBulkRemoveUsersFromGroups()
  
  const isLoading = bulkAddGroupsMutation.isPending || bulkRemoveGroupsMutation.isPending

  // Filter data based on search
  const filteredGroups = useMemo(() => {
    if (!groupsData?.groups) return []
    return groupsData.groups.filter(group => 
      group.name.toLowerCase().includes(searchGroups.toLowerCase())
    )
  }, [groupsData?.groups, searchGroups])

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return []
    return usersData.users.filter(user => 
      user.username.toLowerCase().includes(searchUsers.toLowerCase())
    )
  }, [usersData?.users, searchUsers])

  const filteredAdmins = useMemo(() => {
    if (!adminsData) return []
    return adminsData.filter(admin => 
      admin.username.toLowerCase().includes(searchAdmins.toLowerCase())
    )
  }, [adminsData, searchAdmins])

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleAdminToggle = (adminId: number) => {
    setSelectedAdmins(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    )
  }

  const handleSelectAllGroups = () => {
    if (groupsData?.groups) {
      setSelectedGroups(groupsData.groups.map(g => g.id))
    }
  }

  const handleDeselectAllGroups = () => {
    setSelectedGroups([])
  }

  const handleSelectAllUsers = () => {
    if (usersData?.users) {
      setSelectedUsers(usersData.users.map(u => u.id))
    }
  }

  const handleDeselectAllUsers = () => {
    setSelectedUsers([])
  }

  const handleSelectAllAdmins = () => {
    if (adminsData) {
      setSelectedAdmins(adminsData.map(a => a.id || 0))
    }
  }

  const handleDeselectAllAdmins = () => {
    setSelectedAdmins([])
  }

  const handleOperation = async () => {
    if (selectedGroups.length === 0) {
      toast.error(t('error'), {
        description: t('bulk.common.noSelection')
      })
      return
    }

    if (selectedUsers.length === 0 && selectedAdmins.length === 0) {
      toast.error(t('error'), {
        description: t('bulk.common.noSelection')
      })
      return
    }

    try {
      const payload = {
        group_ids: selectedGroups,
        users: selectedUsers.length > 0 ? selectedUsers : undefined,
        admins: selectedAdmins.length > 0 ? selectedAdmins : undefined,
      }

      if (operationType === 'add') {
        await bulkAddGroupsMutation.mutateAsync({ data: payload })
        toast.success(t('success'), {
          description: t('bulk.groups.addSuccess')
        })
      } else {
        await bulkRemoveGroupsMutation.mutateAsync({ data: payload })
        toast.success(t('success'), {
          description: t('bulk.groups.removeSuccess')
        })
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] })
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] })

      // Reset selections
      setSelectedGroups([])
      setSelectedUsers([])
      setSelectedAdmins([])
    } catch (error) {
      toast.error(t('error'), {
        description: operationType === 'add' 
          ? t('bulk.groups.addFailed')
          : t('bulk.groups.removeFailed')
      })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Enhanced Operation Type Selection */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
        <div className="flex-1">
          <div className="flex gap-1 sm:gap-2 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={operationType === 'add' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOperationType('add')}
              className={cn(
                "flex items-center gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3",
                operationType === 'add' && "shadow-sm"
              )}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('bulk.groups.addGroups')}</span>
              <span className="sm:hidden">{t('bulk.groups.addGroups')}</span>
            </Button>
            <Button
              variant={operationType === 'remove' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setOperationType('remove')}
              className={cn(
                "flex items-center gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3",
                operationType === 'remove' && "shadow-sm"
              )}
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('bulk.groups.removeGroups')}</span>
              <span className="sm:hidden">{t('bulk.groups.removeGroups')}</span>
            </Button>
          </div>
        </div>
        
        {/* Summary Badge */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge variant="outline" className="text-xs px-2 py-1">
            <Users className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
            {selectedGroups.length} {t('bulk.common.groups')}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-1">
            <UserCheck className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
            {selectedUsers.length + selectedAdmins.length} {t('bulk.common.targets')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Enhanced Groups Selection */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span>{t('bulk.groups.selectGroups')}</span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllGroups}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  {t('bulk.common.selectAll')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAllGroups}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  {t('bulk.common.deselectAll')}
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedGroups.length} {t('bulk.common.selected')}
              </Badge>
              {groupsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('bulk.common.searchGroups')}
                value={searchGroups}
                onChange={(e) => setSearchGroups(e.target.value)}
                className="ltr:pl-9 rtl:pr-9 h-9 text-sm"
              />
            </div>
            
            <ScrollArea className="h-48 sm:h-56 lg:h-64 ltr:pr-2 rtl:pl-2">
              <div className="space-y-1 sm:space-y-2">
                {filteredGroups.map(group => (
                  <div 
                    key={group.id} 
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50",
                      selectedGroups.includes(group.id) && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => handleGroupToggle(group.id)}
                    />
                    <Label 
                      htmlFor={`group-${group.id}`} 
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {group.name}
                    </Label>
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('bulk.common.noGroupsFound')}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Enhanced Users Selection */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
                <span>{t('bulk.groups.selectUsers')}</span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllUsers}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  {t('bulk.common.selectAll')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAllUsers}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  {t('bulk.common.deselectAll')}
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedUsers.length} {t('bulk.common.selected')}
              </Badge>
              {usersLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('bulk.common.searchUsers')}
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="ltr:pl-9 rtl:pr-9 h-9 text-sm"
              />
            </div>
            
            <ScrollArea className="h-48 sm:h-56 lg:h-64 ltr:pr-2 rtl:pl-2">
              <div className="space-y-1 sm:space-y-2">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50",
                      selectedUsers.includes(user.id) && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label 
                      htmlFor={`user-${user.id}`} 
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {user.username}
                    </Label>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('bulk.common.noUsersFound')}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Enhanced Admins Selection */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/20 lg:col-span-1 xl:col-span-1">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <UserX className="h-4 w-4 text-primary" />
                </div>
                <span>{t('bulk.groups.selectAdmins')}</span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAllAdmins}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  {t('bulk.common.selectAll')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeselectAllAdmins}
                  className="h-7 sm:h-8 px-2 text-xs"
                >
                  {t('bulk.common.deselectAll')}
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedAdmins.length} {t('bulk.common.selected')}
              </Badge>
              {adminsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('bulk.common.searchAdmins')}
                value={searchAdmins}
                onChange={(e) => setSearchAdmins(e.target.value)}
                className="ltr:pl-9 rtl:pr-9 h-9 text-sm"
              />
            </div>
            
            <ScrollArea className="h-48 sm:h-56 lg:h-64 ltr:pr-2 rtl:pl-2">
              <div className="space-y-1 sm:space-y-2">
                {filteredAdmins.map(admin => (
                  <div 
                    key={admin.id} 
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50",
                      selectedAdmins.includes(admin.id || 0) && "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <Checkbox
                      id={`admin-${admin.id}`}
                      checked={selectedAdmins.includes(admin.id || 0)}
                      onCheckedChange={() => handleAdminToggle(admin.id || 0)}
                    />
                    <Label 
                      htmlFor={`admin-${admin.id}`} 
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {admin.username}
                    </Label>
                  </div>
                ))}
                {filteredAdmins.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <UserX className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('bulk.common.noAdminsFound')}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Action Button */}
      <div className="flex justify-center pt-4 sm:pt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              onClick={handleOperation}
              disabled={isLoading || selectedGroups.length === 0 || (selectedUsers.length === 0 && selectedAdmins.length === 0)}
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                  {t('bulk.common.loading')}
                </>
              ) : (
                <>
                  {operationType === 'add' ? <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> : <Minus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />}
                  {t('bulk.common.apply')}
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('bulk.common.confirmAction')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('bulk.common.confirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto">{t('bulk.common.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleOperation}
                className="w-full sm:w-auto"
              >
                {t('bulk.common.apply')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 