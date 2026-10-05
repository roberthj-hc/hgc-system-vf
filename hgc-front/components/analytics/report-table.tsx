"use client"
import { Button } from "@/components/ui/button"
import {
  format,
  type AnalyticsReport,
  type Column,
} from "@/lib/analytics/types"
export function ReportTable({
  data,
  columns,
  onPage,
}: {
  data: AnalyticsReport
  columns: Column[]
  onPage: (page: number) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-xs font-medium whitespace-nowrap text-muted-foreground"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 tabular-nums">
                    {format(row[c.key], c.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!data.rows.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No hay resultados para estos filtros.
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t p-3 text-xs text-muted-foreground">
        <span>
          {format(data.pagination.total)} resultados · página{" "}
          {data.pagination.page} de {Math.max(1, data.pagination.pages)}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={data.pagination.page <= 1}
            onClick={() => onPage(data.pagination.page - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={data.pagination.page >= data.pagination.pages}
            onClick={() => onPage(data.pagination.page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
