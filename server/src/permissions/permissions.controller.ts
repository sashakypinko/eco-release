import { Controller, Get, Query } from '@nestjs/common';

const permissionRegistry = [
  {
    key: "release:view",
    label: "View Releases",
    description: "Can view releases and release details",
    domain: "Release",
    scope: "releaseManager",
  },
  {
    key: "release:create",
    label: "Create Release",
    description: "Can create new releases",
    domain: "Release",
    scope: "releaseManager",
  },
  {
    key: "release:edit",
    label: "Edit Release",
    description: "Can edit existing releases",
    domain: "Release",
    scope: "releaseManager",
  },
  {
    key: "release:delete",
    label: "Delete Release",
    description: "Can delete releases",
    domain: "Release",
    scope: "releaseManager",
  },
  {
    key: "history:view",
    label: "View Release History",
    description: "Can view release history entries",
    domain: "History",
    scope: "releaseManager",
  },
  {
    key: "history:create",
    label: "Create Release History",
    description: "Can create release history entries",
    domain: "History",
    scope: "releaseManager",
  },
  {
    key: "history:edit",
    label: "Edit Release History",
    description: "Can edit release history entries",
    domain: "History",
    scope: "releaseManager",
  },
  {
    key: "history:delete",
    label: "Delete Release History",
    description: "Can delete release history entries",
    domain: "History",
    scope: "releaseManager",
  },
  {
    key: "template:view",
    label: "View Templates",
    description: "Can view checklist templates",
    domain: "Template",
    scope: "releaseManager",
  },
  {
    key: "template:create",
    label: "Create Template",
    description: "Can create checklist templates",
    domain: "Template",
    scope: "releaseManager",
  },
  {
    key: "template:edit",
    label: "Edit Template",
    description: "Can edit checklist templates",
    domain: "Template",
    scope: "releaseManager",
  },
  {
    key: "template:delete",
    label: "Delete Template",
    description: "Can delete checklist templates",
    domain: "Template",
    scope: "releaseManager",
  },
];

@Controller()
export class PermissionsController {
  @Get('permissions/registry')
  getRegistry(@Query('scope') scope?: string) {
    if (scope) {
      return permissionRegistry.filter((p) => p.scope === scope);
    }
    return permissionRegistry;
  }
}
