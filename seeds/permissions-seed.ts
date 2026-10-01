import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';
import { Role } from '../src/modules/roles/entities/role.entity';
import { Permission } from '../src/modules/permissions/entities/permission.entity';
import { RolePermission } from '../src/modules/role-permissions/entities/role-permission.entity';
import { RoleEnum } from '../src/modules/roles/role.enum';
import { PermissionActionEnum } from '../src/common/enums/permission-actions.enum';
import { In } from 'typeorm';

// Define features with their specific available actions (only existing modules)
const FEATURE_PERMISSIONS = {
  users: {
    description: 'User management system',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.DELETE,
      PermissionActionEnum.ASSIGN,
      PermissionActionEnum.VIEW_ALL,
    ],
  },

  roles: {
    description: 'Role management system',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.DELETE,
      PermissionActionEnum.ASSIGN,
      PermissionActionEnum.MANAGE,
    ],
  },

  permissions: {
    description: 'Permission management system',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.DELETE,
      PermissionActionEnum.ASSIGN,
      PermissionActionEnum.MANAGE,
    ],
  },
  customers: {
    description: 'Customer and customer site management',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.DELETE,
    ],
  },
  technicians: {
    description:
      'Technician, capability, certification, and vehicle management',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.DELETE,
      PermissionActionEnum.MANAGE,
    ],
  },
  activities: {
    description: 'Field activity scheduling and lifecycle management',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.DELETE,
      PermissionActionEnum.ASSIGN,
      PermissionActionEnum.MANAGE,
    ],
  },
  tracking: {
    description: 'Technician real-time position and route tracking',
    actions: [
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.MONITOR,
    ],
  },
  routes: {
    description: 'Daily route planning and optimization',
    actions: [PermissionActionEnum.READ, PermissionActionEnum.MANAGE],
  },
  notifications: {
    description: 'Customer and technician notification delivery',
    actions: [
      PermissionActionEnum.CREATE,
      PermissionActionEnum.READ,
      PermissionActionEnum.UPDATE,
      PermissionActionEnum.MANAGE,
    ],
  },
  feedback: {
    description: 'Customer satisfaction feedback',
    actions: [PermissionActionEnum.CREATE, PermissionActionEnum.READ],
  },
  dashboard: {
    description: 'Operational dashboard and interactive map data',
    actions: [PermissionActionEnum.READ],
  },
  reports: {
    description: 'Operational and performance reports',
    actions: [PermissionActionEnum.READ, PermissionActionEnum.EXPORT],
  },
};

export async function seedPermissions() {
  try {
    console.log('Starting permissions seeding...');

    const roleRepo = AppDataSource.getRepository(Role);
    const permissionRepo = AppDataSource.getRepository(Permission);
    const rolePermissionRepo = AppDataSource.getRepository(RolePermission);

    console.log('🔍 Fetching roles...');
    const adminRole = await roleRepo.findOneBy({ name: RoleEnum.ADMIN });
    const clientRole = await roleRepo.findOneBy({ name: RoleEnum.CLIENT });
    const employeeRole = await roleRepo.findOneBy({ name: RoleEnum.EMPLOYEE });
    const supportRole = await roleRepo.findOneBy({ name: RoleEnum.SUPPORT }); // Don't forget to fetch the support role.
    const managerRole = await roleRepo.findOneBy({
      name: RoleEnum.PROJECT_MANAGER,
    });
    const dispatcherRole = await roleRepo.findOneBy({
      name: RoleEnum.DISPATCHER,
    });
    const technicianRole = await roleRepo.findOneBy({
      name: RoleEnum.TECHNICIAN,
    });

    // Check if roles exist
    if (
      !adminRole ||
      !clientRole ||
      !employeeRole ||
      !supportRole ||
      !managerRole ||
      !dispatcherRole ||
      !technicianRole
    ) {
      throw new Error(
        '❌ One or more roles not found. Please ensure the main seed script runs correctly first.',
      );
    }

    console.log('📜 Defining permissions...');
    const allPermissions: Permission[] = [];
    // ... (your permission creation logic) ...
    for (const resourceName in FEATURE_PERMISSIONS) {
      if (
        Object.prototype.hasOwnProperty.call(FEATURE_PERMISSIONS, resourceName)
      ) {
        const feature = FEATURE_PERMISSIONS[resourceName];
        for (const action of feature.actions) {
          const permission = new Permission();
          permission.name = `${resourceName}.${action}`;
          permission.description = `${feature.description} - ${action}`;
          permission.resource = resourceName;
          permission.action = action;
          allPermissions.push(permission);
        }
      }
    }

    console.log('💾 Upserting permissions without deleting assignments...');
    await permissionRepo.upsert(allPermissions, ['name']);
    const savedPermissions = await permissionRepo.findBy({
      name: In(allPermissions.map((permission) => permission.name)),
    });

    console.log('🔗 Linking permissions to roles...');
    const rolePermissions: RolePermission[] = [];

    // Admin gets all permissions
    savedPermissions.forEach((perm) => {
      rolePermissions.push(
        rolePermissionRepo.create({
          roleId: adminRole.id,
          permissionId: perm.id,
        }),
      );
    });

    // Basic permissions for other roles
    const basicPermissions = savedPermissions.filter(
      (perm) => perm.action === PermissionActionEnum.READ,
    );

    basicPermissions.forEach((perm) => {
      rolePermissions.push(
        rolePermissionRepo.create({
          roleId: employeeRole.id,
          permissionId: perm.id,
        }),
      );
    });

    const dispatcherResources = new Set([
      'customers',
      'technicians',
      'activities',
      'tracking',
      'routes',
      'notifications',
      'dashboard',
      'reports',
      'feedback',
    ]);
    savedPermissions
      .filter((permission) => dispatcherResources.has(permission.resource))
      .forEach((permission) =>
        rolePermissions.push(
          rolePermissionRepo.create({
            roleId: dispatcherRole.id,
            permissionId: permission.id,
          }),
        ),
      );

    const technicianPermissions = new Set([
      'activities.read',
      'activities.update',
      'tracking.read',
      'tracking.update',
      'routes.read',
      'notifications.read',
      'feedback.create',
    ]);
    savedPermissions
      .filter((permission) => technicianPermissions.has(permission.name))
      .forEach((permission) =>
        rolePermissions.push(
          rolePermissionRepo.create({
            roleId: technicianRole.id,
            permissionId: permission.id,
          }),
        ),
      );

    await rolePermissionRepo.upsert(rolePermissions, [
      'roleId',
      'permissionId',
    ]);

    console.log('✅ Permissions and role-permissions seeded successfully!');
  } catch (err) {
    // You can remove the process.exit here since the main script handles it.
    throw new Error(`❌ Error seeding permissions: ${err.message}`);
  }
}
