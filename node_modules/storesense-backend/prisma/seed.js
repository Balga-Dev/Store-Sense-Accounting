const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database initialization...');

  const existingSuperAdmin = await prisma.superAdmin.findFirst();
  if (existingSuperAdmin) {
    console.log('Super admin already exists. Skipping creation.');
    console.log('Username:', existingSuperAdmin.username);
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('Admin@12345', salt);

  const superAdmin = await prisma.superAdmin.create({
    data: {
      username: 'superadmin',
      password: hashedPassword,
      email: 'admin@storesense.com'
    }
  });

  console.log('Super Admin created:');
  console.log('  Username: superadmin');
  console.log('  Password: Admin@12345');
  console.log('  Email: admin@storesense.com');

  const tabPermissions = [
    { key: 'TAB_DASHBOARD', label: 'Dashboard', category: 'TAB', description: 'Access to dashboard' },
    { key: 'TAB_TRANSACTIONS', label: 'Transactions', category: 'TAB', description: 'Access to transactions' },
    { key: 'TAB_ORDERS', label: 'Orders', category: 'TAB', description: 'Access to order history' },
    { key: 'TAB_ORDER_ANALYTICS', label: 'Order Analytics', category: 'TAB', description: 'Access to order analytics' },
    { key: 'TAB_REPORTS', label: 'Reports', category: 'TAB', description: 'Access to reports' },
    { key: 'TAB_FINANCIAL_REPORTS', label: 'Financial Reports', category: 'TAB', description: 'Access to financial reports' },
    { key: 'TAB_INVENTORY', label: 'Inventory', category: 'TAB', description: 'Access to inventory' },
    { key: 'TAB_ITEM_MANAGEMENT', label: 'Item Management', category: 'TAB', description: 'Access to item management' },
    { key: 'TAB_CATEGORIES', label: 'Categories', category: 'TAB', description: 'Access to categories' },
    { key: 'TAB_SUPPLIERS', label: 'Suppliers', category: 'TAB', description: 'Access to suppliers' },
    { key: 'TAB_PURCHASE_ORDERS', label: 'Purchase Orders', category: 'TAB', description: 'Access to purchase orders' },
    { key: 'TAB_EXPENSES', label: 'Expenses', category: 'TAB', description: 'Access to expenses' },
    { key: 'TAB_REVENUE', label: 'Revenue Tracking', category: 'TAB', description: 'Access to revenue tracking' },
    { key: 'TAB_EMPLOYEE_MANAGEMENT', label: 'Employee Management', category: 'TAB', description: 'Access to employee management' },
    { key: 'TAB_ROLE_MANAGEMENT', label: 'Role & Permission Management', category: 'TAB', description: 'Access to role management' },
    { key: 'TAB_CUSTOMER_MANAGEMENT', label: 'Customer Management', category: 'TAB', description: 'Access to customer management' },
    { key: 'TAB_LOYALTY', label: 'Loyalty & Rewards', category: 'TAB', description: 'Access to loyalty program' },
    { key: 'TAB_NOTIFICATIONS', label: 'Notifications & Alerts', category: 'TAB', description: 'Access to notifications' },
    { key: 'TAB_ACTIVITY_LOGS', label: 'Activity Logs', category: 'TAB', description: 'Access to activity logs' },
    { key: 'TAB_SETTINGS', label: 'Settings', category: 'TAB', description: 'Access to settings' },
    { key: 'TAB_INTEGRATIONS', label: 'Integrations', category: 'TAB', description: 'Access to integrations' },
    { key: 'TAB_SYSTEM_LOGS', label: 'System Logs', category: 'TAB', description: 'Access to system logs' }
  ];

  const actionPermissions = [
    { key: 'ACT_CREATE_TRANSACTION', label: 'Create Transactions', category: 'ACTION', description: 'Can create new transactions' },
    { key: 'ACT_EDIT_TRANSACTION', label: 'Edit Transactions', category: 'ACTION', description: 'Can edit existing transactions' },
    { key: 'ACT_DELETE_TRANSACTION', label: 'Delete Transactions', category: 'ACTION', description: 'Can delete transactions' },
    { key: 'ACT_VIEW_REPORTS', label: 'View Reports', category: 'ACTION', description: 'Can view reports' },
    { key: 'ACT_EXPORT_REPORTS', label: 'Export Reports', category: 'ACTION', description: 'Can export reports' },
    { key: 'ACT_MANAGE_EMPLOYEES', label: 'Manage Employees', category: 'ACTION', description: 'Can manage employees' },
    { key: 'ACT_MANAGE_ITEMS', label: 'Manage Items', category: 'ACTION', description: 'Can manage items' },
    { key: 'ACT_MANAGE_CATEGORIES', label: 'Manage Categories', category: 'ACTION', description: 'Can manage categories' },
    { key: 'ACT_MANAGE_ROLES', label: 'Manage Roles', category: 'ACTION', description: 'Can manage roles and permissions' },
    { key: 'ACT_ACCESS_SETTINGS', label: 'Access Settings', category: 'ACTION', description: 'Can access settings' },
    { key: 'ACT_MANAGE_CUSTOMERS', label: 'Manage Customers', category: 'ACTION', description: 'Can manage customers' },
    { key: 'ACT_MANAGE_SUPPLIERS', label: 'Manage Suppliers', category: 'ACTION', description: 'Can manage suppliers' },
    { key: 'ACT_CREATE_PURCHASE_ORDER', label: 'Create Purchase Orders', category: 'ACTION', description: 'Can create purchase orders' },
    { key: 'ACT_MANAGE_EXPENSES', label: 'Manage Expenses', category: 'ACTION', description: 'Can manage expenses' },
    { key: 'ACT_VIEW_ACTIVITY_LOGS', label: 'View Activity Logs', category: 'ACTION', description: 'Can view activity logs' }
  ];

  await prisma.permission.createMany({
    data: [...tabPermissions, ...actionPermissions]
  });

  console.log('Default permissions created.');

  const createdPermissions = await prisma.permission.findMany();
  const createdTabs = createdPermissions.filter(p => p.category === 'TAB');
  const createdActions = createdPermissions.filter(p => p.category === 'ACTION');

  const defaultRoles = [
    {
      name: 'BUSINESS_MANAGER',
      roleType: 'BUSINESS_MANAGER',
      isDefault: true,
      description: 'Full business management access',
      tabs: createdTabs.map(t => t.id),
      actions: createdActions.map(a => a.id)
    },
    {
      name: 'SUPERVISOR',
      roleType: 'SUPERVISOR',
      isDefault: true,
      description: 'Supervisory access with limited management',
      tabs: createdTabs.filter(t => [
        'TAB_DASHBOARD', 'TAB_TRANSACTIONS', 'TAB_ORDERS', 'TAB_ORDER_ANALYTICS',
        'TAB_REPORTS', 'TAB_FINANCIAL_REPORTS', 'TAB_INVENTORY', 'TAB_ITEM_MANAGEMENT',
        'TAB_CATEGORIES', 'TAB_EMPLOYEE_MANAGEMENT', 'TAB_ACTIVITY_LOGS'
      ].map(k => t.key)).map(t => t.id),
      actions: createdActions.filter(a => [
        'ACT_CREATE_TRANSACTION', 'ACT_EDIT_TRANSACTION', 'ACT_VIEW_REPORTS',
        'ACT_EXPORT_REPORTS', 'ACT_MANAGE_ITEMS', 'ACT_MANAGE_CATEGORIES'
      ].map(k => a.key)).map(a => a.id)
    },
    {
      name: 'CASHIER',
      roleType: 'CASHIER',
      isDefault: true,
      description: 'Transaction processing access',
      tabs: createdTabs.filter(t => [
        'TAB_DASHBOARD', 'TAB_TRANSACTIONS', 'TAB_ITEM_MANAGEMENT'
      ].map(k => t.key)).map(t => t.id),
      actions: createdActions.filter(a => [
        'ACT_CREATE_TRANSACTION'
      ].map(k => a.key)).map(a => a.id)
    },
    {
      name: 'VIEWER',
      roleType: 'VIEWER',
      isDefault: true,
      description: 'Read-only access',
      tabs: createdTabs.filter(t => [
        'TAB_DASHBOARD', 'TAB_TRANSACTIONS', 'TAB_REPORTS'
      ].map(k => t.key)).map(t => t.id),
      actions: []
    }
  ];

  for (const role of defaultRoles) {
    const createdRole = await prisma.role.create({
      data: {
        name: role.name,
        roleType: role.roleType,
        isDefault: role.isDefault,
        description: role.description,
        tabPermissions: {
          create: role.tabs.map(permissionId => ({ permissionId, isEnabled: true }))
        },
        actionPermissions: {
          create: role.actions.map(permissionId => ({ permissionId, isEnabled: true }))
        }
      }
    });

    console.log(`Default role created: ${role.name}`);
  }

  console.log('\nInitialization complete!');
  console.log('\nIMPORTANT: Change the Super Admin password immediately after first login.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
