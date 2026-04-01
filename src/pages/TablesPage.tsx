import { useState } from 'react';
import { Download, Edit, Trash2, Eye } from 'lucide-react';
import { Table, TableColumn, TableBadge } from '../components/ui/Table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  sales: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export function TablesPage() {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const userData: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', lastLogin: '2024-03-15', sales: 125000 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'active', lastLogin: '2024-03-14', sales: 98000 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', lastLogin: '2024-03-10', sales: 67000 },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User', status: 'active', lastLogin: '2024-03-15', sales: 154000 },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Manager', status: 'pending', lastLogin: '2024-03-12', sales: 89000 },
  ];

  const productData: Product[] = [
    { id: 1, name: 'Laptop Pro 15"', category: 'Electronics', price: 1299.99, stock: 45, status: 'in-stock' },
    { id: 2, name: 'Wireless Mouse', category: 'Accessories', price: 29.99, stock: 8, status: 'low-stock' },
    { id: 3, name: 'USB-C Cable', category: 'Accessories', price: 19.99, stock: 0, status: 'out-of-stock' },
    { id: 4, name: 'Monitor 27"', category: 'Electronics', price: 399.99, stock: 23, status: 'in-stock' },
    { id: 5, name: 'Keyboard Mechanical', category: 'Accessories', price: 149.99, stock: 12, status: 'in-stock' },
  ];

  const userColumns: TableColumn<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: '200px'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      width: '120px',
      render: (value) => (
        <TableBadge variant={value === 'Admin' ? 'info' : value === 'Manager' ? 'success' : 'default'}>
          {value}
        </TableBadge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value) => (
        <TableBadge variant={value === 'active' ? 'success' : value === 'inactive' ? 'error' : 'warning'}>
          {value}
        </TableBadge>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      width: '140px'
    },
    {
      key: 'sales',
      label: 'Sales',
      sortable: true,
      align: 'right',
      width: '140px',
      render: (value) => `$${value.toLocaleString()}`
    }
  ];

  const productColumns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '150px'
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      align: 'center',
      width: '100px'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      width: '140px',
      render: (value) => (
        <TableBadge variant={value === 'in-stock' ? 'success' : value === 'low-stock' ? 'warning' : 'error'}>
          {value === 'in-stock' ? 'In Stock' : value === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
        </TableBadge>
      )
    }
  ];

  const compactColumns: TableColumn[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'value', label: 'Value', align: 'right', width: '120px' }
  ];

  const compactData = [
    { id: 1, name: 'Item A', value: '$125' },
    { id: 2, name: 'Item B', value: '$250' },
    { id: 3, name: 'Item C', value: '$175' },
  ];

  const handleEdit = (row: User | Product) => {
    console.log('Edit:', row);
  };

  const handleDelete = (row: User | Product) => {
    console.log('Delete:', row);
  };

  const handleView = (row: User | Product) => {
    console.log('View:', row);
  };

  const handleExport = (row: User | Product) => {
    console.log('Export:', row);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tables</h1>
        <p className="text-gray-600">Flexible table components with sorting, selection, and actions</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Default Table</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={userColumns}
              data={userData}
              hover
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Selectable Table with Actions</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={userColumns}
              data={userData}
              selectable
              onRowSelect={setSelectedUsers}
              actions={[
                {
                  label: 'View Details',
                  icon: <Eye className="w-4 h-4" />,
                  onClick: handleView,
                  variant: 'primary'
                },
                {
                  label: 'Edit',
                  icon: <Edit className="w-4 h-4" />,
                  onClick: handleEdit,
                  variant: 'default'
                },
                {
                  label: 'Export',
                  icon: <Download className="w-4 h-4" />,
                  onClick: handleExport,
                  variant: 'default'
                },
                {
                  label: 'Delete',
                  icon: <Trash2 className="w-4 h-4" />,
                  onClick: handleDelete,
                  variant: 'danger'
                }
              ]}
            />
          </div>
          {selectedUsers.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Striped Table</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={productColumns}
              data={productData}
              variant="striped"
              hover
              actions={[
                {
                  label: 'Edit',
                  icon: <Edit className="w-4 h-4" />,
                  onClick: handleEdit
                },
                {
                  label: 'Delete',
                  icon: <Trash2 className="w-4 h-4" />,
                  onClick: handleDelete,
                  variant: 'danger'
                }
              ]}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Compact Table</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={compactColumns}
              data={compactData}
              variant="compact"
              hover
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sticky Header with Max Height</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={userColumns}
              data={[...userData, ...userData, ...userData]}
              stickyHeader
              maxHeight="400px"
              hover
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading State</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={userColumns}
              data={[]}
              loading
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Empty State</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table
              columns={userColumns}
              data={[]}
              emptyMessage="No users found. Add a new user to get started."
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Table Badges</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-wrap gap-4">
              <TableBadge variant="default">Default (Gray 70)</TableBadge>
              <TableBadge variant="completed">Completed (Gray 90)</TableBadge>
              <TableBadge variant="success">Success</TableBadge>
              <TableBadge variant="warning">Warning</TableBadge>
              <TableBadge variant="error">Error</TableBadge>
              <TableBadge variant="info">Info</TableBadge>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
