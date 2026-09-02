import Link from "next/link";
import type { Route } from "next";
import { Card, PageHeader, Stat } from "@/components/ui";
import { stats } from "@/lib/api/endpoints";
import { formatDate, formatMoney, formatRate } from "@/lib/format";

export const metadata = { title: "Estatísticas" };

const PERIODS: { value: "7d" | "30d" | "cycle"; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "cycle", label: "Ciclo atual" },
];

/** RF-W04.9 — painel de T-22 com filtro de período e série de faturamento (dias sem atividade = 0). */
export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = (["7d", "30d", "cycle"].includes(params.period ?? "")
    ? params.period
    : "30d") as "7d" | "30d" | "cycle";

  const [data, series] = await Promise.all([
    stats.merchant(period),
    stats.series("orders_completed"),
  ]);

  const maxValue = Math.max(1, ...series.data.map((point) => point.value));

  return (
    <div>
      <PageHeader
        title="Estatísticas"
        description="Volume, prazo e custo das suas entregas ao longo do tempo."
        breadcrumbs={["UaiOu", "Estabelecimento", "Estatísticas"]}
      />

      <Card>
        <nav className="tabs" aria-label="Período">
          {PERIODS.map((entry) => (
            <Link
              key={entry.value}
              href={`/merchant/estatisticas?period=${entry.value}` as Route}
              aria-current={period === entry.value ? "page" : undefined}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
        {/* `from`/`to` chegam como instantes ISO completos. Despejá-los crus dava
            "2026-07-09T22:57:02.899583072Z" — precisão de nanossegundo para quem só quer saber de
            que dia a que dia o gráfico fala. */}
        <p className="muted small" style={{ marginTop: "var(--space-2)" }}>
          {data.period.label} · {formatDate(data.period.from)} a {formatDate(data.period.to)}
        </p>
      </Card>

      <div className="grid-3">
        <Stat label="Pedidos publicados" value={data.ordersPublished} />
        <Stat label="Pedidos concluídos" value={data.ordersCompleted} />
        <Stat label="Taxa de match" value={formatRate(data.matchRate)} />
        <Stat
          label="Tempo médio até atribuição"
          value={data.medianTimeToAssignmentMinutes ? `${data.medianTimeToAssignmentMinutes} min` : "—"}
        />
        <Stat label="Aceite de contraoferta" value={formatRate(data.counterofferAcceptRate)} />
        <Stat label="Spread médio" value={formatMoney(data.spread)} />
        <Stat label="Gasto com frete" value={formatMoney(data.freightSpend)} />
        <Stat
          label="Créditos consumidos"
          value={data.creditsQuota ? `${data.creditsConsumed} / ${data.creditsQuota}` : data.creditsConsumed}
        />
        <Stat label="Taxa de contingência" value={formatRate(data.codeContingencyRate)} />
      </div>

      <Card title="Pedidos concluídos por dia">
        {series.data.length === 0 ? (
          <p className="muted">Sem dados no período.</p>
        ) : (
          <div className="series">
            {series.data.map((point) => (
              <div key={point.date} className="series-bar-wrap" title={`${point.date}: ${point.value}`}>
                <div
                  className="series-bar"
                  style={{ height: `${Math.max(4, (point.value / maxValue) * 100)}%` }}
                />
                <span className="series-label small muted">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
