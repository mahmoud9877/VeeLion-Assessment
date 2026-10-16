import type { ActivityLog } from "@/types/api";
import { ActivityItem } from "@/components/activity/ActivityItem";

type ActivityListProps = {
  items: ActivityLog[];
};

export function ActivityList({ items }: ActivityListProps) {
  return (
    <ol className="card timeline" aria-label="Activity">
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </ol>
  );
}
