'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getOrgMembers,
  removeOrgMember,
  changeOrgMemberRole,
  type OrgMember,
  type OrgRole,
} from '@/lib/actions/organization';
import { inviteOrgMember, getPendingInvitations, cancelInvitation, type Invitation } from '@/lib/actions/invitation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/components/providers/AuthProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-green-100 text-green-700 border-green-200',
  viewer: 'bg-gray-100 text-gray-600 border-gray-200',
};

function getInitials(name: string | null, email: string): string {
  const src = name?.trim() || email;
  const parts = src.split(/[\s@]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// InviteMemberDialog
// ---------------------------------------------------------------------------

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callerRole: OrgRole;
  onInvited: () => void;
}

const INVITABLE_ROLES: OrgRole[] = ['admin', 'member', 'viewer'];

function InviteMemberDialog({ open, onOpenChange, callerRole, onInvited }: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  // Admins cannot invite admins
  const availableRoles = callerRole === 'owner'
    ? INVITABLE_ROLES
    : INVITABLE_ROLES.filter(r => r !== 'admin');

  function reset() {
    setEmail('');
    setRole('member');
    setError('');
    setSuccess('');
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    startTransition(async () => {
      const { error } = await inviteOrgMember(email.trim(), role);
      if (error) {
        setError(error);
        return;
      }
      setSuccess(`Invitation sent to ${email.trim()}`);
      setEmail('');
      onInvited();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email address</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <Select value={role} onValueChange={v => setRole(v as OrgRole)} disabled={isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(r => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !email.trim()}>
              {isPending ? 'Sending…' : 'Send invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// RemoveConfirmDialog
// ---------------------------------------------------------------------------

interface RemoveDialogProps {
  member: OrgMember | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function RemoveConfirmDialog({ member, onConfirm, onCancel, isPending }: RemoveDialogProps) {
  return (
    <Dialog open={!!member} onOpenChange={open => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mt-1">
          Are you sure you want to remove{' '}
          <strong>{member?.full_name || member?.email}</strong> from the organization?
          They will lose access immediately.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Removing…' : 'Remove member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MembersTab
// ---------------------------------------------------------------------------

interface MembersTabProps {
  callerRole: OrgRole;
}

export function MembersTab({ callerRole }: MembersTabProps) {
  const { user } = useAuthContext();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = callerRole === 'owner' || callerRole === 'admin';
  const isOwner = callerRole === 'owner';

  async function loadData() {
    setLoading(true);
    setError(null);
    const [membersRes, invitesRes] = await Promise.all([
      getOrgMembers(),
      isAdmin ? getPendingInvitations() : Promise.resolve({ invitations: [], error: null }),
    ]);
    if (membersRes.error) setError(membersRes.error);
    else setMembers(membersRes.members);
    if (!invitesRes.error) setPendingInvitations(invitesRes.invitations);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRemoveConfirm() {
    if (!removingMember) return;
    const target = removingMember;
    setActionError(null);
    startTransition(async () => {
      const { error } = await removeOrgMember(target.user_id);
      if (error) {
        setActionError(error);
        setRemovingMember(null);
        return;
      }
      setRemovingMember(null);
      await loadData();
    });
  }

  function handleRoleChange(member: OrgMember, newRole: OrgRole) {
    setActionError(null);
    startTransition(async () => {
      const { error } = await changeOrgMemberRole(member.user_id, newRole);
      if (error) { setActionError(error); return; }
      await loadData();
    });
  }

  function handleCancelInvite(invitationId: string) {
    startTransition(async () => {
      await cancelInvitation(invitationId);
      await loadData();
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        Loading members…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Team members</h2>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)} size="sm">
            Invite member
          </Button>
        )}
      </div>

      {actionError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}

      {/* Member list */}
      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {members.map(member => {
          const isSelf = member.user_id === user?.id;
          const isTargetOwner = member.role === 'owner';
          const canRemove = isAdmin && !isSelf && !isTargetOwner;
          const canChangeRole = isOwner && !isSelf && !isTargetOwner;

          return (
            <div key={member.user_id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={member.avatar_url ?? undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  {getInitials(member.full_name, member.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {member.full_name || member.email}
                  </span>
                  {isSelf && (
                    <span className="text-xs text-gray-400">(you)</span>
                  )}
                </div>
                {member.full_name && (
                  <span className="text-xs text-gray-500 truncate block">{member.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400 hidden sm:block">
                  Joined {formatDate(member.joined_at)}
                </span>
                {canChangeRole ? (
                  <Select
                    value={member.role}
                    onValueChange={v => handleRoleChange(member, v as OrgRole)}
                    disabled={isPending}
                  >
                    <SelectTrigger className={`h-7 text-xs font-medium border px-2.5 py-0.5 rounded-full w-auto min-w-[80px] ${ROLE_COLORS[member.role as OrgRole]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['admin', 'member', 'viewer'] as OrgRole[]).map(r => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${ROLE_COLORS[member.role as OrgRole]}`}
                  >
                    {ROLE_LABELS[member.role as OrgRole]}
                  </Badge>
                )}
                {canRemove && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => setRemovingMember(member)}
                      >
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending invitations */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Pending invitations ({pendingInvitations.length})
          </h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {pendingInvitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="bg-gray-100 text-gray-500 text-xs font-semibold">
                    {inv.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700 truncate block">{inv.email}</span>
                  <span className="text-xs text-gray-400">
                    Expires {formatDate(inv.expires_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${ROLE_COLORS[inv.role as OrgRole]}`}
                  >
                    {ROLE_LABELS[inv.role as OrgRole]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-400 hover:text-red-600"
                    onClick={() => handleCancelInvite(inv.id)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        callerRole={callerRole}
        onInvited={loadData}
      />
      <RemoveConfirmDialog
        member={removingMember}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemovingMember(null)}
        isPending={isPending}
      />
    </div>
  );
}
