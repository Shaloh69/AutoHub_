"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody } from "@heroui/card";
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '@/types/task';
import { apiService } from '@/services/api';
import { ChevronDownIcon, DeleteIcon, EditIcon, EyeIcon, PlusIcon, SearchIcon, VerticalDotsIcon } from "./icons";

// Table columns configuration
const columns = [
  { name: "TITLE", uid: "title", sortable: true },
  { name: "DESCRIPTION", uid: "description", sortable: false },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "CREATED", uid: "createdAt", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
  { name: "Pending", uid: "pending" },
  { name: "In Progress", uid: "in-progress" },
  { name: "Completed", uid: "completed" },
];

const statusColorMap = {
  pending: "warning",
  "in-progress": "primary",
  completed: "success",
};

const INITIAL_VISIBLE_COLUMNS = ["title", "description", "status", "createdAt", "actions"];

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to check if selectedKeys is a Set
function isSetSelection(selectedKeys: any): selectedKeys is Set<React.Key> {
  return selectedKeys instanceof Set;
}

export default function TaskTable() {
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  
  // Main state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Set<string> | "all">(new Set(INITIAL_VISIBLE_COLUMNS));
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "createdAt",
    direction: "descending",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, 'in-progress': 0, completed: 0 });

  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onOpenChange: onViewOpenChange } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: "",
    description: "",
    status: "pending",
  });

  // Hydration fix effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query = {
        page,
        limit: rowsPerPage,
        ...(filterValue && { search: filterValue }),
        ...(statusFilter !== "all" && { status: statusFilter as TaskStatus }),
      };

      const response = await apiService.getTasks(query);
      
      if (response.success && Array.isArray(response.data)) {
        setTasks(response.data);
        setTotalTasks(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterValue, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiService.getTaskStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchTasks();
      fetchStats();
    }
  }, [fetchTasks, fetchStats, isMounted]);

  // Handle create task
  const handleCreateTask = async () => {
    try {
      if (!formData.title.trim() || !formData.description.trim()) {
        setError('Title and description are required');
        return;
      }

      await apiService.createTask(formData);
      setFormData({ title: "", description: "", status: "pending" });
      onCreateOpenChange();
      fetchTasks();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  // Handle edit task
  const handleEditTask = async () => {
    if (!editingTask) return;

    try {
      if (!formData.title.trim() || !formData.description.trim()) {
        setError('Title and description are required');
        return;
      }

      await apiService.updateTask(editingTask.id, formData);
      setEditingTask(null);
      setFormData({ title: "", description: "", status: "pending" });
      onEditOpenChange();
      fetchTasks();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      await apiService.deleteTask(deletingTask.id);
      setDeletingTask(null);
      onDeleteOpenChange();
      fetchTasks();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Open edit modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
    });
    onEditOpen();
  };

  // Open view modal
  const openViewModal = (task: Task) => {
    setViewingTask(task);
    onViewOpen();
  };

  // Open delete modal
  const openDeleteModal = (task: Task) => {
    setDeletingTask(task);
    onDeleteOpen();
  };

  // Client-side sorting
  const sortedTasks = useMemo(() => {
    if (!sortDescriptor.column) return tasks;

    return [...tasks].sort((a, b) => {
      const column = sortDescriptor.column as keyof Task;
      let aValue = a[column];
      let bValue = b[column];

      // Handle different data types
      if (column === 'createdAt' || column === 'updatedAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let result = 0;
      if (aValue < bValue) {
        result = -1;
      } else if (aValue > bValue) {
        result = 1;
      }

      return sortDescriptor.direction === 'descending' ? -result : result;
    });
  }, [tasks, sortDescriptor]);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const renderCell = useCallback((task: Task, columnKey: React.Key) => {
    const cellValue = task[columnKey as keyof Task];

    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{task.title}</p>
          </div>
        );
      case "description":
        return (
          <div className="flex flex-col max-w-xs">
            <p className="text-small text-ellipsis overflow-hidden whitespace-nowrap">
              {task.description}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize border-none gap-1 text-default-600"
            color={statusColorMap[task.status] as any}
            size="sm"
            variant="dot"
          >
            {task.status === "in-progress" ? "In Progress" : capitalize(task.status)}
          </Chip>
        );
      case "createdAt":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-tiny text-default-500">
              {formatDate(task.createdAt)}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown className="bg-background border-1 border-default-200">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-400" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="view" onPress={() => openViewModal(task)}>
                  <div className="flex items-center gap-2">
                    <EyeIcon />
                    View
                  </div>
                </DropdownItem>
                <DropdownItem key="edit" onPress={() => openEditModal(task)}>
                  <div className="flex items-center gap-2">
                    <EditIcon />
                    Edit
                  </div>
                </DropdownItem>
                <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => openDeleteModal(task)}>
                  <div className="flex items-center gap-2">
                    <DeleteIcon />
                    Delete
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-small text-default-500">Total Tasks</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-small text-default-500">Pending</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats['in-progress']}</p>
              <p className="text-small text-default-500">In Progress</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-small text-default-500">Completed</p>
            </CardBody>
          </Card>
        </div>

        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            placeholder="Search tasks..."
            size="sm"
            startContent={<SearchIcon className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Status Filter"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDownIcon className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button 
              className="bg-foreground text-background" 
              endContent={<PlusIcon />} 
              size="sm"
              onPress={onCreateOpen}
            >
              Add New Task
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {totalTasks} tasks</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-1"
              onChange={onRowsPerPageChange}
              value={rowsPerPage}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    totalTasks,
    hasSearchFilter,
    stats,
    rowsPerPage,
    onCreateOpen
  ]);

  const bottomContent = useMemo(() => {
    const getSelectionText = () => {
      if (selectedKeys === "all") {
        return "All items selected";
      }
      if (isSetSelection(selectedKeys)) {
        return `${selectedKeys.size} of ${sortedTasks.length} selected`;
      }
      return `0 of ${sortedTasks.length} selected`;
    };

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          page={page}
          total={totalPages}
          variant="light"
          onChange={setPage}
        />
        <span className="text-small text-default-400">
          {getSelectionText()}
        </span>
      </div>
    );
  }, [selectedKeys, sortedTasks, page, totalPages]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-danger text-lg mb-4">Error: {error}</p>
          <Button color="primary" onPress={() => { setError(null); fetchTasks(); }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Table
        aria-label="Task management table"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        checkboxesProps={{
          classNames: {
            wrapper: "after:bg-foreground after:text-background text-background",
          },
        }}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody 
          emptyContent={loading ? <Spinner /> : "No tasks found"} 
          items={sortedTasks}
          isLoading={loading}
          loadingContent={<Spinner />}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create Task Modal */}
      <Modal isOpen={isCreateOpen} onOpenChange={onCreateOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Create New Task</ModalHeader>
              <ModalBody>
                <Input
                  label="Title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  variant="bordered"
                />
                <Textarea
                  label="Description"
                  placeholder="Enter task description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  variant="bordered"
                />
                <Select
                  label="Status"
                  placeholder="Select status"
                  selectedKeys={[formData.status || "pending"]}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  variant="bordered"
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.uid} value={status.uid}>
                      {status.name}
                    </SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleCreateTask}>
                  Create Task
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Edit Task</ModalHeader>
              <ModalBody>
                <Input
                  label="Title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  variant="bordered"
                />
                <Textarea
                  label="Description"
                  placeholder="Enter task description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  variant="bordered"
                />
                <Select
                  label="Status"
                  placeholder="Select status"
                  selectedKeys={[formData.status || "pending"]}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  variant="bordered"
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.uid} value={status.uid}>
                      {status.name}
                    </SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleEditTask}>
                  Update Task
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* View Task Modal */}
      <Modal isOpen={isViewOpen} onOpenChange={onViewOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Task Details</ModalHeader>
              <ModalBody>
                {viewingTask && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-default-600">Title</p>
                      <p className="text-lg">{viewingTask.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-default-600">Description</p>
                      <p>{viewingTask.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-default-600">Status</p>
                      <Chip
                        className="capitalize"
                        color={statusColorMap[viewingTask.status] as any}
                        size="sm"
                        variant="flat"
                      >
                        {viewingTask.status === "in-progress" ? "In Progress" : capitalize(viewingTask.status)}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-default-600">Created</p>
                      <p>{formatDate(viewingTask.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-default-600">Last Updated</p>
                      <p>{formatDate(viewingTask.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Confirm Delete</ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete the task <strong>"{deletingTask?.title}"</strong>? 
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={handleDeleteTask}>
                  Delete Task
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}