import TaskTable from "@/components/taskTable";
import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className={title()}>Task Manager</h1>
        <h2 className={subtitle({ class: "mt-4" })}>
          Manage your tasks efficiently with a modern interface
        </h2>
      </div>
      <TaskTable />
    </div>
  );
}