import { formatDateTime } from "@/lib/format";
import type { ActivityLog } from "@/types/api";

type ActivityItemProps = {
  item: ActivityLog;
};

export function ActivityItem({ item }: ActivityItemProps) {
  return (
    <li className="timeline__item">
      <span className="timeline__dot" aria-hidden="true" />
      <div className="timeline__content">
        <p className="timeline__action">{item.action || "Activity"}</p>
        {item.info ? <p className="timeline__info">{item.info}</p> : null}
      </div>
      <time className="timeline__time" dateTime={item.when}>
        {formatDateTime(item.when)}
      </time>
    </li>
  );
}
