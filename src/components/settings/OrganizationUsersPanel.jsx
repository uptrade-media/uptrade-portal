/**
 * OrganizationUsersPanel - Manage organization members
 * Displays list of org members with invite/remove capabilities
 */
import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Loader2,
  Crown,
  Shield,
  Briefcase,
  Search,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { toast } from '@/lib/toast'
import { useOrgMembers, useInviteOrgMember, useRemoveOrgMember, useUpdateOrgMemberRole } from '@/lib/hooks'
import { adminApi } from '@/lib/portal-api'

// Role icons and labels
const ROLE_CONFIG = {
  admin: { icon: Crown, label: 'Admin', color: 'text-amber-400' },
  manager: { icon: Shield, label: 'Manager', color: 'text-purple-400' },
  member: { icon: Briefcase, label: 'Member', color: 'text-blue-400' },
}

// Status badges
const STATUS_CONFIG = {
  active: { icon: CheckCircle2, label: 'Active', variant: 'success' },
  pending: { icon: Clock, label: 'Pending', variant: 'warning' },
  inactive: { icon: XCircle, label: 'Inactive', variant: 'secondary' },
}

export default function OrganizationUsersPanel({ 
  organizationId, 
  organizationName,
  canManage = false 
}) {
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // For adding existing users
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [addUserRole, setAddUserRole] = useState('member')
  const [activeTab, setActiveTab] = useState('invite')

  // React Query hooks
  const { data: membersData, isLoading } = useOrgMembers(organizationId)
  const inviteMemberMutation = useInviteOrgMember()
  const removeMemberMutation = useRemoveOrgMember()
  const updateRoleMutation = useUpdateOrgMemberRole()

  const members = membersData?.members || membersData || []
  
  console.log('[OrganizationUsersPanel]', { 
    organizationId, 
    organizationName, 
    membersData, 
    members,
    membersLength: members.length 
  })
  
  const memberUserIds = useMemo(
    () => new Set(members.map(m => m.user_id || m.id)),
    [members]
  )

  // Search for existing users
  useEffect(() => {
    if (!userSearchQuery.trim() || activeTab !== 'existing') {
      setSearchResults([])
      return
    }

    const searchUsers = async () => {
      setIsSearching(true)
      try {
        const response = await adminApi.listUsers({ search: userSearchQuery, limit: 10 })
        const users = response.data?.users || response.data || []
        // Filter out users already in the org
        const filteredUsers = users.filter(u => !memberUserIds.has(u.id))
        setSearchResults(filteredUsers)
      } catch (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [userSearchQuery, memberUserIds, activeTab])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }
    
    setIsSubmitting(true)
    try {
      await inviteMemberMutation.mutateAsync({
        organizationId,
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteDialog(false)
    } catch (error) {
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddExistingUser = async () => {
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.addOrgMember(organizationId, {
        user_id: selectedUser.id,
        role: addUserRole,
      })
      toast.success(`${selectedUser.email} added to organization`)
      setSelectedUser(null)
      setAddUserRole('member')
      setUserSearchQuery('')
      setShowInviteDialog(false)
      // Refetch members
      inviteMemberMutation.reset()
    } catch (error) {
      toast.error(error.message || 'Failed to add user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (member) => {
    try {
      await removeMemberMutation.mutateAsync({
        organizationId,
        userId: member.user_id || member.id,
      })
      toast.success(`${member.name || member.email} removed from organization`)
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }

  const handleRoleChange = async (member, newRole) => {
    try {
      await updateRoleMutation.mutateAsync({
        organizationId,
        userId: member.user_id || member.id,
        role: newRole,
      })
      toast.success(`${member.name || member.email} is now a ${newRole}`)
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const getInitials = (member) => {
    const contact = member.contact || member
    const name = contact.name || contact.full_name || contact.email || ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleMemberClick = (member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  if (isLoading) {
    return (
      <Card className="border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-[var(--glass-border)] bg-[var(--glass-bg)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Organization Members
            </CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? 's' : ''} in {organizationName || 'this organization'}
            </CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No members found</p>
              {canManage && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite your first member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const contact = member.contact || member
                const role = member.role || member.org_role || 'member'
                const status = member.status || member.invite_status || (contact.auth_user_id ? 'active' : 'pending')
                const RoleIcon = ROLE_CONFIG[role]?.icon || Briefcase
                const StatusIcon = STATUS_CONFIG[status]?.icon || CheckCircle2

                return (
                  <div
                    key={member.id || member.user_id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      'bg-[var(--surface-secondary)] border border-transparent',
                      'hover:border-[var(--glass-border)] hover:cursor-pointer transition-colors'
                    )}
                    onClick={() => handleMemberClick(member)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar || contact.avatar_url} />
                        <AvatarFallback className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--text-primary)]">
                          {contact.name || contact.full_name || contact.email}
                        </span>
                        <span className="text-sm text-[var(--text-tertiary)]">
                          {contact.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className={cn('h-4 w-4', ROLE_CONFIG[role]?.color)} />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {ROLE_CONFIG[role]?.label || role}
                        </span>
                      </div>

                      <Badge variant={STATUS_CONFIG[status]?.variant || 'secondary'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[status]?.label || status}
                      </Badge>

                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRoleChange(member, 'admin'); }}>
                              <Crown className="h-4 w-4 mr-2 text-amber-400" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRoleChange(member, 'manager'); }}>
                              <Shield className="h-4 w-4 mr-2 text-purple-400" />
                              Make Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRoleChange(member, 'member'); }}>
                              <Briefcase className="h-4 w-4 mr-2 text-blue-400" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleRemove(member); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Org
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite/Add Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new user or add an existing user to {organizationName || 'your organization'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">
                <Mail className="h-4 w-4 mr-2" />
                Invite New
              </TabsTrigger>
              <TabsTrigger value="existing">
                <UserCheck className="h-4 w-4 mr-2" />
                Add Existing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-400" />
                        Manager
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-400" />
                        Member
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="existing" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="search-user">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-user"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Search Results */}
                {userSearchQuery && (
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={cn(
                              'w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left',
                              selectedUser?.id === user.id && 'bg-muted'
                            )}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {(user.name || user.email || '?').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{user.name || user.email}</div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                            {selectedUser?.id === user.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedUser && (
                <div className="space-y-2">
                  <Label htmlFor="add-role">Role</Label>
                  <Select value={addUserRole} onValueChange={setAddUserRole}>
                    <SelectTrigger id="add-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-400" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-400" />
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-400" />
                          Member
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            {activeTab === 'invite' ? (
              <Button onClick={handleInvite} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            ) : (
              <Button onClick={handleAddExistingUser} disabled={isSubmitting || !selectedUser}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                Add User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Details Dialog */}
      <Dialog open={showMemberDetails} onOpenChange={setShowMemberDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          
          {selectedMember && (() => {
            const contact = selectedMember.contact || selectedMember
            const role = selectedMember.role || selectedMember.org_role || 'member'
            const status = selectedMember.status || selectedMember.invite_status || (contact.auth_user_id ? 'active' : 'pending')
            const RoleIcon = ROLE_CONFIG[role]?.icon || Briefcase
            const StatusIcon = STATUS_CONFIG[status]?.icon || CheckCircle2
            
            return (
              <div className="space-y-6 py-4">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={contact.avatar || contact.avatar_url} />
                    <AvatarFallback className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xl">
                      {getInitials(selectedMember)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {contact.name || contact.full_name || 'No name'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={STATUS_CONFIG[status]?.variant || 'secondary'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[status]?.label || status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[var(--text-tertiary)] text-xs uppercase">Email</Label>
                    <div className="text-[var(--text-primary)]">{contact.email || 'Not provided'}</div>
                  </div>

                  {contact.phone && (
                    <div className="space-y-1">
                      <Label className="text-[var(--text-tertiary)] text-xs uppercase">Phone</Label>
                      <div className="text-[var(--text-primary)]">{contact.phone}</div>
                    </div>
                  )}

                  {contact.company && (
                    <div className="space-y-1">
                      <Label className="text-[var(--text-tertiary)] text-xs uppercase">Company</Label>
                      <div className="text-[var(--text-primary)]">{contact.company}</div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[var(--text-tertiary)] text-xs uppercase">Role</Label>
                    <div className="flex items-center gap-2">
                      <RoleIcon className={cn('h-4 w-4', ROLE_CONFIG[role]?.color)} />
                      <span className="text-[var(--text-primary)]">{ROLE_CONFIG[role]?.label || role}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[var(--text-tertiary)] text-xs uppercase">Access Level</Label>
                    <div className="text-[var(--text-primary)]">
                      {selectedMember.access_level === 'organization' ? 'Organization-wide' : 'Project-specific'}
                    </div>
                  </div>

                  {contact.last_sign_in_at && (
                    <div className="space-y-1">
                      <Label className="text-[var(--text-tertiary)] text-xs uppercase">Last Sign In</Label>
                      <div className="text-[var(--text-primary)]">
                        {new Date(contact.last_sign_in_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[var(--text-tertiary)] text-xs uppercase">Member Since</Label>
                    <div className="text-[var(--text-primary)]">
                      {new Date(selectedMember.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
