import React from "react";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./Chart";
import { ProductiveTypeStat } from "../endpoints/dashboard/stats_GET.schema";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardProductiveInteractionsWidget.module.css";

interface DashboardProductiveInteractionsWidgetProps {
  productiveInteractionTypes: ProductiveTypeStat[];
  isLoading: boolean;
}

export function DashboardProductiveInteractionsWidget({
  productiveInteractionTypes,
  isLoading,
}: DashboardProductiveInteractionsWidgetProps) {
  const chartConfig = {
    meeting: {
      label: "Meeting",
      color: "var(--chart-color-1)",
    },
    call: {
      label: "Call",
      color: "var(--chart-color-2)",
    },
    email: {
      label: "Email",
      color: "var(--chart-color-3)",
    },
    coffee: {
      label: "Coffee",
      color: "var(--chart-color-4)",
    },
  };

  const chartData = productiveInteractionTypes.map((stat) => ({
    type: stat.type.charAt(0).toUpperCase() + stat.type.slice(1),
    count: stat.count,
    fill: chartConfig[stat.type as keyof typeof chartConfig]?.color || "var(--chart-color-5)",
  }));

  const hasData = productiveInteractionTypes.length > 0;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <BarChart3 className={styles.icon} />
        <h2 className={styles.title}>Productive Interactions</h2>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div style={{ height: "200px", width: "100%" }}>
            <Skeleton style={{ width: "100%", height: "100%" }} />
          </div>
        ) : !hasData ? (
          <div className={styles.emptyState}>
            <p>No project-linked interactions yet</p>
          </div>
        ) : (
          <>
            <div style={{ height: "200px", width: "100%" }}>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <p className={styles.chartCaption}>
              Interactions that led to projects
            </p>
          </>
        )}
      </div>
    </div>
  );
}