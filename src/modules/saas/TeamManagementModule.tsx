"use client";

import { FormEvent, useEffect, useState } from "react";

import RoleGate from "@/components/auth/RoleGate";
import { requestApi } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "inactive";
  joinedAt: string;
}

interface TeamInvite {
  id: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}

function TeamManagementModule() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTeam() {
    setIsLoading(true);

    try {
      const data = await requestApi<{ members: TeamMember[]; invites: TeamInvite[] }>("/api/v1/settings/team");
      setMembers(data.members);
      setInvites(data.invites);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load team data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTeam();
  }, []);

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      const data = await requestApi<{ invite: TeamInvite }>("/api/v1/settings/team", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email: formData.get("email"),
          role: formData.get("role")
        })
      });

      setInvites((current) => [data.invite, ...current]);
      toast.success("Invite sent.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send invite.");
    }
  }

  async function changeRole(memberId: string, role: string) {
    try {
      const data = await requestApi<{ member: TeamMember }>("/api/v1/settings/team", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ memberId, role })
      });

      setMembers((current) => current.map((member) => (member.id === memberId ? data.member : member)));
      toast.success("Role updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update role.");
    }
  }

  async function removeMember(memberId: string) {
    try {
      await requestApi<{ removed: boolean }>(`/api/v1/settings/team?memberId=${encodeURIComponent(memberId)}`, {
        method: "DELETE"
      });

      setMembers((current) => current.filter((member) => member.id !== memberId));
      toast.success("Member removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove member.");
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading team...</p>
      </section>
    );
  }

  return (
    <RoleGate minimumRole="admin">
      <div className="space-y-6">
        <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Team Members</h2>
          <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
            Manage active members, update roles, and remove access when needed.
          </p>

          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <article className="rounded-lg border border-border-light p-4 dark:border-border-dark" key={member.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">{member.name}</h3>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      {member.email} · Joined {new Date(member.joinedAt).toLocaleDateString()} · {member.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border border-border-light px-2 py-1 text-xs dark:border-border-dark dark:bg-background-dark"
                      defaultValue={member.role}
                      onChange={(event) => void changeRole(member.id, event.target.value)}
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    {member.role !== "owner" ? (
                      <button
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                        onClick={() => void removeMember(member.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Invite Team Member</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={sendInvite}>
            <input className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark md:col-span-2" name="email" placeholder="teammate@company.com" required type="email" />
            <select className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark" name="role">
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-3" type="submit">
              Send Invite
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">Pending Invites</h3>
            {invites.map((invite) => (
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark" key={invite.id}>
                {invite.email} · {invite.role} · {invite.status}
              </p>
            ))}
          </div>
        </section>
      </div>
    </RoleGate>
  );
}

export default TeamManagementModule;
