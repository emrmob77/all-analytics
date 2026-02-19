import { ApiError } from "@/lib/api/errors";
import { createApiHandler } from "@/lib/api/handler";
import { ensureObjectRecord, readBodyEnum, readBodyString, readStringParam } from "@/lib/api/validation";
import {
  getDefaultTenantId,
  inviteTeamMember,
  listTeamInvites,
  listTeamMembers,
  removeTeamMember,
  updateTeamMemberRole
} from "@/lib/saas/store";

const roles = ["owner", "admin", "member", "viewer"] as const;

export const GET = createApiHandler(async (request) => {
  const url = new URL(request.url);
  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();

  return {
    data: {
      members: listTeamMembers(tenantId),
      invites: listTeamInvites(tenantId)
    }
  };
});

export const POST = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const tenantId = readBodyString(body, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();
  const email = readBodyString(body, "email", { required: true, maxLength: 255 }) ?? "";
  const role = readBodyEnum(body, "role", roles) ?? "member";

  const invite = inviteTeamMember({
    tenantId,
    email,
    role
  });

  return {
    data: {
      invite
    },
    status: 201
  };
}, {
  audit: {
    action: "settings.team.invite"
  }
});

export const PUT = createApiHandler(async (_request, context) => {
  const body = ensureObjectRecord(await context.readJson());

  const tenantId = readBodyString(body, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();
  const memberId = readBodyString(body, "memberId", { required: true, maxLength: 255 }) ?? "";
  const role = readBodyEnum(body, "role", roles, { required: true }) ?? "member";

  const member = updateTeamMemberRole({
    tenantId,
    memberId,
    role
  });

  if (!member) {
    throw new ApiError({
      status: 404,
      code: "TEAM_MEMBER_NOT_FOUND",
      message: "Team member could not be found.",
      expose: true
    });
  }

  return {
    data: {
      member
    }
  };
}, {
  audit: {
    action: "settings.team.role_update"
  }
});

export const DELETE = createApiHandler(async (request) => {
  const url = new URL(request.url);

  const tenantId = readStringParam(url.searchParams, "tenantId", { maxLength: 120 }) ?? getDefaultTenantId();
  const memberId = readStringParam(url.searchParams, "memberId", { required: true, maxLength: 255 }) ?? "";

  const removed = removeTeamMember({ tenantId, memberId });

  if (!removed) {
    throw new ApiError({
      status: 404,
      code: "TEAM_MEMBER_NOT_FOUND",
      message: "Team member could not be found.",
      expose: true
    });
  }

  return {
    data: {
      removed: true
    }
  };
}, {
  audit: {
    action: "settings.team.remove"
  }
});
