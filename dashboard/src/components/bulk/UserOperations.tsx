import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useBulkModifyUsersExpire, useBulkModifyUsersDatalimit, useBulkModifyUsersProxySettings, useGetUsers, useGetAdmins, useGetAllGroups } from '@/service/api'
import { queryClient } from '@/utils/query-client'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, Database, Settings, UserCheck, UserX, Loader2, Calendar, HardDrive, Shield, Plus, Minus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function UserOperations() {
  const { t } = useTranslation()
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedAdmins, setSelectedAdmins] = useState<number[]>([])
  const [operationType, setOperationType] = useState<'expire' | 'dataLimit' | 'proxySettings'>('expire')
  const [searchUsers, setSearchUsers] = useState('')
  const [searchAdmins, setSearchAdmins] = useState('')
  
  // Expire operation state
  const [expireAmount, setExpireAmount] = useState('')
  const [expireOperation, setExpireOperation] = useState<'add' | 'subtract'>('add')
  
  // Data limit operation state
  const [dataLimitAmount, setDataLimitAmount] = useState('')
  const [dataLimitOperation, setDataLimitOperation] = useState<'add' | 'subtract'>('add')
  
  // Proxy settings operation state
  const [proxyFlow, setProxyFlow] = useState('')
  const [proxyMethod, setProxyMethod] = useState('')
  const [proxyGroupIds, setProxyGroupIds] = useState<number[]>([])

  const { data: usersData, isLoading: usersLoading } = useGetUsers({})
  const { data: adminsData, isLoading: adminsLoading } = useGetAdmins({})
  const { data: groupsData, isLoading: groupsLoading } = useGetAllGroups({})
  
  const bulkExpireMutation = useBulkModifyUsersExpire()
  const bulkDataLimitMutation = useBulkModifyUsersDatalimit()
  const bulkProxySettingsMutation = useBulkModifyUsersProxySettings()
  
  const isLoading = bulkExpireMutation.isPending || bulkDataLimitMutation.isPending || bulkProxySettingsMutation.isPending

  // Filter data based on search
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

  const handleGroupToggle = (groupId: number) => {
    setProxyGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleOperation = async () => {
    if (selectedUsers.length === 0 && selectedAdmins.length === 0) {
      toast.error(t('error'), {
        description: t('bulk.common.noSelection')
      })
      return
    }

    try {
      const basePayload = {
        users: selectedUsers.length > 0 ? selectedUsers : undefined,
        admins: selectedAdmins.length > 0 ? selectedAdmins : undefined,
      }

      if (operationType === 'expire') {
        if (!expireAmount || isNaN(Number(expireAmount)) || Number(expireAmount) <= 0) {
          toast.error(t('error'), {
            description: t('validation.required', { field: t('bulk.users.expire.amount') })
          })
          return
        }

        const amount = expireOperation === 'add' ? Number(expireAmount) : -Number(expireAmount)
        await bulkExpireMutation.mutateAsync({ 
          data: { ...basePayload, amount } 
        })
        toast.success(t('success'), {
          description: t('bulk.users.expire.success')
        })
      } else if (operationType === 'dataLimit') {
        if (!dataLimitAmount || isNaN(Number(dataLimitAmount)) || Number(dataLimitAmount) <= 0) {
          toast.error(t('error'), {
            description: t('validation.required', { field: t('bulk.users.dataLimit.amount') })
          })
          return
        }

        const amount = dataLimitOperation === 'add' ? Number(dataLimitAmount) : -Number(dataLimitAmount)
        await bulkDataLimitMutation.mutateAsync({ 
          data: { ...basePayload, amount } 
        })
        toast.success(t('success'), {
          description: t('bulk.users.dataLimit.success')
        })
      } else if (operationType === 'proxySettings') {
        const proxyPayload: any = { ...basePayload }
        
        if (proxyFlow) proxyPayload.flow = proxyFlow
        if (proxyMethod) proxyPayload.method = proxyMethod
        if (proxyGroupIds.length > 0) proxyPayload.group_ids = proxyGroupIds

        await bulkProxySettingsMutation.mutateAsync({ 
          data: proxyPayload 
        })
        toast.success(t('success'), {
          description: t('bulk.users.proxySettings.success')
        })
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] })

      // Reset selections
      setSelectedUsers([])
      setSelectedAdmins([])
      setExpireAmount('')
      setDataLimitAmount('')
      setProxyFlow('')
      setProxyMethod('')
      setProxyGroupIds([])
    } catch (error) {
      toast.error(t('error'), {
        description: t(`bulk.users.${operationType}.failed`)
      })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Enhanced Operation Tabs */}
      <Tabs value={operationType} onValueChange={(value) => setOperationType(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-muted/50">
          <TabsTrigger value="expire" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('bulk.users.expire.title')}</span>
            <span className="sm:hidden">{t('bulk.users.expire.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="dataLimit" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3">
            <Database className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('bulk.users.dataLimit.title')}</span>
            <span className="sm:hidden">{t('bulk.users.dataLimit.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="proxySettings" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('bulk.users.proxySettings.title')}</span>
            <span className="sm:hidden">{t('bulk.users.proxySettings.title')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expire" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">{t('bulk.users.expire.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('bulk.users.expire.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('bulk.users.expire.amount')}
                  </Label>
                  <Input
                    type="number"
                    placeholder={t('bulk.users.expire.amountPlaceholder')}
                    value={expireAmount}
                    onChange={(e) => setExpireAmount(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm font-medium">{t('bulk.common.operation')}</Label>
                  <Select value={expireOperation} onValueChange={(value) => setExpireOperation(value as any)}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t('bulk.users.expire.addTime')}
                      </SelectItem>
                      <SelectItem value="subtract" className="flex items-center gap-2">
                        <Minus className="h-4 w-4" />
                        {t('bulk.users.expire.subtractTime')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dataLimit" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">{t('bulk.users.dataLimit.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('bulk.users.dataLimit.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {t('bulk.users.dataLimit.amount')}
                  </Label>
                  <Input
                    type="number"
                    placeholder={t('bulk.users.dataLimit.amountPlaceholder')}
                    value={dataLimitAmount}
                    onChange={(e) => setDataLimitAmount(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm font-medium">{t('bulk.common.operation')}</Label>
                  <Select value={dataLimitOperation} onValueChange={(value) => setDataLimitOperation(value as any)}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t('bulk.users.dataLimit.addData')}
                      </SelectItem>
                      <SelectItem value="subtract" className="flex items-center gap-2">
                        <Minus className="h-4 w-4" />
                        {t('bulk.users.dataLimit.subtractData')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proxySettings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">{t('bulk.users.proxySettings.title')}</CardTitle>
                  <CardDescription className="text-sm">{t('bulk.users.proxySettings.description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t('bulk.users.proxySettings.flow')}
                  </Label>
                  <Select value={proxyFlow} onValueChange={setProxyFlow}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder={t('bulk.common.selectFlow')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xtls-rprx-vision">xtls-rprx-vision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('bulk.users.proxySettings.method')}
                  </Label>
                  <Select value={proxyMethod} onValueChange={setProxyMethod}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder={t('bulk.common.selectMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aes-128-gcm">aes-128-gcm</SelectItem>
                      <SelectItem value="aes-256-gcm">aes-256-gcm</SelectItem>
                      <SelectItem value="chacha20-ietf-poly1305">chacha20-ietf-poly1305</SelectItem>
                      <SelectItem value="xchacha20-poly1305">xchacha20-poly1305</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('bulk.users.proxySettings.groupIds')}
                </Label>
                <ScrollArea className="h-24 sm:h-32 border rounded-lg p-2 sm:p-3 bg-background/50">
                  <div className="space-y-1 sm:space-y-2">
                    {groupsData?.groups.map(group => (
                      <div 
                        key={group.id} 
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50",
                          proxyGroupIds.includes(group.id) && "bg-primary/10 border border-primary/20"
                        )}
                      >
                        <Checkbox
                          id={`proxy-group-${group.id}`}
                          checked={proxyGroupIds.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <Label 
                          htmlFor={`proxy-group-${group.id}`} 
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {group.name}
                        </Label>
                      </div>
                    ))}
                    {(!groupsData?.groups || groupsData.groups.length === 0) && (
                      <div className="text-center py-4 sm:py-6 text-muted-foreground">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 opacity-50" />
                        <p className="text-xs sm:text-sm">{t('bulk.common.noGroupsFound')}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced User Selection Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Users Selection */}
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

        {/* Admins Selection */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-background to-muted/20">
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
              disabled={isLoading || (selectedUsers.length === 0 && selectedAdmins.length === 0)}
              className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                  {t('bulk.common.loading')}
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
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