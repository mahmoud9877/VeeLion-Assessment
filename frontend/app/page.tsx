import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { NAV_ITEMS } from "@/lib/navigation";

export default function HomePage() {
  return (
    <div className="page">
      <PageHeader
        title="Overview"
        description="Pick a module to manage tasks, follow activity or check the numbers."
      />

      <ul className="module-grid">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="card module-card">
              <h2 className="module-card__title">{item.label}</h2>
              <p className="module-card__description">{item.description}</p>
              <span className="module-card__cta" aria-hidden="true">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
